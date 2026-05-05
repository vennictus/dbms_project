# Formula 1 Race Intelligence System - Technical Guide

This guide explains the project from the technical side. It is written for someone who may not already know the codebase, Oracle SQL, PL/SQL, or the frontend structure.

## 1. What This Project Is

This is a DBMS project built around Formula 1 race data for the 2021 and 2022 seasons.

The main system is an Oracle database that stores:

- seasons
- circuits
- teams
- drivers
- races
- classified race results
- lap-time data
- tyre stint data

The React frontend is a presentation layer. It lets a user explore the database output visually: selected race result, podium, constructor points, lap pace, championship state after each race, and final standings.

In simple terms:

```text
CSV dataset -> Python scripts -> Oracle SQL import + frontend data file -> Oracle DB + React dashboard
```

## 2. Main Technologies

| Layer | Technology | Purpose |
| --- | --- | --- |
| Database | Oracle SQL | Stores normalized Formula 1 data |
| Database logic | PL/SQL | Triggers, functions, procedures, cursors, and transaction examples |
| Data generation | Python | Converts Ergast-style CSV data into Oracle insert scripts and frontend JSON-like data |
| Frontend | React | Interactive dashboard for presenting race and championship data |
| Build tool | Vite | Runs and builds the React app |
| Icons | lucide-react | UI icons in the dashboard |

## 3. Project Structure

```text
dbms_project/
  data/ergast/
    Source CSV files used to generate the project data.

  docs/
    normalization.md
      Explains normalization and why the schema is structured as separate tables.

    report/
      final_report.md
      er_model.md
      relational_schema.md
      Report-oriented documentation for DBMS submission.

  scripts/
    ergast_to_oracle.py
      Reads CSV files and generates Oracle INSERT statements.

    build_frontend_data.py
      Reads CSV files and generates src/data/f1Data.js for the React dashboard.

  sql/
    00_run_all.sql
      Master runner for Oracle SQL Developer.

    01_schema.sql
      Creates all tables, constraints, indexes, and views.

    02_import_ergast_2021_2022.sql
      Generated import file with seasons, races, drivers, results, laps, and tyre data.

    03_plsql.sql
      PL/SQL triggers, functions, procedures, cursors, exception handling, and rollback demo.

    04_analytics_queries.sql
      Standalone analytical SQL queries.

    05_transaction_demo.sql
      Transaction management demonstration using savepoints, rollback, and commit.

  src/
    data/f1Data.js
      Generated data used by the frontend.

    main.jsx
      Main React app and dashboard components.

    styles.css
      All dashboard styling.

  package.json
    Frontend dependencies and npm scripts.
```

## 4. Database Design

The database is normalized so repeated information is stored once and referenced through foreign keys.

### Core Tables

#### `SEASON`

Stores one row per Formula 1 season.

Important columns:

- `season_id`: primary key
- `year`: season year, such as 2021 or 2022

#### `CIRCUIT`

Stores race circuit details.

Important columns:

- `circuit_id`: primary key
- `name`: circuit name
- `country`: circuit country
- `length_km`: approximate circuit length

#### `TEAM`

Stores constructor/team information.

Important columns:

- `team_id`: primary key
- `team_name`: constructor name
- `nationality`: constructor nationality

#### `DRIVER`

Stores driver information.

Important columns:

- `driver_id`: primary key
- `name`: driver full name
- `driver_code`: three-letter driver code, such as VER or HAM
- `nationality`: driver nationality
- `team_id`: current/default team reference

#### `RACE`

Stores one row per Grand Prix.

Important columns:

- `race_id`: primary key
- `season_id`: foreign key to `SEASON`
- `circuit_id`: foreign key to `CIRCUIT`
- `round_no`: race round number in that season
- `race_name`: Grand Prix name
- `race_date`: race date
- `weather`: simplified race weather category
- `track_condition`: simplified track condition category

The unique race rule is `(season_id, race_name)`. This matters because one season can have multiple races at the same circuit, such as the Styrian and Austrian Grands Prix at the Red Bull Ring.

#### `RESULT`

Stores classified race result rows.

Important columns:

- `result_id`: primary key
- `race_id`: foreign key to `RACE`
- `driver_id`: foreign key to `DRIVER`
- `team_id`: foreign key to `TEAM`
- `position`: final classified position
- `grid_position`: starting grid position
- `points`: points scored
- `status`: finish status

This table is the main link between a race, a driver, a team, and the final result.

#### `LAP_DATA`

Stores lap-level timing data.

Important columns:

- `lap_id`: primary key
- `race_id`: foreign key to `RACE`
- `driver_id`: foreign key to `DRIVER`
- `lap_number`: lap number
- `lap_time_sec`: lap time in seconds
- `sector1_sec`, `sector2_sec`, `sector3_sec`: optional sector timings

This table supports fastest lap, average pace, and lap ranking analytics.

#### `TYRE_DATA`

Stores demonstrative tyre stint windows derived from pit-stop laps.

Important columns:

- `tyre_id`: primary key
- `race_id`: foreign key to `RACE`
- `driver_id`: foreign key to `DRIVER`
- `stint_no`: stint number
- `compound`: Soft, Medium, Hard, Intermediate, or Wet
- `start_lap`: first lap of stint
- `end_lap`: last lap of stint

The source pit-stop data does not include actual compound names, so compound labels are generated for demonstration.

## 5. Constraints and Data Quality

The schema uses constraints so invalid data is rejected early.

Examples:

- `SEASON.year` must be between 1950 and 2100.
- `CIRCUIT.length_km` must be greater than 0.
- `DRIVER.driver_code` must be uppercase.
- `RACE.weather` must be one of the accepted weather categories.
- `RESULT.points` cannot be negative.
- `LAP_DATA.lap_number` must be greater than 0.
- `TYRE_DATA.end_lap` must be greater than or equal to `start_lap`.

Foreign keys protect relationships. For example, a result cannot exist unless its race, driver, and team already exist.

## 6. Views

Views are stored SQL queries that make reporting easier.

The schema creates views such as:

- `VW_RACE_RESULTS`: combines season, race, driver, team, and result information.
- `VW_LAP_PERFORMANCE`: combines race, driver, and lap timing information.

Instead of repeatedly writing long joins, analytics can query these views directly.

## 7. PL/SQL Components

The PL/SQL file demonstrates database-side logic.

### Triggers

Triggers run automatically when certain database changes happen.

This project includes:

- a trigger that validates lap time against sector times when sector data exists
- a trigger that calculates race points if points are not explicitly inserted

### Functions

Functions return a value.

Examples:

- calculate a driver's average lap time for a selected race
- return the fastest lap driver for a selected race

### Procedures

Procedures perform a task.

Examples:

- insert a race result with validation and exception handling
- print race standings using a cursor
- demonstrate rollback behavior

### Cursors

A cursor is used to process query results row by row. This is useful when a procedure needs to print or process ordered standings.

### Exception Handling

Exception handling catches database errors and gives controlled output instead of failing silently.

## 8. Transaction Management

The project includes a transaction demo with:

- `SAVEPOINT`
- `ROLLBACK TO SAVEPOINT`
- `COMMIT`

This demonstrates the ACID idea that database changes should be reliable, controlled, and recoverable.

Example idea:

```sql
SAVEPOINT before_insert;
-- Try a change
ROLLBACK TO before_insert;
COMMIT;
```

## 9. Data Pipeline

There are two generated outputs from the same source data.

### Oracle Import Generation

Run:

```powershell
python scripts/ergast_to_oracle.py
```

This creates or updates:

```text
sql/02_import_ergast_2021_2022.sql
```

That file contains Oracle insert statements for the selected seasons.

### Frontend Data Generation

Run:

```powershell
python scripts/build_frontend_data.py
```

This creates or updates:

```text
src/data/f1Data.js
```

The React app imports this file directly.

## 10. Oracle Execution

Open Oracle SQL Developer and run:

```sql
@sql/00_run_all.sql
```

That master file runs the project in order:

```sql
@sql/01_schema.sql
@sql/02_import_ergast_2021_2022.sql
@sql/03_plsql.sql
@sql/04_analytics_queries.sql
@sql/05_transaction_demo.sql
```

The order matters:

1. Create the schema.
2. Import data.
3. Add PL/SQL logic.
4. Run analytics.
5. Demonstrate transactions.

## 11. Frontend Architecture

The frontend lives mainly in:

```text
src/main.jsx
src/styles.css
src/data/f1Data.js
```

### `src/data/f1Data.js`

This is generated data. It contains the race, result, lap summary, standings, and story information used by the React app.

Do not manually rewrite this file unless necessary. If the source CSV data changes, regenerate it with:

```powershell
python scripts/build_frontend_data.py
```

### `src/main.jsx`

This file contains the React components.

Important components:

- `App`: top-level app state and layout
- `RaceExplorer`: race selector, race details, classified result, race summary, and championship snapshots
- `ResultSummary`: summary numbers for the selected race
- `RaceInsights`: winner, fastest lap, grid movement, and top team haul
- `Podium`: top three finishers
- `Standings`: final championship tables
- `DBMSBrief`: explanation of backend database features

### `src/styles.css`

This file contains the full visual system:

- colors
- dashboard layout
- panels
- tables
- race cards
- championship snapshots
- responsive behavior

## 12. Frontend State Flow

The dashboard keeps track of:

- selected season: 2021 or 2022
- selected race
- race search query
- current scroll position for navigation behavior

When the user selects a season:

1. React reads that season from `f1Data`.
2. The active race is reset to the season's final race by default.
3. The race workspace updates.
4. Championship snapshots update to the selected race.

When the user selects a race:

1. `activeRaceId` changes.
2. React finds the matching race object.
3. The race summary, result table, podium, pace ranking, constructor points, and championship state all update.

The previous/next race controls move through the season round by round.

## 13. Running the Frontend

Install dependencies:

```powershell
npm install
```

Start the dev server:

```powershell
npm run dev -- --host 127.0.0.1 --port 5177
```

Open:

```text
http://127.0.0.1:5177/
```

Build for production:

```powershell
npm run build
```

Preview the production build:

```powershell
npm run preview -- --host 127.0.0.1 --port 4173
```

## 14. Important Analytics Shown

### Race Result

Uses classified result rows to show:

- finishing position
- driver
- constructor
- grid position
- grid delta
- points

### Constructor Points In Race

Groups result rows by constructor and sums race points.

### Lap Pace Ranking

Ranks drivers by average lap time from lap data.

### Championship State After Selected Race

Uses standings snapshots generated after each round.

This is why selecting an earlier race shows the championship as it stood at that moment, not only the final standings.

### Final Standings

Shows the final drivers' and constructors' championship tables for the selected season.

## 15. Why 2021 and 2022 Are Used

The dashboard focuses on two connected seasons:

- 2021: Verstappen vs Hamilton title fight
- 2022: Verstappen and Red Bull become dominant after a more competitive early season

These two seasons are enough to demonstrate:

- race-by-race management
- championship progression
- constructor performance
- driver performance
- lap-time analytics

## 16. Known Data Notes

- The data is based on an Ergast-derived Formula 1 dataset.
- Tyre compound labels are demonstrative because pit-stop data gives pit windows but not real compound names.
- Weather and track condition are simplified categories for DBMS demonstration.
- The frontend data is static/generated; it does not query Oracle live.

This is intentional for presentation: the Oracle database is the core DBMS work, and the frontend is a clean visualization of the generated output.

## 17. Common Demo Flow

A clear demo can follow this order:

1. Explain the normalized schema.
2. Show `sql/01_schema.sql`.
3. Show the import file generated from real F1 data.
4. Run or explain `sql/00_run_all.sql`.
5. Show PL/SQL triggers, functions, and procedures.
6. Open the frontend.
7. Switch between 2021 and 2022.
8. Use the race search and previous/next race controls.
9. Show how championship state changes by selected race.
10. End with final standings and DBMS brief.

## 18. Troubleshooting

### `npm run dev` does not start

Run:

```powershell
npm install
```

Then start again:

```powershell
npm run dev -- --host 127.0.0.1 --port 5177
```

### Browser shows an old UI

Refresh the page. Vite usually hot-reloads, but a manual refresh clears stale UI state.

### Oracle script fails because a table already exists

Use `sql/00_run_all.sql` or run `sql/01_schema.sql` first. The schema file drops existing project tables before recreating them.

### Import fails because schema is missing

Run:

```sql
@sql/01_schema.sql
```

before:

```sql
@sql/02_import_ergast_2021_2022.sql
```

### Frontend data looks out of sync with SQL import

Regenerate both generated files:

```powershell
python scripts/ergast_to_oracle.py
python scripts/build_frontend_data.py
```

## 19. What To Say In A Viva

Short explanation:

> This is a Formula 1 DBMS project where the main implementation is an Oracle relational database. The schema is normalized into seasons, circuits, teams, drivers, races, results, lap data, and tyre data. It uses primary keys, foreign keys, check constraints, indexes, views, PL/SQL triggers, functions, procedures, cursors, and transaction handling. The React frontend is a visualization layer that helps demonstrate race results, lap pace, constructor points, and championship standings after each selected race.

## 20. Main Files To Know

| File | Why It Matters |
| --- | --- |
| `sql/01_schema.sql` | Core database design |
| `sql/02_import_ergast_2021_2022.sql` | Generated data import |
| `sql/03_plsql.sql` | PL/SQL automation and procedural logic |
| `sql/04_analytics_queries.sql` | Analytical SQL examples |
| `sql/05_transaction_demo.sql` | Transaction control demo |
| `scripts/ergast_to_oracle.py` | Converts CSV data into Oracle SQL |
| `scripts/build_frontend_data.py` | Generates frontend data |
| `src/main.jsx` | React dashboard logic |
| `src/styles.css` | Frontend visual design |
| `src/data/f1Data.js` | Generated frontend dataset |

