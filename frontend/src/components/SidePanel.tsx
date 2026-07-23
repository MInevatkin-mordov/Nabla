import { Link } from "react-router-dom";

export default function SidePanel() {
    return (
        <aside className="side-panel">

            <h2>Nabla</h2>

            <nav>

                <Link to="/">
                    🏠 Главная
                </Link>

                <Link to="/catalog">
                    🌌 Каталог
                </Link>

                <button disabled>
                    ⭐ Избранное
                </button>

                <button disabled>
                    ⚙ Настройки
                </button>

            </nav>

        </aside>
    );
}