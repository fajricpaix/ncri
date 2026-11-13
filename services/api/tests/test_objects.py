import pytest
from pydantic import ValidationError

from app.schemas import CulturalObjectUpdate


def test_update_is_partial():
    assert CulturalObjectUpdate(name="Tari Saman").model_dump(exclude_unset=True) == {"name": "Tari Saman"}
    # field opsional boleh dikosongkan
    assert CulturalObjectUpdate(description=None).model_dump(exclude_unset=True) == {"description": None}


def test_update_cannot_change_provenance():
    with pytest.raises(ValidationError):
        CulturalObjectUpdate(data_origin="PUBLIC")  # label SIMULATED tidak boleh diganti lewat edit


@pytest.mark.parametrize("body", [{"name": None}, {"category": None}, {"name": ""}, {"latitude": 91}])
def test_update_rejects_invalid(body):
    with pytest.raises(ValidationError):
        CulturalObjectUpdate(**body)
