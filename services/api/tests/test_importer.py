from app.importer import parse_csv, validate_rows

OBJ, IND, SRC = {"OBJ-001"}, {"SUCCESSORS"}, {"SRC-01"}
HEAD = "object_external_code,indicator_code,period_start,period_end,value_numeric,source_code,data_origin\n"


def run(body):
    rows, err = parse_csv((HEAD + body).encode())
    assert err is None
    return validate_rows(rows, OBJ, IND, SRC)


def test_valid_row_and_empty_value_stays_null():
    valid, errors = run("OBJ-001,SUCCESSORS,2024-01-01,2024-12-31,8,SRC-01,PARTNER\n"
                        "OBJ-001,SUCCESSORS,2023-01-01,2023-12-31,,SRC-01,PARTNER\n")
    assert not errors and valid[0]["value_numeric"] == 8.0 and valid[1]["value_numeric"] is None


def test_errors_are_reported_per_row_and_field():
    _, errors = run("X,SUCCESSORS,2024-01-01,2024-12-31,8,SRC-01,PARTNER\n"
                    "OBJ-001,SUCCESSORS,2024-12-31,2024-01-01,abc,SRC-01,REAL\n")
    assert {(e["row"], e["field"]) for e in errors} == {
        (2, "object_external_code"), (3, "period_end"), (3, "value_numeric"), (3, "data_origin")}


def test_missing_column_rejected():
    _, err = parse_csv(b"object_external_code\nOBJ-001\n")
    assert "Kolom wajib" in err


def test_sources_and_objects_validation():
    from app.importer import validate_objects, validate_sources
    rows, _ = parse_csv(b"code,name,source_type\nA,x,SURVEY\nA,y,SURVEY\nB,z,NOPE\n,w,SURVEY\n", ["code", "name", "source_type"])
    valid, errors = validate_sources(rows)
    assert [v["code"] for v in valid] == ["A"]
    assert {(e["row"], e["field"]) for e in errors} == {(3, "code"), (4, "source_type"), (5, "code")}
    rows, _ = parse_csv(b"external_code,name,category,region_code,data_origin,latitude\nO1,n,c,32,PARTNER,\nO2,n,c,99,PARTNER,200\n",
                        ["external_code", "name", "category", "region_code", "data_origin"])
    valid, errors = validate_objects(rows, {"32"}, set())
    assert len(valid) == 1 and valid[0]["latitude"] is None
    assert {(e["row"], e["field"]) for e in errors} == {(3, "region_code"), (3, "latitude")}
