import { useEffect, useRef, useState, type CSSProperties } from "react";
import { taxa, getTaxon, getMedia, type TaxonId, type MediaItem } from "./data";
import { lifeCycles } from "./life-data";
import { Art } from "./art";
import { Icon, type IconName } from "./icons";
import { Panel, Capture, BlobPhoto } from "./panels";
import { audioManager, defaultSoundLevels, type SoundLevels } from "./audio";
import { readJourney, writeJourney, type Discovery } from "./game-store";
import { listObservations, type StoredObservation } from "./storage";
import "./styles.css";
import "./focused.css";
import {
  ActivityHome,
  BackButton,
  WoodlandChooser,
  SpeciesChooser,
  SearchScene,
  DevelopmentScene,
  ClassificationTree,
} from "./focused-scenes";
import { readFinds, writeFinds, findWoodland } from "./search-data";
import { scientificNames, taxonomySources } from "./taxonomy";

type Place =
  | "home"
  | "woods"
  | "species"
  | "world"
  | "tree"
  | "portrait"
  | "life"
  | "journal";
type RouteStep = {
  place: Place;
  taxon: TaxonId;
  stage: string;
  focus?: string;
};
type Route = RouteStep & { trail: RouteStep[] };
const places: Place[] = [
  "home",
  "woods",
  "species",
  "world",
  "tree",
  "portrait",
  "life",
  "journal",
];
const routeKey = (route: RouteStep) =>
  `#${route.place}/${route.taxon}/${route.stage}`;
function isRouteStep(value: unknown): value is RouteStep {
  if (!value || typeof value !== "object") return false;
  const step = value as Record<string, unknown>;
  return (
    places.includes(step.place as Place) &&
    taxa.some((taxon) => taxon.id === step.taxon) &&
    typeof step.stage === "string" &&
    /^[a-z0-9-]{1,80}$/i.test(step.stage) &&
    (step.focus === undefined ||
      (typeof step.focus === "string" && /^[a-z0-9-]{1,80}$/i.test(step.focus)))
  );
}
type Overlay =
  "settings" | "sources" | "capture" | "branches" | "photos" | null;
function readRoute(): Route {
  const [place, taxon, stage] = location.hash.slice(1).split("/");
  const route: Route = {
    place: places.includes(place as Place) ? (place as Place) : "home",
    taxon: taxa.some((t) => t.id === taxon) ? (taxon as TaxonId) : "physarum",
    stage: stage || "spore",
    trail: [],
  };
  // Browser history keeps the return path across reload and Back/Forward,
  // without mixing navigation metadata into the saved learning progress.
  const saved = history.state?.mixorNavigation;
  if (
    saved &&
    isRouteStep(saved.route) &&
    routeKey(saved.route) === routeKey(route) &&
    Array.isArray(saved.trail) &&
    saved.trail.length <= 8 &&
    saved.trail.every(isRouteStep)
  ) {
    route.trail = saved.trail;
    route.focus = saved.route.focus;
  }
  return route;
}
function parentRoute(route: Route): Route {
  const last = route.trail.at(-1);
  if (last) return { ...last, trail: route.trail.slice(0, -1) };
  const place =
    route.place === "world"
      ? "woods"
      : route.place === "life"
        ? "species"
        : route.place === "portrait"
          ? "tree"
          : "home";
  return { place, taxon: route.taxon, stage: "spore", trail: [] };
}
function backLabel(route: RouteStep): string {
  return route.place === "woods"
    ? "Назад к выбору места"
    : route.place === "species"
      ? "Назад к выбору вида"
      : route.place === "world"
        ? `Назад: ${findWoodland(route.stage).title}`
        : route.place === "portrait"
          ? "Назад к организму"
          : route.place === "tree"
            ? "Назад к дереву"
            : route.place === "journal"
              ? "Назад в журнал"
              : "Назад на главный экран";
}
function pref<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function setPref(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Nonessential preference. */
  }
}
function MaterialToggle({
  real,
  change,
}: {
  real: boolean;
  change: (value: boolean) => void;
}) {
  return (
    <button
      className="quiet-photo material-peek"
      aria-pressed={real}
      onClick={() => change(!real)}
    >
      <Icon name={real ? "leaf" : "camera"} size={18} />{" "}
      {real ? "Иллюстрация" : "Настоящее фото"}
    </button>
  );
}
function Credit({ photo }: { photo: MediaItem }) {
  return (
    <p className="photo-credit">
      <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
        {photo.author} · Wikimedia Commons
      </a>
      <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
        {photo.license}
      </a>
    </p>
  );
}
function Photo({ photo }: { photo: MediaItem }) {
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = frame.current;
    if (el) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    }
  }, [zoom]);
  return (
    <div className="photo-workspace">
      <div
        className="photo-viewport"
        ref={frame}
        tabIndex={0}
        aria-label="Фотография. Увеличенный кадр можно прокручивать или перемещать стрелками."
      >
        {failed ? (
          <p className="image-error">
            Фото не загрузилось. Выберите другой снимок или вернитесь к
            иллюстрации.
          </p>
        ) : (
          <div
            className="photo-zoom"
            style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              onError={() => setFailed(true)}
              draggable={false}
            />
          </div>
        )}
      </div>
      <div className="zoom-tools">
        <button
          className="icon-button"
          aria-label="Уменьшить фото"
          onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
          disabled={zoom === 1}
        >
          <Icon name="minus" />
        </button>
        <button onClick={() => setZoom(1)} aria-label="Вернуть полный кадр">
          {zoom.toFixed(1)}× <span>цифровое</span>
        </button>
        <button
          className="icon-button"
          aria-label="Увеличить фото"
          onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
          disabled={zoom === 3}
        >
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [entered, setEntered] = useState(() => pref("mixor-entered-v2", false));
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [journey, setJourney] = useState(readJourney);
  const [real, setReal] = useState(false);
  const requestedReal = useRef(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [finds, setFinds] = useState(readFinds);
  const [searchSessionOnly, setSearchSessionOnly] = useState(false);
  const [muted, setMuted] = useState(true);
  const [levels, setLevels] = useState<SoundLevels>(() => {
    const candidate = pref("mixor-sound-levels-v2", defaultSoundLevels);
    return ["music", "nature", "effects"].every(
      (key) => typeof candidate[key as keyof SoundLevels] === "number",
    )
      ? candidate
      : defaultSoundLevels;
  });
  const [calm, setCalm] = useState(() => pref("mixor-calm-v2", false));
  const [fullscreen, setFullscreen] = useState(false);
  const [toast, setToast] = useState("");
  const [investigating, setInvestigating] = useState(false);
  const [answer, setAnswer] = useState("");
  const [observations, setObservations] = useState<StoredObservation[]>([]);
  const [journalError, setJournalError] = useState("");
  const [detail, setDetail] = useState<Discovery | null>(null);
  const taxon = getTaxon(route.taxon);
  const cycle = lifeCycles[taxon.id];
  const stages = cycle?.stages.filter((stage) => stage.id !== "rest") ?? [];
  const stageIndex = Math.max(
    0,
    stages.findIndex((stage) => stage.id === route.stage),
  );
  const stage = stages[stageIndex];
  const photo = taxon.media[photoIndex % Math.max(taxon.media.length, 1)];
  const stagePhoto = stage?.kind === "photo" ? getMedia(stage.photoId) : null;
  const viewed = stages.filter((item) =>
    journey.visited.includes(`${taxon.id}/${item.id}`),
  ).length;
  const parent = parentRoute(route);
  const originWoodland =
    route.place === "world"
      ? route
      : (route.place === "portrait" || route.place === "life") &&
        [...route.trail].reverse().find((step) => step.place === "world");
  const ambientScene = originWoodland
    ? findWoodland(originWoodland.stage).id
    : null;

  useEffect(() => {
    const update = () => {
      setRoute(readRoute());
      setOverlay(null);
    };
    const full = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    document.addEventListener("fullscreenchange", full);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
      document.removeEventListener("fullscreenchange", full);
    };
  }, []);
  useEffect(() => {
    audioManager.setScene(ambientScene);
  }, [ambientScene]);
  useEffect(() => {
    if (route.place !== "world" || !route.focus) return;
    const frame = requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>(`[data-find="${route.focus}"]`)
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [route]);
  useEffect(() => {
    setPhotoIndex(0);
    setAnswer("");
    setInvestigating(false);
    setReal(requestedReal.current);
    requestedReal.current = false;
  }, [route.taxon, route.place]);
  useEffect(() => {
    if (route.place === "life") setReal(false);
  }, [route.stage, route.place]);
  useEffect(() => {
    audioManager.setLevels(levels);
    setPref("mixor-sound-levels-v2", levels);
  }, [levels]);
  useEffect(() => {
    if (route.place !== "life" || !stage || !entered) return;
    const id = `${taxon.id}/${stage.id}`;
    setJourney((current) => {
      if (current.visited.includes(id)) return current;
      const next = { ...current, visited: [...current.visited, id] };
      if (!writeJourney(next))
        setToast(
          "Прогресс доступен только до закрытия вкладки: браузер не разрешил сохранение.",
        );
      return next;
    });
  }, [route.place, taxon.id, stage?.id, entered]);
  useEffect(() => {
    if (route.place !== "journal") return;
    let active = true;
    void listObservations()
      .then((records) => {
        if (active) {
          setObservations(records);
          setJournalError("");
        }
      })
      .catch((error) => {
        if (active) setJournalError(String(error.message));
      });
    return () => {
      active = false;
    };
  }, [route.place]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timer);
  }, [toast]);

  function go(
    place: Place,
    id = taxon.id,
    at = route.stage,
    showPhoto = false,
    returnFocus?: string,
  ) {
    audioManager.playSfx(place === "journal" ? "journal-open" : "ui-press");
    setDetail(null);
    requestedReal.current = showPhoto;
    setReal(showPhoto);
    const sameActivity = place === route.place;
    const step = {
      place: route.place,
      taxon: route.taxon,
      stage: route.stage,
      focus: returnFocus,
    };
    const trail = sameActivity
      ? route.trail
      : ["home", "woods", "species", "tree", "journal"].includes(place)
        ? []
        : [...route.trail, step].slice(-8);
    const next: Route = { place, taxon: id, stage: at, trail };
    const parentKey = sameActivity
      ? history.state?.mixorNavigation?.parentKey
      : routeKey(route);
    if (!sameActivity) {
      history.replaceState(
        {
          ...history.state,
          mixorNavigation: {
            ...history.state?.mixorNavigation,
            route: { ...route, focus: returnFocus },
            trail: route.trail,
          },
        },
        "",
      );
    }
    // Moving between stages or woodland scenes keeps one history entry for
    // that activity. Back then returns to the chooser/organism, not each step.
    history[sameActivity ? "replaceState" : "pushState"](
      {
        ...history.state,
        mixorNavigation: { route: next, trail, parentKey },
      },
      "",
      routeKey(next),
    );
    setOverlay(null);
    setRoute(next);
  }
  function back() {
    audioManager.playSfx("ui-press");
    if (history.state?.mixorNavigation?.parentKey === routeKey(parent)) {
      history.back();
    } else {
      history.replaceState(
        {
          ...history.state,
          mixorNavigation: { route: parent, trail: parent.trail },
        },
        "",
        routeKey(parent),
      );
      setOverlay(null);
      setRoute(parent);
    }
  }
  async function toggleSound() {
    if (!muted) {
      audioManager.setMuted(true);
      setMuted(true);
      setPref("mixor-muted", true);
    } else {
      const started = await audioManager.enable();
      setMuted(!started);
      setPref("mixor-muted", !started);
      if (!started)
        setToast(
          "Звук не запустился. Можно продолжить в тишине и попробовать ещё раз.",
        );
    }
  }
  function enter(withSound: boolean) {
    setEntered(true);
    setPref("mixor-entered-v2", true);
    if (withSound) void toggleSound();
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else
        setToast(
          "Этот браузер не поддерживает полноэкранный режим. Игра работает в обычной вкладке.",
        );
    } catch {
      setToast(
        "Браузер не разрешил полноэкранный режим. Можно играть в этой вкладке.",
      );
    }
  }
  function closeOverlay() {
    if (
      overlay === "capture" &&
      !window.confirm("Закрыть несохранённый черновик?")
    )
      return;
    setOverlay(null);
  }
  const question = "Какая форма заметна на этом снимке?";
  const isNetworkPhoto =
    photo &&
    ["physarum-blob", "physarum-petri", "physarum-plasmodium"].includes(
      photo.id,
    );
  const explanation =
    answer === "Не различаю"
      ? "Это тоже наблюдение. По одному фото не всегда видны детали: сравни другой ракурс или увеличь кадр. Отсутствие видимого признака не доказывает его отсутствие."
      : isNetworkPhoto
        ? "На этом кадре плазмодий распластан по поверхности. Ищи соединяющиеся участки и разветвления; отдельные споры и ядра на таком фото не различить."
        : `Ты отметил(а): «${answer}». ${photo?.caption ?? "Сравни форму на разных снимках."} Форма и цвет помогают описать наблюдение, но сами по себе не доказывают вид или стадию.`;
  function saveDiscovery() {
    if (!answer || !photo || !real) return;
    const record: Discovery = {
      id: `study:${taxon.id}:${photo.id}`,
      taxonId: taxon.id,
      mediaId: photo.id,
      question,
      answer,
      note: explanation,
      createdAt: new Date().toISOString(),
    };
    const next = {
      ...journey,
      discoveries: [
        record,
        ...journey.discoveries.filter((item) => item.id !== record.id),
      ],
    };
    if (!writeJourney(next)) {
      setToast(
        "Не удалось сохранить открытие. Ответ остаётся здесь — попробуйте ещё раз.",
      );
      return;
    }
    setJourney(next);
    audioManager.playSfx("save-local");
    go("journal");
    setDetail(record);
  }
  function reveal(id: string) {
    if (finds.includes(id)) return;
    const next = [...finds, id];
    setFinds(next);
    if (!writeFinds(next)) setSearchSessionOnly(true);
    audioManager.playSfx("uncover");
  }
  function openLifePhotos() {
    setPhotoIndex(
      Math.max(
        0,
        taxon.media.findIndex((item) => item.id === stagePhoto?.id),
      ),
    );
    setOverlay("photos");
  }
  return (
    <div
      className={`game ${calm ? "calm" : ""} scene-${route.place}`}
      onClick={(event) => {
        // Circle actions choose their own uncover/inspection cue. Other plain
        // controls use the common tap cue (deduplicated by AudioManager).
        if (
          !muted &&
          event.target instanceof Element &&
          event.target.closest("button") &&
          !event.target.closest(".hiding-place")
        )
          audioManager.playSfx("ui-press");
      }}
    >
      <div className="forest-background" aria-hidden="true" />
      <div className="forest-shade" aria-hidden="true" />
      {route.place === "home" && (
        <header className="hud">
          <button
            className="brand"
            onClick={() => go("home")}
            aria-label="Mixor — главный экран"
          >
            <Icon name="leaf" />
            <span>mixor</span>
          </button>
          <span className="hud-location">ТАЙНАЯ ЖИЗНЬ ЛЕСА</span>
          <div className="hud-tools">
            <button
              className="icon-button"
              onClick={() => void toggleSound()}
              aria-label={muted ? "Включить звук" : "Выключить звук"}
              aria-pressed={!muted}
            >
              <Icon name={muted ? "mute" : "sound"} />
            </button>
            <button
              className="icon-button"
              onClick={() => setOverlay("settings")}
              aria-label="Настройки"
            >
              <Icon name="settings" />
            </button>
            <button
              className="icon-button fullscreen-button"
              onClick={() => void toggleFullscreen()}
              aria-label={
                fullscreen ? "Выйти из полного экрана" : "Полный экран"
              }
              aria-pressed={fullscreen}
            >
              <Icon name="expand" />
            </button>
          </div>
        </header>
      )}

      <main
        className="scene"
        aria-label={
          route.place === "home"
            ? "Выбор занятия"
            : route.place === "woods"
              ? "Места поиска"
              : route.place === "species"
                ? "Выбор вида"
                : route.place === "world"
                  ? "Лесная поляна"
                  : route.place === "life"
                    ? "Развитие"
                    : route.place === "tree"
                      ? "Дерево видов"
                      : route.place === "journal"
                        ? "Полевой журнал"
                        : "Рассматривание организма"
        }
      >
        {!["home", "world", "life"].includes(route.place) && (
          <BackButton back={back} label={backLabel(parent)} />
        )}
        {route.place === "home" && (
          <ActivityHome choose={(place) => go(place)} />
        )}
        {route.place === "woods" && (
          <WoodlandChooser
            finds={finds}
            sessionOnly={searchSessionOnly}
            choose={(id) => go("world", taxon.id, id)}
          />
        )}
        {route.place === "species" && (
          <SpeciesChooser
            choose={(id) => go("life", id, "spore")}
            visited={journey.visited}
          />
        )}
        {route.place === "world" && (
          <SearchScene
            key={route.stage}
            woodland={findWoodland(route.stage)}
            finds={finds}
            reveal={reveal}
            inspect={(id, findId) => go("portrait", id, "spore", false, findId)}
            change={(id) => go("world", taxon.id, id)}
            back={back}
          />
        )}
        {route.place === "tree" && (
          <ClassificationTree
            select={(id) => go("portrait", id)}
            sources={() => setOverlay("sources")}
          />
        )}
        {route.place === "portrait" && (
          <section className="portrait-scene">
            <div className="scene-heading">
              <div>
                <p className="eyebrow">
                  {investigating
                    ? "ТВОЁ НАБЛЮДЕНИЕ"
                    : "ЗНАКОМСТВО С ОБИТАТЕЛЕМ"}
                </p>
                <h1>{taxon.commonName}</h1>
                {scientificNames[taxon.id].synonym && (
                  <i className="latin">
                    Также: {scientificNames[taxon.id].synonym}
                  </i>
                )}
              </div>
              <button
                className="icon-button"
                onClick={() => go("tree")}
                aria-label="Выбрать другой вид"
              >
                <Icon name="tree" />
              </button>
            </div>
            <div
              className={`portrait-content ${investigating ? "investigating" : ""}`}
            >
              <div className="specimen-view">
                <MaterialToggle
                  real={real}
                  change={(value) => {
                    setReal(value);
                    if (!value) {
                      setInvestigating(false);
                      setAnswer("");
                    }
                  }}
                />
                <div className="portrait-picture">
                  {real && photo ? (
                    <Photo key={photo.id} photo={photo} />
                  ) : (
                    <Art
                      taxon={taxon.id}
                      label={`${taxon.latinName}. Учебная иллюстрация, созданная с ИИ`}
                    />
                  )}
                </div>
                {real && photo ? (
                  <>
                    <Credit photo={photo} />
                    <div
                      className="photo-select"
                      aria-label="Другие реальные снимки"
                    >
                      {taxon.media.map((item, index) => (
                        <button
                          key={item.id}
                          aria-label={`Фото ${index + 1}`}
                          aria-pressed={index === photoIndex}
                          onClick={() => {
                            setPhotoIndex(index);
                            setAnswer("");
                          }}
                        >
                          <img src={item.src} alt="" />
                          <span>{index + 1}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="material-label">
                    Учебная иллюстрация · создана с ИИ · без масштаба
                  </p>
                )}
              </div>
              <div className="specimen-notes scroll-panel">
                {investigating ? (
                  <>
                    <p className="eyebrow">ПОСМОТРИ ВНИМАТЕЛЬНО</p>
                    <h2>{question}</h2>
                    <p>
                      Увеличь снимок или выбери другой ракурс. Здесь можно
                      сомневаться.
                    </p>
                    <div className="answer-options">
                      {[
                        "Сеть с разветвлениями",
                        "Плодовые тела",
                        "Не различаю",
                      ].map((option) => (
                        <button
                          key={option}
                          aria-pressed={answer === option}
                          onClick={() => {
                            setAnswer(option);
                            audioManager.playSfx("ui-press");
                          }}
                        >
                          <span>{option}</span>
                          {answer === option && <Icon name="check" size={18} />}
                        </button>
                      ))}
                    </div>
                    {answer && (
                      <div className="observation-feedback" aria-live="polite">
                        <p>{explanation}</p>
                        <button className="primary" onClick={saveDiscovery}>
                          <Icon name="book" /> Записать открытие
                        </button>
                      </div>
                    )}
                    <button
                      className="text-button"
                      onClick={() => {
                        setInvestigating(false);
                        setAnswer("");
                      }}
                    >
                      Вернуться к знакомству
                    </button>
                  </>
                ) : (
                  <>
                    <p className="eyebrow">ПРИСМОТРИСЬ</p>
                    <h2>
                      {taxon.id === "physarum"
                        ? "Одна клетка. Целый мир."
                        : "У леса много маленьких тайн."}
                    </h2>
                    <p>{taxon.summary}</p>
                    {real && photo && (
                      <p className="photo-caption">{photo.caption}</p>
                    )}
                    <button
                      className="primary"
                      onClick={() => {
                        setReal(true);
                        setInvestigating(true);
                        audioManager.playSfx("lens-open");
                      }}
                    >
                      <Icon name="lens" /> Сделать открытие
                    </button>
                    <button
                      className="secondary"
                      onClick={() => go("life", taxon.id, "spore")}
                    >
                      <Icon name="cycle" /> Как он развивается?
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setOverlay("sources")}
                    >
                      <Icon name="info" size={18} /> Источники и точность
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {route.place === "life" && stage && (
          <DevelopmentScene
            taxon={taxon}
            cycle={cycle}
            stage={stage}
            index={stageIndex}
            back={back}
            backLabel={backLabel(parent)}
            select={(id) => go("life", taxon.id, id)}
            photos={openLifePhotos}
            details={() => setOverlay("sources")}
          />
        )}
        {route.place === "journal" && (
          <section className="journal-scene">
            <div className="scene-heading">
              <div>
                <p className="eyebrow">СОБРАНО ТОБОЙ</p>
                <h1>Полевой журнал</h1>
              </div>
              <button
                className="secondary"
                aria-label="Добавить свою находку"
                onClick={() => setOverlay("capture")}
              >
                <Icon name="plus" />
                <span>Своя находка</span>
              </button>
            </div>
            <div className="journal-pages scroll-panel">
              {detail ? (
                <article className="discovery-page">
                  <button
                    className="text-button"
                    onClick={() => setDetail(null)}
                  >
                    <Icon name="back" /> Все страницы
                  </button>
                  <p className="eyebrow">
                    УЧЕБНОЕ ОТКРЫТИЕ · СОХРАНЕНО ЛОКАЛЬНО
                  </p>
                  <h2>{getTaxon(detail.taxonId).commonName}</h2>
                  <img
                    className="journal-photo"
                    src={getMedia(detail.mediaId).src}
                    alt={getMedia(detail.mediaId).alt}
                  />
                  <Credit photo={getMedia(detail.mediaId)} />
                  <h3>{detail.question}</h3>
                  <p className="written-answer">«{detail.answer}»</p>
                  <p>{detail.note}</p>
                  <button
                    className="primary"
                    onClick={() => go("life", detail.taxonId, "spore")}
                  >
                    <Icon name="cycle" /> Продолжить исследование
                  </button>
                  <p className="fineprint">
                    Учебный материал из атласа, не ваша находка в природе.
                  </p>
                </article>
              ) : (
                <>
                  <div className="journal-intro">
                    <Icon name="book" size={36} />
                    <div>
                      <h2>
                        {journey.discoveries.length
                          ? "Маленькие открытия остаются."
                          : "Первая страница ждёт тебя."}
                      </h2>
                      <p>
                        Рассмотри настоящее фото, отметь, что видишь, и сохрани
                        наблюдение.
                      </p>
                    </div>
                  </div>
                  <div className="journal-entries">
                    {journey.discoveries.map((item) => (
                      <button
                        key={item.id}
                        className="journal-entry"
                        onClick={() => setDetail(item)}
                      >
                        <Art
                          taxon={item.taxonId}
                          label="Учебная иллюстрация ИИ"
                        />
                        <span>
                          <small>УЧЕБНОЕ ОТКРЫТИЕ · ЛОКАЛЬНО</small>
                          <strong>{getTaxon(item.taxonId).commonName}</strong>
                          <span>{item.answer}</span>
                        </span>
                        <Icon name="next" />
                      </button>
                    ))}
                  </div>
                  {!journey.discoveries.length && (
                    <button
                      className="primary"
                      onClick={() => go("portrait", "physarum")}
                    >
                      <Icon name="lens" /> К первому открытию
                    </button>
                  )}
                  <h2 className="own-findings-title">Свои находки</h2>
                  <p className="fineprint">
                    Только на этом устройстве. Облачная синхронизация ещё не
                    подключена.
                  </p>
                  {journalError && <p role="alert">{journalError}</p>}
                  {observations.length ? (
                    observations.map((record) => (
                      <article className="own-observation" key={record.id}>
                        <h3>{record.title}</h3>
                        <p>
                          {record.observedAt} · {record.locationLabel}
                        </p>
                        <p>{record.note}</p>
                        <div className="capture-previews">
                          {record.photos
                            .filter((p) => p.blob instanceof Blob)
                            .map((file, i) => (
                              <BlobPhoto
                                key={i}
                                blob={file.blob}
                                name={file.name}
                              />
                            ))}
                        </div>
                        <small>
                          {record.photos.length
                            ? "Оригиналы фото сохранены локально"
                            : "Заметка сохранена локально · без фото"}
                        </small>
                      </article>
                    ))
                  ) : (
                    <p>
                      Пока нет записей. Вид и точное место можно не указывать.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Закрыть сообщение"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {!entered && (
        <Panel
          title="Добро пожаловать в микромир"
          close={() => enter(false)}
          wide
        >
          <div className="welcome">
            <p className="eyebrow">MIXOR · ЛЕСНАЯ ЭКСПЕДИЦИЯ</p>
            <h1>
              Большие открытия
              <br />
              маленького мира.
            </h1>
            <p>
              Исследуй обитателей бревна, проследи их развитие и собери свой
              полевой журнал.
            </p>
            <button className="primary" onClick={() => enter(true)}>
              <Icon name="sound" /> Начать со звуками леса
            </button>
            <button className="secondary" onClick={() => enter(false)}>
              Начать в тишине
            </button>
            <p className="fineprint">
              Без таймеров и штрафов. Все восемь видов открыты сразу.
            </p>
          </div>
        </Panel>
      )}
      {overlay === "capture" && (
        <Panel title="Новая находка" close={closeOverlay}>
          <Capture
            saved={(record) => {
              setObservations((current) => [record, ...current]);
              setOverlay(null);
              go("journal");
              setToast(
                record.photos.length
                  ? "Находка и оригиналы фото сохранены на этом устройстве."
                  : "Заметка без фото сохранена на этом устройстве.",
              );
            }}
          />
        </Panel>
      )}
      {overlay === "photos" && (
        <Panel title={taxon.latinName} close={closeOverlay} wide>
          <div className="photo-peek-content">
            <p className="peek-context">
              {photo.id === stagePhoto?.id
                ? "Настоящее фото этой стадии · другой экземпляр"
                : "Фото вида, не выбранного этапа развития. Это не последовательность одного экземпляра."}
            </p>
            <div className="peek-photo">
              <Photo key={photo.id} photo={photo} />
            </div>
            <Credit photo={photo} />
            <p className="peek-caption">{photo.caption}</p>
            <div className="photo-select" aria-label="Реальные фотографии">
              {taxon.media.map((item, i) => (
                <button
                  key={item.id}
                  aria-label={`Фото ${i + 1}`}
                  aria-pressed={i === photoIndex}
                  onClick={() => setPhotoIndex(i)}
                >
                  <img src={item.src} alt="" />
                  <span>{i + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </Panel>
      )}
      {overlay === "settings" && (
        <Panel title="Настроить тишину" close={closeOverlay}>
          <p>
            Музыка едва заметна. Лес — ветер, листья и редкие птицы — звучит
            ближе.
          </p>
          <button className="secondary" onClick={() => void toggleSound()}>
            <Icon name={muted ? "sound" : "mute"} />
            {muted ? "Включить звуки леса" : "Выключить весь звук"}
          </button>
          <div className="sound-sliders">
            {(
              [
                ["music", "Музыка"],
                ["nature", "Ветер и птицы"],
                ["effects", "Касания и инструменты"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <span>
                  {label}
                  <output>{levels[key]}%</output>
                </span>
                <input
                  aria-label={label}
                  type="range"
                  min="0"
                  max="100"
                  value={levels[key]}
                  onChange={(event) =>
                    setLevels((current) => ({
                      ...current,
                      [key]: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={calm}
              onChange={(event) => {
                setCalm(event.target.checked);
                setPref("mixor-calm-v2", event.target.checked);
              }}
            />{" "}
            Спокойное движение
          </label>
          <button className="secondary" onClick={() => void toggleFullscreen()}>
            <Icon name="expand" />
            {fullscreen ? "Выйти из полного экрана" : "На весь экран"}
          </button>
          <p className="fineprint">
            При скрытии вкладки звук приостанавливается. Открытие окон не
            прерывает музыку. После перезагрузки звук включается только
            нажатием. Фон и иллюстрации созданы с ИИ; аудио — ElevenLabs. Это
            локальная игровая версия.
          </p>
        </Panel>
      )}
      {overlay === "sources" && (
        <Panel
          title={
            route.place === "tree"
              ? "О дереве и изображениях"
              : "Источники и точность"
          }
          close={closeOverlay}
        >
          <h3>{taxon.latinName}</h3>
          <p>{taxon.notice}</p>
          <p>{taxon.habitat}</p>
          <p>
            Основные изображения созданы с ИИ для исследования форм. Это не
            снимки реальных экземпляров и не определитель. Названия — научные;
            синонимы сохранены для сопоставления с подписями источников.
          </p>
          {route.place === "tree" && (
            <>
              <h3>Выбранная классификация</h3>
              <p>
                Myxomycetes → подклассы → порядки → семейства → роды → виды.
                Основа: Leontyev et al. (2019), пересмотры 2023, 2025 и 2026
                годов; проверено 10.09.2026. Это ветви классификации, а не
                дерево с измеренными эволюционными расстояниями. Остальные виды
                и группы не показаны.
              </p>
              <p>
                Badhamia polycephala — также известна как Physarum polycephalum.
                Hemitrichia decipiens — ранее Trichia decipiens. Подписи
                настоящих фотографий сохраняют название исходного автора.
                Классификации баз данных могут отличаться от этих публикаций.
              </p>
              <p>{scientificNames.stemonitis.placementNote}</p>
              <ul className="source-links">
                {taxonomySources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          {route.place === "life" && cycle && (
            <>
              <h3>Область применимости</h3>
              <p>{cycle.scopeNote}</p>
              <h3>{stage?.label}</h3>
              <p>{stage?.description}</p>
              <h3>Переходы</h3>
              <ul>
                {cycle.transitions.map((transition, i) => (
                  <li key={i}>
                    {
                      cycle.stages.find((s) => s.id === transition.from)
                        ?.shortLabel
                    }{" "}
                    →{" "}
                    {
                      cycle.stages.find((s) => s.id === transition.to)
                        ?.shortLabel
                    }
                    : {transition.label}
                    {transition.optional ? " (возможная ветвь)" : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3>Научные источники</h3>
          <ul className="source-links">
            {Array.from(
              new Set([
                ...taxon.sourceRefs,
                ...(route.place === "life" ? (cycle?.sourceUrls ?? []) : []),
              ]),
            ).map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {new URL(url).hostname} — открыть источник ↗
                </a>
              </li>
            ))}
          </ul>
          <h3>Настоящие фотографии</h3>
          {taxon.media.map((item) => (
            <div className="source-photo" key={item.id}>
              <img src={item.src} alt={item.alt} />
              <div>
                <p>{item.caption}</p>
                <Credit photo={item} />
              </div>
            </div>
          ))}
          <h3>Учебные реконструкции</h3>
          <p>
            Учебные реконструкции созданы с ИИ, это не снимки экземпляров и не
            документальная последовательность развития. Источники сведений о
            форме организмов и авторство настоящих фотографий приведены выше.
          </p>
          <details className="archived-art-sources">
            <summary>Предыдущие иллюстрации: источники и лицензии</summary>
            <p>
              В прежней серии плодовые тела Physarum уточнялись по снимку Katja
              Schulz. Эта архивная переработка с ИИ использует CC BY 4.0.
            </p>
            <Credit photo={getMedia("physarum-macro")} />
            <p>
              Три прежних портрета перерабатывали фотографии Trichia decipiens и
              Tubifera ferruginosa (Björn S…, CC BY-SA 2.0) и Didymium
              squamulosum (Thomas Laxton, CC BY-SA 4.0). Для этих архивных
              переработок сохраняется лицензия CC BY-SA 4.0.
            </p>
            <div className="source-links">
              {[
                "trichia-portrait",
                "tubifera-portrait",
                "didymium-portrait",
              ].map((id) => (
                <Credit key={id} photo={getMedia(id)} />
              ))}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                Лицензия архивных переработок: CC BY-SA 4.0
              </a>
            </div>
          </details>
        </Panel>
      )}
      {overlay === "branches" && (
        <Panel title="У жизни бывают развилки" close={closeOverlay}>
          <p>
            Цикл — не расписание. Условия среды могут направить жизнь по другому
            пути.
          </p>
          <h3>Амёба ↔ клетка со жгутиками</h3>
          <p>
            В свободной воде возможна плавающая форма. Амёбная клетка также
            может переждать неблагоприятные условия в защитной цисте.
          </p>
          <h3>Плазмодий ↔ покой</h3>
          <p>{cycle?.stages.find((item) => item.id === "rest")?.description}</p>
          <p className="fineprint">{cycle?.scopeNote}</p>
          <button
            className="secondary"
            onClick={() => {
              setOverlay(null);
              go("life", taxon.id, "network");
            }}
          >
            Вернуться к плазмодию
          </button>
          <ul className="source-links">
            {cycle?.sourceUrls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {new URL(url).hostname} — источник ↗
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
