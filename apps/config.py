from pathlib import Path
import os

basedir = Path(__file__).parent.parent

class BaseConfig:
    SECRET_KEY = "2AZSMss3p5QPbcY2hBsJ"
    WTF_CSRF_SECRET_KEY = "AuwzyszU5sugKN7KZs6f"

    UPLOAD_FOLDER = str(Path(basedir, "apps", "uploads"))

    labels_path = os.path.join(basedir, "apps",  "model", "labels.txt")

    MODEL_PATH = os.path.join(basedir, "apps", "model", "keras_model.h5")

    with open(labels_path, encoding="utf-8") as f:
        LABELS = [line.strip() for line in f.readlines()]

class LocalConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{basedir / 'local.sqlite'}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = True

config = {
    "local" : LocalConfig,
}