"""Build compact frontend data from the Ergast/Kaggle CSV files."""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "ergast"
YEARS = {2021, 2022}
OUT = ROOT / "src" / "data" / "f1Data.js"


def rows(name: str) -> list[dict[str, str]]:
    path = DATA_DIR / name
    if not path.exists():
        path = ROOT / name
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def clean(value: str | None) -> str | None:
    if value is None or value == "\\N" or value == "":
        return None
    return value


def seconds(value: str | None) -> float | None:
    value = clean(value)
    return None if value is None else round(int(value) / 1000, 3)


def main() -> None:
    races = rows("races.csv")
    results = rows("results.csv")
    driver_standing_rows = rows("driver_standings.csv")
    constructor_standing_rows = rows("constructor_standings.csv")
    drivers = rows("drivers.csv")
    constructors = rows("constructors.csv")
    circuits = rows("circuits.csv")
    laps = rows("lap_times.csv")
    qualifying_path = DATA_DIR / "qualifying.csv"
    if not qualifying_path.exists():
        qualifying_path = ROOT / "qualifying.csv"
    qualifying = rows("qualifying.csv") if qualifying_path.exists() else []

    driver_by_id = {
        d["driverId"]: {
            "id": d["driverId"],
            "code": clean(d.get("code")) or d["driverRef"][:3].upper(),
            "name": f"{d.get('forename', '')} {d.get('surname', '')}".strip(),
            "nationality": clean(d.get("nationality")),
        }
        for d in drivers
    }
    constructor_by_id = {
        c["constructorId"]: {
            "id": c["constructorId"],
            "name": c["name"],
            "nationality": clean(c.get("nationality")),
        }
        for c in constructors
    }
    circuit_by_id = {
        c["circuitId"]: {
            "id": c["circuitId"],
            "name": c["name"],
            "location": c["location"],
            "country": c["country"],
        }
        for c in circuits
    }

    selected_races = [
        r for r in races
        if int(r["year"]) in YEARS
    ]
    race_by_id = {r["raceId"]: r for r in selected_races}

    results_by_race: dict[str, list[dict]] = defaultdict(list)
    driver_wins: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    driver_podiums: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for result in results:
        race = race_by_id.get(result["raceId"])
        if not race:
            continue
        year = race["year"]
        driver = driver_by_id[result["driverId"]]
        constructor = constructor_by_id[result["constructorId"]]
        points = float(result["points"])
        position = int(result["positionOrder"])
        milliseconds = seconds(result.get("milliseconds"))
        result_row = {
            "position": position,
            "grid": None if clean(result.get("grid")) is None else int(result["grid"]),
            "driverId": driver["id"],
            "driver": driver["name"],
            "code": driver["code"],
            "constructorId": constructor["id"],
            "constructor": constructor["name"],
            "points": points,
            "laps": int(result["laps"]),
            "statusId": result["statusId"],
            "timeSeconds": milliseconds,
        }
        results_by_race[result["raceId"]].append(result_row)
        if position == 1:
            driver_wins[year][driver["id"]] += 1
        if position <= 3:
            driver_podiums[year][driver["id"]] += 1

    lap_summary: dict[str, dict[str, dict[str, float | int]]] = defaultdict(lambda: defaultdict(dict))
    lap_times_acc: dict[tuple[str, str], list[float]] = defaultdict(list)
    fastest_lap: dict[str, dict] = {}
    for lap in laps:
        race = race_by_id.get(lap["raceId"])
        if not race:
            continue
        lap_time = seconds(lap.get("milliseconds"))
        if lap_time is None:
            continue
        key = (lap["raceId"], lap["driverId"])
        lap_times_acc[key].append(lap_time)
        current = fastest_lap.get(lap["raceId"])
        if current is None or lap_time < current["lapTime"]:
            fastest_lap[lap["raceId"]] = {
                "driver": driver_by_id[lap["driverId"]]["name"],
                "code": driver_by_id[lap["driverId"]]["code"],
                "lap": int(lap["lap"]),
                "lapTime": lap_time,
            }

    for (race_id, driver_id), values in lap_times_acc.items():
        lap_summary[race_id][driver_id] = {
            "laps": len(values),
            "avgLap": round(sum(values) / len(values), 3),
            "bestLap": round(min(values), 3),
            "worstLap": round(max(values), 3),
        }

    poles_by_race = {}
    for q in qualifying:
        race = race_by_id.get(q["raceId"])
        if not race or q.get("position") != "1":
            continue
        poles_by_race[q["raceId"]] = {
            "driver": driver_by_id[q["driverId"]]["name"],
            "code": driver_by_id[q["driverId"]]["code"],
            "constructor": constructor_by_id[q["constructorId"]]["name"],
        }

    seasons = {}
    for year in sorted(YEARS):
        year_races = sorted(
            [r for r in selected_races if r["year"] == str(year)],
            key=lambda r: int(r["round"]),
        )
        final_race_id = year_races[-1]["raceId"]
        driver_standings = sorted(
            [
                {
                    **driver_by_id[row["driverId"]],
                    "position": int(row["position"]),
                    "points": float(row["points"]),
                    "wins": int(row["wins"]),
                    "podiums": driver_podiums[str(year)][row["driverId"]],
                }
                for row in driver_standing_rows
                if row["raceId"] == final_race_id
            ],
            key=lambda item: item["position"],
        )
        constructor_standings = sorted(
            [
                {
                    **constructor_by_id[row["constructorId"]],
                    "position": int(row["position"]),
                    "points": float(row["points"]),
                    "wins": int(row["wins"]),
                }
                for row in constructor_standing_rows
                if row["raceId"] == final_race_id
            ],
            key=lambda item: item["position"],
        )
        race_items = []
        for race in year_races:
            driver_snapshot = sorted(
                [
                    {
                        **driver_by_id[row["driverId"]],
                        "position": int(row["position"]),
                        "points": float(row["points"]),
                        "wins": int(row["wins"]),
                    }
                    for row in driver_standing_rows
                    if row["raceId"] == race["raceId"]
                ],
                key=lambda item: item["position"],
            )
            constructor_snapshot = sorted(
                [
                    {
                        **constructor_by_id[row["constructorId"]],
                        "position": int(row["position"]),
                        "points": float(row["points"]),
                        "wins": int(row["wins"]),
                    }
                    for row in constructor_standing_rows
                    if row["raceId"] == race["raceId"]
                ],
                key=lambda item: item["position"],
            )
            ordered_results = sorted(results_by_race[race["raceId"]], key=lambda item: item["position"])
            winner = ordered_results[0] if ordered_results else None
            race_items.append({
                "id": race["raceId"],
                "round": int(race["round"]),
                "name": race["name"],
                "date": race["date"],
                "circuit": circuit_by_id[race["circuitId"]],
                "winner": winner,
                "pole": poles_by_race.get(race["raceId"]),
                "fastestLap": fastest_lap.get(race["raceId"]),
                "driverStandingsAfter": driver_snapshot,
                "constructorStandingsAfter": constructor_snapshot,
                "results": [
                    {
                        **result,
                        "lapSummary": lap_summary[race["raceId"]].get(result["driverId"]),
                    }
                    for result in ordered_results
                ],
            })
        seasons[str(year)] = {
            "year": year,
            "races": race_items,
            "driverStandings": driver_standings,
            "constructorStandings": constructor_standings,
        }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        "export const f1Data = "
        + json.dumps({"seasons": seasons}, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
