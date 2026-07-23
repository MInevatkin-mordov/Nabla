import "./Home.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home">

      <aside className="sidebar">

        <div className="logo">
          🌌
          <div>
            <h2>DeepSkyAtlas</h2>
            <p>Энциклопедия космоса</p>
          </div>
        </div>

        <nav>

          <button>🏠 Главная</button>

          <Link to="/catalog" style={{ textDecoration: "none" }}>
            <button>🔭 Каталог объектов</button>
          </Link>

          <button>🎓 Обучение</button>
          <button>🎮 Викторина</button>
          <button>⭐ Избранное</button>
          <button>📊 Статистика</button>
          <button>⚖️ Сравнение</button>
          <button>⚙️ Настройки</button>

        </nav>

      </aside>

      <main className="content">

        <header className="header">

          <h1>DeepSkyAtlas</h1>

          <p>
            Энциклопедия объектов глубокого космоса
          </p>

        </header>

        <section className="cards">

          <Link
            to="/catalog"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="card">
              <h2>🔭 Каталог</h2>
              <p>Более 100 000 объектов</p>
            </div>
          </Link>

          <div className="card">
            <h2>🎓 Обучение</h2>
            <p>Изучи Вселенную</p>
          </div>

          <div className="card">
            <h2>🎮 Викторина</h2>
            <p>Проверь знания</p>
          </div>

          <div className="card">
            <h2>⭐ Избранное</h2>
            <p>Любимые объекты</p>
          </div>

          <div className="card">
            <h2>📊 Статистика</h2>
            <p>Ваш прогресс</p>
          </div>

          <div className="card">
            <h2>⚖️ Сравнение</h2>
            <p>Сравнение объектов</p>
          </div>

        </section>

      </main>

    </div>
  );
}

export default Home;