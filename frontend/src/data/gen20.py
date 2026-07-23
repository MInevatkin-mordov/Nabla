import requests
import time
from pathlib import Path

SAVE_DIR = Path("public/images/messier")
SAVE_DIR.mkdir(parents=True, exist_ok=True)

NASA_API = "https://images-api.nasa.gov/search"

HEADERS = {
    "User-Agent": "Nabla Downloader"
}

MESSIER = {
    "M1": "Crab Nebula",
    "M2": "Messier 2",
    "M3": "Messier 3",
    "M4": "Messier 4",
    "M5": "Messier 5",
    "M6": "Butterfly Cluster",
    "M7": "Ptolemy Cluster",
    "M8": "Lagoon Nebula",
    "M9": "Messier 9",
    "M10": "Messier 10",
    "M11": "Wild Duck Cluster",
    "M12": "Messier 12",
    "M13": "Hercules Globular Cluster",
    "M14": "Messier 14",
    "M15": "Messier 15",
    "M16": "Eagle Nebula",
    "M17": "Omega Nebula",
    "M18": "Messier 18",
    "M19": "Messier 19",
    "M20": "Trifid Nebula"
}


def search_nasa(query):

    try:

        r = requests.get(
            NASA_API,
            params={
                "q": query,
                "media_type": "image"
            },
            headers=HEADERS,
            timeout=30
        )

        r.raise_for_status()

        data = r.json()

        return data.get("collection", {}).get("items", [])

    except Exception as e:

        print("NASA:", e)
        return []


def get_image_url(item):

    try:

        href = item["href"]

        r = requests.get(
            href,
            headers=HEADERS,
            timeout=30
        )

        r.raise_for_status()

        files = r.json()

        for url in files:

            url = url.lower()

            if url.endswith(".jpg") or url.endswith(".jpeg"):
                return url

        return None

    except Exception as e:

        print(e)
        return None


def download(url, filename):

    try:

        r = requests.get(
            url,
            headers=HEADERS,
            stream=True,
            timeout=120
        )

        r.raise_for_status()

        with open(filename, "wb") as f:

            for chunk in r.iter_content(8192):

                if chunk:
                    f.write(chunk)

        return True

    except Exception as e:

        print(e)
        return False


print("=" * 50)
print("Загрузка изображений NASA")
print("=" * 50)

count = 0

for messier, query in MESSIER.items():

    print(messier)

    items = search_nasa(query)

    if not items:
        print("Не найдено")
        continue

    image = None

    for item in items:

        image = get_image_url(item)

        if image:
            break

    if image is None:
        print("Нет изображения")
        continue

    filename = SAVE_DIR / f"{messier}.jpg"

    if download(image, filename):

        count += 1
        print("OK")

    else:

        print("Ошибка")

    time.sleep(1)

print()
print("=" * 50)
print("Скачано:", count)
print("=" * 50)