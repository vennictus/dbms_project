SET LINESIZE 180;
SET PAGESIZE 100;

PROMPT Race results
SELECT * FROM vw_race_results ORDER BY year, race_name, position;

PROMPT Fastest laps by race
SELECT
  r.race_name,
  d.driver_code,
  d.name AS driver_name,
  MIN(l.lap_time_sec) AS fastest_lap_sec
FROM lap_data l
JOIN race r ON r.race_id = l.race_id
JOIN driver d ON d.driver_id = l.driver_id
GROUP BY r.race_name, d.driver_code, d.name
ORDER BY r.race_name, fastest_lap_sec;

PROMPT Average lap pace by driver
SELECT
  r.race_name,
  d.driver_code,
  d.name AS driver_name,
  ROUND(AVG(l.lap_time_sec), 3) AS avg_lap_sec,
  ROUND(MIN(l.lap_time_sec), 3) AS best_lap_sec,
  ROUND(MAX(l.lap_time_sec), 3) AS worst_lap_sec
FROM lap_data l
JOIN race r ON r.race_id = l.race_id
JOIN driver d ON d.driver_id = l.driver_id
GROUP BY r.race_name, d.driver_code, d.name
ORDER BY r.race_name, avg_lap_sec;

PROMPT Team points
SELECT
  s.year,
  t.team_name,
  SUM(res.points) AS total_points
FROM result res
JOIN race r ON r.race_id = res.race_id
JOIN season s ON s.season_id = r.season_id
JOIN driver d ON d.driver_id = res.driver_id
JOIN team t ON t.team_id = res.team_id
GROUP BY s.year, t.team_name
ORDER BY total_points DESC;

PROMPT Race pace by track condition placeholder
SELECT
  r.track_condition,
  ROUND(AVG(l.lap_time_sec), 3) AS avg_lap_sec,
  ROUND(AVG(l.speed_kmph), 2) AS avg_speed_kmph
FROM lap_data l
JOIN race r ON r.race_id = l.race_id
GROUP BY r.track_condition
ORDER BY avg_lap_sec;

PROMPT Driver consistency
SELECT
  r.race_name,
  d.driver_code,
  ROUND(STDDEV(l.lap_time_sec), 3) AS lap_time_stddev
FROM lap_data l
JOIN race r ON r.race_id = l.race_id
JOIN driver d ON d.driver_id = l.driver_id
GROUP BY r.race_name, d.driver_code
ORDER BY lap_time_stddev NULLS LAST;
