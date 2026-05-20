# -*- coding: utf-8 -*-
"""
リネーム済みポケモン画像を assets/characters/ にコピーし、data/pokemon.json を生成。

入力フォルダ:
    C:\\Users\\想井込美\\マイドライブ\\動画制作用\\ユナイトキャラクター画像
出力:
    ./assets/characters/<file>
    ./data/pokemon.json  (一覧)

ファイル名規約: _<Atk|Def|Spd|Sup|Bal>_<Name>.<ext>
"""
import json
import os
import re
import shutil

SRC = r"C:\Users\想井込美\マイドライブ\動画制作用\ユナイトキャラクター画像"
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST_DIR = os.path.join(HERE, "assets", "characters")
JSON_PATH = os.path.join(HERE, "data", "pokemon.json")

ROLE_RE = re.compile(r"_(Atk|Def|Spd|Sup|Bal)_", re.IGNORECASE)
IMG_EXTS = {".png", ".jpg", ".jpeg", ".jfif", ".webp"}


def main() -> None:
    os.makedirs(DST_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)

    if not os.path.isdir(SRC):
        print(f"SRC not found: {SRC}")
        return

    entries = []
    skipped = []
    for fn in sorted(os.listdir(SRC)):
        ext = os.path.splitext(fn)[1].lower()
        if ext not in IMG_EXTS:
            continue
        m = ROLE_RE.search(fn)
        if not m:
            skipped.append((fn, "no role tag"))
            continue
        role = m.group(1).capitalize()  # Atk Def Spd Sup Bal
        name = re.sub(r"\.[^.]+$", "", fn)
        name = ROLE_RE.sub("", name).strip("_")

        src = os.path.join(SRC, fn)
        dst = os.path.join(DST_DIR, fn)
        try:
            if not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst):
                shutil.copy2(src, dst)
        except Exception as e:
            skipped.append((fn, f"copy err: {e}"))
            continue

        entries.append({
            "file": fn,
            "name": name,
            "role": role,
        })

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    by_role: dict[str, int] = {}
    for e in entries:
        by_role[e["role"]] = by_role.get(e["role"], 0) + 1
    print(f"Copied {len(entries)} files -> {DST_DIR}")
    print(f"Manifest -> {JSON_PATH}")
    print(f"By role: {by_role}")
    if skipped:
        print(f"Skipped ({len(skipped)}):")
        for fn, why in skipped:
            print(f"  [{why}] {fn}")


if __name__ == "__main__":
    main()
