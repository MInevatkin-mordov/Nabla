import { useState } from "react";
import { useNavigate } from "react-router-dom";
import catalog from "../data/catalog.json";
import "./Level1.css";

/* =========================================================
   ТИПЫ
========================================================= */

type CatalogObj = {
  messier: string;
  name: string;
  type: string;
  constellation: string;
  ra: string;
  dec: string;
  magnitude: number | null;
  distance_pc: number | null;
  angular_size: string | null;
  image: string;
};

type FieldKey =
  | "ra"
  | "dec"
  | "magnitude"
  | "angular_size"
  | "constellation"
  | "messier";

type Mode = 1 | 2;
type Phase = "settings" | "quiz" | "results";

/* =========================================================
   ОПИСАНИЕ ХАРАКТЕРИСТИК
========================================================= */

const FIELD_DEFS: {
  key: FieldKey;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: "ra",
    label: "Прямое восхождение (RA)",
    placeholder: "в градусах, напр. 83.6",
    hint: "Погрешность ±5°",
  },
  {
    key: "dec",
    label: "Склонение (Dec)",
    placeholder: "в градусах, напр. 22.0",
    hint: "Погрешность ±5°",
  },
  {
    key: "magnitude",
    label: "Видимая звёздная величина",
    placeholder: "напр. 8.4",
    hint: "Погрешность ±5%",
  },
  {
    key: "angular_size",
    label: "Угловые размеры",
    placeholder: "в угл. минутах, напр. 8.0",
    hint: "Погрешность ±5%",
  },
  {
    key: "constellation",
    label: "Созвездие (по Байеру)",
    placeholder: "напр. Taurus или Tau",
    hint: "Точное совпадение",
  },
  {
    key: "messier",
    label: "Номер объекта Мессье",
    placeholder: "напр. M1 или 1",
    hint: "Точное совпадение",
  },
];

/* =========================================================
   СОЗВЕЗДИЯ: аббревиатура -> полное имя
========================================================= */

const CONSTELLATIONS: Record<string, string> = {
  And: "Andromeda",
  Aqr: "Aquarius",
  Aur: "Auriga",
  CMa: "Canis Major",
  CVn: "Canes Venatici",
  Cap: "Capricornus",
  Cas: "Cassiopeia",
  Cet: "Cetus",
  Cnc: "Cancer",
  Com: "Coma Berenices",
  Crv: "Corvus",
  Cyg: "Cygnus",
  Dra: "Draco",
  Gem: "Gemini",
  Her: "Hercules",
  Hya: "Hydra",
  Leo: "Leo",
  Lep: "Lepus",
  Lyr: "Lyra",
  Mon: "Monoceros",
  Oph: "Ophiuchus",
  Ori: "Orion",
  Peg: "Pegasus",
  Per: "Perseus",
  Psc: "Pisces",
  Pup: "Puppis",
  Sco: "Scorpius",
  Sct: "Scutum",
  Se1: "Serpens Caput",
  Se2: "Serpens Cauda",
  Sge: "Sagitta",
  Sgr: "Sagittarius",
  Tau: "Taurus",
  Tri: "Triangulum",
  UMa: "Ursa Major",
  Vir: "Virgo",
  Vul: "Vulpecula",
};

/* =========================================================
   ПАРСИНГ АСТРОНОМИЧЕСКИХ ФОРМАТОВ
========================================================= */

function parseFirstNumber(str: string | null | undefined): number | null {
  if (!str) return null;
  const m = String(str).match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function raToDegrees(ra: string | null | undefined): number | null {
  if (!ra) return null;
  const m = ra.match(
    /(\d+(?:\.\d+)?)h\s*(\d+(?:\.\d+)?)m\s*(\d+(?:\.\d+)?)s/i
  );
  if (!m) return null;
  const h = parseFloat(m[1]);
  const mi = parseFloat(m[2]);
  const s = parseFloat(m[3]);
  return (h + mi / 60 + s / 3600) * 15;
}

function decToDegrees(dec: string | null | undefined): number | null {
  if (!dec) return null;
  const m = dec.match(
    /([+-]?\d+(?:\.\d+)?)[°]\s*(\d+(?:\.\d+)?)['′]\s*(\d+(?:\.\d+)?)["″]/
  );
  if (!m) return null;
  const sign = m[1].trim().startsWith("-") ? -1 : 1;
  const d = Math.abs(parseFloat(m[1]));
  const mi = parseFloat(m[2]);
  const s = parseFloat(m[3]);
  return sign * (d + mi / 60 + s / 3600);
}

/* =========================================================
   ПРОВЕРКА ОТВЕТА / ОТОБРАЖЕНИЕ ПРАВИЛЬНОГО ОТВЕТА
========================================================= */

function checkAnswer(
  key: FieldKey,
  userValue: string,
  obj: CatalogObj
): boolean {
  const guessRaw = (userValue ?? "").trim();
  if (!guessRaw) return false;

  switch (key) {
    case "ra": {
      const actual = raToDegrees(obj.ra);
      const guess = parseFloat(guessRaw);
      if (actual === null || isNaN(guess)) return false;
      let diff = Math.abs(guess - actual);
      diff = Math.min(diff, 360 - diff);
      return diff <= 5;
    }
    case "dec": {
      const actual = decToDegrees(obj.dec);
      const guess = parseFloat(guessRaw);
      if (actual === null || isNaN(guess)) return false;
      return Math.abs(guess - actual) <= 5;
    }
    case "magnitude": {
      const actual = obj.magnitude;
      const guess = parseFloat(guessRaw);
      if (actual === null || actual === undefined || isNaN(guess))
        return false;
      const tolerance = Math.max(Math.abs(actual) * 0.05, 0.05);
      return Math.abs(guess - actual) <= tolerance;
    }
    case "angular_size": {
      const actual = parseFirstNumber(obj.angular_size);
      const guess = parseFloat(guessRaw);
      if (actual === null || isNaN(guess)) return false;
      const tolerance = Math.max(actual * 0.05, 0.05);
      return Math.abs(guess - actual) <= tolerance;
    }
    case "constellation": {
      const code = String(obj.constellation ?? "").trim().toLowerCase();
      const full = (CONSTELLATIONS[obj.constellation] ?? "")
        .trim()
        .toLowerCase();
      const guess = guessRaw.toLowerCase();
      return guess === code || (full !== "" && guess === full);
    }
    case "messier": {
      const norm = (s: string) => s.replace(/[^0-9]/g, "");
      const g = norm(guessRaw);
      return g !== "" && g === norm(obj.messier);
    }
  }
}

function actualDisplay(key: FieldKey, obj: CatalogObj): string {
  switch (key) {
    case "ra": {
      const deg = raToDegrees(obj.ra);
      return deg !== null ? `${obj.ra}  (≈ ${deg.toFixed(1)}°)` : obj.ra;
    }
    case "dec": {
      const deg = decToDegrees(obj.dec);
      return deg !== null ? `${obj.dec}  (≈ ${deg.toFixed(1)}°)` : obj.dec;
    }
    case "magnitude":
      return obj.magnitude !== null && obj.magnitude !== undefined
        ? `${obj.magnitude}ᵐ`
        : "нет данных";
    case "angular_size":
      return obj.angular_size ?? "нет данных";
    case "constellation": {
      const full = CONSTELLATIONS[obj.constellation];
      return full ? `${full} (${obj.constellation})` : obj.constellation;
    }
    case "messier":
      return obj.messier;
  }
}

function hasValue(key: FieldKey, obj: CatalogObj): boolean {
  switch (key) {
    case "ra":
      return raToDegrees(obj.ra) !== null;
    case "dec":
      return decToDegrees(obj.dec) !== null;
    case "magnitude":
      return obj.magnitude !== null && obj.magnitude !== undefined;
    case "angular_size":
      return parseFirstNumber(obj.angular_size) !== null;
    case "constellation":
      return !!obj.constellation;
    case "messier":
      return !!obj.messier;
  }
}

/* =========================================================
   СЛУЧАЙНАЯ ВЫБОРКА
========================================================= */

function sampleObjects(source: CatalogObj[], n: number): CatalogObj[] {
  const arr = [...source];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

/* =========================================================
   КОМПОНЕНТ
========================================================= */

function Level1() {
  const navigate = useNavigate();
  const data = catalog as CatalogObj[];

  const [phase, setPhase] = useState<Phase>("settings");

  const [selectedFields, setSelectedFields] = useState<
    Record<FieldKey, boolean>
  >({
    ra: true,
    dec: true,
    magnitude: true,
    angular_size: true,
    constellation: true,
    messier: true,
  });

  const [mode, setMode] = useState<Mode>(1);
  const [count, setCount] = useState(10);

  const [quizObjects, setQuizObjects] = useState<CatalogObj[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState<
    Record<string, string>
  >({});
  const [allAnswers, setAllAnswers] = useState<Record<string, string>[]>([]);

  const activeFieldKeys = FIELD_DEFS.filter(
    (f) => selectedFields[f.key]
  ).map((f) => f.key);

  const anyFieldSelected = activeFieldKeys.length > 0;

  function toggleField(key: FieldKey) {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleStart() {
    if (count === 0 || !anyFieldSelected) return;
    const objs = sampleObjects(data, count);
    setQuizObjects(objs);
    setCurrentIndex(0);
    setCurrentAnswers({});
    setAllAnswers([]);
    setPhase("quiz");
  }

  function handleAnswerChange(key: FieldKey, value: string) {
    setCurrentAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    const updated = [...allAnswers, currentAnswers];
    if (currentIndex + 1 < quizObjects.length) {
      setAllAnswers(updated);
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswers({});
    } else {
      setAllAnswers(updated);
      setPhase("results");
    }
  }

  /* ---------- РЕЗУЛЬТАТЫ ---------- */

  let totalChecked = 0;
  let totalCorrect = 0;

  if (phase === "results") {
    quizObjects.forEach((obj) => {
      activeFieldKeys.forEach((key) => {
        if (!hasValue(key, obj)) return;
        totalChecked += 1;
      });
    });
  }

  /* =========================================================
     ЭКРАН 1 — НАСТРОЙКИ
  ========================================================= */

  if (phase === "settings") {
    return (
      <div className="level1-page">
        <div className="level1-window">
          <h1>Уровень 1</h1>
          <p className="subtitle">
            Выбери, что хочешь тренировать, и начни изучение объектов
            Мессье
          </p>

          <h2>Что спрашивать</h2>
          <div className="fields-grid">
            {FIELD_DEFS.map((f) => (
              <label key={f.key}>
                <input
                  type="checkbox"
                  checked={selectedFields[f.key]}
                  onChange={() => toggleField(f.key)}
                />
                {f.label}
              </label>
            ))}
          </div>

          <h2>Режим</h2>
          <div className="mode-buttons">
            <button
              type="button"
              className={mode === 1 ? "selected" : ""}
              onClick={() => setMode(1)}
            >
              🖼️ Режим 1 — по фото
            </button>
            <button
              type="button"
              className={mode === 2 ? "selected" : ""}
              onClick={() => setMode(2)}
            >
              🔤 Режим 2 — по названию
            </button>
          </div>

          <h2>Количество карточек</h2>
          <input
            className="slider"
            type="range"
            min={0}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <div className="count">{count}</div>

          <button
            className="start-button"
            disabled={count === 0 || !anyFieldSelected}
            onClick={handleStart}
          >
            Начать
          </button>

          <button className="back-button" onClick={() => navigate("/cards")}>
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     ЭКРАН 2 — КАРТОЧКИ
  ========================================================= */

  if (phase === "quiz") {
    const obj = quizObjects[currentIndex];

    return (
      <div className="level1-page">
        <div className="level1-window">
          <div className="quiz-progress">
            Карточка {currentIndex + 1} из {quizObjects.length}
          </div>

          {mode === 1 ? (
            <img
              className="quiz-image"
              src={obj.image}
              alt="Объект Мессье"
              onError={(e) => {
                e.currentTarget.src =
                  "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
              }}
            />
          ) : (
            <div className="quiz-name">{obj.name}</div>
          )}

          <form onSubmit={handleNext}>
            <div className="quiz-fields">
              {activeFieldKeys.map((key) => {
                const def = FIELD_DEFS.find((f) => f.key === key)!;
                if (!hasValue(key, obj)) {
                  return (
                    <div className="field-row" key={key}>
                      <label>{def.label}</label>
                      <div className="field-nodata">
                        нет данных для этого объекта
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="field-row" key={key}>
                    <label>
                      {def.label}
                      <span className="field-hint">{def.hint}</span>
                    </label>
                    <input
                      type="text"
                      placeholder={def.placeholder}
                      value={currentAnswers[key] ?? ""}
                      onChange={(e) =>
                        handleAnswerChange(key, e.target.value)
                      }
                    />
                  </div>
                );
              })}
            </div>

            <button className="start-button" type="submit">
              {currentIndex + 1 < quizObjects.length
                ? "Далее →"
                : "Завершить"}
            </button>
          </form>

          <button className="back-button" onClick={() => navigate("/cards")}>
            ✕ Выйти из тренировки
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     ЭКРАН 3 — РЕЗУЛЬТАТЫ
  ========================================================= */

  return (
    <div className="level1-page">
      <div className="level1-window">
        <h1>Результаты</h1>

        <div className="results-list">
          {quizObjects.map((obj, i) => {
            const answers = allAnswers[i] ?? {};
            return (
              <div className="result-card" key={obj.messier + i}>
                <div className="result-card-header">
                  <span>#{i + 1}</span>
                  <strong>{obj.messier}</strong>
                  <span className="result-card-name">{obj.name}</span>
                </div>

                {activeFieldKeys.map((key) => {
                  if (!hasValue(key, obj)) return null;
                  const def = FIELD_DEFS.find((f) => f.key === key)!;
                  const userValue = answers[key] ?? "";
                  const correct = checkAnswer(key, userValue, obj);
                  if (correct) totalCorrect += 1;

                  return (
                    <div
                      className={
                        "result-row " + (correct ? "correct" : "incorrect")
                      }
                      key={key}
                    >
                      <span className="result-icon">
                        {correct ? "✅" : "❌"}
                      </span>
                      <span className="result-label">{def.label}</span>
                      <span className="result-answer">
                        Твой ответ: {userValue.trim() ? userValue : "—"}
                      </span>
                      <span className="result-correct">
                        Верно: {actualDisplay(key, obj)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="score-summary">
          Правильно: {totalCorrect} из {totalChecked}
        </div>

        <button className="start-button" onClick={() => setPhase("settings")}>
          Пройти ещё раз
        </button>
        <button className="back-button" onClick={() => navigate("/cards")}>
          ← К выбору уровня
        </button>
      </div>
    </div>
  );
}

export default Level1;
