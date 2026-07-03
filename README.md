vscode と github の連携手順

まずgitがインストールされているか、
git --version　で確認

GitHubにログインする

リポジトリ　→　Code　→　HTTPSのURLをコピー

vscodeを起動し、仮想環境に入る前に
git clone リポジトリURL

ファイルができたことを確認し、
仮想環境を作る
python -m venv venv　で作って、
activate.ps1で仮想環境に入った後、
pip install -r requirements.txt　を実行すれば、
teachable machineが動かせる環境が揃う

Ctrl + Shift + P　で　.venv　を選択する


git関連のコマンド
  git add . # 「.」大事　変更したファイルをすべて追加
  git status  # 変更を確認
  git commit -m "メッセージ" # コミット
  git push origin main # Githubへ反映
  
  git pull --rebase origin main # Githubから取得


アプリの起動コマンド
   python -m flask --app apps.app run
   
7/3　西本
teachable machineで作ったモデルでの検知ができるようになりました。
モデルはgitにあげられないので、teamsかどっかに置いて、そこから各自で置く必要があります
モデルの置き場所は、TrashJudge/apps/に、modelフォルダーを作って、.h5ファイルと、labels.txtを入れてください

仮想環境にインストールしたものの中で、互換性がなく動かせないものがあったので、バージョンを変えてインストールしなおしてます
git pull --rebase origin main　で最新のものを持ってきた後、
もう一度　pip install -r requirements.txtを実行してください
