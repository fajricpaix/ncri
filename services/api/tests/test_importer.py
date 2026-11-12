from app.importer import parse_csv, validate_rows

OBJ, IND, SRC = {"OBJ-001"}, {"SUCCESSORS"}, {"SIM-01"}
HEAD = "object_external_code,indicator_code,period_start,period_end,value_numeric,source_code,data_origin\n"


def run(body):
    rows, err = parse_csv((HEAD + body).encode())
    assert err is None
    return validate_rows(rows, OBJ, IND, SRC)


def test_valid_row_and_empty_value_stays_null():
    valid, errors = run("OBJ-001,SUCCESSORS,2024-01-01,2024-12-31,8,SIM-01,SIMULATED\n"
                        "OBJ-001,SUCCESSORS,2023-01-01,2023-12-31,,SIM-01,SIMULATED\n")
    assert not errors and valid[0]["value_numeric"] == 8.0 and valid[1]["value_numeric"] is None


def test_errors_are_reported_per_row_and_field():
    _, errors = run("X,SUCCESSORS,2024-01-01,2024-12-31,8,SIM-01,SIMULATED\n"
                    "OBJ-001,SUCCESSORS,2024-12-31,2024-01-01,abc,SIM-01,REAL\n")
    assert {(e["row"], e["field"]) for e in errors} == {
        (2, "object_external_code"), (3, "period_end"), (3, "value_numeric"), (3, "data_origin")}


def test_missing_column_rejected():
    _, err = parse_csv(b"object_external_code\nOBJ-001\n")
    assert "Kolom wajib" in err
