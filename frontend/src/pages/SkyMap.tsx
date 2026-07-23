import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

import messierData from "../data/catalog.json";
import caldwellData from "../data/caldwell.json";
import ngcData from "../data/ngc.json";
import starsData from "../data/stars.json";

import "./SkyMap.css";

/* =========================================================
   ТИПЫ
========================================================= */

type Catalog = "messier" | "caldwell" | "ngc";

type SkyObject = {
  id: string;
  catalog: Catalog;
  designation: string;
  name: string;
  type: string;
  constellation: string;
  ra: string;
  dec: string;
  magnitude: number | null;
  angularSize: string | null;
};

type ViewMode = "outside" | "inside";

type StarRec = { ra: number; dec: number; mag: number; bv: number | null };

/* =========================================================
   ПАРСИНГ RA/DEC (общий для всех трёх каталогов)
========================================================= */

function raToDegrees(ra: string | null | undefined): number | null {
  if (!ra) return null;
  const m = ra.match(/(\d+(?:\.\d+)?)h\s*(\d+(?:\.\d+)?)m\s*(\d+(?:\.\d+)?)s/i);
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
   СБОРКА ЕДИНОГО СПИСКА ОБЪЕКТОВ ИЗ ТРЁХ КАТАЛОГОВ
========================================================= */

function buildObjectList(): SkyObject[] {
  const out: SkyObject[] = [];

  (messierData as any[]).forEach((o) => {
    out.push({
      id: `messier-${o.messier}`,
      catalog: "messier",
      designation: o.messier,
      name: o.name,
      type: o.type,
      constellation: o.constellation,
      ra: o.ra,
      dec: o.dec,
      magnitude: o.magnitude,
      angularSize: o.angular_size,
    });
  });

  (caldwellData as any[]).forEach((o) => {
    out.push({
      id: `caldwell-${o.caldwell}`,
      catalog: "caldwell",
      designation: o.caldwell,
      name: o.name,
      type: o.type,
      constellation: o.constellation,
      ra: o.ra,
      dec: o.dec,
      magnitude: o.magnitude,
      angularSize: o.angular_size,
    });
  });

  (ngcData as any[]).forEach((o) => {
    out.push({
      id: `ngc-${o.ngc}`,
      catalog: "ngc",
      designation: o.ngc,
      name: o.name,
      type: o.type,
      constellation: o.constellation,
      ra: o.ra,
      dec: o.dec,
      magnitude: o.magnitude,
      angularSize: o.angular_size,
    });
  });

  return out;
}

const CATALOG_COLORS: Record<Catalog, string> = {
  messier: "#5fb5ff",
  caldwell: "#c98bff",
  ngc: "#5cf0c2",
};

const CATALOG_LABELS: Record<Catalog, string> = {
  messier: "Мессье",
  caldwell: "Caldwell",
  ngc: "NGC / IC",
};

const SPHERE_RADIUS = 500;
const STAR_RADIUS = 480;
const OUTSIDE_DISTANCE = 1350;
const OUTSIDE_FOV = 50;
const INSIDE_FOV = 78;

/* =========================================================
   ГЕОМЕТРИЯ: RA/DEC -> ТОЧКА НА СФЕРЕ
========================================================= */

function raDecToVector3(raDeg: number, decDeg: number, radius: number) {
  const raRad = THREE.MathUtils.degToRad(raDeg);
  const decRad = THREE.MathUtils.degToRad(decDeg);
  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = radius * Math.cos(decRad) * Math.sin(raRad);
  return new THREE.Vector3(x, y, z);
}

/* =========================================================
   ЗВЁЗДНЫЙ ФОН — ЗАПЕЧЁН В ОДНУ ТЕКСТУРУ ЗАРАНЕЕ
   (не тысячи живых точек на GPU, а одна готовая картинка
   на сфере — дёшево для слабого железа)
========================================================= */

function bvToCss(bv: number | null): string {
  if (bv === null || bv === undefined) return "#ffffff";
  if (bv < 0.0) return "#aecbff";
  if (bv < 0.3) return "#f8f7ff";
  if (bv < 0.6) return "#fff4ea";
  if (bv < 1.0) return "#ffe4b3";
  return "#ffb38a";
}

function magToPixelRadius(mag: number): number {
  const clamped = Math.max(-1.5, Math.min(6, mag));
  return 3.0 - ((clamped + 1.5) / 7.5) * 2.4; // ярче -> крупнее (0.6..3.0px)
}

function buildStarTexture(stars: StarRec[]): THREE.CanvasTexture {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  stars.forEach((s) => {
    const raRad = THREE.MathUtils.degToRad(s.ra);
    const decRad = THREE.MathUtils.degToRad(s.dec);
    let u = 0.5 - raRad / (2 * Math.PI);
    u = ((u % 1) + 1) % 1;
    const v = THREE.MathUtils.clamp(0.5 - decRad / Math.PI, 0, 1);
    const x = u * W;
    const y = v * H;
    const r = magToPixelRadius(s.mag);

    ctx.fillStyle = bvToCss(s.bv);
    ctx.globalAlpha = 0.95;
    // рисуем у обоих краёв текстуры, чтобы не было шва на границе 0/360°
    [x - W, x, x + W].forEach((xx) => {
      if (xx > -6 && xx < W + 6) {
        ctx.beginPath();
        ctx.arc(xx, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* =========================================================
   ТЕКСТУРА МАРКЕРА (свой стиль: кольцо + ядро + мягкое свечение)
========================================================= */

function makeMarkerTexture(color: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const glow = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  glow.addColorStop(0, color);
  glow.addColorStop(0.22, color + "cc");
  glow.addColorStop(0.5, color + "33");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.05, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeHighlightTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* =========================================================
   ПЛАВНАЯ АНИМАЦИЯ
========================================================= */

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* =========================================================
   КОМПОНЕНТ
========================================================= */

function SkyMap() {
  const navigate = useNavigate();
  const mountRef = useRef<HTMLDivElement>(null);

  const objects = useMemo(() => buildObjectList(), []);

  const [mode, setMode] = useState<ViewMode>("outside");
  const [visibleCatalogs, setVisibleCatalogs] = useState<
    Record<Catalog, boolean>
  >({
    messier: true,
    caldwell: true,
    ngc: true,
  });
  const [selected, setSelected] = useState<SkyObject | null>(null);
  const [jumpTarget, setJumpTarget] = useState("");

  // мутируемое состояние сцены, не вызывающее ре-рендер React
  const sceneState = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    worldGroup?: THREE.Group;
    groups: Record<Catalog, THREE.Group>;
    pointBuckets: { catalog: Catalog; points: THREE.Points; objs: SkyObject[] }[];
    idToPosition: Map<string, THREE.Vector3>;
    highlight?: THREE.Sprite;
    azimuth: number;
    elevation: number;
    dragging: boolean;
    lastX: number;
    lastY: number;
    moved: boolean;
    outsideDistance: number;
    mode: ViewMode;
    animStart: number | null;
    animFrom: { azimuth: number; elevation: number; distance: number; fov: number };
    animTo: { azimuth: number; elevation: number; distance: number; fov: number };
    animDuration: number;
    frameId?: number;
  }>({
    groups: { messier: new THREE.Group(), caldwell: new THREE.Group(), ngc: new THREE.Group() },
    pointBuckets: [],
    idToPosition: new Map(),
    azimuth: 0,
    elevation: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    moved: false,
    outsideDistance: OUTSIDE_DISTANCE,
    mode: "outside",
    animStart: null,
    animFrom: { azimuth: 0, elevation: 0, distance: OUTSIDE_DISTANCE, fov: OUTSIDE_FOV },
    animTo: { azimuth: 0, elevation: 0, distance: OUTSIDE_DISTANCE, fov: OUTSIDE_FOV },
    animDuration: 900,
  });

  /* ---------- ИНИЦИАЛИЗАЦИЯ СЦЕНЫ (один раз) ---------- */

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const st = sceneState.current;

    const scene = new THREE.Scene();
    st.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      OUTSIDE_FOV,
      mount.clientWidth / mount.clientHeight,
      0.1,
      5000
    );
    camera.position.set(0, 0, OUTSIDE_DISTANCE);
    st.camera = camera;

    // antialias выключен и pixelRatio ограничен — для слабого железа это
    // основная экономия GPU-времени на каждый кадр
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    st.renderer = renderer;

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    st.worldGroup = worldGroup;

    // --- звёздный фон: одна запечённая текстура на сфере, а не тысячи
    //     живых точек — рисуется один раз при загрузке, дальше рендерится
    //     как обычная картинка (один draw call на весь звёздный слой) ---
    const starTexture = buildStarTexture(starsData as StarRec[]);
    const starSphereGeo = new THREE.SphereGeometry(STAR_RADIUS, 48, 24);
    const starSphereMat = new THREE.MeshBasicMaterial({
      map: starTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const starMesh = new THREE.Mesh(starSphereGeo, starSphereMat);
    worldGroup.add(starMesh);

    // --- группы маркеров по каталогам ---
    (Object.keys(st.groups) as Catalog[]).forEach((cat) => {
      worldGroup.add(st.groups[cat]);
    });

    const markerTextures: Record<Catalog, THREE.CanvasTexture> = {
      messier: makeMarkerTexture(CATALOG_COLORS.messier),
      caldwell: makeMarkerTexture(CATALOG_COLORS.caldwell),
      ngc: makeMarkerTexture(CATALOG_COLORS.ngc),
    };

    // валидные объекты (с корректными RA/Dec) + запоминаем позицию каждого
    // объекта один раз — используется для подсветки и перехода "по запросу"
    const validObjects = objects.filter((o) => {
      const raDeg = raToDegrees(o.ra);
      const decDeg = decToDegrees(o.dec);
      if (raDeg === null || decDeg === null) return false;
      st.idToPosition.set(o.id, raDecToVector3(raDeg, decDeg, SPHERE_RADIUS));
      return true;
    });

    // маркеры каждого каталога объединены всего в 2 яруса по яркости —
    // это 3 каталога × максимум 2 = до 6 draw call'ов вместо 224 отдельных
    // спрайтов, при этом деление на "ярче/тусклее" сохраняется
    const brightnessTiers: { max: number; size: number }[] = [
      { max: 6, size: 15 },
      { max: 100, size: 9 },
    ];

    (Object.keys(st.groups) as Catalog[]).forEach((cat) => {
      const catObjects = validObjects.filter((o) => o.catalog === cat);

      brightnessTiers.forEach((tier, idx) => {
        const prevMax = idx === 0 ? -100 : brightnessTiers[idx - 1].max;
        const bucket = catObjects.filter((o) => {
          const m = o.magnitude ?? 8;
          return m > prevMax && m <= tier.max;
        });
        if (bucket.length === 0) return;

        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(bucket.length * 3);
        bucket.forEach((o, i) => {
          const v = st.idToPosition.get(o.id)!;
          pos[i * 3] = v.x;
          pos[i * 3 + 1] = v.y;
          pos[i * 3 + 2] = v.z;
        });
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
          map: markerTextures[cat],
          size: tier.size,
          transparent: true,
          depthWrite: false,
          sizeAttenuation: true,
        });
        const points = new THREE.Points(geo, mat);
        st.groups[cat].add(points);
        st.pointBuckets.push({ catalog: cat, points, objs: bucket });
      });
    });

    // --- маркер подсветки выбранного объекта ---
    const highlightTex = makeHighlightTexture();
    const highlightMat = new THREE.SpriteMaterial({
      map: highlightTex,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      opacity: 0,
    });
    const highlightSprite = new THREE.Sprite(highlightMat);
    highlightSprite.scale.set(26, 26, 1);
    worldGroup.add(highlightSprite);
    st.highlight = highlightSprite;

    /* ---------- УПРАВЛЕНИЕ ---------- */

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 9 };
    const pointerNDC = new THREE.Vector2();

    function onPointerDown(e: PointerEvent) {
      st.dragging = true;
      st.moved = false;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
    }

    function onPointerMove(e: PointerEvent) {
      if (!st.dragging) return;
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) st.moved = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;

      const sensitivity = 0.005;
      if (st.mode === "outside") {
        st.azimuth += dx * sensitivity;
        st.elevation = THREE.MathUtils.clamp(
          st.elevation + dy * sensitivity,
          -1.4,
          1.4
        );
      } else {
        st.azimuth -= dx * sensitivity;
        st.elevation = THREE.MathUtils.clamp(
          st.elevation + dy * sensitivity,
          -1.4,
          1.4
        );
      }
    }

    function onPointerUp(e: PointerEvent) {
      st.dragging = false;
      if (!st.moved && st.camera && st.scene) {
        pointerNDC.x = (e.clientX / mount!.clientWidth) * 2 - 1;
        pointerNDC.y = -(e.clientY / mount!.clientHeight) * 2 + 1;
        raycaster.setFromCamera(pointerNDC, st.camera);

        const candidates = st.pointBuckets.filter(
          (b) => st.groups[b.catalog].visible
        );
        const hits = raycaster.intersectObjects(
          candidates.map((b) => b.points),
          false
        );
        if (hits.length > 0 && hits[0].index !== undefined) {
          const bucket = candidates.find((b) => b.points === hits[0].object);
          const obj = bucket?.objs[hits[0].index!];
          if (obj) selectObject(obj);
        }
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (st.mode === "outside") {
        st.outsideDistance = THREE.MathUtils.clamp(
          st.outsideDistance + e.deltaY * 0.6,
          650,
          2400
        );
      } else if (st.camera) {
        st.camera.fov = THREE.MathUtils.clamp(
          st.camera.fov + e.deltaY * 0.03,
          35,
          100
        );
        st.camera.updateProjectionMatrix();
      }
    }

    function selectObject(obj: SkyObject) {
      setSelected(obj);
      const pos = st.idToPosition.get(obj.id);
      if (pos && st.highlight) {
        st.highlight.position.copy(pos);
        (st.highlight.material as THREE.SpriteMaterial).opacity = 1;
      }
    }

    mount.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    mount.addEventListener("wheel", onWheel, { passive: false });

    function onResize() {
      if (!mount || !st.camera || !st.renderer) return;
      st.camera.aspect = mount.clientWidth / mount.clientHeight;
      st.camera.updateProjectionMatrix();
      st.renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    /* ---------- ЦИКЛ РЕНДЕРА ---------- */

    function animate(t: number) {
      const st2 = sceneState.current;

      if (st2.animStart !== null) {
        const elapsed = t - st2.animStart;
        const p = Math.min(1, elapsed / st2.animDuration);
        const e = easeInOutCubic(p);
        st2.azimuth =
          st2.animFrom.azimuth + (st2.animTo.azimuth - st2.animFrom.azimuth) * e;
        st2.elevation =
          st2.animFrom.elevation +
          (st2.animTo.elevation - st2.animFrom.elevation) * e;
        st2.outsideDistance =
          st2.animFrom.distance + (st2.animTo.distance - st2.animFrom.distance) * e;
        if (st2.camera) {
          st2.camera.fov = st2.animFrom.fov + (st2.animTo.fov - st2.animFrom.fov) * e;
          st2.camera.updateProjectionMatrix();
        }
        if (p >= 1) st2.animStart = null;
      }

      if (st2.worldGroup && st2.camera) {
        if (st2.mode === "outside") {
          st2.worldGroup.rotation.set(0, 0, 0);
          st2.worldGroup.rotation.y = st2.azimuth;
          st2.worldGroup.rotation.x = st2.elevation;
          st2.camera.position.set(0, 0, st2.outsideDistance);
          st2.camera.lookAt(0, 0, 0);
        } else {
          st2.worldGroup.rotation.set(0, 0, 0);
          st2.camera.position.set(0, 0, 0.001);
          st2.camera.rotation.order = "YXZ";
          st2.camera.rotation.y = st2.azimuth;
          st2.camera.rotation.x = st2.elevation;
        }
      }

      if (st2.highlight) {
        const mat = st2.highlight.material as THREE.SpriteMaterial;
        if (mat.opacity > 0) {
          const pulse = 26 + Math.sin(t * 0.006) * 4;
          st2.highlight.scale.set(pulse, pulse, 1);
        }
      }

      if (st2.renderer && st2.scene && st2.camera) {
        st2.renderer.render(st2.scene, st2.camera);
      }
      st2.frameId = requestAnimationFrame(animate);
    }
    st.frameId = requestAnimationFrame(animate);

    return () => {
      if (st.frameId) cancelAnimationFrame(st.frameId);
      mount.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      mount.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      starSphereGeo.dispose();
      starSphereMat.dispose();
      starTexture.dispose();
      st.pointBuckets.forEach((b) => {
        b.points.geometry.dispose();
        (b.points.material as THREE.Material).dispose();
      });
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- ПЕРЕКЛЮЧЕНИЕ ВИДИМОСТИ КАТАЛОГОВ ---------- */

  useEffect(() => {
    const st = sceneState.current;
    (Object.keys(st.groups) as Catalog[]).forEach((cat) => {
      st.groups[cat].visible = visibleCatalogs[cat];
    });
  }, [visibleCatalogs]);

  /* ---------- ПЕРЕКЛЮЧЕНИЕ РЕЖИМА (снаружи / изнутри) ---------- */

  function switchMode(next: ViewMode) {
    if (next === mode) return;
    const st = sceneState.current;

    st.animFrom = {
      azimuth: st.azimuth,
      elevation: st.elevation,
      distance: st.outsideDistance,
      fov: st.camera?.fov ?? OUTSIDE_FOV,
    };
    st.animTo = {
      azimuth: st.azimuth,
      elevation: st.elevation,
      distance: next === "outside" ? OUTSIDE_DISTANCE : st.outsideDistance,
      fov: next === "outside" ? OUTSIDE_FOV : INSIDE_FOV,
    };
    st.mode = next;
    st.animStart = performance.now();
    setMode(next);
  }

  /* ---------- ПЕРЕХОД К ОБЪЕКТУ ПО ЗАПРОСУ ---------- */

  function jumpToObject(obj: SkyObject) {
    const st = sceneState.current;
    const raDeg = raToDegrees(obj.ra);
    const decDeg = decToDegrees(obj.dec);
    if (raDeg === null || decDeg === null) return;

    // азимут/высота, при которых объект оказывается по центру экрана
    const targetAzimuth =
      st.mode === "outside" ? -THREE.MathUtils.degToRad(raDeg) : THREE.MathUtils.degToRad(raDeg);
    const targetElevation =
      st.mode === "outside"
        ? -THREE.MathUtils.degToRad(decDeg)
        : THREE.MathUtils.degToRad(decDeg);

    st.animFrom = {
      azimuth: st.azimuth,
      elevation: st.elevation,
      distance: st.outsideDistance,
      fov: st.camera?.fov ?? OUTSIDE_FOV,
    };
    st.animTo = {
      azimuth: targetAzimuth,
      elevation: targetElevation,
      distance: st.mode === "outside" ? Math.min(st.outsideDistance, 900) : st.outsideDistance,
      fov: st.camera?.fov ?? (st.mode === "outside" ? OUTSIDE_FOV : INSIDE_FOV),
    };
    st.animStart = performance.now();

    setSelected(obj);
    const pos = st.idToPosition.get(obj.id);
    if (pos && st.highlight) {
      st.highlight.position.copy(pos);
      (st.highlight.material as THREE.SpriteMaterial).opacity = 1;
    }
  }

  function toggleCatalog(cat: Catalog) {
    setVisibleCatalogs((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  const searchMatches = useMemo(() => {
    if (jumpTarget.trim().length < 2) return [];
    const q = jumpTarget.trim().toLowerCase();
    return objects
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.designation.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [jumpTarget, objects]);

  return (
    <div className="skymap-page">
      <div className="skymap-canvas" ref={mountRef} />

      <div className="skymap-topbar">
        <button className="skymap-back" onClick={() => navigate("/")}>
          ← Главная
        </button>

        <div className="skymap-mode-switch">
          <button
            className={mode === "outside" ? "selected" : ""}
            onClick={() => switchMode("outside")}
          >
            🌐 Снаружи
          </button>
          <button
            className={mode === "inside" ? "selected" : ""}
            onClick={() => switchMode("inside")}
          >
            🔭 Изнутри
          </button>
        </div>
      </div>

      <div className="skymap-legend">
        {(Object.keys(CATALOG_LABELS) as Catalog[]).map((cat) => (
          <label key={cat} className="skymap-legend-item">
            <input
              type="checkbox"
              checked={visibleCatalogs[cat]}
              onChange={() => toggleCatalog(cat)}
            />
            <span
              className="skymap-legend-dot"
              style={{ background: CATALOG_COLORS[cat] }}
            />
            {CATALOG_LABELS[cat]}
          </label>
        ))}
      </div>

      <div className="skymap-search">
        <input
          type="text"
          placeholder="Показать объект: M31, Крабовидная..."
          value={jumpTarget}
          onChange={(e) => setJumpTarget(e.target.value)}
        />
        {searchMatches.length > 0 && (
          <div className="skymap-search-results">
            {searchMatches.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  jumpToObject(o);
                  setJumpTarget("");
                }}
              >
                <span
                  className="skymap-legend-dot"
                  style={{ background: CATALOG_COLORS[o.catalog] }}
                />
                {o.designation} — {o.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="skymap-info-panel">
          <button className="skymap-info-close" onClick={() => setSelected(null)}>
            ✕
          </button>
          <div className="skymap-info-badge" style={{ background: CATALOG_COLORS[selected.catalog] }}>
            {CATALOG_LABELS[selected.catalog]}
          </div>
          <h2>{selected.designation}</h2>
          <div className="skymap-info-name">{selected.name}</div>
          <div className="skymap-info-row">
            <span>Тип</span>
            <span>{selected.type}</span>
          </div>
          <div className="skymap-info-row">
            <span>Созвездие</span>
            <span>{selected.constellation}</span>
          </div>
          <div className="skymap-info-row">
            <span>RA / Dec</span>
            <span>
              {selected.ra} / {selected.dec}
            </span>
          </div>
          <div className="skymap-info-row">
            <span>Величина</span>
            <span>{selected.magnitude ?? "—"}</span>
          </div>
          <div className="skymap-info-row">
            <span>Размер</span>
            <span>{selected.angularSize ?? "—"}</span>
          </div>
        </div>
      )}

      <div className="skymap-hint">
        Перетаскивай мышью, чтобы оглядеться · колесо мыши — приближение
      </div>
    </div>
  );
}

export default SkyMap;
