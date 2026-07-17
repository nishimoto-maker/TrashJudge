from flask import render_template, Blueprint
from flask_login import login_required
# import webbrowser
# import threading

game = Blueprint(
    "game",
    __name__,
    template_folder="templates",
    static_folder="static"
)

@game.route("/")
@login_required
def index():
    return render_template("gameform.html")

@game.route("/game_exe")
@login_required
def game_exe():
    return render_template("index.html")

# # ブラウザを開く関数
# def open_browser():
#     webbrowser.open("http://127.0.0.1:5000/")

# if __name__ == "__main__":
#     threading.Timer(1.0, open_browser).start()
#     app.run(debug=True, use_reloader=False)