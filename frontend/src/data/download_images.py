import json
import os
import time
import requests

# -------------------------------
# Настройки
# -------------------------------

CATALOG = "src/data/catalog_raw.json"
OUTPUT = "public/images/messier"

os.makedirs(OUTPUT, exist_ok=True)

URL = "https://alasky.cds.unistra.fr/hips-image-services/hips2fits"

HEADERS = {
    "User-Agent": "Nabla Astronomy Catalog"
}

# Красивый цветной обзор DSS2
SURVEY = "CDS/P/DSS2/color"

# Размер изображения
WIDTH = 700
HEIGHT = 700

# Поле зрения (градусы)
FOV = 0.45


# -------------------------------
# Загрузка каталога
# -------------------------------

with open(CATALOG, encoding="utf-8") as f:
    catalog = json.load(f)


# -------------------------------
# Загрузка изображений
# -------------------------------

for obj in catalog:

    messier = obj["messier"]

    ra = obj["ra"]
    dec = obj["dec"]

    filename = os.path.join(
        OUTPUT,
        f"{messier}.jpg"
    )

    if os.path.exists(filename):
        print(f"{messier} уже существует")
        continue

    params = {

        "hips": SURVEY,

        "width": WIDTH,

        "height": HEIGHT,

        "projection": "SIN",

        "coordsys": "icrs",

        "ra": ra,

        "dec": dec,

        "fov": FOV,

        "format": "jpg"

    }

    try:

        print(f"Скачивание {messier}...")

        r = requests.get(
            URL,
            params=params,
            headers=HEADERS,
            timeout=60
        )

        if r.status_code == 200:

            with open(filename, "wb") as img:
                img.write(r.content)

            print(f"✓ {messier}")

        else:

            print(f"Ошибка {messier}: {r.status_code}")

    except Exception as e:

        print(f"{messier}: {e}")

    time.sleep(1)

print("Готово.")