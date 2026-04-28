# ER Model

## Entities and Attributes

### Season

- `SeasonID` - primary key
- `Year` - unique championship year

### Circuit

- `CircuitID` - primary key
- `Name`
- `Location`
- `Country`
- `LengthKm`

### Team

- `TeamID` - primary key
- `TeamName`
- `BaseCountry`

### Driver

- `DriverID` - primary key
- `Name`
- `Nationality`
- `DriverCode`
- `TeamID` - optional current/default team reference

### Race

- `RaceID` - primary key
- `SeasonID` - foreign key
- `CircuitID` - foreign key
- `RaceName`
- `RaceDate`
- `Weather`
- `TrackCondition`

### Result

- `ResultID` - primary key
- `RaceID` - foreign key
- `DriverID` - foreign key
- `TeamID` - foreign key
- `Position`
- `Points`
- `Status`
- `TotalTimeSec`

### LapData

- `LapID` - primary key
- `RaceID` - foreign key
- `DriverID` - foreign key
- `LapNumber`
- `Sector1Sec`
- `Sector2Sec`
- `Sector3Sec`
- `LapTimeSec`
- `SpeedKmph`

### TyreData

- `TyreID` - primary key
- `RaceID` - foreign key
- `DriverID` - foreign key
- `StintNo`
- `Compound`
- `StartLap`
- `EndLap`

## Relationships and Cardinality

- One `Season` has many `Race` records.
- One `Circuit` can host many `Race` records across seasons.
- One `Team` can have many `Driver` records.
- One `Race` has many `Result` records.
- One `Driver` has many `Result` records.
- One `Team` has many `Result` records because constructor assignment is race-specific.
- One `Race` has many `LapData` records.
- One `Driver` has many `LapData` records.
- One `Race` has many `TyreData` records.
- One `Driver` has many `TyreData` records.

## Mermaid ER Diagram

```mermaid
erDiagram
    SEASON ||--o{ RACE : contains
    CIRCUIT ||--o{ RACE : hosts
    TEAM ||--o{ DRIVER : has
    RACE ||--o{ RESULT : produces
    DRIVER ||--o{ RESULT : earns
    TEAM ||--o{ RESULT : constructor_for
    RACE ||--o{ LAP_DATA : records
    DRIVER ||--o{ LAP_DATA : drives
    RACE ||--o{ TYRE_DATA : includes
    DRIVER ||--o{ TYRE_DATA : uses

    SEASON {
      number season_id PK
      number year
    }
    CIRCUIT {
      number circuit_id PK
      string name
      string location
      string country
      number length_km
    }
    TEAM {
      number team_id PK
      string team_name
      string base_country
    }
    DRIVER {
      number driver_id PK
      string name
      string nationality
      string driver_code
      number team_id FK
    }
    RACE {
      number race_id PK
      number season_id FK
      number circuit_id FK
      string race_name
      date race_date
      string weather
      string track_condition
    }
    RESULT {
      number result_id PK
      number race_id FK
      number driver_id FK
      number team_id FK
      number position
      number points
      string status
      number total_time_sec
    }
    LAP_DATA {
      number lap_id PK
      number race_id FK
      number driver_id FK
      number lap_number
      number lap_time_sec
    }
    TYRE_DATA {
      number tyre_id PK
      number race_id FK
      number driver_id FK
      number stint_no
      string compound
      number start_lap
      number end_lap
    }
```
