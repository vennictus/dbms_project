"""Convert Ergast/Kaggle F1 CSV data into Oracle INSERT statements.

Expected input directory:
    data/ergast/

Required files:
    circuits.csv
    constructors.csv
    drivers.csv
    races.csv
    results.csv
    lap_times.csv

Output:
    sql/02_import_ergast_2021_2022.sql

The import focuses on the 2021 and 2022 seasons. Ergast IDs are preserved as
primary-key values so joins remain simple and traceable to the source dataset.
"""

from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PREFERRED_DATA_DIR = ROOT / "data" / "ergast"
DATA_DIR = PREFERRED_DATA_DIR if PREFERRED_DATA_DIR.exists() else ROOT
OUTPUT_FILE = ROOT / "sql" / "02_import_ergast_2021_2022.sql"
YEARS = {2021, 2022}


def read_csv(name: str) -> list[dict[str, str]]:
    path = DATA_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Missing required file: {path}")

    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if value in {"", "\\N"}:
        return None
    return value


def sql_str(value: str | None) -> str:
    value = clean(value)
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_num(value: str | None) -> str:
    value = clean(value)
    return value if value is not None else "NULL"


def seconds_from_millis(value: str | None) -> str:
    value = clean(value)
    if value is None:
        return "NULL"
    return f"{int(value) / 1000:.3f}"


def derive_status(status_id: str | None, status_by_id: dict[str, str]) -> str:
    status = status_by_id.get(clean(status_id) or "", "Unknown")
    lowered = status.lower()
    if lowered == "finished" or lowered.startswith("+"):
        return "Finished"
    if "disqualified" in lowered:
        return "DSQ"
    if "did not start" in lowered or lowered == "dns":
        return "DNS"
    return "DNF"


def main() -> None:
    circuits = read_csv("circuits.csv")
    constructors = read_csv("constructors.csv")
    drivers = read_csv("drivers.csv")
    races = read_csv("races.csv")
    results = read_csv("results.csv")
    lap_times = read_csv("lap_times.csv")

    try:
        statuses = read_csv("status.csv")
    except FileNotFoundError:
        statuses = []

    status_by_id = {
        row["statusId"]: row["status"]
        for row in statuses
        if clean(row.get("statusId")) and clean(row.get("status"))
    }

    races_by_id = {
        row["raceId"]: row
        for row in races
        if int(row["year"]) in YEARS
    }
    circuit_ids = {row["circuitId"] for row in races_by_id.values()}

    result_rows = [row for row in results if row["raceId"] in races_by_id]
    driver_ids = {row["driverId"] for row in result_rows}
    constructor_ids = {row["constructorId"] for row in result_rows}

    circuit_rows = [row for row in circuits if row["circuitId"] in circuit_ids]
    constructor_rows = [row for row in constructors if row["constructorId"] in constructor_ids]
    driver_rows = [row for row in drivers if row["driverId"] in driver_ids]
    lap_rows = [row for row in lap_times if row["raceId"] in races_by_id]

    lines: list[str] = [
        "SET DEFINE OFF;",
        "SET SERVEROUTPUT ON;",
        "",
        "-- Source: Ergast Motor Racing Data, via Kaggle Formula 1 World Championship dataset.",
        "-- Focus seasons: 2021 and 2022.",
        "",
    ]

    for year in sorted(YEARS):
        lines.append(f"INSERT INTO season (season_id, year) VALUES ({year}, {year});")
    lines.append("")

    for row in circuit_rows:
        lines.append(
            "INSERT INTO circuit (circuit_id, name, location, country, length_km) "
            f"VALUES ({row['circuitId']}, {sql_str(row['name'])}, {sql_str(row['location'])}, "
            f"{sql_str(row['country'])}, 1);"
        )
    lines.append("")

    for row in constructor_rows:
        lines.append(
            "INSERT INTO team (team_id, team_name, base_country) "
            f"VALUES ({row['constructorId']}, {sql_str(row['name'])}, {sql_str(row['nationality'])});"
        )
    lines.append("")

    for row in driver_rows:
        code = clean(row.get("code")) or clean(row.get("driverRef")) or f"D{row['driverId']}"
        code = code.upper()[:3]
        full_name = f"{clean(row.get('forename')) or ''} {clean(row.get('surname')) or ''}".strip()
        lines.append(
            "INSERT INTO driver (driver_id, name, nationality, team_id, driver_code) "
            f"VALUES ({row['driverId']}, {sql_str(full_name)}, {sql_str(row.get('nationality'))}, NULL, {sql_str(code)});"
        )
    lines.append("")

    for row in races_by_id.values():
        lines.append(
            "INSERT INTO race (race_id, season_id, circuit_id, race_name, race_date, weather, track_condition) "
            f"VALUES ({row['raceId']}, {row['year']}, {row['circuitId']}, {sql_str(row['name'])}, "
            f"DATE {sql_str(row['date'])}, 'Dry', 'Green');"
        )
    lines.append("")

    for row in result_rows:
        status = derive_status(row.get("statusId"), status_by_id)
        position = sql_num(row.get("positionOrder") or row.get("position"))
        total_time = seconds_from_millis(row.get("milliseconds"))
        lines.append(
            "INSERT INTO result (result_id, race_id, driver_id, team_id, position, points, status, total_time_sec) "
            f"VALUES ({row['resultId']}, {row['raceId']}, {row['driverId']}, {row['constructorId']}, "
            f"{position}, {sql_num(row.get('points'))}, {sql_str(status)}, {total_time});"
        )
    lines.append("")

    for index, row in enumerate(lap_rows, start=1):
        lines.append(
            "INSERT INTO lap_data (lap_id, race_id, driver_id, lap_number, lap_time_sec) "
            f"VALUES ({index}, {row['raceId']}, {row['driverId']}, {row['lap']}, "
            f"{seconds_from_millis(row.get('milliseconds'))});"
        )
    lines.extend(["", "COMMIT;", ""])

    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE}")
    print(f"Seasons: {', '.join(str(year) for year in sorted(YEARS))}")
    print(f"Races: {len(races_by_id)}")
    print(f"Results: {len(result_rows)}")
    print(f"Lap rows: {len(lap_rows)}")


if __name__ == "__main__":
    main()
