# Tartu Public-Order Incident Synthetic Dataset

This project generates a reproducible synthetic dataset for Tartu public-order
incident forecasting. One row represents one Tartu district at one hourly
timestamp, with static district features, time features, citywide weather, and
the target column `incident_count`.

## Outputs

- `generate_dataset.py` - modular Python generator.
- `tartu_risk_dataset.csv` - generated modeling dataset.
- `validation_report.md` - validation checks and aggregate diagnostics.
- `README.md` - this generation note.
- `generate_visuals.py` - creates chart images and a dataset overview.
- `visuals/` - generated PNG charts based on the CSV.
- `dataset_overview.md` - plain-language summary with embedded visuals.

## How to Regenerate

Install dependencies if needed:

```bash
python -m pip install pandas numpy
```

Run:

```bash
python generate_dataset.py
```

The script uses random seed `20260428`.

To regenerate the visuals and overview:

```bash
python -m pip install matplotlib
python generate_visuals.py
```

## Dataset Shape and Date Window

The specification asks for 18 districts x 90 days x 24 hours = 38,880 rows.
Starting at `2026-01-28 00:00`, a continuous 90-day hourly window ends at
`2026-04-27 23:00`. The separate requested endpoint `2026-04-28 23:00` would
make the grid 91 days long, or 39,312 rows. This generator keeps the 90-day
continuous grid and records the reconciliation in `validation_report.md`.

Current generated shape:

- Rows: 38,880
- Time range: 2026-01-28 00:00:00 to 2026-04-27 23:00:00
- Average daily incidents: 43.26
- Zero-row share: 91.63%

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
hour, night/weekend flags, and weather effects. Most area-hour rows are zero,
some are one, and 2+ counts concentrate in high-risk district-hour contexts.

`validate_dataset()` checks row count, area coverage, timestamp coverage,
duplicate keys, time range, target type/range, daily incident mean, weekday
ordering, zero-row share, weather persistence, and exclusion of application-layer
or leakage-prone fields.

## Modeling Notes

The dataset intentionally does not include `risk_score`; forecasting should
predict `incident_count`, and a later application layer can transform predicted
counts into a risk score or category.

The dataset also does not include `same_slot_avg_90d`. That engineered
historical feature should be tested later in a separate feature-engineering
experiment to compare baseline models against history-enhanced models and avoid
accidental leakage.

## Public App

This folder also contains a static public-facing prototype application:

- `index.html` - main forecasting support tool
- `app.css`, `app.js` - main app styles and behavior
- `dataset_view.html` - dataset browser
- `policing_plan.html` - 48-hour patrol-planning support view
- `xgboost_model.html` - model explanation page
- `embedded_dataset.js` - embedded dataset fallback for file and static-host use
- `tartu_risk_dataset_2.csv` - live CSV source used by the browser pages

The application is suitable for GitHub Pages because it is a static site made
of HTML, CSS, JavaScript, and bundled data assets.

## GitHub Pages Deployment

Recommended publishing setup:

1. Create a standalone public GitHub repository for `Project_Crime`.
2. Push the contents of this folder as the repository root.
3. In GitHub, open `Settings -> Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select the `main` branch and the `/ (root)` folder.
6. Save the settings and wait for the site URL to appear.

Typical published URL format:

```text
https://<github-username>.github.io/<repository-name>/
```
