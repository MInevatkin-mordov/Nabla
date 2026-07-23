import { useNavigate } from "react-router-dom";
import "./Cards.css";

function Cards() {
  const navigate = useNavigate();

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundImage:
      "linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url('/images/backgrounds/cards.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
    boxSizing: "border-box",
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "700px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "25px",
    padding: "45px",
    boxShadow: "0 20px 40px rgba(0,0,0,.45)",
  };

  const titleStyle: React.CSSProperties = {
    color: "white",
    textAlign: "center",
    fontSize: "42px",
    marginBottom: "10px",
  };

  const subtitleStyle: React.CSSProperties = {
    color: "#d6d6d6",
    textAlign: "center",
    fontSize: "18px",
    marginBottom: "35px",
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>🌌 Тренировка по карточкам</h1>

        <p style={subtitleStyle}>
          Проверь, как хорошо ты запомнил объекты каталога Мессье.
        </p>

        <button
          className="cards-start-button"
          onClick={() => navigate("/cards/level1")}
        >
          🚀 Начать прохождение карточек
        </button>

        <div className="cards-bottom-panel">
          <button className="bottom-button" onClick={() => navigate("/")}>
            🏠 Главная
          </button>

          <button
            className="bottom-button"
            onClick={() => navigate("/catalog")}
          >
            📚 Каталог
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cards;
