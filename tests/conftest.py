import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

os.environ["FAULTLINE_DB_PATH"] = str(
    Path(tempfile.gettempdir()) / "faultline_test_default.db"
)

import pytest

from faultline import db


@pytest.fixture
def fresh_db(tmp_path, monkeypatch):
    test_db = tmp_path / "faultline_test.db"
    monkeypatch.setattr("faultline.db._DB_PATH", str(test_db))
    db.init_db()
    yield test_db
