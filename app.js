const APP_CONFIG = {
  csvPath: "tartu_risk_dataset_2.csv",
  playbackMs: 434,
};
const STARTUP_ACK_KEY = "tartuSafetyPrototypeNoticeAcceptedSession";

const MAP_DEFAULT_VIEW = {
  x: 10,
  y: 150,
  width: 1400,
  height: 1193,
};

const MAP_BOUNDS = {
  xMin: -280,
  yMin: -260,
  xMax: 1660,
  yMax: 1380,
};

const MAP_MIN_VIEW_WIDTH = 560;
const MAP_MAX_VIEW_WIDTH = 1820;

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
  clear: "Weather: Clear",
  rain: "Weather: Rain",
  snow: "Weather: Snow",
  storm: "Weather: Storm",
  other_extremes: "Weather: Other extremes",
};

const DISTRICTS = [
  {
    number: 1,
    area: "T\u00e4htvere",
    short: "T\u00e4htvere",
    x: 486,
    y: 466,
    radius: 118,
    dx: -8,
    dy: -4,
    width: 112,
    zone: "360,310 435,330 520,380 555,440 530,520 455,565 395,540 350,450",
  },
  {
    number: 2,
    area: "Veeriku",
    short: "Veeriku",
    x: 436,
    y: 588,
    radius: 108,
    dx: -12,
    dy: -6,
    width: 106,
    zone: "355,540 440,560 500,600 500,675 455,720 390,725 355,675",
  },
  {
    number: 3,
    area: "Maarjam\u00f5isa",
    short: "Maarja.",
    x: 466,
    y: 688,
    radius: 94,
    dx: -10,
    dy: 0,
    width: 102,
    zone: "405,690 500,670 530,740 470,790 400,775",
  },
  {
    number: 4,
    area: "Tammelinn",
    short: "Tammelinn",
    x: 530,
    y: 745,
    radius: 124,
    dx: 8,
    dy: 0,
    width: 116,
    zone: "455,720 545,730 585,820 545,900 470,925 410,850",
  },
  {
    number: 5,
    area: "R\u00e4nilinn",
    short: "R\u00e4nilinn",
    x: 413,
    y: 870,
    radius: 98,
    dx: -8,
    dy: 4,
    width: 102,
    zone: "350,810 415,830 450,920 390,995 330,925",
  },
  {
    number: 6,
    area: "Vaksali",
    short: "Vaksali",
    x: 603,
    y: 663,
    radius: 82,
    dx: -12,
    dy: -2,
    width: 98,
    zone: "520,560 580,555 615,620 595,710 540,690 500,620",
  },
  {
    number: 7,
    area: "Kesklinn",
    short: "Kesklinn",
    x: 641,
    y: 570,
    radius: 104,
    dx: 6,
    dy: -18,
    width: 110,
    zone: "550,520 640,500 710,530 735,610 700,670 620,675 565,630 530,570",
  },
  {
    number: 8,
    area: "Karlova",
    short: "Karlova",
    x: 719,
    y: 699,
    radius: 108,
    dx: 6,
    dy: 2,
    width: 102,
    zone: "605,675 700,670 780,700 800,790 770,860 690,865 625,820 600,745",
  },
  {
    number: 9,
    area: "Variku",
    short: "Variku",
    x: 558,
    y: 895,
    radius: 86,
    dx: -4,
    dy: 0,
    width: 94,
    zone: "455,905 545,900 590,940 565,1005 485,1000 430,960",
  },
  {
    number: 10,
    area: "Ropka",
    short: "Ropka",
    x: 636,
    y: 835,
    radius: 104,
    dx: -4,
    dy: -4,
    width: 96,
    zone: "560,825 650,825 690,885 680,965 585,965 540,915",
  },
  {
    number: 11,
    area: "Ropka t\u00f6\u00f6stuse",
    short: "Ropka T.",
    x: 737,
    y: 901,
    radius: 116,
    dx: -8,
    dy: 0,
    width: 108,
    zone: "655,885 770,880 835,930 800,1010 660,1020 615,965",
  },
  {
    number: 12,
    area: "Raadi-Kruusam\u00e4e",
    short: "Raadi-K.",
    x: 675,
    y: 389,
    radius: 110,
    dx: 4,
    dy: -10,
    width: 110,
    zone: "540,300 655,320 760,360 800,420 760,470 660,450 615,420 560,400",
  },
  {
    number: 13,
    area: "Supilinn",
    short: "Supilinn",
    x: 594,
    y: 468,
    radius: 74,
    dx: -14,
    dy: 10,
    width: 98,
    zone: "540,470 585,465 620,500 595,540 555,535 520,505",
  },
  {
    number: 14,
    area: "\u00dclej\u00f5e",
    short: "\u00dclej\u00f5e",
    x: 689,
    y: 490,
    radius: 118,
    dx: 12,
    dy: 0,
    width: 98,
    zone: "590,420 650,450 760,470 805,520 755,575 660,565 610,520 570,470",
  },
  {
    number: 15,
    area: "Jaamam\u00f5isa",
    short: "Jaama.",
    x: 851,
    y: 487,
    radius: 108,
    dx: 10,
    dy: -6,
    width: 102,
    zone: "800,430 900,430 945,500 940,575 840,560 780,520",
  },
  {
    number: 16,
    area: "Annelinn",
    short: "Annelinn",
    x: 856,
    y: 604,
    radius: 136,
    dx: 12,
    dy: 0,
    width: 112,
    zone: "805,560 960,590 1015,690 990,820 930,905 845,900 790,820 780,710",
  },
  {
    number: 17,
    area: "Ihaste",
    short: "Ihaste",
    x: 947,
    y: 832,
    radius: 106,
    dx: 8,
    dy: 0,
    width: 96,
    zone: "905,840 1030,840 1090,915 1040,1030 900,1000 845,910",
  },
  {
    number: 18,
    area: "Kvissentali",
    short: "Kvissent.",
    x: 478,
    y: 267,
    radius: 82,
    dx: -12,
    dy: -4,
    width: 110,
    zone: "430,210 500,220 540,250 535,300 470,315 430,300 410,250",
  },
];

const state = {
  model: null,
  forecast: null,
  step: 0,
  selectedArea: null,
  markerMap: new Map(),
  playing: false,
  playHandle: null,
  mapView: { ...MAP_DEFAULT_VIEW },
  pan: null,
  panSuppressClickUntil: 0,
};

document.addEventListener("DOMContentLoaded", () => {
  bindControls();
  bindMapInteractions();
  bindStartupGate();
});

function bindStartupGate() {
  const acceptButton = document.getElementById("startupAccept");
  const exitButton = document.getElementById("startupExit");
  const gate = document.getElementById("startupGate");
  const startupChecks = [
    document.getElementById("startupAckAcademic"),
    document.getElementById("startupAckCritical"),
    document.getElementById("startupAckOperational"),
  ];

  const syncStartupAcceptState = () => {
    const allChecked = startupChecks.every((checkbox) => checkbox?.checked);
    acceptButton.disabled = !allChecked;
  };

  startupChecks.forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.addEventListener("change", syncStartupAcceptState);
  });
  syncStartupAcceptState();

  // Ignore any older persistent acceptance flag and use session-only state so
  // the notice appears on first entry, but not again during internal navigation.
  try {
    window.localStorage.removeItem("tartuSafetyPrototypeNoticeAccepted");
  } catch (error) {
    // No-op: storage availability can vary by browser mode.
  }

  const hasAccepted = (() => {
    try {
      return window.sessionStorage.getItem(STARTUP_ACK_KEY) === "true";
    } catch (error) {
      return false;
    }
  })();

  if (hasAccepted) {
    gate.hidden = true;
    gate.classList.add("hidden");
    void init();
    return;
  }

  gate.hidden = false;
  gate.classList.remove("hidden");

  acceptButton.addEventListener("click", () => {
    if (acceptButton.disabled) {
      return;
    }
    try {
      window.sessionStorage.setItem(STARTUP_ACK_KEY, "true");
    } catch (error) {
      // No-op: continue even if session storage is unavailable.
    }
    gate.hidden = true;
    gate.classList.add("hidden");
    void init();
  });

  exitButton.addEventListener("click", () => {
    window.location.href = "about:blank";
  });
}

async function init() {
  try {
    const csvText = await fetchCsvText(APP_CONFIG.csvPath);
    const rows = parseCsv(csvText);
    const model = buildModel(rows);
    const forecast = buildForecast(model, computeNextHour());

    state.model = model;
    state.forecast = forecast;
    state.selectedArea = DISTRICTS.some((district) => district.area === "Annelinn")
      ? "Annelinn"
      : forecast.hours[0].sortedAreas[0].area;

    applyMapView();
    createMarkers();
    buildAreaSelect();
    buildSliderScale();
    render();
    hideLoading();
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  }
}

function bindControls() {
  document.getElementById("hourSlider").addEventListener("input", (event) => {
    state.step = Number(event.target.value);
    stopPlayback();
    render();
  });

  document.getElementById("playToggle").addEventListener("click", () => {
    if (state.playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });

  document.getElementById("zoomIn").addEventListener("click", () => {
    zoomAroundViewport(0.88);
  });

  document.getElementById("zoomOut").addEventListener("click", () => {
    zoomAroundViewport(1.14);
  });

  document.getElementById("resetView").addEventListener("click", () => {
    state.mapView = { ...MAP_DEFAULT_VIEW };
    applyMapView();
  });

  const areaDropdown = document.getElementById("selectedAreaDropdown");
  const areaTrigger = document.getElementById("selectedAreaTrigger");
  areaTrigger.addEventListener("click", () => {
    const isOpen = areaDropdown.classList.toggle("open");
    areaTrigger.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!areaDropdown.contains(event.target)) {
      closeAreaDropdown();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAreaDropdown();
    }
  });

  const selectedChart = document.getElementById("selectedForecastChart");
  selectedChart.addEventListener("click", handleSelectedChartClick);
}

function bindMapInteractions() {
  const mapSvg = document.getElementById("mapSvg");

  mapSvg.addEventListener("pointerdown", handleMapPointerDown);
  mapSvg.addEventListener("pointermove", handleMapPointerMove);
  mapSvg.addEventListener("pointerup", handleMapPointerUp);
  mapSvg.addEventListener("pointercancel", handleMapPointerUp);
  mapSvg.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 0.9 : 1.1;
      zoomAtClientPoint(factor, event.clientX, event.clientY);
    },
    { passive: false },
  );
}

function handleMapPointerDown(event) {
  if (event.button !== 0) {
    return;
  }

  const mapSvg = document.getElementById("mapSvg");
  state.pan = {
    pointerId: event.pointerId,
    startView: { ...state.mapView },
    startPoint: clientToMapPoint(event.clientX, event.clientY, state.mapView),
    moved: false,
  };

  mapSvg.classList.add("is-dragging");
  mapSvg.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function handleMapPointerMove(event) {
  if (!state.pan || event.pointerId !== state.pan.pointerId) {
    return;
  }

  const point = clientToMapPoint(event.clientX, event.clientY, state.pan.startView);
  const deltaX = point.x - state.pan.startPoint.x;
  const deltaY = point.y - state.pan.startPoint.y;

  if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
    state.pan.moved = true;
  }

  state.mapView = clampMapView({
    ...state.pan.startView,
    x: state.pan.startView.x - deltaX,
    y: state.pan.startView.y - deltaY,
  });

  applyMapView();
}

function handleMapPointerUp(event) {
  if (!state.pan || event.pointerId !== state.pan.pointerId) {
    return;
  }

  const mapSvg = document.getElementById("mapSvg");
  if (mapSvg.hasPointerCapture(event.pointerId)) {
    mapSvg.releasePointerCapture(event.pointerId);
  }

  if (state.pan.moved) {
    state.panSuppressClickUntil = performance.now() + 120;
  }

  state.pan = null;
  mapSvg.classList.remove("is-dragging");
}

function handleSelectedChartClick(event) {
  if (!state.forecast) {
    return;
  }

  const chart = event.currentTarget;
  const rect = chart.getBoundingClientRect();
  if (!rect.width) {
    return;
  }

  const width = 360;
  const plotLeft = 18;
  const plotRight = 18;
  const plotWidth = width - plotLeft - plotRight;
  const localX = ((event.clientX - rect.left) / rect.width) * width;
  const normalized = clamp((localX - plotLeft) / plotWidth, 0, 1);
  const nextStep = Math.round(normalized * (state.forecast.hours.length - 1));

  state.step = clamp(nextStep, 0, state.forecast.hours.length - 1);
  stopPlayback();
  render();
}

function applyMapView() {
  const mapSvg = document.getElementById("mapSvg");
  const view = state.mapView;
  mapSvg.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
}

function clampMapView(view) {
  const width = clamp(view.width, MAP_MIN_VIEW_WIDTH, MAP_MAX_VIEW_WIDTH);
  const height = width * (MAP_DEFAULT_VIEW.height / MAP_DEFAULT_VIEW.width);
  const x = clamp(view.x, MAP_BOUNDS.xMin, MAP_BOUNDS.xMax - width);
  const y = clamp(view.y, MAP_BOUNDS.yMin, MAP_BOUNDS.yMax - height);
  return { x, y, width, height };
}

function zoomAroundViewport(factor) {
  const rect = document.getElementById("mapSvg").getBoundingClientRect();
  const clientX = rect.left + (rect.width / 2);
  const clientY = rect.top + (rect.height / 2);
  zoomAtClientPoint(factor, clientX, clientY);
}

function zoomAtClientPoint(factor, clientX, clientY) {
  const current = state.mapView;
  const anchor = clientToMapPoint(clientX, clientY, current);
  const nextWidth = clamp(current.width * factor, MAP_MIN_VIEW_WIDTH, MAP_MAX_VIEW_WIDTH);
  const nextHeight = nextWidth * (MAP_DEFAULT_VIEW.height / MAP_DEFAULT_VIEW.width);
  const anchorXRatio = (anchor.x - current.x) / current.width;
  const anchorYRatio = (anchor.y - current.y) / current.height;

  state.mapView = clampMapView({
    x: anchor.x - (anchorXRatio * nextWidth),
    y: anchor.y - (anchorYRatio * nextHeight),
    width: nextWidth,
    height: nextHeight,
  });

  applyMapView();
}

function clientToMapPoint(clientX, clientY, view) {
  const svg = document.getElementById("mapSvg");
  const rect = svg.getBoundingClientRect();
  const scale = Math.min(rect.width / view.width, rect.height / view.height);
  const renderedWidth = view.width * scale;
  const renderedHeight = view.height * scale;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;
  const localX = clamp(clientX - rect.left - offsetX, 0, renderedWidth);
  const localY = clamp(clientY - rect.top - offsetY, 0, renderedHeight);

  return {
    x: view.x + (localX / scale),
    y: view.y + (localY / scale),
  };
}

async function fetchCsvText(csvPath) {
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

function parseCsv(csvText) {
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
    row.is_weekend = Number(row.is_weekend);
    row.is_night = Number(row.is_night);
    row.student_zone = Number(row.student_zone);
    row.nightlife_zone = Number(row.nightlife_zone);
    row.minorities_zone = Number(row.minorities_zone);
    row.socially_vulnerable_zone = Number(row.socially_vulnerable_zone);
    row.incident_count = Number(row.incident_count);
    row.timestamp = new Date(row.time.replace(" ", "T"));
    return row;
  });
}

function buildModel(rows) {
  const areaMeta = new Map();
  const areaStats = new Map();
  const areaHourDay = new Map();
  const areaHour = new Map();
  const areaDay = new Map();
  const cityHour = new Map();
  const cityDay = new Map();
  const cityWeatherByTime = new Map();
  let globalSum = 0;
  let globalCount = 0;
  let lastDatasetTime = rows[0]?.time ?? "";

  rows.forEach((row) => {
    if (!areaMeta.has(row.area)) {
      areaMeta.set(row.area, {
        area: row.area,
        population: row.population,
        density: row.area_population_density,
        footTraffic: row.foot_traffic,
        areaType: row.area_type,
        studentZone: row.student_zone,
        nightlifeZone: row.nightlife_zone,
        minoritiesZone: row.minorities_zone,
        sociallyVulnerableZone: row.socially_vulnerable_zone,
      });
    }

    incrementStat(areaStats, row.area, row.incident_count);
    incrementStat(areaHourDay, `${row.area}|${row.day_of_week}|${row.hour}`, row.incident_count);
    incrementStat(areaHour, `${row.area}|${row.hour}`, row.incident_count);
    incrementStat(areaDay, `${row.area}|${row.day_of_week}`, row.incident_count);
    incrementStat(cityHour, `${row.hour}`, row.incident_count);
    incrementStat(cityDay, row.day_of_week, row.incident_count);

    if (!cityWeatherByTime.has(row.time)) {
      cityWeatherByTime.set(row.time, row.weather);
    }

    globalSum += row.incident_count;
    globalCount += 1;
    if (row.time > lastDatasetTime) {
      lastDatasetTime = row.time;
    }
  });

  const weatherCycle = Array.from(cityWeatherByTime.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-48)
    .map((entry) => entry[1]);

  return {
    areaMeta,
    areaStats,
    areaHourDay,
    areaHour,
    areaDay,
    cityHour,
    cityDay,
    weatherCycle,
    globalMean: globalSum / globalCount,
    lastDatasetTime,
  };
}

function buildForecast(model, startTime) {
  const weatherCycle = buildWeatherOutlook(startTime, model.lastDatasetTime);
  const rawByArea = new Map();

  DISTRICTS.forEach((district) => {
    rawByArea.set(district.area, []);
  });

  for (let step = 0; step < 48; step += 1) {
    const timestamp = new Date(startTime.getTime() + step * 3600_000);
    const weather = weatherCycle[step % weatherCycle.length];
    const dayName = DAY_NAMES[timestamp.getDay()];
    const hour = timestamp.getHours();

    DISTRICTS.forEach((district, index) => {
      const value = predictIncident(model, district.area, dayName, hour, weather, step, index);
      rawByArea.get(district.area).push(value);
    });
  }

  const smoothedByArea = new Map();
  rawByArea.forEach((series, area) => {
    smoothedByArea.set(area, smoothSeries(series));
  });

  const hours = [];
  for (let step = 0; step < 48; step += 1) {
    const timestamp = new Date(startTime.getTime() + step * 3600_000);
    const weather = weatherCycle[step % weatherCycle.length];
    const dayName = DAY_NAMES[timestamp.getDay()];
    const hour = timestamp.getHours();

    const areas = DISTRICTS.map((district) => {
      const meta = model.areaMeta.get(district.area);
      const exactStat = model.areaHourDay.get(`${district.area}|${dayName}|${hour}`);
      const fallbackHour = model.areaHour.get(`${district.area}|${hour}`);
      const sampleCount = exactStat?.count ?? fallbackHour?.count ?? 0;
      const incident = Number(smoothedByArea.get(district.area)[step].toFixed(2));
      const per10k = (incident / meta.population) * 10000;
      return {
        area: district.area,
        number: district.number,
        short: district.short,
        layout: district,
        incident,
        population: meta.population,
        density: meta.density,
        footTraffic: meta.footTraffic,
        areaType: meta.areaType,
        studentZone: meta.studentZone,
        nightlifeZone: meta.nightlifeZone,
        minoritiesZone: meta.minoritiesZone,
        sociallyVulnerableZone: meta.sociallyVulnerableZone,
        sampleCount,
        per10k,
      };
    });

    const maxIncident = Math.max(...areas.map((entry) => entry.incident), 0.01);
    const maxPer10k = Math.max(...areas.map((entry) => entry.per10k), 0.01);

    areas.forEach((entry) => {
      entry.riskScore = computeRiskScore(entry, maxIncident, maxPer10k);
      entry.riskColor = riskColor(entry.riskScore);
      entry.confidence = confidenceLabel(entry.sampleCount);
    });

    areas.sort((left, right) => {
      if (right.riskScore !== left.riskScore) {
        return right.riskScore - left.riskScore;
      }
      return right.incident - left.incident;
    });

    hours.push({
      timestamp,
      weather,
      cityTotal: Number(areas.reduce((sum, area) => sum + area.incident, 0).toFixed(2)),
      sortedAreas: areas,
      topArea: areas[0],
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

function createMarkers() {
  const zoneLayer = document.getElementById("districtZoneLayer");
  const markerLayer = document.getElementById("districtLayer");
  zoneLayer.innerHTML = "";
  markerLayer.innerHTML = "";
  state.markerMap.clear();

  DISTRICTS.forEach((district) => {
    const zone = svgElement("polygon", {
      class: "district-zone",
      points: district.zone,
      fill: "rgba(19, 123, 114, 0.58)",
    });

    const group = svgElement("g", { class: "district-marker", "data-area": district.area });

    const label = svgElement("g", {
      transform: `translate(${district.x + district.dx} ${district.y + district.dy})`,
    });
    const labelHeight = 42;
    const box = svgElement("rect", {
      class: "district-label-box",
      x: -50,
      y: -labelHeight / 2,
      width: 100,
      height: labelHeight,
      rx: 14,
      filter: "url(#panel-shadow)",
    });
    const lineTwo = svgElement("text", {
      class: "district-label-line district-name",
      x: -40,
      y: -2,
    });
    const lineThree = svgElement("text", {
      class: "district-label-line district-metrics",
      x: -40,
      y: 14,
    });

    lineTwo.textContent = district.short;
    lineThree.textContent = "-- incidents | --/10";

    label.append(box, lineTwo, lineThree);

    const activateDistrict = () => {
      if (performance.now() < state.panSuppressClickUntil) {
        return;
      }
      state.selectedArea = district.area;
      render();
    };

    const hit = svgElement("polygon", {
      class: "district-hit",
      points: district.zone,
    });

    group.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });

    group.addEventListener("pointerup", (event) => {
      event.stopPropagation();
    });

    group.addEventListener("click", (event) => {
      event.stopPropagation();
      activateDistrict();
    });

    zoneLayer.append(zone);
    group.append(label, hit);
    markerLayer.append(group);
    updateDistrictLabelLayout({
      box,
      lineTwo,
      lineThree,
      minWidth: district.width,
      height: labelHeight,
    });

    state.markerMap.set(district.area, {
      group,
      zone,
      box,
      lineTwo,
      lineThree,
      minWidth: district.width,
      height: labelHeight,
    });
  });
}

function buildAreaSelect() {
  const menu = document.getElementById("selectedAreaMenu");
  menu.innerHTML = "";
  DISTRICTS.forEach((district) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "selected-area-option";
    option.setAttribute("role", "option");
    option.dataset.area = district.area;
    option.textContent = district.area;
    option.addEventListener("click", () => {
      state.selectedArea = district.area;
      closeAreaDropdown();
      render();
    });
    menu.append(option);
  });
}

function buildSliderScale() {
  const scale = document.getElementById("sliderScale");
  scale.innerHTML = "";
  const marks = [0, 6, 12, 18, 24, 30, 36, 42, 47];
  marks.forEach((step) => {
    const label = document.createElement("span");
    label.textContent = compactTick(state.forecast.hours[step].timestamp);
    scale.append(label);
  });
}

function render() {
  if (!state.forecast) {
    return;
  }

  const hourData = state.forecast.hours[state.step];
  const slider = document.getElementById("hourSlider");
  slider.value = String(state.step);
  updateTimelineProgress(slider);

  renderSummary(hourData);
  renderMap(hourData);
  renderSelected(hourData);
  renderRanking(hourData);
  renderTimeline(hourData);
}

function renderSummary(hourData) {
  const summaryHour = document.getElementById("summaryHour");
  const summaryCityTotal = document.getElementById("summaryCityTotal");

  if (summaryHour) {
    summaryHour.innerHTML = formatForecastHourMarkup(hourData.timestamp);
  }

  if (summaryCityTotal) {
    summaryCityTotal.textContent = `${hourData.cityTotal.toFixed(2)} incidents`;
  }
}

function renderMap(hourData) {
  hourData.sortedAreas.forEach((entry) => {
    const marker = state.markerMap.get(entry.area);
    if (!marker) {
      return;
    }

    const zoneOpacity = 0.46 + (entry.riskScore * 0.035);
    marker.zone.setAttribute("fill", entry.riskColor);
    marker.zone.setAttribute("fill-opacity", zoneOpacity.toFixed(2));
    marker.zone.setAttribute("stroke", riskColor(Math.min(10, entry.riskScore + 1)));
    marker.zone.setAttribute("stroke-opacity", "0.36");

    marker.box.setAttribute("stroke", entry.riskColor);
    marker.lineThree.textContent = `${entry.incident.toFixed(2)} incidents | ${entry.riskScore}/10`;
    updateDistrictLabelLayout(marker);
    marker.group.classList.toggle("selected", state.selectedArea === entry.area);
  });
}

function updateDistrictLabelLayout(marker) {
  const horizontalPadding = 10;
  const minimumWidth = marker.minWidth ?? 92;
  const labelHeight = marker.height ?? 42;
  const nameWidth = marker.lineTwo.getBBox().width;
  const metricsWidth = marker.lineThree.getBBox().width;
  const contentWidth = Math.max(nameWidth, metricsWidth);
  const labelWidth = Math.max(minimumWidth, Math.ceil(contentWidth + (horizontalPadding * 2)));
  const startX = -labelWidth / 2 + horizontalPadding;

  marker.box.setAttribute("x", String(-labelWidth / 2));
  marker.box.setAttribute("y", String(-labelHeight / 2));
  marker.box.setAttribute("width", String(labelWidth));
  marker.box.setAttribute("height", String(labelHeight));
  marker.lineTwo.setAttribute("x", String(startX));
  marker.lineThree.setAttribute("x", String(startX));
}

function renderSelected(hourData) {
  const selected = hourData.sortedAreas.find((entry) => entry.area === state.selectedArea)
    ?? hourData.sortedAreas[0];
  state.selectedArea = selected.area;

  document.getElementById("selectedAreaTrigger").textContent = selected.area;
  renderAreaDropdownSelection();
  document.getElementById("selectedRiskPill").textContent = `${selected.riskScore}/10`;
  document.getElementById("selectedRiskPill").style.background =
    `linear-gradient(135deg, ${riskColor(Math.max(1, selected.riskScore - 2))}, ${selected.riskColor})`;
  document.getElementById("selectedIncident").textContent = selected.incident.toFixed(2);
  document.getElementById("selectedPopulation").textContent = formatNumber(selected.population);
  document.getElementById("selectedDensity").textContent = `${formatNumber(selected.density)} persons/km²`;
  document.getElementById("selectedConfidence").textContent = selected.confidence;
  document.getElementById("selectedRiskText").textContent = `${selected.riskScore}/10`;
  document.getElementById("selectedRiskBar").style.width = `${selected.riskScore * 10}%`;
  document.getElementById("selectedFootTraffic").textContent = titleCase(selected.footTraffic);
  document.getElementById("selectedAreaType").textContent = titleCase(selected.areaType);
  document.getElementById("selectedLifestyle").textContent =
    `${selected.nightlifeZone ? "Nightlife" : "No nightlife"} | ${selected.studentZone ? "Student" : "Non-student"}`;
  document.getElementById("selectedPerCapita").textContent =
    `${selected.per10k.toFixed(2)} / 10k residents`;
  renderSelectedOutlookChart(selected.area);
  const selectedCopy = buildSelectedCopy(selected, hourData);
  document.getElementById("selectedPosture").textContent = selectedCopy.posture;
  const narrativeElement = document.getElementById("selectedNarrative");
  narrativeElement.textContent = "";
  narrativeElement.classList.add("hidden");
}

function renderSelectedOutlookChart(areaName) {
  const chart = document.getElementById("selectedForecastChart");
  if (!chart || !state.forecast) {
    return;
  }

  const series = state.forecast.hours.map((hourData, index) => {
    const entry = hourData.sortedAreas.find((area) => area.area === areaName);
    if (!entry) {
      return null;
    }
    return {
      index,
      timestamp: hourData.timestamp,
      incident: entry.incident,
      riskScore: entry.riskScore,
    };
  }).filter(Boolean);

  if (!series.length) {
    chart.replaceChildren();
    return;
  }

  const chartTitle = document.getElementById("selectedChartTitle");
  const chartPeak = document.getElementById("selectedChartPeak");
  const chartStart = document.getElementById("selectedChartStart");
  const chartMid = document.getElementById("selectedChartMid");
  const chartEnd = document.getElementById("selectedChartEnd");
  const chartActiveLegend = document.getElementById("selectedChartActiveLegend");
  const peakPoint = series.reduce((peak, point) => (point.incident > peak.incident ? point : peak), series[0]);

  chartTitle.textContent = `${areaName} next 48 hours`;
  chartPeak.textContent = `Peak ${peakPoint.incident.toFixed(2)} | ${formatChartBadgeHour(peakPoint.timestamp)}`;
  chartStart.textContent = formatChartAxisHour(series[0].timestamp);
  chartMid.textContent = formatChartAxisHour(series[Math.floor((series.length - 1) / 2)].timestamp);
  chartEnd.textContent = formatChartAxisHour(series[series.length - 1].timestamp);
  chart.setAttribute("aria-label", `${areaName} 48-hour forecast with predicted incidents and risk score`);

  const width = 360;
  const height = 176;
  const plotLeft = 18;
  const plotRight = 18;
  const plotTop = 14;
  const plotBottom = 24;
  const plotWidth = width - plotLeft - plotRight;
  const plotHeight = height - plotTop - plotBottom;
  const maxIncident = Math.max(...series.map((point) => point.incident), 0.5);
  const currentPoint = series[state.step] ?? series[0];
  const currentX = plotLeft + ((currentPoint.index / (series.length - 1)) * plotWidth);
  const activeHourLabel = formatActiveChartHour(currentPoint.timestamp);

  const mapX = (index) => plotLeft + ((index / (series.length - 1)) * plotWidth);
  const mapIncidentY = (value) => plotTop + plotHeight - ((value / maxIncident) * plotHeight);
  const mapRiskY = (value) => plotTop + plotHeight - (((value - 1) / 9) * plotHeight);

  if (chartActiveLegend) {
    chartActiveLegend.innerHTML = `<i class="legend-swatch current"></i>Active hour | ${activeHourLabel}`;
  }

  const incidentPoints = series
    .map((point) => `${mapX(point.index).toFixed(2)},${mapIncidentY(point.incident).toFixed(2)}`)
    .join(" ");
  const riskPoints = series
    .map((point) => `${mapX(point.index).toFixed(2)},${mapRiskY(point.riskScore).toFixed(2)}`)
    .join(" ");
  const incidentAreaPath = [
    `M ${plotLeft} ${plotTop + plotHeight}`,
    ...series.map((point, index) => `L ${mapX(index).toFixed(2)} ${mapIncidentY(point.incident).toFixed(2)}`),
    `L ${plotLeft + plotWidth} ${plotTop + plotHeight}`,
    "Z",
  ].join(" ");

  chart.replaceChildren();

  [0, 0.25, 0.5, 0.75, 1].forEach((ratio) => {
    chart.append(svgElement("line", {
      x1: String(plotLeft),
      y1: String((plotTop + (plotHeight * ratio)).toFixed(2)),
      x2: String(plotLeft + plotWidth),
      y2: String((plotTop + (plotHeight * ratio)).toFixed(2)),
      stroke: "rgba(19, 49, 74, 0.10)",
      "stroke-width": "1",
    }));
  });

  [0, 12, 24, 36, 47].forEach((index) => {
    chart.append(svgElement("line", {
      x1: String(mapX(index).toFixed(2)),
      y1: String(plotTop),
      x2: String(mapX(index).toFixed(2)),
      y2: String(plotTop + plotHeight),
      stroke: "rgba(19, 49, 74, 0.07)",
      "stroke-width": index === state.step ? "1.5" : "1",
      "stroke-dasharray": index === state.step ? "0" : "3 5",
    }));
  });

  chart.append(svgElement("rect", {
    x: String((currentX - 9).toFixed(2)),
    y: String(plotTop),
    width: "18",
    height: String(plotHeight),
    rx: "9",
    fill: "rgba(19, 49, 74, 0.08)",
  }));

  chart.append(svgElement("line", {
    x1: String(currentX.toFixed(2)),
    y1: String(plotTop),
    x2: String(currentX.toFixed(2)),
    y2: String(plotTop + plotHeight),
    stroke: "#13314a",
    "stroke-width": "3.2",
  }));

  chart.append(svgElement("path", {
    d: incidentAreaPath,
    fill: "rgba(19, 123, 114, 0.12)",
  }));

  chart.append(svgElement("polyline", {
    points: incidentPoints,
    fill: "none",
    stroke: "#137b72",
    "stroke-width": "3",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }));

  chart.append(svgElement("polyline", {
    points: riskPoints,
    fill: "none",
    stroke: "#c86b29",
    "stroke-width": "2.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }));

  chart.append(svgElement("circle", {
    cx: String(currentX.toFixed(2)),
    cy: String(mapIncidentY(currentPoint.incident).toFixed(2)),
    r: "4.5",
    fill: "#137b72",
    stroke: "#ffffff",
    "stroke-width": "2",
  }));

  chart.append(svgElement("circle", {
    cx: String(currentX.toFixed(2)),
    cy: String(mapRiskY(currentPoint.riskScore).toFixed(2)),
    r: "4.5",
    fill: "#c86b29",
    stroke: "#ffffff",
    "stroke-width": "2",
  }));

  const labelWidth = Math.min(132, Math.max(86, Math.round(activeHourLabel.length * 6.2) + 18));
  const labelX = clamp(currentX - (labelWidth / 2), plotLeft, plotLeft + plotWidth - labelWidth);
  const labelRect = svgElement("rect", {
    x: String(labelX.toFixed(2)),
    y: String((plotTop + 8).toFixed(2)),
    width: String(labelWidth),
    height: "22",
    rx: "11",
    fill: "#13314a",
    opacity: "0.96",
  });
  chart.append(labelRect);

  const labelText = svgElement("text", {
    x: String((labelX + (labelWidth / 2)).toFixed(2)),
    y: String((plotTop + 23).toFixed(2)),
    fill: "#ffffff",
    "font-size": "10",
    "font-weight": "700",
    "text-anchor": "middle",
  });
  labelText.textContent = activeHourLabel;
  chart.append(labelText);

  const incidentTopLabel = svgElement("text", {
    x: String(plotLeft),
    y: String(plotTop - 2),
    fill: "#137b72",
    "font-size": "10",
    "font-weight": "700",
  });
  incidentTopLabel.textContent = `${maxIncident.toFixed(1)} inc`;
  chart.append(incidentTopLabel);

  const incidentBottomLabel = svgElement("text", {
    x: String(plotLeft),
    y: String(plotTop + plotHeight + 16),
    fill: "#6a7c8f",
    "font-size": "10",
    "font-weight": "600",
  });
  incidentBottomLabel.textContent = "0";
  chart.append(incidentBottomLabel);

  const riskTopLabel = svgElement("text", {
    x: String(plotLeft + plotWidth - 26),
    y: String(plotTop - 2),
    fill: "#c86b29",
    "font-size": "10",
    "font-weight": "700",
  });
  riskTopLabel.textContent = "10/10";
  chart.append(riskTopLabel);

  const riskBottomLabel = svgElement("text", {
    x: String(plotLeft + plotWidth - 22),
    y: String(plotTop + plotHeight + 16),
    fill: "#6a7c8f",
    "font-size": "10",
    "font-weight": "600",
  });
  riskBottomLabel.textContent = "1/10";
  chart.append(riskBottomLabel);
}

function renderAreaDropdownSelection() {
  document.querySelectorAll(".selected-area-option").forEach((option) => {
    const isActive = option.dataset.area === state.selectedArea;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-selected", String(isActive));
  });
}

function renderRanking(hourData) {
  const rankingList = document.getElementById("rankingList");
  if (!rankingList) {
    return;
  }
  rankingList.innerHTML = "";

  hourData.sortedAreas.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ranking-row";
    if (entry.area === state.selectedArea) {
      button.classList.add("active");
    }

    button.innerHTML = `
      <div class="ranking-number">${entry.number}</div>
      <div>
        <div class="ranking-area">${entry.area}</div>
        <div class="ranking-subline">${entry.incident.toFixed(2)} incidents | ${entry.confidence}</div>
      </div>
      <div class="ranking-risk">
        <div class="ranking-area">${entry.riskScore}/10</div>
        <div class="ranking-subline">rank ${index + 1}</div>
      </div>
    `;

    button.addEventListener("click", () => {
      state.selectedArea = entry.area;
      render();
    });

    rankingList.append(button);
  });
}

function renderTimeline(hourData) {
  const timelineWindow = document.getElementById("timelineWindow");
  const timelineContext = document.getElementById("timelineContext");

  if (timelineWindow) {
    timelineWindow.textContent = formatTimelineWindow(hourData.timestamp);
  }

  if (timelineContext) {
    timelineContext.textContent = WEATHER_LABELS[hourData.weather] ?? hourData.weather;
  }
}

function closeAreaDropdown() {
  const areaDropdown = document.getElementById("selectedAreaDropdown");
  const areaTrigger = document.getElementById("selectedAreaTrigger");
  areaDropdown.classList.remove("open");
  areaTrigger.setAttribute("aria-expanded", "false");
}

function updateTimelineProgress(slider) {
  const progress = (state.step / 47) * 100;
  slider.style.setProperty("--progress", `${progress}%`);
  slider.classList.toggle("is-playing", state.playing);

  const bottomHud = document.querySelector(".bottom-hud");
  if (bottomHud) {
    bottomHud.classList.toggle("is-playing", state.playing);
  }

  const playButton = document.getElementById("playToggle");
  if (playButton) {
    playButton.classList.toggle("is-playing", state.playing);
  }
}

function startPlayback() {
  if (state.playing) {
    return;
  }
  state.playing = true;
  document.getElementById("playToggle").textContent = "Pause";
  updateTimelineProgress(document.getElementById("hourSlider"));
  state.playHandle = window.setInterval(() => {
    state.step = state.step >= 47 ? 0 : state.step + 1;
    render();
  }, APP_CONFIG.playbackMs);
}

function stopPlayback() {
  if (!state.playing) {
    return;
  }
  state.playing = false;
  document.getElementById("playToggle").textContent = "Run 48h Forecast";
  window.clearInterval(state.playHandle);
  state.playHandle = null;
  updateTimelineProgress(document.getElementById("hourSlider"));
}

function computeRiskScore(areaEntry, maxIncident, maxPer10k) {
  const incidentNorm = areaEntry.incident / maxIncident;
  const perCapitaNorm = areaEntry.per10k / maxPer10k;
  const raw = (incidentNorm * 0.68) + (perCapitaNorm * 0.32);
  return clamp(Math.round((raw * 9) + 1), 1, 10);
}

function riskColor(score) {
  const ratio = (score - 1) / 9;
  const hue = 145 - (ratio * 140);
  const lightness = 56 - (ratio * 16);
  return `hsl(${hue.toFixed(0)}, 74%, ${lightness.toFixed(0)}%)`;
}

function buildSelectedCopy(selected, hourData) {
  let posture = "";
  if (selected.riskScore >= 8) {
    posture = "Visible patrol presence and fast-response positioning.";
  } else if (selected.riskScore >= 6) {
    posture = "Targeted patrol pass for this hour.";
  } else {
    posture = "Routine coverage with watchlist awareness.";
  }

  return {
    posture,
  };
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

function incrementStat(map, key, value) {
  const existing = map.get(key) ?? { sum: 0, count: 0 };
  existing.sum += value;
  existing.count += 1;
  map.set(key, existing);
}

function computeNextHour() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

function computeCurrentHour() {
  const current = new Date();
  current.setMinutes(0, 0, 0);
  return current;
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

function formatTimelineWindow(timestamp) {
  const end = new Date(timestamp.getTime() + 3600_000);
  const startLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);

  const sameDay = timestamp.getFullYear() === end.getFullYear()
    && timestamp.getMonth() === end.getMonth()
    && timestamp.getDate() === end.getDate();

  const endLabel = sameDay
    ? new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(end)
    : new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(end);

  return `${startLabel} - ${endLabel}`;
}

function formatForecastHourMarkup(timestamp) {
  const datePart = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(timestamp);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
  return `${datePart}, <span class="summary-hour-time">${timePart}</span>`;
}

function formatChartAxisHour(timestamp) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatChartBadgeHour(timestamp) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatActiveChartHour(timestamp) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function compactTick(timestamp) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatDatasetTime(timeValue) {
  const timestamp = typeof timeValue === "string"
    ? new Date(timeValue.replace(" ", "T"))
    : timeValue;
  if (!(timestamp instanceof Date) || Number.isNaN(timestamp.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function buildDatasetWindowLabel() {
  const end = computeCurrentHour();
  const start = new Date(end);
  start.setDate(start.getDate() - 90);
  return `Dataset window: ${formatDatasetTime(start)} - ${formatDatasetTime(end)}`;
}

function confidenceLabel(sampleCount) {
  if (sampleCount >= 12) {
    return "High";
  }
  if (sampleCount >= 8) {
    return "Stable";
  }
  return "Watch";
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function titleCase(value) {
  if (!value) {
    return "-";
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hideLoading() {
  document.getElementById("loadingState").classList.add("hidden");
}

function showError(message) {
  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("errorState").classList.remove("hidden");
  document.getElementById("errorMessage").textContent = message;
}

function svgElement(tagName, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
