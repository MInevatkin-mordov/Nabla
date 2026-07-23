import json
import pandas as pd

INPUT_FILE = "scripts/NGC.csv"
from pathlib import Path

BASE_DIR = Path(__file__).parent

OUTPUT_FILE = BASE_DIR.parent / "src" / "data" / "catalog.json"

# -----------------------------
# Загрузка OpenNGC
# -----------------------------
df = pd.read_csv(INPUT_FILE, sep=";")

# Только объекты Мессье
df = df[df["Messier"].notna()].copy()

catalog = []


def format_ra(ra):
    if pd.isna(ra):
        return None

    h, m, s = str(ra).split(":")
    return f"{h}h {m}m {s}s"


def format_dec(dec):
    if pd.isna(dec):
        return None

    d, m, s = str(dec).split(":")
    return f"{d}° {m}′ {s}″"


def format_size(major, minor):

    if pd.isna(major):
        return None

    major = float(major)
    minor = float(minor) if pd.notna(minor) else None

    # OpenNGC хранит размеры в угловых минутах
    if minor is None:
        return f"{major:.1f}′"

    return f"{major:.1f}′ × {minor:.1f}′"


for _, row in df.iterrows():

    messier = str(row['Messier']).strip()

    name = row["common_names"]

    if pd.isna(name):
        name = messier

    magnitude = None
    if pd.notna(row["v_mag"]):
        magnitude = float(row["v_mag"])

    obj = {

        "messier": messier,

        "name": name,

        "type": row["Object type"],

        "constellation": row["Constellation"],

        "ra": format_ra(row["ra"]),

        "dec": format_dec(row["dec"]),

        "magnitude": magnitude,

        "distance_pc": None,

        "angular_size": format_size(
            row["Major axis"],
            row["Minor axis"]
        ),

        "image": f"/images/messier/{messier}.jpg"

    }

    catalog.append(obj)

catalog.sort(key=lambda x: int(x["messier"][1:]))

with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        catalog,
        f,
        ensure_ascii=False,
        indent=4
    )

print(f"Готово! Создано {len(catalog)} объектов.")