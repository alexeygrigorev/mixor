import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import type { TaxonId } from "./data";
import { woodlands, type Woodland } from "./search-data";
import { getWalkView, type WalkView } from "./street-view-data";
import { panoramaLinks, panoramaPoints } from "./street-view-panorama-data";
import { createPanoramaRenderer, projectDirection, wrapAngle, type PanoramaRenderer, type ViewDirection } from "./street-view-renderer";
import { SearchSpecimen } from "./search-specimen";
import { scientificNames } from "./taxonomy";

export function StreetViewScene({ view, woodland, finds, reveal, inspect, change, back }: {
  view: WalkView;
  woodland: Woodland;
  finds: string[];
  reveal: (id: string) => void;
  inspect: (taxon: TaxonId, findId: string) => void;
  change: (id: string) => void;
  back: () => void;
}) {
  const host = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<PanoramaRenderer | null>(null);
  const [camera, setCamera] = useState<ViewDirection>(() => ({ yaw: panoramaPoints[view.id].yaw, pitch: 0, fov: 80 }));
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const cameraTarget = useRef(camera);
  const cameraFrame = useRef(0);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [contextVersion, setContextVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [hint, setHint] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; yaw: number; pitch: number } | null>(null);
  const stepping = useRef(false);
  const request = useRef(0);
  const images = useRef(new Map<string, Promise<HTMLImageElement>>());
  const links = panoramaLinks(view);
  const selected = woodland.spots.find((spot) => spot.id === selectedId);

  function loadImage(id: string) {
    const existing = images.current.get(id);
    if (existing) return existing;
    const image = new Image();
    image.src = panoramaPoints[id].image;
    const loading = image.decode().then(() => image).catch((cause: unknown) => {
      images.current.delete(id);
      throw cause;
    });
    images.current.set(id, loading);
    return loading;
  }

  useLayoutEffect(() => {
    const element = host.current!;
    const resize = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      renderer.current?.draw(cameraRef.current);
    });
    resize.observe(element);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const element = canvas.current!;
    try {
      renderer.current = createPanoramaRenderer(element);
    } catch {
      setError("Не удалось включить круговой обзор.");
      setBusy(false);
      return;
    }
    const restore = () => setContextVersion((version) => version + 1);
    const lost = (event: Event) => {
      event.preventDefault();
      request.current++;
      stepping.current = false;
      setReady(false);
      setBusy(false);
      setError("Круговой обзор прервался.");
    };
    const visible = () => renderer.current?.draw(cameraRef.current);
    element.addEventListener("webglcontextlost", lost);
    element.addEventListener("webglcontextrestored", restore);
    document.addEventListener("visibilitychange", visible);
    return () => {
      renderer.current?.dispose();
      renderer.current = null;
      element.removeEventListener("webglcontextlost", lost);
      element.removeEventListener("webglcontextrestored", restore);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [contextVersion]);

  useEffect(() => {
    const currentRequest = ++request.current;
    cancelAnimationFrame(cameraFrame.current);
    cameraTarget.current = cameraRef.current;
    const sceneRenderer = renderer.current;
    if (!sceneRenderer) return;
    setBusy(true);
    setError("");
    setSelectedId(null);
    drag.current = null;
    void loadImage(view.id).then(async (image) => {
      if (request.current !== currentRequest) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !!host.current?.closest(".calm");
      sceneRenderer.draw(cameraRef.current);
      setReady(true);
      await sceneRenderer.show(image, reduced ? 0 : 300);
      if (request.current !== currentRequest) return;
      stepping.current = false;
      setBusy(false);
      view.links.forEach((link) => {
        if (panoramaPoints[link.to]) void loadImage(link.to).catch(() => undefined);
      });
    }).catch(() => {
      if (request.current !== currentRequest) return;
      setError("Панорама не загрузилась. Можно попробовать ещё раз.");
      stepping.current = false;
      setBusy(false);
      setReady(false);
    });
    return () => { request.current++; cancelAnimationFrame(cameraFrame.current); };
  }, [view.id, contextVersion]);

  useLayoutEffect(() => { renderer.current?.draw(camera); }, [camera, size]);

  useEffect(() => {
    const element = canvas.current!;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || busy || !ready || selectedId) return;
      event.preventDefault();
      setHint(false);
      animateCamera({ ...cameraTarget.current, fov: Math.max(45, Math.min(105, cameraTarget.current.fov + Math.sign(event.deltaY) * 3)) });
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [busy, ready, selectedId]);

  function animateCamera(target: ViewDirection) {
    cancelAnimationFrame(cameraFrame.current);
    cameraTarget.current = target;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || host.current?.closest(".calm");
    if (reduced) { setCamera(target); return; }
    const start = performance.now();
    const from = cameraRef.current;
    const yaw = wrapAngle(target.yaw - from.yaw);
    const animate = (now: number) => {
      const t = document.hidden ? 1 : Math.min(1, (now - start) / 180);
      const eased = t * t * (3 - 2 * t);
      setCamera({ yaw: wrapAngle(from.yaw + yaw * eased), pitch: from.pitch + (target.pitch - from.pitch) * eased,
        fov: from.fov + (target.fov - from.fov) * eased });
      if (t < 1) cameraFrame.current = requestAnimationFrame(animate);
    };
    cameraFrame.current = requestAnimationFrame(animate);
  }

  async function step(to: string) {
    if (busy || stepping.current || !getWalkView(to)) return;
    stepping.current = true;
    cancelAnimationFrame(cameraFrame.current);
    cameraTarget.current = cameraRef.current;
    const currentRequest = ++request.current;
    setBusy(true);
    setSelectedId(null);
    setHint(false);
    setError("");
    try {
      await loadImage(to);
      if (request.current !== currentRequest) return;
      change(to);
    } catch {
      if (request.current !== currentRequest) return;
      stepping.current = false;
      setBusy(false);
      setError("Следующая точка не загрузилась. Нажми на стрелку ещё раз.");
    }
  }

  function look(yaw: number, pitch = 0) {
    if (busy || !ready) return;
    setHint(false);
    const previous = cameraTarget.current;
    animateCamera({ ...previous, yaw: wrapAngle(previous.yaw + yaw), pitch: Math.max(-80, Math.min(80, previous.pitch + pitch)) });
  }
  function walkFacing(backwards = false) {
    const facing = wrapAngle(camera.yaw + (backwards ? 180 : 0));
    const nearest = [...links].sort((a, b) => Math.abs(wrapAngle(a.yaw - facing)) - Math.abs(wrapAngle(b.yaw - facing)))[0];
    if (nearest && Math.abs(wrapAngle(nearest.yaw - facing)) < 65) void step(nearest.to);
  }
  function zoom(amount: number) {
    if (!ready || busy) return;
    setHint(false);
    animateCamera({ ...cameraTarget.current, fov: Math.max(45, Math.min(105, cameraTarget.current.fov + amount)) });
  }
  const woodlandIndex = woodlands.findIndex((place) => place.id === woodland.id);

  return <section ref={host} className="search-scene panorama-scene" aria-label={`${woodland.title}: обзор 360°`} data-view={view.id}
    onKeyDown={(event) => {
      if (event.key === "Escape" && selectedId) {
        setSelectedId(null);
        canvas.current?.focus({ preventScroll: true });
        return;
      }
      if (event.target !== canvas.current || event.altKey || event.ctrlKey || event.metaKey || selectedId) return;
      switch (event.key.toLowerCase()) {
        case "arrowleft": case "a": look(-5); break;
        case "arrowright": case "d": look(5); break;
        case "arrowup": look(0, 4); break;
        case "arrowdown": look(0, -4); break;
        case "w": walkFacing(); break;
        case "s": walkFacing(true); break;
        case "+": case "=": zoom(-5); break;
        case "-": zoom(5); break;
        default: return;
      }
      event.preventDefault();
    }}>
    {!ready && <img className="panorama-fallback" src={view.image} alt="" />}
    <canvas ref={canvas} className={`panorama-canvas ${ready ? "is-ready" : ""}`} tabIndex={0}
      aria-label="Круговая панорама. Потяни мышью, чтобы оглядеться. Стрелки клавиатуры — поворот, W и S — шаг, плюс и минус — масштаб."
      onPointerDown={(event) => {
        if (event.button !== 0 || busy || !ready || selectedId || drag.current) return;
        cancelAnimationFrame(cameraFrame.current);
        cameraTarget.current = cameraRef.current;
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: camera.yaw, pitch: camera.pitch };
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;
        const factor = camera.fov / size.width;
        setHint(false);
        const nextCamera = { ...cameraRef.current,
          yaw: wrapAngle(start.yaw - (event.clientX - start.x) * factor),
          pitch: Math.max(-80, Math.min(80, start.pitch + (event.clientY - start.y) * factor)),
        };
        cameraTarget.current = nextCamera;
        setCamera(nextCamera);
      }}
      onPointerUp={(event) => {
        if (drag.current?.id !== event.pointerId) return;
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { drag.current = null; }}
      onLostPointerCapture={() => { drag.current = null; }}
      onDoubleClick={() => { if (!selectedId) walkFacing(); }}
    />
    {ready && !busy && !selected && <nav className="walk-directions panorama-directions" aria-label="Прогулка по тропе">
      {links.map((link) => {
        const point = projectDirection(link.yaw, link.pitch, camera, size.width, size.height);
        if (!point.visible) return null;
        return <button key={`${view.id}-${link.to}`} className="walk-arrow panorama-arrow" style={{ left: point.left, top: point.top }}
          aria-label={`Перейти: ${link.label}`} onClick={() => void step(link.to)}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <g transform={`rotate(${wrapAngle(link.yaw - camera.yaw)} 50 50)`}>
              <path d="M50 15 84 64 71 72 50 43 29 72 16 64Z" />
            </g>
          </svg><span>{link.label}</span>
        </button>;
      })}
    </nav>}
    {ready && !busy && view.id === "6-3d" && !selected && woodland.spots.map((spot, index) => {
      const point = projectDirection(index === 0 ? -96 : 10, index === 0 ? -18 : -52, camera, size.width, size.height);
      if (!point.visible) return null;
      return <button key={spot.id} className="panorama-find" data-find={spot.id}
        aria-label={finds.includes(spot.id) ? `Рассмотреть находку: ${scientificNames[spot.taxon].name}` : `Осмотреть: ${spot.label}`}
        style={{ left: point.left, top: point.top }} onClick={() => {
          if (!finds.includes(spot.id)) reveal(spot.id);
          setSelectedId(spot.id);
        }}><span aria-hidden="true" /></button>;
    })}
    {selected && <>
      <button className="search-dismiss-surface" aria-label="Закрыть увеличение" onClick={() => setSelectedId(null)} />
      <div className="search-magnifier panorama-magnifier" role="dialog" aria-label={scientificNames[selected.taxon].name}>
        <div className="search-magnified-image">
          <SearchSpecimen woodland={woodland} spot={selected} label={`${scientificNames[selected.taxon].name}: иллюстрация ИИ`} />
          <button autoFocus className="search-dismiss" aria-label="Закрыть увеличение" onClick={() => setSelectedId(null)}><Icon name="close" /></button>
        </div>
        <div className="search-magnified-caption"><i>{scientificNames[selected.taxon].name}</i>
          <button className="search-learn" onClick={() => inspect(selected.taxon, selected.id)}>Узнать больше <Icon name="next" size={20} /></button>
        </div>
      </div>
    </>}
    <button className="activity-back" onClick={back} aria-label="Назад к выбору места"><Icon name="back" /></button>
    <button className="wetland-experiment-link" onClick={() => change("wetland")}>Вернуться к сцене 6</button>
    <nav className="search-places" aria-label={`Места поиска. Сейчас: ${woodland.title}`}>
      <button onClick={() => change(woodlands[(woodlandIndex + woodlands.length - 1) % woodlands.length].id)} aria-label="Предыдущее место"><Icon name="back" size={20} /></button>
      <span>6-3d · эксперимент</span>
      <button onClick={() => change(woodlands[(woodlandIndex + 1) % woodlands.length].id)} aria-label="Следующее место"><Icon name="next" size={20} /></button>
    </nav>
    <div className="panorama-location"><span>360°</span><p>{view.title}</p></div>
    {hint && ready && !busy && <p className="panorama-hint">Потяни, чтобы оглядеться · Нажми на стрелку, чтобы пройти</p>}
    {busy && <p className="panorama-loading" role="status">Открываем тропу…</p>}
    {error && <div className="panorama-error" role="alert"><p>{error}</p>
      <button onClick={() => { setReady(false); setContextVersion((version) => version + 1); }}>Повторить</button>
      {!ready && links.map((link) => <button key={link.to} onClick={() => change(link.to)}>{link.label}</button>)}
    </div>}
    <div className="panorama-controls" aria-label="Управление обзором">
      <div className="panorama-turn">
        <button disabled={!ready || busy} aria-label="Посмотреть налево" onClick={() => look(-30)}><Icon name="back" size={18} /></button>
        <button className="panorama-compass" disabled={!ready || busy} aria-label="Вернуть исходное направление" title="Исходное направление"
          onClick={() => animateCamera({ yaw: panoramaPoints[view.id].yaw, pitch: 0, fov: 80 })}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" />
            <g transform={`rotate(${panoramaPoints[view.id].yaw - camera.yaw} 24 24)`}><path d="M24 7 30 27 24 24 18 27Z" /><path className="compass-tail" d="M24 41 18 21 24 24 30 21Z" /></g>
          </svg>
        </button>
        <button disabled={!ready || busy} aria-label="Посмотреть направо" onClick={() => look(30)}><Icon name="next" size={18} /></button>
      </div>
      <div className="panorama-zoom"><button disabled={!ready || busy || camera.fov <= 45} aria-label="Приблизить" onClick={() => zoom(-10)}>+</button>
        <button disabled={!ready || busy || camera.fov >= 105} aria-label="Отдалить" onClick={() => zoom(10)}>−</button></div>
    </div>
    <span className="panorama-credit">Окружение создано с ИИ</span>
    <span className="sr-only" role="status">{!busy && ready ? view.title : ""}</span>
  </section>;
}
