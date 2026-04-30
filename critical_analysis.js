const CRITICAL_CONFIG = {
  csvPath: "tartu_risk_dataset_2.csv",
};

const AREA_ORDER = [
  "Tähtvere",
  "Veeriku",
  "Maarjamõisa",
  "Tammelinn",
  "Ränilinn",
  "Vaksali",
  "Kesklinn",
  "Karlova",
  "Variku",
  "Ropka",
  "Ropka tööstuse",
  "Raadi-Kruusamäe",
  "Supilinn",
  "Ülejõe",
  "Jaamamõisa",
  "Annelinn",
  "Ihaste",
  "Kvissentali",
];

document.addEventListener("DOMContentLoaded", () => {
  void initCriticalAnalysis();
});

async function initCriticalAnalysis() {
  const csvText = await fetchCriticalCsv(CRITICAL_CONFIG.csvPath);
  const rows = parseCriticalCsv(csvText);
  const profiles = buildAreaProfiles(rows);
  const simulation = simulateTwoYears(profiles);

  renderCriticalSummary(simulation);
  renderLineChart(
    document.getElementById("patrolTrendChart"),
    simulation.quarterLabels,
    [
      { label: "Targeted minority / vulnerable areas", values: simulation.targetedPatrolSeries, color: "#c24c3d" },
      { label: "Light-touch residential areas", values: simulation.reliefPatrolSeries, color: "#137b72" },
    ],
    "Average patrol pressure index",
  );
  renderLineChart(
    document.getElementById("incidentTrendChart"),
    simulation.quarterLabels,
    [
      { label: "Targeted minority / vulnerable areas", values: simulation.targetedIncidentSeries, color: "#c24c3d" },
      { label: "Light-touch residential areas", values: simulation.reliefIncidentSeries, color: "#137b72" },
    ],
    "Recorded incident index",
  );
  renderImpactTable(simulation.areaResults);
  renderConclusions(simulation);
}

async function fetchCriticalCsv(csvPath) {
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

function parseCriticalCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    row.population = Number(row.population);
    row.area_population_density = Number(row.area_population_density);
    row.student_zone = Number(row.student_zone);
    row.nightlife_zone = Number(row.nightlife_zone);
    row.minorities_zone = Number(row.minorities_zone);
    row.socially_vulnerable_zone = Number(row.socially_vulnerable_zone);
    row.incident_count = Number(row.incident_count);
    return row;
  });
}

function buildAreaProfiles(rows) {
  const aggregate = new Map();

  rows.forEach((row) => {
    const current = aggregate.get(row.area) ?? {
      area: row.area,
      population: row.population,
      density: row.area_population_density,
      footTraffic: row.foot_traffic,
      areaType: row.area_type,
      studentZone: row.student_zone,
      nightlifeZone: row.nightlife_zone,
      minoritiesZone: row.minorities_zone,
      sociallyVulnerableZone: row.socially_vulnerable_zone,
      totalIncidents: 0,
      hourCount: 0,
    };

    current.totalIncidents += row.incident_count;
    current.hourCount += 1;
    aggregate.set(row.area, current);
  });

  return AREA_ORDER
    .map((area) => aggregate.get(area))
    .filter(Boolean)
    .map((profile) => ({
      ...profile,
      avgHourly: profile.totalIncidents / profile.hourCount,
      per10kWindow: (profile.totalIncidents / profile.population) * 10000,
    }));
}

function simulateTwoYears(profiles) {
  const states = profiles.map((profile) => ({
    ...profile,
    incidentLevel: profile.avgHourly,
    patrolPressure: 1,
    cumulativePatrol: 0,
    propertyShift: 0,
    prestigeShift: 0,
    ghettoizationScore: 0,
  }));

  const quarterLabels = [
    "Q1 2026",
    "Q2 2026",
    "Q3 2026",
    "Q4 2026",
    "Q1 2027",
    "Q2 2027",
    "Q3 2027",
    "Q4 2027",
  ];

  const targetedPatrolSeries = [];
  const reliefPatrolSeries = [];
  const targetedIncidentSeries = [];
  const reliefIncidentSeries = [];

  for (let quarter = 0; quarter < quarterLabels.length; quarter += 1) {
    const maxIncident = Math.max(...states.map((state) => state.incidentLevel), 0.01);
    const maxPer10k = Math.max(
      ...states.map((state) => ((state.incidentLevel * state.hourCount) / state.population) * 10000),
      0.01,
    );

    states.forEach((state) => {
      const per10kFlow = ((state.incidentLevel * state.hourCount) / state.population) * 10000;
      const riskIndex =
        0.68 * (state.incidentLevel / maxIncident)
        + 0.32 * (per10kFlow / maxPer10k);
      const targetingBias =
        1
        + 0.20 * state.sociallyVulnerableZone
        + 0.18 * state.minoritiesZone
        + 0.06 * state.nightlifeZone
        + 0.04 * state.studentZone;
      const targetedArea = state.sociallyVulnerableZone || state.minoritiesZone ? 1 : 0;
      const desiredPatrol = 0.68 + (riskIndex * targetingBias);

      // Keep quarter one close to the observed baseline, then let targeted areas
      // retain some institutional patrol attention in later quarters.
      if (quarter === 0) {
        state.patrolPressure = clamp(desiredPatrol, 0.65, 1.90);
        return;
      }

      const persistentTargeting = desiredPatrol + (0.04 * targetedArea);
      const patrolPersistence = 0.56 + (0.12 * targetedArea);
      const quarterDrift = 0.004 * quarter * targetedArea;
      state.patrolPressure = clamp(
        (persistentTargeting * (1 - patrolPersistence))
        + (state.patrolPressure * patrolPersistence)
        + quarterDrift,
        0.65,
        1.90,
      );
    });

    states.forEach((state) => {
      const visibleDeterrence =
        0.022
        * state.patrolPressure
        * (0.55 + 0.45 * (isVisibleArea(state) ? 1 : 0));
      const recordingEscalation =
        0.050
        * Math.max(0, state.patrolPressure - 0.88)
        * (0.55 + 0.65 * state.sociallyVulnerableZone + 0.60 * state.minoritiesZone);
      const lowContactRelief =
        0.022
        * Math.max(0, 1.05 - state.patrolPressure)
        * (0.65 + 0.35 * isPrestigeResidential(state));
      const serviceNeglect =
        0.012
        * Math.max(0, 0.84 - state.patrolPressure)
        * (0.40 + 0.60 * (state.nightlifeZone + state.studentZone));

      const multiplier = 1 - visibleDeterrence + recordingEscalation - lowContactRelief + serviceNeglect;
      state.incidentLevel = clamp(state.incidentLevel * multiplier, 0.03, 1.8);
      state.cumulativePatrol += state.patrolPressure;

      const vulnerabilityWeight =
        0.35 + 0.45 * state.sociallyVulnerableZone + 0.40 * state.minoritiesZone;
      state.propertyShift +=
        (lowContactRelief * 14)
        - (recordingEscalation * 18)
        - (Math.max(0, state.patrolPressure - 1) * vulnerabilityWeight * 2.8);
      state.prestigeShift +=
        (lowContactRelief * 12)
        - (recordingEscalation * 14)
        - (Math.max(0, state.patrolPressure - 1) * vulnerabilityWeight * 2.1);
      state.ghettoizationScore += Math.max(
        0,
        (recordingEscalation * (0.8 + vulnerabilityWeight)) - (visibleDeterrence * 0.25),
      );
    });

    const targetedGroup = states.filter((state) => state.sociallyVulnerableZone || state.minoritiesZone);
    const reliefGroup = states.filter((state) => !state.sociallyVulnerableZone && !state.minoritiesZone);

    targetedPatrolSeries.push(round2(average(targetedGroup.map((state) => state.patrolPressure))));
    reliefPatrolSeries.push(round2(average(reliefGroup.map((state) => state.patrolPressure))));
    targetedIncidentSeries.push(round2(average(targetedGroup.map((state) => state.incidentLevel))));
    reliefIncidentSeries.push(round2(average(reliefGroup.map((state) => state.incidentLevel))));
  }

  const areaResults = states.map((state) => {
    const avgPatrol = round2(state.cumulativePatrol / quarterLabels.length);
    const patrolAbove = Math.max(0, avgPatrol - 1);
    const patrolBelow = Math.max(0, 1.02 - avgPatrol);
    const visibleBenefit = (isVisibleArea(state) ? 1 : 0) * 0.06;
    const vulnerabilityPenalty = 0.16 * state.sociallyVulnerableZone + 0.14 * state.minoritiesZone;
    const prestigeRelief = 0.12 * isPrestigeResidential(state);
    const studentNightPenalty = 0.04 * (state.studentZone + state.nightlifeZone);
    const simulatedFactor = clamp(
      1
      + patrolAbove * (0.18 + vulnerabilityPenalty + studentNightPenalty)
      - patrolBelow * (0.18 + prestigeRelief + 0.08 * ((state.sociallyVulnerableZone || state.minoritiesZone) ? 1 : 0))
      - visibleBenefit * Math.max(0, avgPatrol - 0.95)
      + 0.02 * Math.max(0, 0.92 - avgPatrol) * (state.nightlifeZone + state.studentZone),
      0.75,
      1.35,
    );
    const simulatedWindowIncidents = Math.round(state.totalIncidents * simulatedFactor);
    const deltaPct = ((simulatedWindowIncidents - state.totalIncidents) / Math.max(1, state.totalIncidents)) * 100;
    const propertyPressure = Math.round(clamp(state.propertyShift, -18, 12));
    const prestigePressure = Math.round(clamp(state.prestigeShift, -16, 10));

    return {
      ...state,
      simulatedWindowIncidents,
      deltaPct,
      avgPatrol,
      propertyPressure,
      prestigePressure,
      ghettoizationLabel: scoreToRiskLabel(state.ghettoizationScore),
      socialImpact: describeSocialImpact(state, deltaPct),
    };
  });

  const bestArea = areaResults.reduce((best, current) => (current.deltaPct < best.deltaPct ? current : best), areaResults[0]);
  const worstArea = areaResults.reduce((worst, current) => (current.deltaPct > worst.deltaPct ? current : worst), areaResults[0]);

  return {
    quarterLabels,
    targetedPatrolSeries,
    reliefPatrolSeries,
    targetedIncidentSeries,
    reliefIncidentSeries,
    areaResults,
    bestArea,
    worstArea,
    targetedDelta: average(areaResults.filter((item) => item.sociallyVulnerableZone || item.minoritiesZone).map((item) => item.deltaPct)),
    reliefDelta: average(areaResults.filter((item) => !item.sociallyVulnerableZone && !item.minoritiesZone).map((item) => item.deltaPct)),
    highRiskCount: areaResults.filter((item) => item.ghettoizationLabel === "High").length,
  };
}

function renderCriticalSummary(simulation) {
  document.getElementById("bestArea").textContent =
    `${simulation.bestArea.area} (${formatSignedPercent(simulation.bestArea.deltaPct)})`;
  document.getElementById("worstArea").textContent =
    `${simulation.worstArea.area} (${formatSignedPercent(simulation.worstArea.deltaPct)})`;
}

function renderLineChart(container, labels, seriesList, yLabel) {
  const width = 960;
  const height = 320;
  const margin = { top: 22, right: 20, bottom: 44, left: 54 };
  const allValues = seriesList.flatMap((series) => series.values);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const yMin = minValue * 0.92;
  const yMax = maxValue * 1.08;

  const xStep = (width - margin.left - margin.right) / Math.max(1, labels.length - 1);
  const svgParts = [];

  for (let index = 0; index < 5; index += 1) {
    const t = index / 4;
    const y = margin.top + ((height - margin.top - margin.bottom) * t);
    const value = yMax - ((yMax - yMin) * t);
    svgParts.push(
      `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="rgba(18,50,74,0.10)" stroke-width="1"></line>`,
    );
    svgParts.push(
      `<text x="${margin.left - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#677487">${value.toFixed(2)}</text>`,
    );
  }

  labels.forEach((label, index) => {
    const x = margin.left + xStep * index;
    svgParts.push(
      `<text x="${x}" y="${height - 14}" text-anchor="middle" font-size="11" fill="#677487">${label}</text>`,
    );
  });

  seriesList.forEach((series) => {
    const points = series.values.map((value, index) => {
      const x = margin.left + xStep * index;
      const ratio = (value - yMin) / Math.max(0.0001, (yMax - yMin));
      const y = height - margin.bottom - ratio * (height - margin.top - margin.bottom);
      return `${x},${y}`;
    }).join(" ");
    svgParts.push(
      `<polyline fill="none" stroke="${series.color}" stroke-width="4" points="${points}"></polyline>`,
    );
    series.values.forEach((value, index) => {
      const x = margin.left + xStep * index;
      const ratio = (value - yMin) / Math.max(0.0001, (yMax - yMin));
      const y = height - margin.bottom - ratio * (height - margin.top - margin.bottom);
      svgParts.push(
        `<circle cx="${x}" cy="${y}" r="4" fill="${series.color}"></circle>`,
      );
    });
  });

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${yLabel}">
      <text x="${margin.left}" y="14" font-size="11" fill="#677487">${yLabel}</text>
      ${svgParts.join("")}
    </svg>
  `;

  const legend = `
    <div class="chart-legend">
      ${seriesList.map((series) => `
        <div class="legend-item">
          <span class="legend-swatch" style="background:${series.color}"></span>
          <span>${series.label}</span>
        </div>
      `).join("")}
    </div>
  `;

  container.innerHTML = `${svg}${legend}`;
}

function renderImpactTable(areaResults) {
  const body = document.getElementById("impactTable");
  const rows = areaResults
    .slice()
    .sort((left, right) => right.deltaPct - left.deltaPct)
    .map((item) => `
      <tr>
        <td>${item.area}</td>
        <td>${formatNumber(item.totalIncidents)}</td>
        <td>${formatNumber(item.simulatedWindowIncidents)}</td>
        <td>${item.avgPatrol.toFixed(2)}x baseline visibility</td>
        <td>${item.socialImpact}</td>
        <td>${formatPropertyPressure(item.propertyPressure)}</td>
        <td>${formatPrestigeShift(item.prestigePressure)}</td>
        <td>${renderRiskTag(item.ghettoizationLabel)}</td>
      </tr>
    `).join("");
  body.innerHTML = rows;
}

function renderConclusions(simulation) {
  const longRecommendation = document.getElementById("recommendationLong");
  const conclusionList = document.getElementById("conclusionList");

  longRecommendation.textContent =
    "In this simulation, the system does not read well as an automatic patrol-allocation engine. " +
    "It makes more sense as a critical teaching aid or, at most, as a tightly governed analyst " +
    "support tool with strong human override and equity controls.";

  const items = [
    "Recorded incidents were allowed to feed future patrol allocation without a clean separation between enforcement-generated events and public-harm events.",
    "Minority and socially vulnerable suburbs were pushed toward self-reinforcing high-risk loops, which is why fairness auditing became central to the critique.",
    "Patrol concentration accumulated in the same suburbs across quarters, making repeated targeting one of the main structural effects of the model.",
    "The simulated system looked less harmful only when strong human review, community oversight, and written justification were assumed around major reallocations.",
    "Second-order effects such as prestige drag, property price pressure, and ghettoization signals mattered alongside the core safety indicators.",
    "In a small pilot scenario, the model made more sense as a reversible, closely governed analyst aid than as an operational deployment engine.",
  ];

  conclusionList.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function describeSocialImpact(state, deltaPct) {
  if (state.sociallyVulnerableZone || state.minoritiesZone) {
    if (deltaPct > 8) {
      return "Higher stop-and-record pressure concentrated on minority / vulnerable residents";
    }
    if (deltaPct > 0) {
      return "Moderate surveillance pressure remains concentrated on vulnerable residents";
    }
    return "Pressure eases, but the area still sits near an enforcement watchlist";
  }

  if (deltaPct < -5) {
    return "Lighter policing contact and fewer enforcement-generated incidents";
  }
  return "Limited change in direct police-contact burden";
}

function isVisibleArea(state) {
  return state.nightlifeZone
    || state.studentZone
    || /Kesklinn|Karlova|Vaksali|Ülejõe|Supilinn/i.test(state.area);
}

function isPrestigeResidential(state) {
  return state.footTraffic === "low"
    && !state.sociallyVulnerableZone
    && !state.minoritiesZone
    && !state.nightlifeZone;
}

function scoreToRiskLabel(score) {
  if (score >= 0.42) {
    return "High";
  }
  if (score >= 0.22) {
    return "Medium";
  }
  return "Low";
}

function renderRiskTag(label) {
  const className = label === "High" ? "bad" : label === "Medium" ? "warn" : "good";
  return `<span class="tag ${className}">${label}</span>`;
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-GB").format(Math.round(value));
}

function formatSignedPercent(value) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}%`;
}

function formatPropertyPressure(value) {
  if (value <= -8) {
    return `Strong downward pressure (${value})`;
  }
  if (value < 0) {
    return `Mild downward pressure (${value})`;
  }
  if (value >= 6) {
    return `Strong uplift (+${value})`;
  }
  return `Mild uplift (+${value})`;
}

function formatPrestigeShift(value) {
  if (value <= -7) {
    return `Prestige loss (${value})`;
  }
  if (value < 0) {
    return `Small prestige drag (${value})`;
  }
  if (value >= 5) {
    return `Prestige gain (+${value})`;
  }
  return `Small prestige gain (+${value})`;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
