"""Build a local JS fallback so the app can open without an HTTP server."""

from __future__ import annotations

import json
from pathlib import Path


SOURCE_CSV = Path("tartu_risk_dataset_2.csv")
OUTPUT_JS = Path("embedded_dataset.js")


def main() -> None:
    csv_text = SOURCE_CSV.read_text(encoding="utf-8")
    payload = json.dumps(csv_text, ensure_ascii=False)
    output = (
        "// Auto-generated from tartu_risk_dataset_2.csv\n"
        "window.__TARTU_RISK_EMBEDDED_CSV__ = "
        f"{payload};\n"
    )
    OUTPUT_JS.write_text(output, encoding="utf-8")
    print(f"Wrote {OUTPUT_JS}")


if __name__ == "__main__":
    main()
