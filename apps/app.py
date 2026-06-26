from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import CSRFProtect
from flask_login import LoginManager
from flask import Flask

from apps.config import config

csrf = CSRFProtect()

db = SQLAlchemy()

login_manager = LoginManager()

login_manager.login_view = "auth.signup"
login_manager.login_message = ""

def create_app(config_key="local"):
    app = Flask(__name__)

    app.config.from_object(config[config_key])

    csrf.init_app(app)
    db.init_app(app)
    Migrate(app, db)

    from apps.crud import views as crud_views
    app.register_blueprint(crud_views.crud, url_prefix="/crud")

    from apps.auth import views as auth_views
    app.register_blueprint(auth_views.auth)

    login_manager.init_app(app)

    from apps.judge import views as judge_views
    app.register_blueprint(judge_views.judge, url_prefix="/judge")

    return app