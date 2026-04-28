# Normalization

## Unnormalized Form

A single race sheet may contain repeated groups:

`SeasonYear, RaceName, CircuitName, DriverName, TeamName, Position, Lap1Time, Lap2Time, TyreStint1, TyreStint2`

This causes repeated driver, team, circuit, and lap data in the same row.

## First Normal Form

1NF requires atomic values and no repeating groups. Lap and tyre information is separated into individual records.

Example:

- One row per race result in `RESULT`
- One row per driver lap in `LAP_DATA`
- One row per tyre stint in `TYRE_DATA`

## Second Normal Form

2NF removes partial dependencies. Driver details depend on `DriverID`, team details depend on `TeamID`, and circuit details depend on `CircuitID`, not on a combined race-result key.

Separated tables:

- `DRIVER(DriverID, Name, Nationality, TeamID, DriverCode)`
- `TEAM(TeamID, TeamName, BaseCountry)`
- `CIRCUIT(CircuitID, Name, Location, Country, LengthKm)`

## Third Normal Form

3NF removes transitive dependencies. Team name is stored only in `TEAM`, not in `DRIVER` or `RESULT`. Circuit location is stored only in `CIRCUIT`, not in `RACE`.

Final schema:

- `SEASON(SeasonID, Year)`
- `CIRCUIT(CircuitID, Name, Location, Country, LengthKm)`
- `TEAM(TeamID, TeamName, BaseCountry)`
- `DRIVER(DriverID, Name, Nationality, TeamID, DriverCode)`
- `RACE(RaceID, SeasonID, CircuitID, RaceName, RaceDate, Weather, TrackCondition)`
- `RESULT(ResultID, RaceID, DriverID, TeamID, Position, Points, Status, TotalTimeSec)`
- `LAP_DATA(LapID, RaceID, DriverID, LapNumber, Sector1Sec, Sector2Sec, Sector3Sec, LapTimeSec, SpeedKmph)`
- `TYRE_DATA(TyreID, RaceID, DriverID, StintNo, Compound, StartLap, EndLap)`

The schema avoids redundancy, supports referential integrity, and keeps analytics data queryable without duplicating master data.

For Ergast-based historical imports, `RESULT.TeamID` stores the constructor used by the driver in that race. This is required because drivers can change teams between seasons.
