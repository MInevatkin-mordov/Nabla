import { Link } from "react-router-dom";
import "./ObjectCard.css";

interface ObjectCardProps {
  obj: any;
}

export default function ObjectCard({ obj }: ObjectCardProps) {
  const image =
    obj.image && obj.image.length > 0
      ? obj.image
      : `/images/messier/${obj.messier}.jpg`;

  return (
    <Link
      to={`/catalog/${obj.messier}`}
      className="object-link"
    >
      <div className="object-card">

        {/* Левая часть */}
        <div className="object-info">

          <h1 className="object-number">
            {obj.messier}
          </h1>

          <h2 className="object-name">
            {obj.name || obj.messier}
          </h2>

          <div className="object-type">
            {obj.type || "Неизвестный тип"}
          </div>

          <p className="object-description">
            {obj.description ||
              "Описание объекта пока отсутствует."}
          </p>

          <div className="coords">

            <div className="coord-box">
              <div className="coord-title">
                Прямое восхождение
              </div>

              <div className="coord-value">
                {obj.ra ?? "-"}
              </div>
            </div>

            <div className="coord-box">
              <div className="coord-title">
                Склонение
              </div>

              <div className="coord-value">
                {obj.dec ?? "-"}
              </div>
            </div>

          </div>

        </div>

        {/* Правая часть */}
        <div className="object-image">

          <img
            src={image}
            alt={obj.messier}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "/images/ui/no-image.png";
            }}
          />

        </div>

      </div>
    </Link>
  );
}