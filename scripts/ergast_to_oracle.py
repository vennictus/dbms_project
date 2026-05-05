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
    pit_stops.csv

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

CIRCUIT_LENGTH_KM = {
    "1": 5.278,
    "3": 5.412,
    "4": 4.675,
    "5": 5.338,
    "6": 3.337,
    "7": 4.361,
    "9": 5.891,
    "11": 4.381,
    "13": 7.004,
    "14": 5.793,
    "15": 5.063,
    "18": 4.309,
    "21": 4.909,
    "22": 5.807,
    "24": 5.281,
    "32": 4.304,
    "34": 5.842,
    "39": 4.259,
    "69": 5.513,
    "70": 4.318,
    "71": 5.848,
    "73": 6.003,
    "75": 4.653,
    "77": 6.174,
    "78": 5.419,
    "79": 5.412,
}

COMPOUND_SEQUENCE = ["Medium", "Hard", "Soft", "Medium", "Hard", "Soft"]


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
    pit_stops = read_csv("pit_stops.csv")

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
    pit_rows = [row for row in pit_stops if row["raceId"] in races_by_id]
    race_laps = {
        race_id: max(
            int(row["laps"])
            for row in result_rows
            if row["raceId"] == race_id and clean(row.get("laps"))
        )
        for race_id in races_by_id
    }
    driver_laps = {
        (row["raceId"], row["driverId"]): int(row["laps"])
        for row in result_rows
        if clean(row.get("laps"))
    }

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
        length_km = CIRCUIT_LENGTH_KM.get(row["circuitId"], 1)
        lines.append(
            "INSERT INTO circuit (circuit_id, name, location, country, length_km) "
            f"VALUES ({row['circuitId']}, {sql_str(row['name'])}, {sql_str(row['location'])}, "
            f"{sql_str(row['country'])}, {length_km});"
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
    lines.append("")

    pit_rows_by_driver: dict[tuple[str, str], list[dict[str, str]]] = {}
    for row in pit_rows:
        key = (row["raceId"], row["driverId"])
        pit_rows_by_driver.setdefault(key, []).append(row)

    lines.append(
        "-- Tyre stint windows are derived from Ergast pit-stop laps. "
        "The source file does not include actual compounds, so compound labels are demonstrative."
    )
    tyre_id = 1
    for key in sorted(pit_rows_by_driver, key=lambda item: (int(item[0]), int(item[1]))):
        race_id, driver_id = key
        total_laps = driver_laps.get(key) or race_laps.get(race_id)
        if not total_laps:
            continue

        current_start = 1
        stint_no = 1
        stops = sorted(pit_rows_by_driver[key], key=lambda row: int(row["stop"]))
        for stop in stops:
            pit_lap = int(stop["lap"])
            if pit_lap < current_start or pit_lap > total_laps:
                continue
            compound = COMPOUND_SEQUENCE[(stint_no - 1) % len(COMPOUND_SEQUENCE)]
            lines.append(
                "INSERT INTO tyre_data (tyre_id, race_id, driver_id, stint_no, compound, start_lap, end_lap) "
                f"VALUES ({tyre_id}, {race_id}, {driver_id}, {stint_no}, {sql_str(compound)}, "
                f"{current_start}, {pit_lap});"
            )
            tyre_id += 1
            current_start = pit_lap + 1
            stint_no += 1

        if current_start <= total_laps:
            compound = COMPOUND_SEQUENCE[(stint_no - 1) % len(COMPOUND_SEQUENCE)]
            lines.append(
                "INSERT INTO tyre_data (tyre_id, race_id, driver_id, stint_no, compound, start_lap, end_lap) "
                f"VALUES ({tyre_id}, {race_id}, {driver_id}, {stint_no}, {sql_str(compound)}, "
                f"{current_start}, {total_laps});"
            )
            tyre_id += 1
    lines.extend(["", "COMMIT;", ""])

    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE}")
    print(f"Seasons: {', '.join(str(year) for year in sorted(YEARS))}")
    print(f"Races: {len(races_by_id)}")
    print(f"Results: {len(result_rows)}")
    print(f"Lap rows: {len(lap_rows)}")
    print(f"Tyre stint rows: {tyre_id - 1}")


if __name__ == "__main__":
    main()
