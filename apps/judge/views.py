from apps.app import db
from apps.crud.models import User
from apps.judge.models import UserImage, UserImageTag
from flask import Blueprint, render_template, current_app, send_from_directory, redirect, url_for, flash, request
from flask_login import login_required, current_user
import uuid
from pathlib import Path
from .forms import UploadImageForm, JudgeForm, DeleteForm
import random
from PIL import Image
import numpy as np
import tensorflow as tf

judge = Blueprint(
    "judge",
    __name__,
    template_folder="templates",
    )


@judge.route("/")
def index():
    user_images = (
        db.session.query(User, UserImage)
        .join(UserImage, User.id == UserImage.user_id)
        .filter(User.id == current_user.id)
        .all()
    )

    user_image_tag_dict = {}
    for user_image in user_images:
        user_image_tags = (
            db.session.query(UserImageTag)
            .filter(UserImageTag.user_image_id == user_image.UserImage.id)
            .all()
        )
        user_image_tag_dict[user_image.UserImage.id] = user_image_tags

    judge_form = JudgeForm()
    delete_form = DeleteForm()

    return render_template(
        "judge/index.html",
        user_images=user_images,
        user_image_tag_dict=user_image_tag_dict,
        judge_form=judge_form,
        delete_form=delete_form
    )

@judge.route("/images/<path:filename>")
def image_file(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)


@judge.route("/upload", methods=["GET", "POST"])
@login_required
def upload_image():
    form = UploadImageForm()
    if form.validate_on_submit():
        file = form.image.data

        ext = Path(file.filename).suffix
        image_uuid_file_name = str(uuid.uuid4()) + ext
        image_path = Path(current_app.config["UPLOAD_FOLDER"], image_uuid_file_name)
        file.save(image_path)

        user_image = UserImage(user_id=current_user.id, image_path=image_uuid_file_name)
        db.session.add(user_image)
        db.session.commit()

        return redirect(url_for("judge.index"))
    return render_template("judge/upload.html", form=form)


def exec_detect(target_image_path):
    labels = current_app.config["LABELS"]

    image = Image.open(target_image_path).convert("RGB")
    image = image.resize((224,224))
    image_array = np.asarray(image)
    image_array = image_array.astype(np.float32)
    image_array = np.expand_dims(image_array, axis=0)

    model = tf.keras.models.load_model(
        current_app.config["MODEL_PATH"],
        compile=False
    )
    
    prediction = model.predict(image_array)

    index = np.argmax(prediction)
    tag = labels[index]

    return tag

def save_detected_image_tag(user_image, tag):
    user_image.is_detected = True
    db.session.add(user_image)

    user_image_tag = UserImageTag(user_image_id=user_image.id, tag_name=tag)
    db.session.add(user_image_tag)

    db.session.commit()

@judge.route("/judge/<string:image_id>", methods=["POST"])
@login_required
def detect(image_id):
    user_image = db.session.query(UserImage).filter(UserImage.id == image_id).first()
    if user_image is None:
        flash("物体検知対象の画像が存在しません。")
        return redirect(url_for("judge.index"))

    target_image_path = Path(current_app.config["UPLOAD_FOLDER"], user_image.image_path)
    tag = exec_detect(target_image_path)

    try:
        save_detected_image_tag(user_image, tag)
    except Exception as e:
        flash("物体検知処理でエラーが発生しました。")
        db.session.rollback()
        current_app.logger.error(e)
        return redirect(url_for("judge.index"))
    return redirect(url_for("judge.index"))

@judge.route("/images/delete/<string:image_id>", methods=["POST"])
@login_required
def delete_image(image_id):
    try:
        db.session.query(UserImageTag).filter(
            UserImageTag.user_image_id == image_id
        ).delete()

        db.session.query(UserImage).filter(UserImage.id == image_id).delete()

        db.session.commit()
    except Exception as e:
        flash("画像削除処理でエラーが発生しました。")
        current_app.logger.error(e)
        db.session.rollback()
    return redirect(url_for("judge.index"))


@judge.route("/images/search", methods=["GET"])
def search():
    user_images = db.session.query(User, UserImage).join(
        UserImage, User.id == UserImage.user_id
    )

    search_text = request.args.get("search")

    user_image_tag_dict = {}
    filtered_user_images = []

    for user_image in user_images:
        if not search_text:
            user_image_tags = (
                db.session.query(UserImageTag)
                .filter(UserImageTag.user_image_id == user_image.UserImage.id)
                .all()
            )
        else:
            user_image_tags = (
                db.session.query(UserImageTag)
                .filter(UserImageTag.user_image_id == user_image.UserImage.id)
                .filter(UserImageTag.tag_name.like("%" + search_text + "%"))
                .all()
            )

            if not user_image_tags:
                continue

            user_image_tags = (
                db.session.query(UserImageTag)
                .filter(UserImageTag.user_image_id == user_image.UserImage.id)
                .all()
            )

        user_image_tag_dict[user_image.UserImage.id] = user_image_tags

        filtered_user_images.append(user_image)

    delete_form = DeleteForm()
    judge_form = JudgeForm()

    return render_template(
        "judge/index.html",
        user_images=filtered_user_images,
        user_image_tag_dict=user_image_tag_dict,
        delete_form=delete_form,
        judge_form=judge_form,
    )