# Relational Schema

## SEASON

`SEASON(SeasonID, Year)`

- Primary key: `SeasonID`
- Unique key: `Year`

## CIRCUIT

`CIRCUIT(CircuitID, Name, Location, Country, LengthKm)`

- Primary key: `CircuitID`
- Unique key: `Name`

## TEAM

`TEAM(TeamID, TeamName, BaseCountry)`

- Primary key: `TeamID`
- Unique key: `TeamName`

## DRIVER

`DRIVER(DriverID, Name, Nationality, TeamID, DriverCode)`

- Primary key: `DriverID`
- Foreign key: `TeamID -> TEAM(TeamID)`
- Unique key: `DriverCode`

## RACE

`RACE(RaceID, SeasonID, CircuitID, RaceName, RaceDate, Weather, TrackCondition)`

- Primary key: `RaceID`
- Foreign key: `SeasonID -> SEASON(SeasonID)`
- Foreign key: `CircuitID -> CIRCUIT(CircuitID)`
- Unique key: `(SeasonID, CircuitID)`

## RESULT

`RESULT(ResultID, RaceID, DriverID, TeamID, Position, Points, Status, TotalTimeSec)`

- Primary key: `ResultID`
- Foreign key: `RaceID -> RACE(RaceID)`
- Foreign key: `DriverID -> DRIVER(DriverID)`
- Foreign key: `TeamID -> TEAM(TeamID)`
- Unique key: `(RaceID, DriverID)`

## LAP_DATA

`LAP_DATA(LapID, RaceID, DriverID, LapNumber, Sector1Sec, Sector2Sec, Sector3Sec, LapTimeSec, SpeedKmph, RecordedAt)`

- Primary key: `LapID`
- Foreign key: `RaceID -> RACE(RaceID)`
- Foreign key: `DriverID -> DRIVER(DriverID)`
- Unique key: `(RaceID, DriverID, LapNumber)`

## TYRE_DATA

`TYRE_DATA(TyreID, RaceID, DriverID, StintNo, Compound, StartLap, EndLap)`

- Primary key: `TyreID`
- Foreign key: `RaceID -> RACE(RaceID)`
- Foreign key: `DriverID -> DRIVER(DriverID)`
- Unique key: `(RaceID, DriverID, StintNo)`
