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
  git add  # ファイルを追加
  git status  # 変更を確認
  git commit -m "メッセージ" # コミット
  git push # Githubへ反映
  
  git pull # Githubから取得
