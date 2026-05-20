# UNITE ランダムドラフトオーバーレイ

ポケモンユナイト配信向けの OBS ブラウザソース用オーバーレイ。
ロール条件・グローバルBANを設定し、ランダム抽選 → クリックでドラフト形式に配置できる。

## 🎬 OBS への導入方法 (最も簡単)

1. OBS で「ソースを追加」→「ブラウザ」を選択
2. URL に下記を入力:
   ```
   https://omoikomi.github.io/unite-random-draft/
   ```
3. 幅 `1920` / 高さ `1080` / FPS `60` を推奨
4. 「OBSで操作を行う」にチェックを入れるとクリック可能になる

それだけ。Pythonも画像準備も不要。

## 操作

### 条件設定画面
- **Pick Count** … 抽選数 (1〜)
- **Role** … ロール選択 (複数可、デフォルト全て)
- **Global BAN** … 出さないポケモンを事前に指定 (残り抽選候補が PickCount を下回らない範囲)
- **スタート** … ドラフト画面へ

### ドラフト画面
- プールのポケモンをクリックで上下スロットへ順次配置
- **リセット** … 配置を初期化 (抽選結果は維持)
- **再抽選** … 同条件で新しくランダム抽選
- **条件へ戻る** … 設定画面へ

#### スロット配置順
| 選択順 | 配置先 |
|---|---|
| 1, 4, 5, 8, 9 | 上 |
| 2, 3, 6, 7, 10 | 下 |

抽選数が 10 未満のときは上行のみで 1〜N の順番に配置。

---

## 🛠 自前で改造・ホスティングする場合

### ローカル開発
```
git clone https://github.com/omoikomi/unite-random-draft.git
cd unite-random-draft
# ローカルWebサーバで起動
python -m http.server 8000
# → http://localhost:8000
```

### 構成
```
├─ index.html        # エントリ
├─ style.css         # スタイル
├─ app.js            # ロジック
├─ data/pokemon.json # 画像一覧 (自動生成)
├─ assets/characters # キャラ画像
└─ scripts/build_assets.py
```

### 画像差し替え
1. `assets/characters/` に `_<Atk|Def|Spd|Sup|Bal>_<Name>.<ext>` 形式の画像を置く
2. `data/pokemon.json` を編集 (もしくは `python scripts/build_assets.py` で自動生成)

ファイル名に含まれる `Atk` / `Def` / `Spd` / `Sup` / `Bal` でロールを判別する。

## ライセンス
ポケモン関連の画像・名称は © Nintendo / The Pokémon Company / TiMi Studios。
本リポジトリの非画像コード部分は MIT。
