SET SERVEROUTPUT ON;

PROMPT Transaction management demo using SAVEPOINT and ROLLBACK

BEGIN
  pr_demo_transaction;
END;
/

PROMPT Example manual transaction block

SAVEPOINT before_demo_update;

UPDATE result
SET status = 'DNF'
WHERE result_id = (
  SELECT result_id
  FROM result
  WHERE ROWNUM = 1
);

ROLLBACK TO before_demo_update;

COMMIT;
