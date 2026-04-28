# Formula 1 Race Management & Performance Analytics System

## 1. Title Page

**Project Title:** Formula 1 Race Management & Performance Analytics System  
**Course Name & Code:** UCS310 - Database Management Systems  
**Degree & Year:** B.Tech, 2nd Year  
**Department / Institute:** Department of Computer Science and Engineering, Thapar Institute of Engineering and Technology  
**Group Members:**  

- Sukhansh Mittal - 1024030318
- Vikramaditya Singh - 1024030315
- Ishjaap Singh - 1024030327

**Lab Instructor:** Diksha Arora  
**Academic Year:** 2025-26

## 2. Introduction

Formula 1 is a highly data-driven motorsport where race outcomes depend on drivers, constructors, circuits, qualifying, strategy, lap pace, reliability, and race execution. This project focuses on designing a relational database system for Formula 1 race management and performance analytics, with a narrative focus on Max Verstappen's 2021 and 2022 championship seasons.

A DBMS is preferred over file-based storage because race data is highly relational. Seasons contain races, races are held at circuits, drivers compete for constructors, and every race produces result and lap-time records. A database ensures consistency, referential integrity, efficient querying, reduced redundancy, and support for analytics using SQL and PL/SQL.

## 3. Problem Statement

Manual handling of Formula 1 race data using spreadsheets or basic files makes it difficult to maintain consistency and perform analytical queries. Data related to drivers, teams, circuits, races, race results, and lap times is interconnected and can become redundant if stored without relational design.

Limitations of a manual/file-based system:

- Repeated driver, team, race, and circuit information.
- Higher risk of inconsistency.
- Difficult joins across race results, teams, and drivers.
- Poor support for performance analytics such as lap pace and standings.
- No automated integrity checks through constraints or triggers.

The project solves this by creating a normalized Oracle database with SQL and PL/SQL components for race management and analytics.

## 4. Objectives of the Project

- To design an ER model for Formula 1 race management data.
- To convert the ER model into normalized relational tables.
- To apply normalization up to 3NF.
- To implement the database using Oracle SQL.
- To use PL/SQL constructs such as procedures, functions, triggers, cursors, and exception handling.
- To support analytics for race results, driver standings, constructor standings, and lap pace.

## 5. Scope of the Project

Functional boundaries:

- Store Formula 1 season, circuit, team, driver, race, result, lap-time, and tyre-related data.
- Import verified 2021 and 2022 race data from an Ergast-derived dataset.
- Support race result lookup and performance analytics.
- Demonstrate SQL joins, aggregate queries, views, subqueries, PL/SQL, and transactions.

Users:

- Admin: loads and maintains race data.
- Analyst/Researcher: runs standings and performance queries.
- Viewer: uses the frontend dashboard to inspect race results and analytics.

Modules:

- Race Management Module
- Performance Analytics Module
- PL/SQL Automation and Integrity Module
- Frontend Visualization Module

## 6. Proposed System Description

The system stores Formula 1 race data in a normalized Oracle database. Race, driver, constructor, circuit, and result data is imported from CSV files generated from the Ergast-derived dataset. Lap-time records are used for telemetry-inspired analytics such as best lap and average lap pace.

Key features:

- Normalized relational database design.
- Primary and foreign key constraints.
- Views for race results and lap performance.
- PL/SQL triggers for validation and automation.
- Stored procedures and functions for race result operations and analytics.
- Cursor-based standings output.
- Transaction demo using `SAVEPOINT`, `ROLLBACK`, and `COMMIT`.
- React dashboard for visualization and presentation.

## 7. Database Design

### 7.1 Entity-Relationship Diagram

Entities:

- Season
- Circuit
- Team
- Driver
- Race
- Result
- LapData
- TyreData

Relationships:

- One season has many races.
- One circuit hosts many races.
- One race has many results.
- One driver has many results.
- One team/constructor has many results.
- One race has many lap records.
- One driver has many lap records.

The detailed ER model is available in `docs/report/er_model.md`.

### 7.2 Relational Schema

The relational schema is available in `docs/report/relational_schema.md`.

Main tables:

- `SEASON`
- `CIRCUIT`
- `TEAM`
- `DRIVER`
- `RACE`
- `RESULT`
- `LAP_DATA`
- `TYRE_DATA`

## 8. Normalization

The database is normalized up to 3NF.

1NF:

- All attributes contain atomic values.
- Repeating groups such as multiple laps or tyre stints are moved into separate tables.

2NF:

- Driver, team, race, and circuit details are separated so that non-key attributes depend on complete primary keys.

3NF:

- Transitive dependencies are removed.
- Team details are stored only in `TEAM`.
- Circuit details are stored only in `CIRCUIT`.
- Race results reference driver and constructor keys instead of duplicating driver/team data.

Detailed normalization notes are available in `docs/normalization.md`.

## 9. Database Implementation

### 9.1 SQL Implementation

SQL files:

- `sql/01_schema.sql` - creates tables, constraints, indexes, and views.
- `sql/02_import_ergast_2021_2022.sql` - inserts 2021 and 2022 race data.
- `sql/04_analytics_queries.sql` - contains analytical queries.

SQL concepts included:

- DDL: `CREATE TABLE`, constraints, indexes, views.
- DML: `INSERT`, `UPDATE`.
- SELECT queries with joins.
- Aggregate functions such as `SUM`, `AVG`, `MIN`, `MAX`, `STDDEV`.
- `GROUP BY` and ordering.
- Views: `VW_RACE_RESULTS`, `VW_LAP_PERFORMANCE`.

### 9.2 PL/SQL Components

PL/SQL file:

- `sql/03_plsql.sql`

Components included:

- Trigger: validates lap time against sector times.
- Trigger: auto-calculates points when points are not imported.
- Function: returns average lap time for a driver in a race.
- Function: returns fastest lap driver for a race.
- Procedure: inserts race result with exception handling.
- Procedure: prints race standings using an explicit cursor.
- Procedure: demonstrates transaction rollback.
- Exception handling using `DUP_VAL_ON_INDEX`, `NO_DATA_FOUND`, and `OTHERS`.

## 10. Transaction Management & Concurrency

Transaction management is demonstrated in:

- `sql/05_transaction_demo.sql`

Concepts included:

- `SAVEPOINT`
- `ROLLBACK TO SAVEPOINT`
- `COMMIT`

The system uses constraints and transactional control to preserve consistency. Oracle's locking and transaction isolation ensure ACID properties during concurrent operations.

## 11. Tools & Technologies Used

- Oracle Database
- Oracle SQL Developer
- SQL
- PL/SQL
- Python for CSV-to-SQL generation
- React for frontend visualization
- Vite for frontend development/build

## 12. Expected Outcomes

- A normalized Formula 1 race database.
- Correct storage of seasons, circuits, teams, drivers, races, results, and lap data.
- Efficient SQL queries for race and performance analysis.
- Automation and validation using PL/SQL procedures, functions, triggers, and cursors.
- Demonstration of transaction management.
- A frontend dashboard that improves project presentation and makes analytics easier to understand.
