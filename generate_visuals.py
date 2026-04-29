"""Create visual diagnostics and a plain-language dataset overview.

Run from the command line:

    python generate_visuals.py
    python generate_visuals.py "other_dataset.csv"
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from textwrap import dedent

import matplotlib

matplotlib.use("Agg")

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


DEFAULT_CSV_PATH = Path("tartu_risk_dataset.csv")
DEFAULT_VISUALS_DIR = Path("visuals")
DEFAULT_OVERVIEW_PATH = Path("dataset_overview.md")

WEEKDAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

WEATHER_ORDER = ["clear", "rain", "snow", "storm", "other_extremes"]

FIG_FACE = "#fbfaf7"
AX_FACE = "#ffffff"
GRID = "#d9d6cf"
TEXT = "#222222"
MUTED = "#6e6a64"
BLUE = "#2f6f9f"
TEAL = "#2f8f83"
ORANGE = "#c7772f"
RED = "#b94a48"
PURPLE = "#6c5b9b"
GREEN = "#5f8f3f"
HOLIDAY_EVE = pd.Timestamp("2026-02-23")
HOLIDAY_DAY = pd.Timestamp("2026-02-24")


@dataclass(frozen=True)
class RenderConfig:
    """Paths and labels for one visualization run."""

    csv_path: Path
    visuals_dir: Path
    overview_path: Path
    dataset_label: str


def slugify(value: str) -> str:
    """Create a filesystem-friendly slug."""

    slug = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_").lower()
    return slug or "dataset"


def parse_args() -> RenderConfig:
    """Parse CLI arguments and derive output paths."""

    parser = argparse.ArgumentParser(
        description="Generate chart PNGs and a markdown overview from a Tartu risk CSV."
    )
    parser.add_argument(
        "csv_path",
        nargs="?",
        default=str(DEFAULT_CSV_PATH),
        help="Path to the source CSV. Defaults to tartu_risk_dataset.csv.",
    )
    parser.add_argument(
        "--visuals-dir",
        help="Directory for PNG charts. Defaults to visuals or a dataset-specific folder.",
    )
    parser.add_argument(
        "--overview-path",
        help="Path for the markdown overview. Defaults to dataset_overview.md or a dataset-specific file.",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv_path)
    csv_name = csv_path.name
    dataset_label = csv_path.stem
    is_default_dataset = csv_name == DEFAULT_CSV_PATH.name
    slug = slugify(csv_path.stem)

    visuals_dir = (
        Path(args.visuals_dir)
        if args.visuals_dir
        else DEFAULT_VISUALS_DIR
        if is_default_dataset
        else Path(f"visuals_{slug}")
    )
    overview_path = (
        Path(args.overview_path)
        if args.overview_path
        else DEFAULT_OVERVIEW_PATH
        if is_default_dataset
        else Path(f"dataset_overview_{slug}.md")
    )

    return RenderConfig(
        csv_path=csv_path,
        visuals_dir=visuals_dir,
        overview_path=overview_path,
        dataset_label=dataset_label,
    )


def load_dataset(csv_path: Path) -> pd.DataFrame:
    """Read the generated CSV and parse timestamps."""

    if not csv_path.exists():
        raise FileNotFoundError(
            f"{csv_path} is missing. Provide a valid CSV path before generating visuals."
        )

    df = pd.read_csv(csv_path)
    df["time"] = pd.to_datetime(df["time"])
    df["date"] = df["time"].dt.date
    return df


def configure_style() -> None:
    """Apply a restrained plotting style."""

    plt.rcParams.update(
        {
            "figure.facecolor": FIG_FACE,
            "axes.facecolor": AX_FACE,
            "axes.edgecolor": "#9b968f",
            "axes.labelcolor": TEXT,
            "axes.titlecolor": TEXT,
            "xtick.color": TEXT,
            "ytick.color": TEXT,
            "font.size": 10,
            "axes.titlesize": 14,
            "axes.labelsize": 10,
            "legend.frameon": False,
            "savefig.facecolor": FIG_FACE,
            "savefig.bbox": "tight",
        }
    )


def save_figure(fig: plt.Figure, visuals_dir: Path, filename: str) -> None:
    """Save and close a figure."""

    visuals_dir.mkdir(exist_ok=True)
    fig.savefig(visuals_dir / filename, dpi=180)
    plt.close(fig)


def plot_daily_incidents(df: pd.DataFrame, visuals_dir: Path) -> None:
    """Line chart of daily incident totals."""

    daily = df.groupby("date")["incident_count"].sum()
    dates = pd.to_datetime(daily.index)
    weekend = pd.Series(dates.day_name()).isin(["Friday", "Saturday", "Sunday"])
    holiday_dates = pd.to_datetime([HOLIDAY_EVE.date(), HOLIDAY_DAY.date()])
    holiday_values = daily.reindex(holiday_dates.date).to_numpy()

    fig, ax = plt.subplots(figsize=(12, 5.2))
    ax.plot(dates, daily.values, color=BLUE, linewidth=2.1, label="Daily total")
    ax.scatter(
        dates[weekend],
        daily.values[weekend.to_numpy()],
        color=ORANGE,
        s=32,
        zorder=4,
        label="Fri-Sun",
    )
    ax.scatter(
        holiday_dates,
        holiday_values,
        color=RED,
        s=54,
        zorder=5,
        label="Feb 23-24 holiday",
    )
    ax.axhline(43.3, color=RED, linestyle="--", linewidth=1.4, label="Target mean 43.3")
    ax.fill_between(dates, 35, 50, color=TEAL, alpha=0.10, label="Typical range 35-50")
    ax.axvspan(HOLIDAY_EVE, HOLIDAY_DAY + pd.Timedelta(days=1), color=ORANGE, alpha=0.08)

    for holiday_date, holiday_value in zip(holiday_dates, holiday_values):
        ax.annotate(
            f"{holiday_date.strftime('%b %d')}: {int(holiday_value)}",
            (holiday_date, holiday_value),
            xytext=(0, 10),
            textcoords="offset points",
            ha="center",
            fontsize=9,
            color=TEXT,
        )

    ax.set_title("Daily Public-Order Incidents")
    ax.set_ylabel("Incidents per day")
    ax.set_xlabel("")
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    ax.xaxis.set_major_locator(mdates.WeekdayLocator(interval=2))
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
    ax.legend(loc="upper left", ncols=2)

    save_figure(fig, visuals_dir, "01_daily_incident_totals.png")


def plot_holiday_window(df: pd.DataFrame, visuals_dir: Path) -> None:
    """Zoom into the national-holiday window so the uplift is easy to inspect."""

    hourly = (
        df.groupby("time")["incident_count"].sum().sort_index()
    )
    window = hourly.loc["2026-02-23 12:00":"2026-02-25 06:00"]
    holiday_mask = (
        ((window.index.date == HOLIDAY_EVE.date()) & (window.index.hour >= 18))
        | ((window.index.date == HOLIDAY_DAY.date()) & ((window.index.hour <= 5) | (window.index.hour >= 21)))
    )

    fig, ax = plt.subplots(figsize=(12, 4.8))
    ax.plot(window.index, window.values, color=BLUE, linewidth=2.1)
    ax.scatter(
        window.index[holiday_mask],
        window.values[holiday_mask],
        color=RED,
        s=34,
        zorder=4,
        label="Holiday uplift window",
    )
    ax.axvspan(pd.Timestamp("2026-02-23 18:00"), pd.Timestamp("2026-02-24 06:00"), color=ORANGE, alpha=0.10)
    ax.axvspan(pd.Timestamp("2026-02-24 21:00"), pd.Timestamp("2026-02-25 00:00"), color=ORANGE, alpha=0.10)

    ax.set_title("Feb 23 Evening and Feb 24 Night Incident Window")
    ax.set_ylabel("Incidents per city-hour")
    ax.set_xlabel("")
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    ax.xaxis.set_major_locator(mdates.HourLocator(interval=6))
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d\n%H:%M"))
    ax.legend(loc="upper left")

    save_figure(fig, visuals_dir, "07_holiday_window.png")


def plot_incidents_by_area(df: pd.DataFrame, visuals_dir: Path) -> None:
    """Horizontal bar chart of total incidents by district."""

    area_totals = df.groupby("area")["incident_count"].sum().sort_values()
    colors = [TEAL if value < area_totals.median() else BLUE for value in area_totals]

    fig, ax = plt.subplots(figsize=(9.5, 7.2))
    ax.barh(area_totals.index, area_totals.values, color=colors)
    ax.set_title("Total Incidents by Tartu District")
    ax.set_xlabel("Total incidents in generated period")
    ax.set_ylabel("")
    ax.grid(axis="x", color=GRID, linewidth=0.8)

    for index, value in enumerate(area_totals.values):
        ax.text(value + 5, index, f"{int(value)}", va="center", fontsize=9, color=MUTED)

    save_figure(fig, visuals_dir, "02_incidents_by_area.png")


def plot_weekday_hour_heatmap(df: pd.DataFrame, visuals_dir: Path) -> None:
    """Heatmap of average incident count by weekday and hour."""

    heatmap = (
        df.groupby(["day_of_week", "hour"])["incident_count"]
        .mean()
        .unstack("hour")
        .reindex(WEEKDAY_ORDER)
    )

    fig, ax = plt.subplots(figsize=(12, 4.8))
    image = ax.imshow(heatmap.values, aspect="auto", cmap="YlOrRd")

    ax.set_title("Average Incident Count by Weekday and Hour")
    ax.set_xlabel("Hour of day")
    ax.set_ylabel("")
    ax.set_xticks(np.arange(24))
    ax.set_xticklabels([str(hour) for hour in range(24)])
    ax.set_yticks(np.arange(len(WEEKDAY_ORDER)))
    ax.set_yticklabels(WEEKDAY_ORDER)

    cbar = fig.colorbar(image, ax=ax, fraction=0.025, pad=0.02)
    cbar.set_label("Mean incidents per district-hour")

    save_figure(fig, visuals_dir, "03_weekday_hour_heatmap.png")


def plot_weather_patterns(df: pd.DataFrame, visuals_dir: Path) -> None:
    """Compare generated weather hours and incident rates by weather state."""

    weather_by_time = df[["time", "weather"]].drop_duplicates("time")
    weather_share = (
        weather_by_time["weather"].value_counts(normalize=True).reindex(WEATHER_ORDER) * 100
    )
    weather_incident_rate = (
        df.groupby("weather")["incident_count"].mean().reindex(WEATHER_ORDER)
    )
    weather_daily = (
        df.groupby(["date", "weather"])["incident_count"]
        .sum()
        .reset_index()
        .groupby("weather")["incident_count"]
        .mean()
        .reindex(WEATHER_ORDER)
    )

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    axes[0].bar(weather_share.index, weather_share.values, color=[GREEN, BLUE, PURPLE, RED, ORANGE])
    axes[0].set_title("Weather Share of Generated Hours")
    axes[0].set_ylabel("Share of hourly timestamps (%)")
    axes[0].grid(axis="y", color=GRID, linewidth=0.8)
    axes[0].tick_params(axis="x", rotation=25)

    axes[1].bar(
        weather_incident_rate.index,
        weather_incident_rate.values,
        color=[GREEN, BLUE, PURPLE, RED, ORANGE],
    )
    axes[1].set_title("Incident Rate by Weather")
    axes[1].set_ylabel("Mean incidents per district-hour")
    axes[1].grid(axis="y", color=GRID, linewidth=0.8)
    axes[1].tick_params(axis="x", rotation=25)

    for ax in axes:
        ax.set_xlabel("")

    fig.text(
        0.5,
        -0.02,
        "Daily weather-conditioned totals average "
        + ", ".join(
            f"{weather}: {value:.1f}" for weather, value in weather_daily.dropna().items()
        ),
        ha="center",
        color=MUTED,
        fontsize=9,
    )

    save_figure(fig, visuals_dir, "04_weather_patterns.png")


def plot_incident_count_distribution(df: pd.DataFrame, visuals_dir: Path) -> None:
    """Show sparsity in the target variable."""

    counts = df["incident_count"].value_counts().sort_index()
    colors = [TEAL if value == 0 else BLUE if value <= 2 else ORANGE for value in counts.index]

    fig, ax = plt.subplots(figsize=(9, 5))
    ax.bar(counts.index.astype(str), counts.values, color=colors)
    ax.set_title("Target Distribution: incident_count")
    ax.set_xlabel("incident_count value")
    ax.set_ylabel("Number of district-hour rows")
    ax.grid(axis="y", color=GRID, linewidth=0.8)

    for index, value in enumerate(counts.values):
        ax.text(index, value + 180, f"{int(value):,}", ha="center", fontsize=9, color=MUTED)

    save_figure(fig, visuals_dir, "05_incident_count_distribution.png")


def plot_area_feature_profile(df: pd.DataFrame, visuals_dir: Path) -> None:
    """Show static area feature composition."""

    areas = df.drop_duplicates("area").copy()
    type_counts = areas["area_type"].value_counts().sort_index()
    foot_counts = areas["foot_traffic"].value_counts().reindex(["low", "medium", "high"])
    zone_cols = [
        "socially_vulnerable_zone",
        "minorities_zone",
        "student_zone",
        "nightlife_zone",
    ]
    zone_counts = areas[zone_cols].sum().rename(
        {
            "socially_vulnerable_zone": "socially vulnerable",
            "minorities_zone": "minorities",
            "student_zone": "student",
            "nightlife_zone": "nightlife",
        }
    )

    fig, axes = plt.subplots(1, 3, figsize=(13, 4.5))
    axes[0].bar(type_counts.index, type_counts.values, color=[ORANGE, BLUE, TEAL])
    axes[0].set_title("Area Type")
    axes[0].set_ylabel("District count")

    axes[1].bar(foot_counts.index, foot_counts.values, color=[TEAL, BLUE, ORANGE])
    axes[1].set_title("Foot Traffic")

    axes[2].bar(zone_counts.index, zone_counts.values, color=[RED, PURPLE, BLUE, ORANGE])
    axes[2].set_title("Binary Zone Flags")
    axes[2].tick_params(axis="x", rotation=25)

    for ax in axes:
        ax.grid(axis="y", color=GRID, linewidth=0.8)
        ax.set_ylim(0, max(type_counts.max(), foot_counts.max(), zone_counts.max()) + 2)

    save_figure(fig, visuals_dir, "06_area_feature_profile.png")


def write_dataset_overview(
    df: pd.DataFrame, overview_path: Path, visuals_dir: Path, dataset_label: str
) -> None:
    """Write a concise markdown overview using the generated CSV."""

    daily = df.groupby("date")["incident_count"].sum()
    area_totals = df.groupby("area")["incident_count"].sum().sort_values(ascending=False)
    zero_share = (df["incident_count"] == 0).mean()
    one_share = (df["incident_count"] == 1).mean()
    multi_share = (df["incident_count"] >= 2).mean()
    weather_share = (
        df[["time", "weather"]]
        .drop_duplicates("time")["weather"]
        .value_counts(normalize=True)
        .reindex(WEATHER_ORDER)
        * 100
    )
    holiday_dates = [HOLIDAY_EVE.date(), HOLIDAY_DAY.date()]
    holiday_daily = daily.reindex(holiday_dates)
    weekday_means = (
        df.groupby(["date", "day_of_week"])["incident_count"]
        .sum()
        .reset_index()
        .groupby("day_of_week")["incident_count"]
        .mean()
        .reindex(WEEKDAY_ORDER)
    )
    columns = ", ".join(f"`{column}`" for column in df.columns if column != "date")

    extra_columns = [
        column
        for column in df.columns
        if column not in {"date", "id", "area", "time", "incident_count"}
    ]
    special_notes = []
    if "synthetic_incident_added" in df.columns:
        added_share = (df["synthetic_incident_added"] == 1).mean()
        special_notes.append(
            f"- `synthetic_incident_added = 1` on {added_share:.2%} of rows"
        )
    special_notes_text = "\n".join(special_notes) if special_notes else "- No extra synthetic-control fields beyond the core schema"

    visuals_dir_name = visuals_dir.as_posix()

    overview = f"""# Dataset Overview

Dataset: `{dataset_label}`

This CSV is a synthetic hourly panel dataset for Tartu public-order incident
forecasting. One row is one district at one timestamp. The target is
`incident_count`; there is no `risk_score` and no `same_slot_avg_90d`.

## Basic Shape

- Rows: {len(df):,}
- Columns: {df.drop(columns=["date"]).shape[1]}
- Districts: {df["area"].nunique()}
- Hourly timestamps: {df["time"].nunique():,}
- Time range: {df["time"].min()} to {df["time"].max()}
- Daily incident mean: {daily.mean():.2f}
- Daily incident range: {int(daily.min())} to {int(daily.max())}

## Columns

{columns}

## Additional Notes

{special_notes_text}
- Non-target predictors in this file: {", ".join(f"`{column}`" for column in extra_columns)}

## Target Behavior

- Zero rows: {zero_share:.2%}
- Rows with exactly one incident: {one_share:.2%}
- Rows with two or more incidents: {multi_share:.2%}
- Highest incident day: {daily.idxmax()} with {int(daily.max())} incidents
- Lowest incident day: {daily.idxmin()} with {int(daily.min())} incidents
- Feb 23 total: {int(holiday_daily.iloc[0])} incidents
- Feb 24 total: {int(holiday_daily.iloc[1])} incidents

The target is intentionally sparse: most district-hour combinations have no
incident, single incidents are occasional, and 2+ counts are uncommon.

## Strongest Aggregate Patterns

- Highest-total districts: {", ".join(f"{area} ({int(total)})" for area, total in area_totals.head(5).items())}
- Lowest-total districts: {", ".join(f"{area} ({int(total)})" for area, total in area_totals.tail(5).items())}
- Weekday daily means: {", ".join(f"{day} {value:.1f}" for day, value in weekday_means.items())}
- Weather mix: {", ".join(f"{weather} {share:.1f}%" for weather, share in weather_share.items())}

## Visuals

![Daily incident totals]({visuals_dir_name}/01_daily_incident_totals.png)

![Incidents by area]({visuals_dir_name}/02_incidents_by_area.png)

![Weekday-hour heatmap]({visuals_dir_name}/03_weekday_hour_heatmap.png)

![Weather patterns]({visuals_dir_name}/04_weather_patterns.png)

![Target distribution]({visuals_dir_name}/05_incident_count_distribution.png)

![Area feature profile]({visuals_dir_name}/06_area_feature_profile.png)

![Holiday window]({visuals_dir_name}/07_holiday_window.png)
"""

    overview_path.write_text(dedent(overview), encoding="utf-8")


def main() -> None:
    """Generate all visuals and the markdown overview."""

    config = parse_args()
    configure_style()
    df = load_dataset(config.csv_path)

    plot_daily_incidents(df, config.visuals_dir)
    plot_incidents_by_area(df, config.visuals_dir)
    plot_weekday_hour_heatmap(df, config.visuals_dir)
    plot_weather_patterns(df, config.visuals_dir)
    plot_incident_count_distribution(df, config.visuals_dir)
    plot_area_feature_profile(df, config.visuals_dir)
    plot_holiday_window(df, config.visuals_dir)
    write_dataset_overview(
        df, config.overview_path, config.visuals_dir, config.dataset_label
    )

    print(f"Source dataset: {config.csv_path}")
    print("Visuals generated:")
    for path in sorted(config.visuals_dir.glob("*.png")):
        print(f"  {path}")
    print(f"Dataset overview written to {config.overview_path}")


if __name__ == "__main__":
    main()
