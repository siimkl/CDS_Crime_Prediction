const PLAN_CONFIG = {
  csvPath: "tartu_risk_dataset_2.csv",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEATHER_FACTORS = {
  clear: 1.04,
  rain: 0.92,
  snow: 0.82,
  storm: 0.88,
  other_extremes: 0.90,
};

const WEATHER_LABELS = {
  clear: "Clear",
  rain: "Rain",
  snow: "Snow",
  storm: "Storm",
  other_extremes: "Other extremes",
};

document.addEventListener("DOMContentLoaded", () => {
  void initPolicingPlan();
});

async function initPolicingPlan() {
  const csvText = await fetchPlanCsv(PLAN_CONFIG.csvPath);
  const rows = parsePlanCsv(csvText);
  const model = buildPlanModel(rows);
  const forecast = buildPlanForecast(model, computeNextHour());

  renderPlanSummary(forecast);
  renderImmediatePriorities(forecast);
  renderGuidelines(forecast);
  renderAttentionTable(forecast);
  renderWatchlist(forecast);
}

async function fetchPlanCsv(csvPath) {
  try {
    const response = await fetch(`${csvPath}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Could not read ${csvPath}.`);
    }
    return response.text();
  } catch (error) {
    if (typeof window.__TARTU_RISK_EMBEDDED_CSV__ === "string") {
      return window.__TARTU_RISK_EMBEDDED_CSV__;
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function parsePlanCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    row.population = Number(row.population);
    row.area_population_density = Number(row.area_population_density);
    row.hour = Number(row.hour);
    row.incident_count = Number(row.incident_count);
    return row;
  });
}

function buildPlanModel(rows) {
  const areaMeta = new Map();
  const areaStats = new Map();
  const areaHourDay = new Map();
  const areaHour = new Map();
  const areaDay = new Map();
  const cityHour = new Map();
  const cityDay = new Map();
  let globalSum = 0;
  let globalCount = 0;
  let lastDatasetTime = rows[0]?.time ?? "";

  rows.forEach((row) => {
    if (!areaMeta.has(row.area)) {
      areaMeta.set(row.area, {
        area: row.area,
        population: row.population,
        density: row.area_population_density,
        areaType: row.area_type,
        footTraffic: row.foot_traffic,
        studentZone: Number(row.student_zone),
        nightlifeZone: Number(row.nightlife_zone),
      });
    }

    incrementStat(areaStats, row.area, row.incident_count);
    incrementStat(areaHourDay, `${row.area}|${row.day_of_week}|${row.hour}`, row.incident_count);
    incrementStat(areaHour, `${row.area}|${row.hour}`, row.incident_count);
    incrementStat(areaDay, `${row.area}|${row.day_of_week}`, row.incident_count);
    incrementStat(cityHour, String(row.hour), row.incident_count);
    incrementStat(cityDay, row.day_of_week, row.incident_count);

    globalSum += row.incident_count;
    globalCount += 1;
    if (row.time > lastDatasetTime) {
      lastDatasetTime = row.time;
    }
  });

  return {
    areaMeta,
    areaStats,
    areaHourDay,
    areaHour,
    areaDay,
    cityHour,
    cityDay,
    globalMean: globalSum / globalCount,
    lastDatasetTime,
  };
}

function buildPlanForecast(model, startTime) {
  const weatherCycle = buildWeatherOutlook(startTime, model.lastDatasetTime);
  const areas = Array.from(model.areaMeta.keys()).sort((left, right) => left.localeCompare(right));
  const rawByArea = new Map(areas.map((area) => [area, []]));

  for (let step = 0; step < 48; step += 1) {
    const timestamp = new Date(startTime.getTime() + step * 3600_000);
    const weather = weatherCycle[step];
    const dayName = DAY_NAMES[timestamp.getDay()];
    const hour = timestamp.getHours();

    areas.forEach((area, index) => {
      const value = predictIncident(model, area, dayName, hour, weather, step, index);
      rawByArea.get(area).push(value);
    });
  }

  const smoothedByArea = new Map();
  rawByArea.forEach((series, area) => {
    smoothedByArea.set(area, smoothSeries(series));
  });

  const hours = [];
  for (let step = 0; step < 48; step += 1) {
    const timestamp = new Date(startTime.getTime() + step * 3600_000);
    const weather = weatherCycle[step];
    const dayName = DAY_NAMES[timestamp.getDay()];
    const hour = timestamp.getHours();

    const hourAreas = areas.map((area) => {
      const meta = model.areaMeta.get(area);
      const exactStat = model.areaHourDay.get(`${area}|${dayName}|${hour}`);
      const fallbackHour = model.areaHour.get(`${area}|${hour}`);
      const sampleCount = exactStat?.count ?? fallbackHour?.count ?? 0;
      const incident = Number(smoothedByArea.get(area)[step].toFixed(2));
      const per10k = (incident / meta.population) * 10000;
      return {
        area,
        incident,
        population: meta.population,
        density: meta.density,
        areaType: meta.areaType,
        footTraffic: meta.footTraffic,
        studentZone: meta.studentZone,
        nightlifeZone: meta.nightlifeZone,
        sampleCount,
        per10k,
      };
    });

    const maxIncident = Math.max(...hourAreas.map((entry) => entry.incident), 0.01);
    const maxPer10k = Math.max(...hourAreas.map((entry) => entry.per10k), 0.01);
    hourAreas.forEach((entry) => {
      entry.riskScore = computeRiskScore(entry, maxIncident, maxPer10k);
    });
    hourAreas.sort((left, right) => right.riskScore - left.riskScore || right.incident - left.incident);

    hours.push({
      timestamp,
      weather,
      cityTotal: Number(hourAreas.reduce((sum, area) => sum + area.incident, 0).toFixed(2)),
      areas: hourAreas,
      topArea: hourAreas[0],
    });
  }

  return {
    startTime,
    endTime: new Date(startTime.getTime() + 47 * 3600_000),
    hours,
  };
}

function buildWeatherOutlook(startTime, lastDatasetTime) {
  const weather = [];
  const seedBase = createWeatherSeed(startTime, lastDatasetTime);
  let step = 0;

  while (step < 48) {
    const remaining = 48 - step;
    const rainSignal = seededUnit(seedBase + (step * 17));
    const isRainBlock = rainSignal > 0.76;
    const blockLength = isRainBlock
      ? Math.min(remaining, 3 + Math.floor(seededUnit(seedBase + (step * 31) + 7) * 4))
      : Math.min(remaining, 5 + Math.floor(seededUnit(seedBase + (step * 29) + 11) * 7));
    const blockWeather = isRainBlock ? "rain" : "clear";

    for (let index = 0; index < blockLength; index += 1) {
      weather.push(blockWeather);
    }

    step += blockLength;
  }

  if (!weather.includes("rain")) {
    const rainStart = Math.min(42, 6 + Math.floor(seededUnit(seedBase + 503) * 28));
    for (let index = rainStart; index < Math.min(48, rainStart + 4); index += 1) {
      weather[index] = "rain";
    }
  }

  return weather.slice(0, 48);
}

function createWeatherSeed(startTime, lastDatasetTime) {
  const baseTimestamp = startTime.getTime();
  const datasetTimestamp = lastDatasetTime
    ? new Date(lastDatasetTime.replace(" ", "T")).getTime()
    : 0;
  return Math.floor((baseTimestamp / 3600_000) + (datasetTimestamp / 3600_000));
}

function seededUnit(seed) {
  const raw = Math.sin(seed * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

function predictIncident(model, area, dayName, hour, weather, step, areaIndex) {
  const areaMean = meanOf(model.areaStats.get(area), 0.08);
  const exact = meanOf(model.areaHourDay.get(`${area}|${dayName}|${hour}`), Number.NaN);
  const areaHour = meanOf(model.areaHour.get(`${area}|${hour}`), Number.NaN);
  const areaDay = meanOf(model.areaDay.get(`${area}|${dayName}`), Number.NaN);
  const cityHour = meanOf(model.cityHour.get(`${hour}`), model.globalMean);
  const cityDay = meanOf(model.cityDay.get(dayName), model.globalMean);

  const blendedBase = weightedBlend([
    [exact, 0.55],
    [areaHour, 0.18],
    [areaDay, 0.12],
    [areaMean, 0.10],
    [(cityHour * areaMean) / model.globalMean, 0.05],
  ], areaMean);

  const cityPulse = clamp(
    0.78 + 0.22 * (((cityHour / model.globalMean) * 0.6) + ((cityDay / model.globalMean) * 0.4)),
    0.70,
    1.34,
  );
  const weatherFactor = WEATHER_FACTORS[weather] ?? 1;
  const motionWave = 1 + 0.05 * Math.sin((step / 5.8) + areaIndex * 0.43);

  return Math.max(0.02, blendedBase * cityPulse * weatherFactor * motionWave);
}

function smoothSeries(values) {
  return values.map((value, index) => {
    const previous = values[Math.max(0, index - 1)];
    const next = values[Math.min(values.length - 1, index + 1)];
    return Math.max(0.02, (previous * 0.22) + (value * 0.56) + (next * 0.22));
  });
}

function computeRiskScore(areaEntry, maxIncident, maxPer10k) {
  const incidentNorm = areaEntry.incident / maxIncident;
  const perCapitaNorm = areaEntry.per10k / maxPer10k;
  const raw = (incidentNorm * 0.68) + (perCapitaNorm * 0.32);
  return clamp(Math.round((raw * 9) + 1), 1, 10);
}

function renderPlanSummary(forecast) {
  const peakHour = forecast.hours.reduce((best, current) => current.cityTotal > best.cityTotal ? current : best, forecast.hours[0]);
  const areaTotals = aggregateAreaTotals(forecast.hours);
  const topArea = Array.from(areaTotals.entries())
    .sort((left, right) => right[1].incidentSum - left[1].incidentSum)[0];

  document.getElementById("planWindow").textContent =
    `${formatHourStamp(forecast.startTime)} - ${formatHourStamp(forecast.endTime)}`;
  document.getElementById("peakHour").textContent =
    `${formatHourStamp(peakHour.timestamp)} | ${peakHour.cityTotal.toFixed(2)} incidents`;
  document.getElementById("topArea").textContent =
    `${topArea[0]} | ${topArea[1].incidentSum.toFixed(2)} projected incidents`;
  document.getElementById("weatherSummary").textContent = describeWeatherPattern(forecast.hours);
}

function renderImmediatePriorities(forecast) {
  const container = document.getElementById("immediatePriorities");
  container.innerHTML = "";
  const windows = [
    { label: "0-12 hours", hours: forecast.hours.slice(0, 12) },
    { label: "12-24 hours", hours: forecast.hours.slice(12, 24) },
    { label: "24-36 hours", hours: forecast.hours.slice(24, 36) },
    { label: "36-48 hours", hours: forecast.hours.slice(36, 48) },
  ];

  windows.forEach((window) => {
    const areaTotals = aggregateAreaTotals(window.hours);
    const topThree = Array.from(areaTotals.entries())
      .sort((left, right) => right[1].incidentSum - left[1].incidentSum)
      .slice(0, 3);
    const peakHour = window.hours.reduce((best, current) => current.cityTotal > best.cityTotal ? current : best, window.hours[0]);
    const card = document.createElement("div");
    card.className = "priority-card";
    card.innerHTML = `
      <div class="priority-title">${window.label}</div>
      <p class="priority-copy">
        Focus first on ${topThree.map((entry) => entry[0]).join(", ")}.
        Peak demand is forecast around ${formatHourStamp(peakHour.timestamp)} with
        ${peakHour.cityTotal.toFixed(2)} city incidents and ${peakHour.topArea.area} leading the hour.
      </p>
    `;
    container.append(card);
  });
}

function renderGuidelines(forecast) {
  const list = document.getElementById("guidelineList");
  const topHours = [...forecast.hours]
    .sort((left, right) => right.cityTotal - left.cityTotal)
    .slice(0, 5);
  const areaTotals = aggregateAreaTotals(forecast.hours);
  const topAreas = Array.from(areaTotals.entries())
    .sort((left, right) => right[1].incidentSum - left[1].incidentSum)
    .slice(0, 5)
    .map((entry) => entry[0]);

  const items = [
    `Keep visible patrol capacity concentrated around ${topAreas.slice(0, 3).join(", ")} during the strongest demand windows.`,
    `Stage flexible backup units for ${topHours[0].topArea.area} and the surrounding corridor from ${formatHourStamp(topHours[0].timestamp)} onward.`,
    `${describeWeatherPattern(forecast.hours)} Use the rain blocks for mobile patrol redistribution and transport-corridor checks.`,
    `Where high-demand suburbs include nightlife or student zones, bias patrol timing toward evening spillover rather than static daytime coverage.`,
    `Use the watchlist table below to assign routine passes to medium-risk suburbs while preserving surge capacity for the peak hours.`,
  ];

  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
}

function renderAttentionTable(forecast) {
  const table = document.getElementById("attentionTable");
  table.innerHTML = "";
  const topHours = [...forecast.hours]
    .sort((left, right) => right.cityTotal - left.cityTotal)
    .slice(0, 8);
  const maxCityTotal = Math.max(...topHours.map((hour) => hour.cityTotal), 0.01);

  topHours.forEach((hour) => {
    const patrolCount = recommendedPatrolUnits(hour, maxCityTotal);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatHourStamp(hour.timestamp)}</td>
      <td>${hour.cityTotal.toFixed(2)}</td>
      <td>${hour.topArea.area}</td>
      <td>${WEATHER_LABELS[hour.weather] ?? hour.weather}</td>
      <td>${renderPatrolLoad(patrolCount)}</td>
    `;
    table.append(row);
  });
}

function renderWatchlist(forecast) {
  const table = document.getElementById("watchlistTable");
  table.innerHTML = "";
  const areaTotals = aggregateAreaTotals(forecast.hours);
  const maxIncidentSum = Math.max(...Array.from(areaTotals.values()).map((summary) => summary.incidentSum), 0.01);

  Array.from(areaTotals.entries())
    .sort((left, right) => right[1].incidentSum - left[1].incidentSum)
    .forEach(([area, summary]) => {
      const patrolCount = recommendedAreaPatrolUnits(summary, maxIncidentSum);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${area}</td>
        <td>${(summary.incidentSum / 48).toFixed(2)}</td>
        <td>${summary.maxRisk}/10</td>
        <td>${formatHourStamp(summary.peakTimestamp)}</td>
        <td>${renderPatrolLoad(patrolCount)}</td>
        <td>${strategyForRisk(summary.maxRisk)}</td>
      `;
      table.append(row);
    });
}

function aggregateAreaTotals(hours) {
  const areaTotals = new Map();

  hours.forEach((hour) => {
    hour.areas.forEach((area) => {
      const current = areaTotals.get(area.area) ?? {
        incidentSum: 0,
        maxRisk: 0,
        peakTimestamp: hour.timestamp,
      };
      current.incidentSum += area.incident;
      if (area.riskScore > current.maxRisk) {
        current.maxRisk = area.riskScore;
        current.peakTimestamp = hour.timestamp;
      }
      areaTotals.set(area.area, current);
    });
  });

  return areaTotals;
}

function describeWeatherPattern(hours) {
  const blocks = [];
  let blockStart = hours[0].timestamp;
  let blockWeather = hours[0].weather;

  for (let index = 1; index < hours.length; index += 1) {
    if (hours[index].weather !== blockWeather) {
      blocks.push({
        weather: blockWeather,
        start: blockStart,
        end: hours[index - 1].timestamp,
      });
      blockStart = hours[index].timestamp;
      blockWeather = hours[index].weather;
    }
  }

  blocks.push({
    weather: blockWeather,
    start: blockStart,
    end: hours[hours.length - 1].timestamp,
  });

  const rainBlocks = blocks.filter((block) => block.weather === "rain");
  if (!rainBlocks.length) {
    return "Mostly clear for the full 48-hour window.";
  }

  const rainText = rainBlocks.map((block) =>
    `${formatShortHour(block.start)}-${formatShortHour(block.end)}`,
  ).join("; ");
  return `Mostly clear, with rain episodes around ${rainText}.`;
}

function strategyForRisk(riskScore) {
  if (riskScore >= 8) {
    return "Visible patrol presence and fast-response positioning";
  }
  if (riskScore >= 6) {
    return "Targeted patrol pass during the higher-demand window";
  }
  return "Routine coverage with watchlist awareness";
}

function recommendedPatrolUnits(hour, maxCityTotal) {
  const cityRatio = hour.cityTotal / maxCityTotal;
  const riskRatio = hour.topArea.riskScore / 10;
  const combinedLoad = (cityRatio * 0.68) + (riskRatio * 0.32);

  if (combinedLoad >= 0.92) {
    return 4;
  }
  if (combinedLoad >= 0.76) {
    return 3;
  }
  if (combinedLoad >= 0.58) {
    return 2;
  }
  return 1;
}

function recommendedAreaPatrolUnits(summary, maxIncidentSum) {
  const incidentRatio = summary.incidentSum / maxIncidentSum;
  const riskRatio = summary.maxRisk / 10;
  const combinedLoad = (incidentRatio * 0.62) + (riskRatio * 0.38);

  if (combinedLoad >= 0.9) {
    return 4;
  }
  if (combinedLoad >= 0.72) {
    return 3;
  }
  if (combinedLoad >= 0.5) {
    return 2;
  }
  return 1;
}

function renderPatrolLoad(count) {
  const icons = Array.from({ length: count }, () => patrolCarIconSvg()).join("");
  return `
    <div class="patrol-load" aria-label="Approximately ${count} patrols recommended">
      <div class="patrol-icons">${icons}</div>
      <span class="patrol-count">~${count} patrols</span>
    </div>
  `;
}

function patrolCarIconSvg() {
  return `
    <svg class="patrol-icon" viewBox="0 0 64 32" aria-hidden="true" focusable="false">
      <rect x="21" y="6" width="12" height="4" rx="1.5" fill="#1f78ff"></rect>
      <path d="M10 22h3l4-8c1.2-2.3 2.6-3.3 5-3.3h17.4c3.2 0 5 .9 6.9 3.5l3.2 4.4H54c2.2 0 4 1.8 4 4v2.3H6v-2.3c0-2.2 1.8-4 4-4Z" fill="currentColor"></path>
      <circle cx="19" cy="25" r="4.5" fill="#20313f"></circle>
      <circle cx="45" cy="25" r="4.5" fill="#20313f"></circle>
      <circle cx="19" cy="25" r="2" fill="#f3f6f8"></circle>
      <circle cx="45" cy="25" r="2" fill="#f3f6f8"></circle>
      <path d="M20.2 13.6h9.8v5.3H17.4l2.8-4.6Z" fill="#dff2f7"></path>
      <path d="M31.6 13.6h8.3c2.2 0 3.4.5 4.7 2.4l1.9 2.9H31.6v-5.3Z" fill="#dff2f7"></path>
    </svg>
  `;
}

function incrementStat(map, key, value) {
  const existing = map.get(key) ?? { sum: 0, count: 0 };
  existing.sum += value;
  existing.count += 1;
  map.set(key, existing);
}

function meanOf(stat, fallback) {
  if (!stat || !stat.count) {
    return fallback;
  }
  return stat.sum / stat.count;
}

function weightedBlend(entries, fallback) {
  let numerator = 0;
  let denominator = 0;
  entries.forEach(([value, weight]) => {
    if (Number.isFinite(value)) {
      numerator += value * weight;
      denominator += weight;
    }
  });
  if (!denominator) {
    return fallback;
  }
  return numerator / denominator;
}

function computeNextHour() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

function formatHourStamp(timestamp) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatShortHour(timestamp) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
