import { Link } from "react-router-dom";
import { useState } from "react";
import catalog from "../data/catalog.json";
import "./Catalog.css";
import { useNavigate } from "react-router-dom";

function Catalog() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
const [filters, setFilters] = useState({
  galaxy: false,
  nebula: false,
  globular: false,
  open: false,
  planetary: false,
  other: false,
});
  const filtered = catalog.filter((obj: any) => {

  const text = search.toLowerCase();

  const matchesSearch =
    obj.messier.toLowerCase().includes(text) ||
    obj.name.toLowerCase().includes(text);

  let matchesFilter = true;

  const anyFilter =
    filters.galaxy ||
    filters.nebula ||
    filters.globular ||
    filters.open ||
    filters.planetary ||
    filters.other;

  if (anyFilter) {

    matchesFilter = false;

    const type = String(obj.type).toLowerCase();

    if (
      filters.galaxy &&
      type.includes("galaxy")
    )
      matchesFilter = true;

    if (
      filters.nebula &&
      (
        type.includes("nebula") ||
        type.includes("snr")
      )
    )
      matchesFilter = true;

    if (
      filters.globular &&
      (
        type.includes("globular") ||
        type.includes("glc")
      )
    )
      matchesFilter = true;

    if (
  filters.open &&
  (
    type.includes("open") ||
    type.includes("open cluster") ||
    type.includes("opc")
  )
)
  matchesFilter = true;
    

    if (filters.other) {

  const knownTypes = [
    "galaxy",
    "nebula",
    "Supernova remnant",
    "Globular Cluster",
    "glc",
    "open cluster",
    "open ",
    "opc",
    "planetary",
    "pn"
  ];

const isKnown = knownTypes.some(t => type.includes(t));

if (isKnown == false) {
    matchesFilter = true;
} else {
    matchesFilter = false;
}
}

    if (
      filters.planetary &&
      (
        type.includes("planetary") ||
        type.includes("pn")
      )
    )
      matchesFilter = true;


  }

  return matchesSearch && matchesFilter;

});

  return (
    <div className="catalog-layout">

      {/* ========================= */}
      {/* Левая панель */}
      {/* ========================= */}

      <aside className="left-panel">

        <div className="logo">

          <h1>NABLA</h1>

          <p>Astronomy Explorer</p>

        </div>

        <nav>

          <button
    className="side-button"
    onClick={() => navigate("/")}
>
    🏠 Главная
</button>

          <button className="side-button active">
            🌌 Каталог
          </button>

          <button
    className="side-button"
    onClick={() => navigate("/favorites")}
>
    ⭐ Избранное
</button>

          <button
    className="side-button"
    onClick={() => navigate("/sky-map")}
>
    ✨ Карта неба
</button>

<button
    className="side-button"
    onClick={() => navigate("/cards")}
>
    🗂️ Карточки
</button>


          <button
    className="side-button"
    onClick={() => navigate("/settings")}
>
    🛠️ Настройки
</button>
        </nav>

      </aside>

      {/* ========================= */}
      {/* Центр */}
      {/* ========================= */}

      <main className="catalog-page">

        <div className="catalog-header">

          <div>

            <h1>Каталог объектов Мессье</h1>

            <p>

              Исследуйте все объекты каталога Мессье.

            </p>

          </div>

          <div className="catalog-count">

            {filtered.length} объектов

          </div>

        </div>

        <input

          className="search-input"

          type="text"

          placeholder="🔍 Поиск по номеру или названию..."

          value={search}

          onChange={(e) => setSearch(e.target.value)}

        />

        <div className="catalog-grid">

{filtered.map((obj: any) => (
  <Link
    key={obj.messier}
    to={`/catalog/${obj.messier}`}
    className="catalog-link"
  >
    <div className="catalog-card">

      <img
        src={`/images/messier/${obj.messier}.jpg`}
        alt={obj.name}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src =
            "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
        }}
      />

      <div className="catalog-title">
        {obj.messier}
      </div>

    </div>
  </Link>
))}

        </div>

      </main>

      {/* ========================= */}
      {/* Правая панель */}
      {/* ========================= */}

      <aside className="right-panel">

        <h2>Фильтры</h2>

        <div className="filter-box">

          <label>

  <input
    type="checkbox"
    checked={filters.galaxy}
    onChange={(e) =>
      setFilters({
        ...filters,
        galaxy: e.target.checked,
      })
    }
  />

  Галактики

</label>

          <label>

            <input
  type="checkbox"
  checked={filters.nebula}
  onChange={(e) =>
    setFilters({
      ...filters,
      nebula: e.target.checked,
    })
  }
/>

            Туманности

          </label>

          <label>

            <input
  type="checkbox"
  checked={filters.globular}
  onChange={(e) =>
    setFilters({
      ...filters,
      globular: e.target.checked,
    })
  }
/>

            Шаровые скопления

          </label>

          <label>

            <input
  type="checkbox"
  checked={filters.open}
  onChange={(e) =>
    setFilters({
      ...filters,
      open: e.target.checked,
    })
    
  }
/>

            Рассеянные скопления

          </label>

          <label>

            <input
  type="checkbox"
  checked={filters.planetary}
  onChange={(e) =>
    setFilters({
      ...filters,
      planetary: e.target.checked,
    })
  }
/>

            Планетарные

          </label>

          <label>

            <input
  type="checkbox"
  checked={filters.other}
  onChange={(e) =>
    setFilters({
      ...filters,
      other: e.target.checked,
    })
  }
/>

            Прочее

          </label>

        </div>

        

      </aside>

    </div>
  );
}

export default Catalog;