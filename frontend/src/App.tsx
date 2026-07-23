import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ObjectPage from "./pages/ObjectPage";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import SkyMap from "./pages/SkyMap";
import Cards from "./pages/Cards";
import Level1 from "./pages/Level1";


function App() {

  return (

    <Routes>

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/catalog"
        element={<Catalog />}
      />

      <Route
        path="/catalog/:messier"
        element={<ObjectPage />}
      />

      <Route
        path="/favorites"
        element={<Favorites />}
      />

      <Route
        path="/settings"
        element={<Settings />}
      />

      <Route
        path="/sky-map"
        element={<SkyMap />}
      />

      <Route
        path="/cards"
        element={<Cards />}
      />

      <Route
        path="/cards/level1"
        element={<Level1 />}
      />

    </Routes>

  );

}

export default App;
