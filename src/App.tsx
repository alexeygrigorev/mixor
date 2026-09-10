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

type Place = "world" | "tree" | "portrait" | "life" | "journal";
type Route = { place: Place; taxon: TaxonId; stage: string };
type Overlay = "settings" | "sources" | "capture" | "branches" | null;
function readRoute(): Route {
  const [place, taxon, stage] = location.hash.slice(1).split("/");
  return {
    place: ["world", "tree", "portrait", "life", "journal"].includes(place)
      ? (place as Place)
      : "world",
    taxon: taxa.some((t) => t.id === taxon) ? (taxon as TaxonId) : "physarum",
    stage: stage || "spore",
  };
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
    <div className="material-switch" role="group" aria-label="Тип изображения">
      <button aria-pressed={!real} onClick={() => change(false)}>
        Иллюстрация
      </button>
      <button aria-pressed={real} onClick={() => change(true)}>
        <Icon name="camera" size={18} /> Настоящее фото
      </button>
    </div>
  );
}
function Credit({ photo }: { photo: MediaItem }) {
  return (
    <p className="photo-credit">
      <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
        {photo.author} · Wikimedia Commons
      </a>{" "}
      ·{" "}
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
  const [grove, setGrove] = useState(0);
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

  useEffect(() => {
    const update = () => setRoute(readRoute());
    const full = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("hashchange", update);
    document.addEventListener("fullscreenchange", full);
    return () => {
      window.removeEventListener("hashchange", update);
      document.removeEventListener("fullscreenchange", full);
    };
  }, []);
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
    audioManager.setQuiet(overlay === "capture");
    return () => audioManager.setQuiet(false);
  }, [overlay]);
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
  ) {
    audioManager.playSfx(place === "journal" ? "journal-open" : "ui-press");
    setDetail(null);
    requestedReal.current = showPhoto;
    setReal(showPhoto);
    location.hash = `${place}/${id}/${at}`;
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
  const brief: Record<string, string> = {
    spore:
      "Спора — маленькая клетка в защитной оболочке. При подходящих условиях из неё выходит подвижная клетка.",
    cells:
      "Амёбная клетка ползает и ест бактерии. В свободной воде возможна форма со жгутиками — она может плавать.",
    fusion:
      "Две совместимые клетки сливаются в одну. В половом цикле из неё вырастает плазмодий.",
    network:
      taxon.id === "arcyria"
        ? "Одна клетка растёт, образуя жилки и веера. Для культуры этого вида описан белый плазмодий."
        : "Эта жёлтая сеть — одна большая клетка с множеством ядер. Плазмодий распространяется по поверхности и питается.",
    fruit:
      "Плазмодий образует плодовые тела со спорами. Споры рассеиваются — и цикл может начаться снова.",
  };
  const nav: { place: Place | "capture"; label: string; icon: IconName }[] = [
    { place: "world", label: "Лес", icon: "leaf" },
    { place: "tree", label: "Дерево", icon: "tree" },
    { place: "life", label: "Развитие", icon: "cycle" },
    { place: "journal", label: "Журнал", icon: "book" },
    { place: "capture", label: "Находка", icon: "plus" },
  ];
  return (
    <div className={`game ${calm ? "calm" : ""} scene-${route.place}`}>
      <div className="forest-background" aria-hidden="true" />
      <div className="forest-shade" aria-hidden="true" />
      <header className="hud">
        <button
          className="brand"
          onClick={() => go("world")}
          aria-label="Mixor — в лес"
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
            aria-label={fullscreen ? "Выйти из полного экрана" : "Полный экран"}
            aria-pressed={fullscreen}
          >
            <Icon name="expand" />
          </button>
        </div>
      </header>

      <main
        className="scene"
        aria-label={
          route.place === "world"
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
        {route.place === "world" && (
          <section className="woodland">
            <div className="world-heading">
              <p className="eyebrow">МАЛЕНЬКАЯ ЭКСПЕДИЦИЯ</p>
              <h1>
                Лес ближе,
                <br />
                <em>чем кажется.</em>
              </h1>
              <p>
                Коснись обитателя бревна.
                <br />У каждой формы — своя история.
              </p>
            </div>
            <button
              className="grove-switch"
              onClick={() =>
                setGrove((value) => (value + 1) % Math.ceil(taxa.length / 4))
              }
            >
              <span>
                {grove === 0 ? "Мшистое бревно" : "Под опавшей листвой"}
              </span>
              <span>
                {grove + 1} / {Math.ceil(taxa.length / 4)}{" "}
                <Icon name="next" size={18} />
              </span>
            </button>
            <div className="specimen-landmarks">
              {taxa.slice(grove * 4, grove * 4 + 4).map((item, index) => (
                <button
                  key={item.id}
                  className={`specimen specimen-${index}`}
                  onClick={() => go("portrait", item.id)}
                  aria-label={`Рассмотреть: ${item.commonName}`}
                >
                  <span className="specimen-halo">
                    <Art
                      taxon={item.id}
                      label={`${item.latinName}, иллюстрация ИИ`}
                    />
                    {journey.discoveries.some(
                      (discovery) => discovery.taxonId === item.id,
                    ) && (
                      <span className="specimen-stamp">
                        <Icon name="check" size={16} />
                      </span>
                    )}
                  </span>
                  <span className="specimen-name">
                    {item.commonName}
                    <Icon name="lens" size={16} />
                  </span>
                </button>
              ))}
            </div>
            <button
              className="world-tool journal-landmark"
              onClick={() => go("journal")}
            >
              <Icon name="book" size={28} />
              <span>
                Полевой журнал
                <small>
                  {journey.discoveries.length
                    ? `${journey.discoveries.length} учебных открытий`
                    : "Здесь будут твои открытия"}
                </small>
              </span>
            </button>
            <button
              className="world-tool lens-landmark"
              onClick={() => go("portrait", taxon.id, route.stage, true)}
            >
              <Icon name="lens" size={28} />
              <span>
                Рассмотреть<small>Рисунок и настоящее фото</small>
              </span>
            </button>
            <button
              className="life-invitation"
              onClick={() => go("life", "physarum", "spore")}
            >
              <Icon name="cycle" />
              <span>
                От споры до живой сети<small>Исследовать развитие</small>
              </span>
              <Icon name="next" />
            </button>
            <span className="world-art-label">
              Рисованный мир · иллюстрации ИИ
            </span>
          </section>
        )}

        {route.place === "tree" && (
          <section className="tree-scene">
            <div className="scene-heading">
              <div>
                <p className="eyebrow">АТЛАС МИКРОМИРА</p>
                <h1>Дерево знакомств</h1>
              </div>
              <button
                className="text-button"
                onClick={() => setOverlay("sources")}
              >
                <Icon name="info" /> О дереве
              </button>
            </div>
            <p className="tree-explanation">
              Восемь разных форм. Выбери веточку, чтобы познакомиться.
            </p>
            <div className="tree-scroll">
              <div className="taxonomy-root">
                <Icon name="tree" />
                <span>
                  Эукариоты <b>›</b> Amoebozoa <b>›</b> Myxogastria
                  <small>Упрощённая классификация · не стадии развития</small>
                </span>
              </div>
              <div className="taxon-branches">
                {taxa.map((item) => (
                  <button
                    className="taxon-branch"
                    key={item.id}
                    onClick={() => go("portrait", item.id)}
                  >
                    <Art
                      taxon={item.id}
                      label={`${item.latinName}: иллюстрация ИИ`}
                    />
                    <span className="branch-name">
                      {item.commonName}
                      <i>{item.latinName}</i>
                    </span>
                    {journey.discoveries.some((d) => d.taxonId === item.id) && (
                      <span className="branch-check">
                        <Icon name="check" size={18} /> изучено
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="fineprint tree-footnote">
                Промежуточные ранги опущены. Ветви не обозначают степень
                родства. Русские названия — описательные; рисунки созданы с ИИ.
              </p>
            </div>
          </section>
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
                <i className="latin">{taxon.latinName}</i>
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

        {route.place === "life" && (
          <section className="life-scene">
            <div className="scene-heading">
              <div>
                <p className="eyebrow">ТЕАТР МАЛЕНЬКИХ ПРЕВРАЩЕНИЙ</p>
                <h1>Развитие</h1>
                <button className="taxon-link" onClick={() => go("portrait")}>
                  <span>{taxon.commonName}</span>
                  <i>{taxon.latinName}</i>
                  <Icon name="next" size={16} />
                </button>
              </div>
              <button
                className="icon-button"
                onClick={() => setOverlay("sources")}
                aria-label="Источники развития"
              >
                <Icon name="info" />
              </button>
            </div>
            {stage && cycle ? (
              <>
                <div className="life-content">
                  <div className="stage-visual">
                    <MaterialToggle real={real} change={setReal} />
                    <div
                      className="stage-picture"
                      key={`${taxon.id}/${stage.id}/${real}`}
                    >
                      {real ? (
                        stagePhoto ? (
                          <Photo photo={stagePhoto} />
                        ) : (
                          <div className="missing-photo">
                            <Icon name="camera" size={36} />
                            <h2>Фото этой стадии пока нет</h2>
                            <p>
                              Не будем подменять его другим видом или стадией.
                            </p>
                            <button
                              className="secondary"
                              onClick={() => setReal(false)}
                            >
                              Вернуться к иллюстрации
                            </button>
                          </div>
                        )
                      ) : (
                        <Art
                          taxon={taxon.id}
                          stage={stage.illustration}
                          label={`${stage.label}. Учебная иллюстрация ИИ`}
                        />
                      )}
                    </div>
                    {real && stagePhoto ? (
                      <Credit photo={stagePhoto} />
                    ) : (
                      <p className="material-label">
                        {real
                          ? "Проверенного снимка нет в подборке"
                          : "Учебная иллюстрация · создана с ИИ · разные масштабы"}
                      </p>
                    )}
                  </div>
                  <div
                    key={`${taxon.id}/${stage.id}`}
                    className="stage-notes scroll-panel"
                  >
                    <p className="stage-number">
                      ГЛАВА 0{stageIndex + 1} <span>/ 0{stages.length}</span>
                    </p>
                    <h2>{stage.label}</h2>
                    <p>{brief[stage.id] || stage.description}</p>
                    <span className="scope-badge">
                      {taxon.id === "physarum"
                        ? "Упрощённый половой цикл"
                        : "Схема группы · пример Arcyria"}
                    </span>
                    <button
                      className="text-button"
                      onClick={() => setOverlay("branches")}
                    >
                      <Icon name="cycle" size={18} /> А если условия изменятся?
                    </button>
                    <button
                      className="secondary"
                      onClick={() =>
                        go("portrait", taxon.id, route.stage, true)
                      }
                    >
                      Сравнить с организмом
                    </button>
                  </div>
                </div>
                <div className="life-controls">
                  <div className="stage-trail" aria-label="Стадии развития">
                    {stages.map((item, index) => (
                      <button
                        key={item.id}
                        aria-current={index === stageIndex ? "step" : undefined}
                        onClick={() => go("life", taxon.id, item.id)}
                      >
                        <span className="stage-dot">
                          {index === stageIndex ? (
                            index + 1
                          ) : journey.visited.includes(
                              `${taxon.id}/${item.id}`,
                            ) ? (
                            <Icon name="check" size={16} />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span>{item.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                  <div className="stage-stepper">
                    <button
                      className="secondary"
                      disabled={stageIndex === 0}
                      onClick={() =>
                        go("life", taxon.id, stages[stageIndex - 1].id)
                      }
                    >
                      <Icon name="back" size={18} /> Назад
                    </button>
                    <span className="stage-progress">
                      {viewed} из {stages.length} стадий открыто
                      <small>Без шкалы времени</small>
                    </span>
                    <button
                      className="primary"
                      onClick={() =>
                        go(
                          "life",
                          taxon.id,
                          stages[(stageIndex + 1) % stages.length].id,
                        )
                      }
                    >
                      {stageIndex === stages.length - 1
                        ? "К новым спорам"
                        : "Дальше"}
                      <Icon
                        name={
                          stageIndex === stages.length - 1 ? "cycle" : "next"
                        }
                        size={18}
                      />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="cycle-gap">
                <Art
                  taxon={taxon.id}
                  label={`${taxon.latinName}, иллюстрация ИИ`}
                />
                <div>
                  <h2>Эта история ещё собирается</h2>
                  <p>
                    Для {taxon.latinName} отдельная серия стадий пока не
                    подготовлена. Можно рассмотреть реальные фотографии или
                    изучить проверенный пример Physarum.
                  </p>
                  <button
                    className="primary"
                    onClick={() => go("life", "physarum", "spore")}
                  >
                    Развитие Physarum <Icon name="next" />
                  </button>
                  <button className="secondary" onClick={() => go("portrait")}>
                    Вернуться к организму
                  </button>
                  <p className="material-label">Портрет · иллюстрация ИИ</p>
                </div>
              </div>
            )}
          </section>
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

      <nav className="game-nav" aria-label="Игровые инструменты">
        {nav.map((item) => (
          <button
            key={item.place}
            aria-current={route.place === item.place ? "page" : undefined}
            onClick={() =>
              item.place === "capture" ? setOverlay("capture") : go(item.place)
            }
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
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
            При скрытии вкладки и добавлении находки звук приостанавливается.
            После перезагрузки звук включается только нажатием. Фон и
            иллюстрации созданы с ИИ; аудио — ElevenLabs. Это локальная игровая
            версия.
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
            снимки реальных экземпляров и не определитель. Русские названия
            описательные.
          </p>
          {route.place === "tree" && (
            <p>
              Дерево показывает общий путь Эукариоты → Amoebozoa → Myxogastria и
              восемь примеров видов. Промежуточные ранги опущены, порядок ветвей
              не отражает близость родства.
            </p>
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
          <h3>Источники рисованной серии</h3>
          <p>
            Плодовые тела Physarum в серии развития уточнены по снимку Katja
            Schulz. Это переработка с ИИ по CC BY 4.0, а не фотография.
          </p>
          <Credit photo={getMedia("physarum-macro")} />
          <p>
            Три портрета уточнены по фотографиям Trichia decipiens и Tubifera
            ferruginosa (Björn S…, CC BY-SA 2.0) и Didymium squamulosum (Thomas
            Laxton, CC BY-SA 4.0). Рисованная серия — переработка с ИИ,
            распространяемая по{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY-SA 4.0
            </a>
            .
          </p>
          <div className="source-links">
            {["trichia-portrait", "tubifera-portrait", "didymium-portrait"].map(
              (id) => (
                <Credit key={id} photo={getMedia(id)} />
              ),
            )}
          </div>
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
