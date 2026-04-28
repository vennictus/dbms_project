SET SERVEROUTPUT ON;

CREATE OR REPLACE TRIGGER trg_validate_lap_time
BEFORE INSERT OR UPDATE ON lap_data
FOR EACH ROW
DECLARE
  v_expected NUMBER(8,3);
BEGIN
  IF :NEW.sector1_sec IS NULL OR :NEW.sector2_sec IS NULL OR :NEW.sector3_sec IS NULL THEN
    RETURN;
  END IF;

  v_expected := ROUND(:NEW.sector1_sec + :NEW.sector2_sec + :NEW.sector3_sec, 3);

  IF ABS(v_expected - :NEW.lap_time_sec) > 0.010 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Lap time must equal sum of sector times.');
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_result_points
BEFORE INSERT OR UPDATE OF position, status ON result
FOR EACH ROW
BEGIN
  IF :NEW.points IS NOT NULL THEN
    RETURN;
  END IF;

  IF :NEW.status <> 'Finished' THEN
    :NEW.points := 0;
  ELSIF :NEW.position = 1 THEN
    :NEW.points := 25;
  ELSIF :NEW.position = 2 THEN
    :NEW.points := 18;
  ELSIF :NEW.position = 3 THEN
    :NEW.points := 15;
  ELSIF :NEW.position = 4 THEN
    :NEW.points := 12;
  ELSIF :NEW.position = 5 THEN
    :NEW.points := 10;
  ELSIF :NEW.position = 6 THEN
    :NEW.points := 8;
  ELSIF :NEW.position = 7 THEN
    :NEW.points := 6;
  ELSIF :NEW.position = 8 THEN
    :NEW.points := 4;
  ELSIF :NEW.position = 9 THEN
    :NEW.points := 2;
  ELSIF :NEW.position = 10 THEN
    :NEW.points := 1;
  ELSE
    :NEW.points := 0;
  END IF;
END;
/

CREATE OR REPLACE FUNCTION fn_driver_avg_lap (
  p_race_id IN NUMBER,
  p_driver_id IN NUMBER
) RETURN NUMBER
IS
  v_avg_lap NUMBER(8,3);
BEGIN
  SELECT ROUND(AVG(lap_time_sec), 3)
  INTO v_avg_lap
  FROM lap_data
  WHERE race_id = p_race_id
    AND driver_id = p_driver_id;

  RETURN v_avg_lap;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN NULL;
END;
/

CREATE OR REPLACE FUNCTION fn_fastest_lap_driver (
  p_race_id IN NUMBER
) RETURN VARCHAR2
IS
  v_driver VARCHAR2(80);
BEGIN
  SELECT driver_name
  INTO v_driver
  FROM (
    SELECT d.name AS driver_name, l.lap_time_sec
    FROM lap_data l
    JOIN driver d ON d.driver_id = l.driver_id
    WHERE l.race_id = p_race_id
    ORDER BY l.lap_time_sec
  )
  WHERE ROWNUM = 1;

  RETURN v_driver;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN 'No telemetry available';
END;
/

CREATE OR REPLACE PROCEDURE pr_add_race_result (
  p_race_id IN NUMBER,
  p_driver_id IN NUMBER,
  p_team_id IN NUMBER,
  p_position IN NUMBER,
  p_status IN VARCHAR2 DEFAULT 'Finished',
  p_total_time_sec IN NUMBER DEFAULT NULL
)
IS
BEGIN
  INSERT INTO result (race_id, driver_id, team_id, position, status, total_time_sec)
  VALUES (p_race_id, p_driver_id, p_team_id, p_position, p_status, p_total_time_sec);

  COMMIT;
EXCEPTION
  WHEN DUP_VAL_ON_INDEX THEN
    ROLLBACK;
    RAISE_APPLICATION_ERROR(-20002, 'Result already exists for this race and driver.');
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
/

CREATE OR REPLACE PROCEDURE pr_print_race_standings (
  p_race_id IN NUMBER
)
IS
  CURSOR c_standings IS
    SELECT d.driver_code, d.name, t.team_name, res.position, res.points
    FROM result res
    JOIN driver d ON d.driver_id = res.driver_id
    JOIN team t ON t.team_id = res.team_id
    WHERE res.race_id = p_race_id
    ORDER BY res.position;
BEGIN
  FOR rec IN c_standings LOOP
    DBMS_OUTPUT.PUT_LINE(
      rec.position || '. ' || rec.driver_code || ' - ' ||
      rec.name || ' (' || rec.team_name || ') ' || rec.points || ' pts'
    );
  END LOOP;
END;
/

CREATE OR REPLACE PROCEDURE pr_demo_transaction
IS
  v_season_id NUMBER;
BEGIN
  SAVEPOINT before_demo_season;

  INSERT INTO season (year) VALUES (2099)
  RETURNING season_id INTO v_season_id;

  ROLLBACK TO before_demo_season;
  DBMS_OUTPUT.PUT_LINE('Transaction demo completed. Temporary season rolled back.');
END;
/
