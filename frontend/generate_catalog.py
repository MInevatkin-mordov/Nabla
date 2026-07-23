import json
import time
import requests

# =====================================================
# НАСТРОЙКИ
# =====================================================

SIMBAD_URL = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync"

HEADERS = {
    "User-Agent": "MessierCatalogGenerator/1.0"
}

OUTPUT = "src/data/catalog_raw.json"

# =====================================================
# СПИСОК ОБЪЕКТОВ
# =====================================================

MESSIER = [f"M{i}" for i in range(1, 111)]

catalog = []

# =====================================================
# ЗАГРУЗКА
# =====================================================

for obj in MESSIER:
    print(f"Получение {obj}")

    query = f"""
SELECT
    main_id,
    ra,
    dec,
    otype_txt
FROM basic
JOIN ident
ON basic.oid=ident.oidref
WHERE id='{obj}'
"""

    params = {
        "request": "doQuery",
        "lang": "adql",
        "format": "json",
        "query": query
    }

    try:
        r = requests.post(
            SIMBAD_URL,
            data=params,
            headers=HEADERS,
            timeout=30
        )

        r.raise_for_status()

        data = r.json()

        if data.get("data"):
            row = data["data"][0]

            catalog.append({
                "messier": obj,
                "name": row[0],
                "ra": row[1],
                "dec": row[2],
                "type": row[3]
            })

            print("OK")

        else:
            print("Не найден")

    except Exception as e:
        print(e)

    time.sleep(0.5)

# =====================================================
# СОХРАНЕНИЕ
# =====================================================

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(
        catalog,
        f,
        ensure_ascii=False,
        indent=2
    )

print("=" * 40)
print("Готово")
print("Объектов:", len(catalog))
print("Файл:", OUTPUT)