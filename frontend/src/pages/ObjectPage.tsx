import { Link, useParams } from "react-router-dom";
import catalog from "../data/catalog.json";
import "./ObjectPage.css";

export default function ObjectPage() {
  const { messier } = useParams();

  const obj = (catalog as any[]).find((o) => o.messier === messier);

  if (!obj) {
    return <h2>Объект не найден</h2>;
  }

  return (
    <div
      className="object-page"
      style={{
        backgroundImage: "url('/backgrounds/card_bg.jpg')",
      }}
    >
      <Link className="back-link" to="/catalog">
        ← Назад к каталогу
      </Link>

      <div className="object-card">

        <div className="object-info">
          <h1>{obj.messier}</h1>

          <table>
            <tbody>
              <tr>
                <td>Тип</td>
                <td>{obj.type || "-"}</td>
              </tr>

              <tr>
                <td>Созвездие</td>
                <td>{obj.constellation || "-"}</td>
              </tr>

              <tr>
                <td>RA</td>
                <td>{obj.ra}</td>
              </tr>

              <tr>
                <td>Dec</td>
                <td>{obj.dec}</td>
              </tr>

              <tr>
                <td>Видимая величина</td>
                <td>{obj.magnitude ?? "-"}</td>
              </tr>

              <tr>
                <td>Расстояние</td>
                <td>{obj.distance_pc ?? "-"} pc</td>
              </tr>

              <tr>
                <td>Угловой размер</td>
                <td>{obj.angular_size ?? "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="object-image">
          <img
            src={`/images/messier/${obj.messier}.jpg`}
            alt={obj.messier}
            onError={(e) => {
              e.currentTarget.src =
                "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
            }}
          />
        </div>

      </div>
    </div>
  );
}