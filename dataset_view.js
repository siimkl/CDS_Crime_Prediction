const DATASET_VIEW_CONFIG = {
  csvPath: "tartu_risk_dataset_2.csv",
};

const datasetState = {
  headers: [],
  rows: [],
  filteredRows: [],
  page: 1,
  pageSize: 100,
};

document.addEventListener("DOMContentLoaded", () => {
  bindDatasetControls();
  void initDatasetView();
});

async function initDatasetView() {
  const sourceStatus = document.getElementById("sourceStatus");

  try {
    const csvText = await fetchDatasetCsv(DATASET_VIEW_CONFIG.csvPath);
    const parsed = parseDatasetCsv(csvText);
    datasetState.headers = parsed.headers;
    datasetState.rows = parsed.rows;
    datasetState.filteredRows = parsed.rows;

    sourceStatus.textContent = parsed.sourceStatus;
    populateAreaFilter(parsed.rows);
    renderDatasetSummary(parsed.rows);
    renderTableHeader(parsed.headers);
    renderDatasetTable();
  } catch (error) {
    sourceStatus.textContent = "Load failed";
    document.getElementById("resultsLabel").textContent =
      error instanceof Error ? error.message : String(error);
  }
}

function bindDatasetControls() {
  document.getElementById("searchInput").addEventListener("input", () => {
    datasetState.page = 1;
    applyDatasetFilters();
  });

  document.getElementById("areaFilter").addEventListener("change", () => {
    datasetState.page = 1;
    applyDatasetFilters();
  });

  document.getElementById("pageSize").addEventListener("change", (event) => {
    datasetState.pageSize = Number(event.target.value);
    datasetState.page = 1;
    renderDatasetTable();
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    datasetState.page = Math.max(1, datasetState.page - 1);
    renderDatasetTable();
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    const pageCount = Math.max(1, Math.ceil(datasetState.filteredRows.length / datasetState.pageSize));
    datasetState.page = Math.min(pageCount, datasetState.page + 1);
    renderDatasetTable();
  });
}

async function fetchDatasetCsv(csvPath) {
  try {
    const response = await fetch(`${csvPath}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Could not read ${csvPath}.`);
    }
    return {
      csvText: await response.text(),
      sourceStatus: "Live CSV",
    };
  } catch (error) {
    if (typeof window.__TARTU_RISK_EMBEDDED_CSV__ === "string") {
      return {
        csvText: window.__TARTU_RISK_EMBEDDED_CSV__,
        sourceStatus: "Embedded fallback",
      };
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function parseDatasetCsv(payload) {
  const lines = payload.csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });

  return {
    headers,
    rows,
    sourceStatus: payload.sourceStatus,
  };
}

function populateAreaFilter(rows) {
  const areaFilter = document.getElementById("areaFilter");
  const areas = Array.from(new Set(rows.map((row) => row.area))).sort((left, right) => left.localeCompare(right));

  areas.forEach((area) => {
    const option = document.createElement("option");
    option.value = area;
    option.textContent = area;
    areaFilter.append(option);
  });
}

function renderDatasetSummary(rows) {
  const areaCount = new Set(rows.map((row) => row.area)).size;
  const timeValues = rows.map((row) => row.time);
  const firstTime = timeValues.reduce((lowest, current) => current < lowest ? current : lowest, timeValues[0]);
  const lastTime = timeValues.reduce((highest, current) => current > highest ? current : highest, timeValues[0]);

  document.getElementById("rowCount").textContent = formatNumber(rows.length);
  document.getElementById("areaCount").textContent = formatNumber(areaCount);
  document.getElementById("timeRange").textContent =
    `${formatDatasetTimestamp(firstTime)} - ${formatDatasetTimestamp(lastTime)}`;
}

function renderTableHeader(headers) {
  const tableHead = document.getElementById("tableHead");
  const row = document.createElement("tr");

  headers.forEach((header) => {
    const cell = document.createElement("th");
    cell.textContent = header;
    row.append(cell);
  });

  tableHead.innerHTML = "";
  tableHead.append(row);
}

function applyDatasetFilters() {
  const searchValue = document.getElementById("searchInput").value.trim().toLowerCase();
  const areaValue = document.getElementById("areaFilter").value;

  datasetState.filteredRows = datasetState.rows.filter((row) => {
    const matchesArea = !areaValue || row.area === areaValue;
    const matchesSearch = !searchValue || Object.values(row)
      .some((value) => String(value).toLowerCase().includes(searchValue));
    return matchesArea && matchesSearch;
  });

  renderDatasetTable();
}

function renderDatasetTable() {
  const tableBody = document.getElementById("tableBody");
  const totalRows = datasetState.filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / datasetState.pageSize));
  datasetState.page = Math.min(datasetState.page, pageCount);

  const startIndex = (datasetState.page - 1) * datasetState.pageSize;
  const pageRows = datasetState.filteredRows.slice(startIndex, startIndex + datasetState.pageSize);

  tableBody.innerHTML = "";
  pageRows.forEach((row) => {
    const tr = document.createElement("tr");
    datasetState.headers.forEach((header) => {
      const td = document.createElement("td");
      td.textContent = row[header];
      tr.append(td);
    });
    tableBody.append(tr);
  });

  document.getElementById("resultsLabel").textContent =
    `${formatNumber(totalRows)} matching rows`;
  document.getElementById("pageLabel").textContent =
    `Page ${datasetState.page} / ${pageCount}`;
  document.getElementById("prevPage").disabled = datasetState.page <= 1;
  document.getElementById("nextPage").disabled = datasetState.page >= pageCount;
}

function formatDatasetTimestamp(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value.replace(" ", "T")));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-GB").format(value);
}
