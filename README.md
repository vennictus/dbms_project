# Formula 1 Race Management & Performance Analytics System

**UCS310 - Database Management Systems**  
**Backend-first Oracle SQL/PL-SQL project with a React visualization dashboard**

This project implements a Formula 1 race management and telemetry-inspired performance analytics system. The core submission is an Oracle DBMS implementation using normalized relational tables, constraints, views, SQL analytics, PL/SQL procedures, functions, triggers, cursors, exception handling, and transaction control. A polished React dashboard is included as the presentation layer to make the database output easier to explore during viva/demo.

## Project Tags

`Oracle SQL` `PL/SQL` `DBMS` `3NF` `ER Model` `Triggers` `Procedures` `Functions` `Cursors` `Transactions` `React` `Formula 1 Analytics`

## Why This Project Stands Out

- Backend is aligned with the DBMS rubric: SQL + PL/SQL are the main implementation.
- Uses real Formula 1 historical data for 2021 and 2022 from an Ergast-derived dataset.
- Demonstrates race management, championship standings, result analysis, and lap-time analytics.
- Includes a frontend dashboard that makes the DBMS work presentable and interactive.
- Documents ER model, relational schema, normalization, and final report structure.

## Story Focus

The frontend and report focus on Max Verstappen's 2021 and 2022 championship arc:

- **2021:** Verstappen vs Hamilton, ending with Verstappen winning the Drivers' Championship by 8 points.
- **2022:** Ferrari starts strongly, then Verstappen and Red Bull take control.

2023 and 2024 are intentionally excluded because the local dataset was not trusted for this submission.

## Implemented DBMS Modules

### Race Management Module

- Stores seasons, circuits, teams/constructors, drivers, races, and classified race results.
- Supports complete race result lookup by season and Grand Prix.
- Maintains race-specific constructor assignment through `RESULT.TeamID`.

### Performance Analytics Module

- Stores lap-time data in `LAP_DATA`.
- Supports fastest lap, average lap pace, race pace ranking, driver comparison, and team performance analysis.
- Provides SQL views for simplified reporting.

### PL/SQL Automation Module

Implemented in `sql/03_plsql.sql`:

- Trigger to validate lap time against sector times when sector data exists.
- Trigger to auto-calculate points when points are not explicitly imported.
- Function to calculate a driver's average lap time for a race.
- Function to return the fastest lap driver for a race.
- Procedure to insert a race result with exception handling.
- Procedure to print race standings using a cursor.
- Procedure demonstrating transaction rollback.

### Transaction Management Module

Implemented in `sql/05_transaction_demo.sql`:

- `SAVEPOINT`
- `ROLLBACK TO SAVEPOINT`
- `COMMIT`
- ACID consistency explanation in report docs

## Frontend Dashboard Features

- Auto-hiding top navigation bar
- Back-to-top button
- Season switcher for 2021 and 2022
- Race explorer with searchable Grand Prix list
- Race detail panel with winner, pole, fastest lap, podium, full classified result
- Grid-to-finish delta
- Constructor points per selected race
- Dynamic driver standings after selected race
- Dynamic constructor standings after selected race
- Final championship standings
- Win distribution chart
- Fastest lap leaderboard
- Story mode timeline
- Dedicated DBMS brief page explaining backend components

## Project Structure

```text
dbms_project/
  data/ergast/                       Source CSV dataset
  docs/
    normalization.md                 Normalization explanation
    report/
      final_report.md                Report draft in required format
      er_model.md                    ER model and cardinality
      relational_schema.md           Table schema with PK/FK
    source/                          Original synopsis and Wikipedia notes
  scripts/
    build_frontend_data.py           Builds React data from CSV files
    ergast_to_oracle.py              Builds Oracle INSERT SQL from CSV files
  sql/
    00_run_all.sql                   Master SQL Developer runner
    01_schema.sql                    Tables, constraints, indexes, views
    02_import_ergast_2021_2022.sql   Generated data import
    03_plsql.sql                     Procedures, functions, triggers, cursors
    04_analytics_queries.sql         SQL analytics queries
    05_transaction_demo.sql          Transaction demo
  src/
    data/f1Data.js                   Generated frontend data
    main.jsx                         React app
    styles.css                       Dashboard styling
```

## Oracle Execution

Run in Oracle SQL Developer:

```sql
@sql/00_run_all.sql
```

Or execute manually:

```sql
@sql/01_schema.sql
@sql/02_import_ergast_2021_2022.sql
@sql/03_plsql.sql
@sql/04_analytics_queries.sql
@sql/05_transaction_demo.sql
```

## Regenerate Data

Generate Oracle import SQL:

```powershell
python scripts/ergast_to_oracle.py
```

Generate frontend dashboard data:

```powershell
python scripts/build_frontend_data.py
```

Current generated import:

- 2 seasons: 2021 and 2022
- 44 races
- 880 race result rows
- 47,217 lap-time rows

## Frontend Execution

Install dependencies:

```powershell
npm install
```

Run locally:

```powershell
npm run dev -- --host 127.0.0.1 --port 5175
```

Build:

```powershell
npm run build
```

## Data Sources

- Dataset: Kaggle "Formula 1 World Championship (1950 - 2024)"
- Original source acknowledged by that dataset: Ergast Motor Racing Data, `http://ergast.com/mrd/`
- Narrative notes: provided Wikipedia season text file in `docs/source/`

## Group

- Sukhansh Mittal - 1024030318
- Vikramaditya Singh - 1024030315
- Ishjaap Singh - 1024030327

## Submission Positioning

This is a DBMS project first. The React frontend is not treated as the backend; it is a visualization layer that demonstrates the database output in a clean, interactive format. The main evaluation artifacts are the Oracle SQL files, PL/SQL components, ER model, relational schema, normalization notes, and report.
