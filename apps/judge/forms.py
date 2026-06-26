from flask_wtf.file import FileAllowed, FileField, FileRequired
from flask_wtf.form import FlaskForm
from wtforms.fields.simple import SubmitField


# 画像アップロード用のフォームのもとを作成
class UploadImageForm(FlaskForm):
    # ファイルフィールドに必要なバリデーションを設定する
    image = FileField( # ファイルのアップロード用のフィールドを作成する
        validators=[
            FileRequired("画像ファイルを指定してください。"), # アップロード必須
            FileAllowed(["png", "jpg", "jpeg", "gif"], "サポートされていない画像形式です。"), # アップロードできる画像の拡張子を指定
        ]
    )
    submit = SubmitField("アップロード") # アップロードボタンを作成する

class JudgeForm(FlaskForm): # 物体検知用のフォームのもとを作成する
    submit = SubmitField("検知") # 物体検知の実行ボタンを作成する

class DeleteForm(FlaskForm): # 画像削除用のフォームのもとを作成する
    submit = SubmitField("削除") # 画像削除の実行ボタンを作成する