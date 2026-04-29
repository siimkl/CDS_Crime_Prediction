"""Synthetic Tartu public-order incident dataset generator.

Run from the command line:

    python generate_dataset.py
    python generate_dataset.py --binary-override Annelinn:nightlife_zone:1

The script creates:
    - tartu_risk_dataset.csv
    - validation_report.md
    - README.md
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Any
import re
import unicodedata

import numpy as np
import pandas as pd
from pandas.api.types import is_integer_dtype


RANDOM_SEED = 20260428
N_AREAS = 18
N_DAYS = 90
HOURS_PER_DAY = 24
EXPECTED_ROWS = N_AREAS * N_DAYS * HOURS_PER_DAY

START_TIME = pd.Timestamp("2026-01-28 00:00")
REQUESTED_END_TIME = pd.Timestamp("2026-04-28 23:00")
ACTUAL_END_TIME = START_TIME + pd.Timedelta(days=N_DAYS) - pd.Timedelta(hours=1)
TARGET_DAILY_MEAN = 43.3
POPULATION_EXPONENT = 0.45

DEFAULT_OUTPUT_CSV = Path("tartu_risk_dataset.csv")
DEFAULT_OUTPUT_REPORT = Path("validation_report.md")
DEFAULT_OUTPUT_README = Path("README.md")

WEATHER_VALUES = ["clear", "rain", "snow", "storm", "other_extremes"]
BINARY_OVERRIDE_COLUMNS = {
    "socially_vulnerable_zone",
    "minorities_zone",
    "student_zone",
    "nightlife_zone",
}

WEEKDAY_DAILY_MEANS = {
    "Monday": 37.9,
    "Tuesday": 36.5,
    "Wednesday": 36.3,
    "Thursday": 39.4,
    "Friday": 50.2,
    "Saturday": 59.6,
    "Sunday": 43.5,
}


@dataclass(frozen=True)
class ValidationResult:
    """Single validation check result."""

    check: str
    passed: bool
    details: str


@dataclass(frozen=True)
class GenerationConfig:
    """Runtime configuration for one dataset generation scenario."""

    seed: int
    binary_overrides: dict[tuple[str, str], int]
    output_csv: Path
    output_report: Path
    output_readme: Path


def parse_args() -> GenerationConfig:
    """Parse CLI arguments and derive output paths."""

    parser = argparse.ArgumentParser(
        description="Generate the Tartu synthetic incident dataset."
    )
    parser.add_argument(
        "--binary-override",
        action="append",
        default=[],
        help=(
            "Override a binary area feature using AREA:COLUMN:VALUE, for example "
            "Annelinn:nightlife_zone:1. Can be repeated."
        ),
    )
    parser.add_argument("--output-csv", help="Path for the generated CSV.")
    parser.add_argument("--output-report", help="Path for the validation report.")
    parser.add_argument("--output-readme", help="Path for the scenario README.")
    parser.add_argument(
        "--seed",
        type=int,
        default=RANDOM_SEED,
        help=f"Random seed for reproducible generation. Default: {RANDOM_SEED}.",
    )
    args = parser.parse_args()

    binary_overrides = _parse_binary_overrides(args.binary_override)
    output_csv, output_report, output_readme = _resolve_output_paths(
        binary_overrides,
        args.output_csv,
        args.output_report,
        args.output_readme,
    )

    return GenerationConfig(
        seed=args.seed,
        binary_overrides=binary_overrides,
        output_csv=output_csv,
        output_report=output_report,
        output_readme=output_readme,
    )


def create_base_grid(
    binary_overrides: dict[tuple[str, str], int] | None = None
) -> pd.DataFrame:
    """Create all combinations of 18 Tartu districts and hourly timestamps."""

    classifier = get_area_classifier(binary_overrides=binary_overrides)
    timestamps = pd.date_range(START_TIME, periods=N_DAYS * HOURS_PER_DAY, freq="h")

    base_grid = (
        pd.MultiIndex.from_product(
            [classifier["area"].tolist(), timestamps], names=["area", "time"]
        )
        .to_frame(index=False)
        .sort_values(["time", "area"])
        .reset_index(drop=True)
    )
    base_grid.insert(0, "id", np.arange(1, len(base_grid) + 1, dtype=np.int64))

    if len(base_grid) != EXPECTED_ROWS:
        raise ValueError(
            f"Base grid row count is {len(base_grid):,}, expected {EXPECTED_ROWS:,}."
        )

    return base_grid


def get_area_classifier(
    base_grid: pd.DataFrame | None = None,
    binary_overrides: dict[tuple[str, str], int] | None = None,
) -> pd.DataFrame:
    """Return the hard-coded district classifier table, optionally merged to a grid."""

    classifier = pd.DataFrame(
        [
            {
                "area": "Variku",
                "population": 1714,
                "area_km2": 0.761,
                "area_population_density": 2252,
                "foot_traffic": "low",
                "area_type": "residential",
                "socially_vulnerable_zone": 1,
                "minorities_zone": 0,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Ropka",
                "population": 4710,
                "area_km2": 1.442,
                "area_population_density": 3266,
                "foot_traffic": "low",
                "area_type": "mixed",
                "socially_vulnerable_zone": 1,
                "minorities_zone": 1,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Vaksali",
                "population": 3091,
                "area_km2": 0.666,
                "area_population_density": 4641,
                "foot_traffic": "medium",
                "area_type": "mixed",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 0,
                "student_zone": 1,
                "nightlife_zone": 1,
            },
            {
                "area": "Karlova",
                "population": 8748,
                "area_km2": 2.683,
                "area_population_density": 3261,
                "foot_traffic": "medium",
                "area_type": "residential",
                "socially_vulnerable_zone": 1,
                "minorities_zone": 0,
                "student_zone": 1,
                "nightlife_zone": 1,
            },
            {
                "area": "Tähtvere",
                "population": 3158,
                "area_km2": 2.5,
                "area_population_density": 1263,
                "foot_traffic": "low",
                "area_type": "residential",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 0,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Veeriku",
                "population": 5070,
                "area_km2": 2.823,
                "area_population_density": 1796,
                "foot_traffic": "medium",
                "area_type": "residential",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 1,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Ihaste",
                "population": 3050,
                "area_km2": 4.8,
                "area_population_density": 635,
                "foot_traffic": "low",
                "area_type": "residential",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 0,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Tammelinn",
                "population": 8118,
                "area_km2": 3.182,
                "area_population_density": 2551,
                "foot_traffic": "low",
                "area_type": "residential",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 0,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Ränilinn",
                "population": 2189,
                "area_km2": 1.222,
                "area_population_density": 1791,
                "foot_traffic": "medium",
                "area_type": "mixed",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 0,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Ropka tööstuse",
                "population": 2198,
                "area_km2": 3.249,
                "area_population_density": 676,
                "foot_traffic": "low",
                "area_type": "commercial",
                "socially_vulnerable_zone": 1,
                "minorities_zone": 1,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Kesklinn",
                "population": 6956,
                "area_km2": 1.799,
                "area_population_density": 3867,
                "foot_traffic": "high",
                "area_type": "commercial",
                "socially_vulnerable_zone": 1,
                "minorities_zone": 1,
                "student_zone": 1,
                "nightlife_zone": 1,
            },
            {
                "area": "Supilinn",
                "population": 2307,
                "area_km2": 0.483,
                "area_population_density": 4776,
                "foot_traffic": "low",
                "area_type": "residential",
                "socially_vulnerable_zone": 1,
                "minorities_zone": 0,
                "student_zone": 1,
                "nightlife_zone": 0,
            },
            {
                "area": "Raadi-Kruusamäe",
                "population": 4804,
                "area_km2": 2.828,
                "area_population_density": 1699,
                "foot_traffic": "low",
                "area_type": "residential",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 0,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Jaamamõisa",
                "population": 3464,
                "area_km2": 1.5,
                "area_population_density": 2309,
                "foot_traffic": "low",
                "area_type": "residential",
                "socially_vulnerable_zone": 1,
                "minorities_zone": 1,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Annelinn",
                "population": 24981,
                "area_km2": 4.91,
                "area_population_density": 5088,
                "foot_traffic": "medium",
                "area_type": "residential",
                "socially_vulnerable_zone": 1,
                "minorities_zone": 1,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Ülejõe",
                "population": 7559,
                "area_km2": 1.525,
                "area_population_density": 4957,
                "foot_traffic": "medium",
                "area_type": "mixed",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 1,
                "student_zone": 1,
                "nightlife_zone": 1,
            },
            {
                "area": "Maarjamõisa",
                "population": 477,
                "area_km2": 1.133,
                "area_population_density": 421,
                "foot_traffic": "low",
                "area_type": "residential",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 0,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
            {
                "area": "Kvissentali",
                "population": 865,
                "area_km2": 1.509,
                "area_population_density": 573,
                "foot_traffic": "low",
                "area_type": "residential",
                "socially_vulnerable_zone": 0,
                "minorities_zone": 0,
                "student_zone": 0,
                "nightlife_zone": 0,
            },
        ]
    )

    binary_columns = [
        "socially_vulnerable_zone",
        "minorities_zone",
        "student_zone",
        "nightlife_zone",
    ]
    classifier[binary_columns] = classifier[binary_columns].astype(np.int8)
    classifier = _apply_binary_overrides(classifier, binary_overrides)

    if len(classifier) != N_AREAS:
        raise ValueError(f"Area classifier has {len(classifier)} areas, expected {N_AREAS}.")

    if base_grid is None:
        return classifier

    merged = base_grid.merge(classifier, on="area", how="left", validate="many_to_one")
    if merged[classifier.columns.difference(["area"])].isna().any().any():
        raise ValueError("Base grid contains an area missing from the classifier.")
    return merged


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive weekday, hour, weekend, and night indicators."""

    out = df.copy()
    out["day_of_week"] = out["time"].dt.day_name()
    out["hour"] = out["time"].dt.hour.astype(np.int8)
    out["is_weekend"] = out["day_of_week"].isin(["Friday", "Saturday", "Sunday"]).astype(
        np.int8
    )
    out["is_night"] = ((out["hour"] >= 21) | (out["hour"] <= 5)).astype(np.int8)
    return out


def generate_weather_blocks(
    timestamps: pd.DatetimeIndex, rng: np.random.Generator
) -> pd.DataFrame:
    """Generate persistent hourly weather blocks and return one weather row per timestamp."""

    weather_by_time: list[dict[str, Any]] = []
    index = 0
    previous_weather: str | None = None
    block_lengths = np.array([6, 12, 24, 48])
    block_probs = np.array([0.36, 0.34, 0.22, 0.08])

    while index < len(timestamps):
        block_start = timestamps[index]
        block_len = int(rng.choice(block_lengths, p=block_probs))
        block_len = min(block_len, len(timestamps) - index)

        probs = _weather_probabilities(block_start, previous_weather)
        if previous_weather is not None:
            probs[previous_weather] = 0.0
            probs = _normalize_probabilities(probs)
        weather = str(rng.choice(WEATHER_VALUES, p=[probs[value] for value in WEATHER_VALUES]))

        for timestamp in timestamps[index : index + block_len]:
            weather_by_time.append({"time": timestamp, "weather": weather})

        previous_weather = weather
        index += block_len

    return pd.DataFrame(weather_by_time)


def generate_incident_count(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    """Generate non-negative integer incident_count using a daily NB process."""

    out = df.copy()
    out["risk_weight"] = _row_risk_weight(out)
    out["date"] = out["time"].dt.date
    out["incident_count"] = 0

    daily_expected = _daily_expected_incidents(out)
    daily_totals = _draw_daily_totals(daily_expected, rng)

    for date_value, total in daily_totals.items():
        mask = out["date"] == date_value
        weights = out.loc[mask, "risk_weight"].to_numpy(dtype=float)
        probabilities = weights / weights.sum()
        out.loc[mask, "incident_count"] = rng.multinomial(int(total), probabilities)

    out["incident_count"] = out["incident_count"].astype(np.int16)
    return out.drop(columns=["risk_weight", "date"])


def validate_dataset(df: pd.DataFrame) -> tuple[list[ValidationResult], dict[str, Any]]:
    """Run quality checks and return structured results plus summary statistics."""

    results: list[ValidationResult] = []
    expected_timestamps = pd.date_range(START_TIME, periods=N_DAYS * HOURS_PER_DAY, freq="h")

    row_count = len(df)
    results.append(
        ValidationResult(
            "Row count",
            row_count == EXPECTED_ROWS,
            f"{row_count:,} rows; expected {EXPECTED_ROWS:,}.",
        )
    )

    area_count = df["area"].nunique()
    results.append(
        ValidationResult(
            "Unique areas",
            area_count == N_AREAS,
            f"{area_count} unique areas; expected {N_AREAS}.",
        )
    )

    timestamps_by_area = df.groupby("area")["time"].nunique()
    complete_area_time = (
        timestamps_by_area.eq(len(expected_timestamps)).all()
        and set(df["time"].unique()) == set(expected_timestamps)
    )
    results.append(
        ValidationResult(
            "Every area has every timestamp",
            bool(complete_area_time),
            f"Each area should have {len(expected_timestamps):,} hourly timestamps.",
        )
    )

    duplicate_count = int(df.duplicated(["area", "time"]).sum())
    results.append(
        ValidationResult(
            "No duplicate area-time rows",
            duplicate_count == 0,
            f"{duplicate_count:,} duplicate area-time rows found.",
        )
    )

    actual_min = df["time"].min()
    actual_max = df["time"].max()
    time_ok = actual_min == START_TIME and actual_max == ACTUAL_END_TIME
    results.append(
        ValidationResult(
            "Time range",
            bool(time_ok),
            f"{actual_min} to {actual_max}; 90-day inclusive end is {ACTUAL_END_TIME}.",
        )
    )

    incident_integer = is_integer_dtype(df["incident_count"])
    incident_non_negative = bool((df["incident_count"] >= 0).all())
    results.append(
        ValidationResult(
            "incident_count integer and non-negative",
            bool(incident_integer and incident_non_negative),
            f"dtype={df['incident_count'].dtype}; min={df['incident_count'].min()}.",
        )
    )

    daily_totals = df.groupby(df["time"].dt.date)["incident_count"].sum()
    daily_mean = float(daily_totals.mean())
    mean_ok = abs(daily_mean - TARGET_DAILY_MEAN) <= 2.5
    results.append(
        ValidationResult(
            "Daily total mean close to 43.3",
            bool(mean_ok),
            f"Observed mean={daily_mean:.2f}; target={TARGET_DAILY_MEAN:.1f}.",
        )
    )

    weekday_means = (
        df.groupby([df["time"].dt.date, "day_of_week"])["incident_count"]
        .sum()
        .reset_index()
        .groupby("day_of_week")["incident_count"]
        .mean()
    )
    weekday_order_ok = (
        weekday_means["Saturday"] > weekday_means["Friday"] > weekday_means["Sunday"]
        and weekday_means["Sunday"]
        > weekday_means[["Monday", "Tuesday", "Wednesday", "Thursday"]].max()
    )
    results.append(
        ValidationResult(
            "Weekday incident ordering",
            bool(weekday_order_ok),
            "Saturday > Friday > Sunday > Monday-Thursday maximum.",
        )
    )

    holiday_mask = (
        ((df["time"].dt.date == pd.Timestamp("2026-02-23").date()) & df["hour"].between(18, 23))
        | ((df["time"].dt.date == pd.Timestamp("2026-02-24").date()) & df["is_night"].eq(1))
    )
    comparable_mask = (
        (
            (df["day_of_week"].eq("Monday") & df["hour"].between(18, 23))
            | (df["day_of_week"].eq("Tuesday") & df["is_night"].eq(1))
        )
        & (
            ~df["time"].dt.date.isin(
                [pd.Timestamp("2026-02-23").date(), pd.Timestamp("2026-02-24").date()]
            )
        )
    )
    holiday_mean = float(df.loc[holiday_mask, "incident_count"].mean())
    comparable_mean = float(df.loc[comparable_mask, "incident_count"].mean())
    results.append(
        ValidationResult(
            "Holiday window uplift",
            holiday_mean > comparable_mean,
            (
                "Feb 23 evening / Feb 24 night mean="
                f"{holiday_mean:.3f}; comparable Monday-Tuesday mean={comparable_mean:.3f}."
            ),
        )
    )

    zero_share = float((df["incident_count"] == 0).mean())
    results.append(
        ValidationResult(
            "Most area-hour rows are zero",
            zero_share >= 0.85,
            f"Zero-row share={zero_share:.2%}; threshold >= 85%.",
        )
    )

    weather_per_time = df.groupby("time")["weather"].nunique()
    weather_same_citywide = bool(weather_per_time.eq(1).all())
    run_lengths = _weather_run_lengths(df[["time", "weather"]].drop_duplicates("time"))
    weather_block_ok = weather_same_citywide and bool(
        (run_lengths >= 6).all() and (run_lengths <= 48).all()
    )
    results.append(
        ValidationResult(
            "Weather block persistence",
            bool(weather_block_ok),
            (
                f"Citywide={weather_same_citywide}; "
                f"min block={int(run_lengths.min())} hours; "
                f"max block={int(run_lengths.max())} hours; "
                f"mean block={run_lengths.mean():.1f} hours."
            ),
        )
    )

    forbidden_columns = {"risk_score", "same_slot_avg_90d"}
    forbidden_present = sorted(forbidden_columns.intersection(df.columns))
    results.append(
        ValidationResult(
            "No leakage/application-layer fields",
            not forbidden_present,
            f"Forbidden columns present: {forbidden_present or 'none'}.",
        )
    )

    summary = {
        "row_count": row_count,
        "date_min": actual_min,
        "date_max": actual_max,
        "daily_mean": daily_mean,
        "daily_min": int(daily_totals.min()),
        "daily_max": int(daily_totals.max()),
        "zero_share": zero_share,
        "top_days": daily_totals.sort_values(ascending=False).head(5),
        "weekday_means": weekday_means.sort_values(ascending=False),
        "incident_distribution": df["incident_count"].value_counts().sort_index(),
        "weather_distribution": (
            df[["time", "weather"]]
            .drop_duplicates("time")["weather"]
            .value_counts(normalize=True)
            .sort_index()
        ),
        "holiday_window_mean": holiday_mean,
        "comparable_weekday_holiday_baseline_mean": comparable_mean,
        "run_lengths": run_lengths,
        "all_checks_passed": all(result.passed for result in results),
    }
    return results, summary


def save_outputs(
    df: pd.DataFrame,
    results: list[ValidationResult],
    summary: dict[str, Any],
    config: GenerationConfig,
) -> None:
    """Save CSV, validation report, and README."""

    output_columns = [
        "id",
        "area",
        "time",
        "population",
        "area_km2",
        "area_population_density",
        "foot_traffic",
        "area_type",
        "socially_vulnerable_zone",
        "minorities_zone",
        "student_zone",
        "nightlife_zone",
        "day_of_week",
        "hour",
        "is_weekend",
        "is_night",
        "weather",
        "incident_count",
    ]
    df = df[output_columns].copy()
    df["time"] = df["time"].dt.strftime("%Y-%m-%d %H:%M:%S")
    df.to_csv(config.output_csv, index=False, encoding="utf-8")

    config.output_report.write_text(
        _build_validation_report(results, summary, config), encoding="utf-8"
    )
    config.output_readme.write_text(
        _build_readme(summary, config), encoding="utf-8"
    )


def build_dataset(
    seed: int = RANDOM_SEED,
    binary_overrides: dict[tuple[str, str], int] | None = None,
) -> tuple[pd.DataFrame, list[ValidationResult], dict[str, Any]]:
    """Build the full dataset and run validation."""

    rng = np.random.default_rng(seed)

    base_grid = create_base_grid(binary_overrides=binary_overrides)
    df = get_area_classifier(base_grid, binary_overrides=binary_overrides)
    df = add_time_features(df)

    weather_by_time = generate_weather_blocks(
        pd.DatetimeIndex(sorted(df["time"].unique())), rng
    )
    df = df.merge(weather_by_time, on="time", how="left", validate="many_to_one")
    df = generate_incident_count(df, rng)

    results, summary = validate_dataset(df)
    return df, results, summary


def main() -> None:
    """Command-line entry point."""

    config = parse_args()
    df, results, summary = build_dataset(
        seed=config.seed, binary_overrides=config.binary_overrides
    )
    save_outputs(df, results, summary, config)

    print("Synthetic Tartu risk dataset generated.")
    print(f"Output CSV: {config.output_csv}")
    print(f"Rows: {summary['row_count']:,}")
    print(
        "Date range: "
        f"{summary['date_min'].strftime('%Y-%m-%d %H:%M')} to "
        f"{summary['date_max'].strftime('%Y-%m-%d %H:%M')}"
    )
    print(f"Average daily incidents: {summary['daily_mean']:.2f}")
    print("Top 5 highest incident days:")
    for date_value, count in summary["top_days"].items():
        print(f"  {date_value}: {int(count)}")
    print(f"Share of zero rows: {summary['zero_share']:.2%}")
    if config.binary_overrides:
        print("Binary overrides:")
        for override in _override_lines(config.binary_overrides):
            print(f"  {override}")
    print(f"Validation checks passed: {sum(r.passed for r in results)}/{len(results)}")


def _weather_probabilities(
    timestamp: pd.Timestamp, previous_weather: str | None
) -> dict[str, float]:
    """Return adjusted weather probabilities for a block start timestamp."""

    date_value = timestamp.date()
    if date_value <= pd.Timestamp("2026-02-20").date():
        probs = {
            "clear": 0.35,
            "snow": 0.40,
            "rain": 0.15,
            "storm": 0.05,
            "other_extremes": 0.05,
        }
    elif date_value <= pd.Timestamp("2026-03-20").date():
        probs = {
            "clear": 0.35,
            "snow": 0.20,
            "rain": 0.35,
            "storm": 0.05,
            "other_extremes": 0.05,
        }
    else:
        probs = {
            "clear": 0.45,
            "snow": 0.05,
            "rain": 0.40,
            "storm": 0.07,
            "other_extremes": 0.03,
        }

    hour = timestamp.hour
    if hour <= 9 or hour >= 22:
        probs["snow"] *= 1.13
        probs["rain"] *= 1.10
        probs["clear"] *= 0.92

    if timestamp.month in [3, 4]:
        probs["storm"] *= 1.35

    if previous_weather in {"snow", "rain"}:
        probs["clear"] *= 1.45
        probs[previous_weather] *= 0.75

    return _normalize_probabilities(probs)


def _normalize_probabilities(probs: dict[str, float]) -> dict[str, float]:
    total = float(sum(probs.values()))
    return {key: value / total for key, value in probs.items()}


def _row_risk_weight(df: pd.DataFrame) -> pd.Series:
    """Compute relative area-hour incident intensity before daily calibration."""

    population_factor = (
        df["population"] / df["population"].median()
    ) ** POPULATION_EXPONENT
    density_factor = (
        df["area_population_density"] / df["area_population_density"].median()
    ) ** 0.24
    foot_factor = df["foot_traffic"].map({"low": 0.72, "medium": 1.12, "high": 1.82})
    area_type_factor = df["area_type"].map(
        {"residential": 0.86, "mixed": 1.12, "commercial": 1.34}
    )
    zone_factor = (
        1.0
        + 0.20 * df["socially_vulnerable_zone"]
        + 0.16 * df["minorities_zone"]
        + 0.24 * df["student_zone"]
        + 0.42 * df["nightlife_zone"]
    )

    hour_factor = df["hour"].map(_hour_factor).astype(float)
    weekend_factor = np.where(df["is_weekend"].eq(1), 1.12, 0.95)
    night_factor = np.where(df["is_night"].eq(1), 1.08, 0.97)

    nightlife_night = np.where(
        df["nightlife_zone"].eq(1) & df["is_night"].eq(1), 1.44, 1.0
    )
    nightlife_weekend_night = np.where(
        df["nightlife_zone"].eq(1) & df["is_night"].eq(1) & df["is_weekend"].eq(1),
        1.16,
        1.0,
    )
    nightlife_evening = np.where(
        df["nightlife_zone"].eq(1) & df["hour"].between(18, 20),
        1.28,
        1.0,
    )
    central_evening = np.where(
        (
            df["hour"].between(18, 20)
            & (
                df["nightlife_zone"].eq(1)
                | df["area_type"].eq("commercial")
                | df["foot_traffic"].eq("high")
            )
        ),
        1.14,
        1.0,
    )
    weekend_evening = np.where(
        df["is_weekend"].eq(1) & df["hour"].between(18, 20),
        1.10,
        1.0,
    )
    student_evening = np.where(
        df["student_zone"].eq(1) & df["hour"].between(17, 23), 1.18, 1.0
    )
    vulnerable_night = np.where(
        df["socially_vulnerable_zone"].eq(1) & df["is_night"].eq(1), 1.10, 1.0
    )

    central_or_nightlife = (
        df["nightlife_zone"].eq(1)
        | df["area_type"].eq("commercial")
        | df["foot_traffic"].eq("high")
    )
    weather_factor = pd.Series(np.ones(len(df)), index=df.index, dtype=float)
    clear_mask = df["weather"].eq("clear")
    rain_mask = df["weather"].eq("rain")
    snow_mask = df["weather"].eq("snow")
    storm_mask = df["weather"].eq("storm")
    other_mask = df["weather"].eq("other_extremes")

    weather_factor.loc[clear_mask] = 1.04
    weather_factor.loc[clear_mask & df["is_weekend"].eq(1)] *= 1.08
    weather_factor.loc[rain_mask] = 0.90
    weather_factor.loc[rain_mask & df["is_night"].eq(1) & central_or_nightlife] *= 1.17
    weather_factor.loc[snow_mask] = 0.78
    weather_factor.loc[storm_mask] = 0.82
    weather_factor.loc[storm_mask & df["is_night"].eq(1)] *= 1.12
    weather_factor.loc[other_mask] = 0.92

    holiday_factor = pd.Series(np.ones(len(df)), index=df.index, dtype=float)
    feb_23_evening = (
        df["time"].dt.date.eq(pd.Timestamp("2026-02-23").date())
        & df["hour"].between(18, 23)
    )
    feb_24_night = (
        df["time"].dt.date.eq(pd.Timestamp("2026-02-24").date())
        & df["is_night"].eq(1)
    )
    holiday_factor.loc[feb_23_evening] = 2.20
    holiday_factor.loc[feb_24_night] = 2.45
    holiday_factor.loc[
        (feb_23_evening | feb_24_night)
        & (df["nightlife_zone"].eq(1) | df["foot_traffic"].eq("high"))
    ] *= 1.25

    return (
        population_factor
        * density_factor
        * foot_factor
        * area_type_factor
        * zone_factor
        * hour_factor
        * weekend_factor
        * night_factor
        * nightlife_evening
        * central_evening
        * weekend_evening
        * nightlife_night
        * nightlife_weekend_night
        * student_evening
        * vulnerable_night
        * weather_factor
        * holiday_factor
    ).clip(lower=0.01)


def _hour_factor(hour: int) -> float:
    factors = {
        0: 1.44,
        1: 1.32,
        2: 1.12,
        3: 0.82,
        4: 0.62,
        5: 0.52,
        6: 0.50,
        7: 0.60,
        8: 0.74,
        9: 0.86,
        10: 0.95,
        11: 1.04,
        12: 1.08,
        13: 1.04,
        14: 1.00,
        15: 1.06,
        16: 1.16,
        17: 1.20,
        18: 1.42,
        19: 1.58,
        20: 1.72,
        21: 1.86,
        22: 1.98,
        23: 1.90,
    }
    return factors[int(hour)]


def _daily_expected_incidents(df: pd.DataFrame) -> pd.Series:
    daily_context = (
        df.groupby("date")
        .agg(
            day_of_week=("day_of_week", "first"),
            clear_share=("weather", lambda s: (s == "clear").mean()),
            rain_share=("weather", lambda s: (s == "rain").mean()),
            snow_share=("weather", lambda s: (s == "snow").mean()),
            storm_share=("weather", lambda s: (s == "storm").mean()),
            other_share=("weather", lambda s: (s == "other_extremes").mean()),
            weekend=("is_weekend", "max"),
        )
        .sort_index()
    )

    expected = daily_context["day_of_week"].map(WEEKDAY_DAILY_MEANS).astype(float)
    holiday_multiplier = pd.Series(1.0, index=daily_context.index, dtype=float)
    holiday_multiplier.loc[pd.Timestamp("2026-02-23").date()] = 1.55
    holiday_multiplier.loc[pd.Timestamp("2026-02-24").date()] = 1.80
    weather_multiplier = (
        1.0
        + 0.04 * daily_context["clear_share"]
        - 0.07 * daily_context["rain_share"]
        - 0.18 * daily_context["snow_share"]
        - 0.13 * daily_context["storm_share"]
        - 0.07 * daily_context["other_share"]
    )
    weather_multiplier += 0.04 * daily_context["clear_share"] * daily_context["weekend"]
    weather_multiplier += 0.05 * daily_context["storm_share"] * daily_context["weekend"]

    expected = expected * holiday_multiplier * weather_multiplier.clip(0.74, 1.14)
    expected *= TARGET_DAILY_MEAN / expected.mean()
    return expected


def _draw_daily_totals(
    daily_expected: pd.Series, rng: np.random.Generator
) -> dict[Any, int]:
    """Draw daily totals with moderate overdispersion and calibrated weekday order."""

    totals: dict[Any, int] = {}
    dispersion = 95.0

    for date_value, mean in daily_expected.items():
        gamma_lambda = rng.gamma(shape=dispersion, scale=float(mean) / dispersion)
        total = int(rng.poisson(gamma_lambda))
        totals[date_value] = max(total, 0)

    # Add a small number of plausible high-activity days so the upper tail can
    # approach the real-world reference without overwhelming the average.
    high_candidates = [
        date_value
        for date_value in daily_expected.index
        if pd.Timestamp(date_value).day_name() in {"Friday", "Saturday", "Sunday"}
    ]
    candidate_weights = np.array(
        [
            {
                "Friday": 0.22,
                "Saturday": 0.56,
                "Sunday": 0.22,
            }[pd.Timestamp(date_value).day_name()]
            for date_value in high_candidates
        ],
        dtype=float,
    )
    candidate_weights = candidate_weights / candidate_weights.sum()
    extreme_days = rng.choice(
        high_candidates, size=2, replace=False, p=candidate_weights
    )
    for date_value in extreme_days:
        totals[date_value] = int(round(totals[date_value] * rng.uniform(1.25, 1.55)))

    adjusted = _calibrate_daily_totals(pd.Series(totals), daily_expected)
    return adjusted.astype(int).to_dict()


def _calibrate_daily_totals(
    totals: pd.Series, daily_expected: pd.Series, max_iterations: int = 500
) -> pd.Series:
    """Nudge stochastic totals until aggregate validation targets are met."""

    adjusted = totals.copy().astype(int)
    protected_dates = {
        pd.Timestamp("2026-02-23").date(),
        pd.Timestamp("2026-02-24").date(),
    }
    expected_order = [
        "Saturday",
        "Friday",
        "Sunday",
        "Thursday",
        "Monday",
        "Tuesday",
        "Wednesday",
    ]
    weekday_by_date = pd.Series(
        {date_value: pd.Timestamp(date_value).day_name() for date_value in adjusted.index}
    )

    def weekday_means(series: pd.Series) -> pd.Series:
        return series.groupby(weekday_by_date).mean()

    for _ in range(max_iterations):
        mean_delta = TARGET_DAILY_MEAN - adjusted.mean()
        if abs(mean_delta) > 0.05:
            if mean_delta > 0:
                date_to_adjust = (daily_expected - adjusted).idxmax()
                adjusted.loc[date_to_adjust] += 1
            else:
                positive = adjusted[adjusted > 0]
                non_protected_positive = positive[
                    ~positive.index.to_series().isin(protected_dates)
                ]
                candidate_index = (
                    non_protected_positive.index
                    if not non_protected_positive.empty
                    else positive.index
                )
                date_to_adjust = (
                    adjusted.loc[candidate_index] - daily_expected.loc[candidate_index]
                ).idxmax()
                adjusted.loc[date_to_adjust] -= 1
            continue

        means = weekday_means(adjusted)
        if (
            means["Saturday"] > means["Friday"] > means["Sunday"]
            and means["Sunday"] > means[["Monday", "Tuesday", "Wednesday", "Thursday"]].max()
        ):
            break

        for high_day, low_day in zip(expected_order, expected_order[1:]):
            means = weekday_means(adjusted)
            if means[high_day] <= means[low_day]:
                high_dates = weekday_by_date[weekday_by_date == high_day].index
                low_dates = weekday_by_date[weekday_by_date == low_day].index
                high_date = (daily_expected.loc[high_dates] - adjusted.loc[high_dates]).idxmax()
                low_positive = adjusted.loc[low_dates][adjusted.loc[low_dates] > 0]
                if low_positive.empty:
                    continue
                low_date = (
                    adjusted.loc[low_positive.index] - daily_expected.loc[low_positive.index]
                ).idxmax()
                adjusted.loc[high_date] += 1
                adjusted.loc[low_date] -= 1
                break

    adjusted = _rebalance_friday_saturday_pairs(adjusted)
    return adjusted.clip(lower=0)


def _rebalance_friday_saturday_pairs(totals: pd.Series) -> pd.Series:
    """Shift part of outsized Friday spikes into the following Saturday."""

    adjusted = totals.copy().astype(int)
    sorted_dates = sorted(adjusted.index)

    for date_value in sorted_dates:
        timestamp = pd.Timestamp(date_value)
        if timestamp.day_name() != "Friday":
            continue

        saturday = (timestamp + pd.Timedelta(days=1)).date()
        if saturday not in adjusted.index:
            continue

        friday_total = int(adjusted.loc[date_value])
        saturday_total = int(adjusted.loc[saturday])
        gap = friday_total - saturday_total

        if gap <= 4:
            continue

        shift = max(2, int(np.ceil((gap + 2) / 2)))
        shift = min(shift, friday_total)
        adjusted.loc[date_value] -= shift
        adjusted.loc[saturday] += shift

    return adjusted


def _weather_run_lengths(weather_by_time: pd.DataFrame) -> pd.Series:
    ordered = weather_by_time.sort_values("time").reset_index(drop=True)
    run_id = ordered["weather"].ne(ordered["weather"].shift()).cumsum()
    return ordered.groupby(run_id).size()


def _build_validation_report(
    results: list[ValidationResult], summary: dict[str, Any], config: GenerationConfig
) -> str:
    check_rows = "\n".join(
        f"| {result.check} | {'PASS' if result.passed else 'FAIL'} | {result.details} |"
        for result in results
    )

    top_days = "\n".join(
        f"- {date_value}: {int(count)} incidents"
        for date_value, count in summary["top_days"].items()
    )
    weekday_lines = "\n".join(
        f"- {weekday}: {value:.2f}"
        for weekday, value in summary["weekday_means"].items()
    )
    incident_distribution = "\n".join(
        f"- {int(count_value)}: {int(row_count):,} rows"
        for count_value, row_count in summary["incident_distribution"].items()
    )
    weather_distribution = "\n".join(
        f"- {weather}: {share:.2%} of hours"
        for weather, share in summary["weather_distribution"].items()
    )
    override_section = _scenario_override_section(config.binary_overrides)

    return f"""# Validation Report

Generated with `generate_dataset.py` and random seed `{config.seed}`.

## Scenario Overrides

{override_section}

## Requirement Reconciliation

The row-count requirement is 18 districts x 90 days x 24 hours = 38,880 rows.
Starting at `2026-01-28 00:00`, a continuous 90-day hourly grid ends at
`2026-04-27 23:00`. Including `2026-04-28 23:00` would create 91 days and
39,312 rows. The generated dataset therefore preserves the specified 90-day row
count without inserting a hidden one-day gap.

## Checks

| Check | Status | Details |
|---|---:|---|
{check_rows}

## Summary

- Row count: {summary["row_count"]:,}
- Time range: {summary["date_min"]} to {summary["date_max"]}
- Average daily incidents: {summary["daily_mean"]:.2f}
- Daily total range: {summary["daily_min"]} to {summary["daily_max"]}
- Share of zero area-hour rows: {summary["zero_share"]:.2%}
- Holiday window mean: {summary["holiday_window_mean"]:.3f}
- Comparable Monday-Tuesday baseline mean: {summary["comparable_weekday_holiday_baseline_mean"]:.3f}
- Weather block length range: {int(summary["run_lengths"].min())} to {int(summary["run_lengths"].max())} hours
- Average weather block length: {summary["run_lengths"].mean():.1f} hours
- All checks passed: {summary["all_checks_passed"]}

## Top 5 Highest Incident Days

{top_days}

## Weekday Daily Means

{weekday_lines}

## incident_count Distribution

{incident_distribution}

## Weather Distribution

{weather_distribution}
"""


def _build_readme(summary: dict[str, Any], config: GenerationConfig) -> str:
    override_section = _scenario_override_section(config.binary_overrides)
    return f"""# Tartu Public-Order Incident Synthetic Dataset

This project generates a reproducible synthetic dataset for Tartu public-order
incident forecasting. One row represents one Tartu district at one hourly
timestamp, with static district features, time features, citywide weather, and
the target column `incident_count`.

## Outputs

- `generate_dataset.py` - modular Python generator.
- `{config.output_csv.name}` - generated modeling dataset.
- `{config.output_report.name}` - validation checks and aggregate diagnostics.
- `{config.output_readme.name}` - this generation note.

## How to Regenerate

Install dependencies if needed:

```bash
python -m pip install pandas numpy
```

Run:

```bash
python generate_dataset.py{_regeneration_suffix(config.binary_overrides)}
```

The script uses random seed `{config.seed}`.

## Scenario Overrides

{override_section}

## Dataset Shape and Date Window

The specification asks for 18 districts x 90 days x 24 hours = 38,880 rows.
Starting at `2026-01-28 00:00`, a continuous 90-day hourly window ends at
`2026-04-27 23:00`. The separate requested endpoint `2026-04-28 23:00` would
make the grid 91 days long, or 39,312 rows. This generator keeps the 90-day
continuous grid and records the reconciliation in `{config.output_report.name}`.

Current generated shape:

- Rows: {summary["row_count"]:,}
- Time range: {summary["date_min"]} to {summary["date_max"]}
- Average daily incidents: {summary["daily_mean"]:.2f}
- Zero-row share: {summary["zero_share"]:.2%}

## Generation Logic

`create_base_grid()` creates every district-hour combination, assigns a stable
integer `id`, and validates the expected row count.

`get_area_classifier()` hard-codes the 18-district classifier from the project
specification: population, area, density, foot traffic, area type, and binary
zone indicators. The binary fields use `0 = no` and `1 = yes`.

`add_time_features()` derives `day_of_week`, `hour`, `is_weekend`, and
`is_night`. In this project `is_weekend = 1` for Friday, Saturday, and Sunday;
`is_night = 1` for hours 21-23 and 0-5.

`generate_weather_blocks()` creates citywide weather blocks lasting 6, 12, 24,
or sometimes 48 hours. Seasonal probabilities follow the specification for
winter, transition, and spring. Rain and snow are slightly more likely at night
and in the morning, storms become more likely in March and April, and clear
weather becomes more likely after rain or snow.

`generate_incident_count()` creates the target as a non-negative integer using a
negative-binomial daily total process followed by multinomial allocation across
district-hour risk weights. The weights combine district type, population
density, student/nightlife/social vulnerability/minority indicators, weekday,
hour, night/weekend flags, weather effects, and a dedicated uplift for
February 23 evening plus February 24 night. Most area-hour rows are zero, some
are one, and 2+ counts concentrate in high-risk district-hour contexts.

`validate_dataset()` checks row count, area coverage, timestamp coverage,
duplicate keys, time range, target type/range, daily incident mean, weekday
ordering, the holiday uplift window, zero-row share, weather persistence, and
exclusion of application-layer or leakage-prone fields.

## Modeling Notes

The dataset intentionally does not include `risk_score`; forecasting should
predict `incident_count`, and a later application layer can transform predicted
counts into a risk score or category.

The dataset also does not include `same_slot_avg_90d`. That engineered
historical feature should be tested later in a separate feature-engineering
experiment to compare baseline models against history-enhanced models and avoid
accidental leakage.
"""


def _parse_binary_overrides(override_args: list[str]) -> dict[tuple[str, str], int]:
    overrides: dict[tuple[str, str], int] = {}
    for raw_override in override_args:
        parts = [part.strip() for part in raw_override.split(":")]
        if len(parts) != 3:
            raise ValueError(
                "Each --binary-override must use AREA:COLUMN:VALUE format, "
                f"got {raw_override!r}."
            )
        area, column, raw_value = parts
        if column not in BINARY_OVERRIDE_COLUMNS:
            allowed = ", ".join(sorted(BINARY_OVERRIDE_COLUMNS))
            raise ValueError(
                f"Unsupported binary override column {column!r}. Allowed: {allowed}."
            )
        if raw_value not in {"0", "1"}:
            raise ValueError(
                f"Binary override value must be 0 or 1, got {raw_value!r}."
            )
        overrides[(area, column)] = int(raw_value)
    return overrides


def _apply_binary_overrides(
    classifier: pd.DataFrame,
    binary_overrides: dict[tuple[str, str], int] | None,
) -> pd.DataFrame:
    if not binary_overrides:
        return classifier

    out = classifier.copy()
    for (area, column), value in binary_overrides.items():
        mask = out["area"].eq(area)
        if not mask.any():
            raise ValueError(f"Unknown area in binary override: {area!r}.")
        out.loc[mask, column] = np.int8(value)
    return out


def _slugify(value: str) -> str:
    ascii_value = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    )
    slug = re.sub(r"[^A-Za-z0-9]+", "_", ascii_value).strip("_").lower()
    return slug or "scenario"


def _scenario_suffix(binary_overrides: dict[tuple[str, str], int]) -> str:
    if not binary_overrides:
        return ""
    tokens = [
        f"{_slugify(area)}_{_slugify(column)}_{value}"
        for (area, column), value in sorted(binary_overrides.items())
    ]
    return "_".join(tokens)


def _resolve_output_paths(
    binary_overrides: dict[tuple[str, str], int],
    output_csv: str | None,
    output_report: str | None,
    output_readme: str | None,
) -> tuple[Path, Path, Path]:
    suffix = _scenario_suffix(binary_overrides)
    scenario_suffix = f"_{suffix}" if suffix else ""
    resolved_csv = Path(output_csv) if output_csv else Path(
        f"{DEFAULT_OUTPUT_CSV.stem}{scenario_suffix}{DEFAULT_OUTPUT_CSV.suffix}"
    )
    resolved_report = Path(output_report) if output_report else Path(
        f"{DEFAULT_OUTPUT_REPORT.stem}{scenario_suffix}{DEFAULT_OUTPUT_REPORT.suffix}"
    )
    resolved_readme = Path(output_readme) if output_readme else Path(
        f"{DEFAULT_OUTPUT_README.stem}{scenario_suffix}{DEFAULT_OUTPUT_README.suffix}"
    )
    return resolved_csv, resolved_report, resolved_readme


def _override_lines(binary_overrides: dict[tuple[str, str], int]) -> list[str]:
    if not binary_overrides:
        return ["None."]
    return [
        f"area={area}, column={column}, value={value}"
        for (area, column), value in sorted(binary_overrides.items())
    ]


def _scenario_override_section(binary_overrides: dict[tuple[str, str], int]) -> str:
    return "\n".join(f"- {line}" for line in _override_lines(binary_overrides))


def _regeneration_suffix(binary_overrides: dict[tuple[str, str], int]) -> str:
    if not binary_overrides:
        return ""
    arguments = " ".join(
        f'--binary-override "{area}:{column}:{value}"'
        for (area, column), value in sorted(binary_overrides.items())
    )
    return f" {arguments}"


if __name__ == "__main__":
    main()
