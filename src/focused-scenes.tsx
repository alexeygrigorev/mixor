import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Art } from "./art";
import { Icon, type IconName } from "./icons";
import { taxa, type TaxonId, type Taxon } from "./data";
import {
  stageBrief,
  stageSequence,
  type LifeCycle,
  type LifeStage,
} from "./life-data";
import { woodlands, type Woodland } from "./search-data";
import { scientificNames, taxonomyTree, type TaxonomyNode } from "./taxonomy";
import { SceneWeather } from "./weather";
import { SearchSpecimen, specimenPatchSize, specimenContact } from "./search-specimen";

export function BackButton({
  back,
  label = "Назад",
}: {
  back: () => void;
  label?: string;
}) {
  return (
    <button className="activity-back" onClick={back} aria-label={label}>
      <Icon name="back" />
      <span>Назад</span>
    </button>
  );
}
export function ActivityHome({
  choose,
}: {
  choose: (activity: "woods" | "species" | "tree" | "journal") => void;
}) {
  const activities: {
    id: "woods" | "species" | "tree" | "journal";
    name: string;
    hint: string;
    icon: IconName;
  }[] = [
    {
      id: "woods",
      name: "Найти в лесу",
      hint: "Пять мест, полных маленькой жизни",
      icon: "lens",
    },
    {
      id: "species",
      name: "Развитие",
      hint: "От одной клетки до спор",
      icon: "cycle",
    },
    {
      id: "tree",
      name: "Дерево жизни",
      hint: "Виды и их родственные группы",
      icon: "tree",
    },
    {
      id: "journal",
      name: "Полевой журнал",
      hint: "Твои фотографии и наблюдения",
      icon: "book",
    },
  ];
  return (
    <section className="activity-home">
      <div className="home-title">
        <p className="eyebrow">МИКРОМИР</p>
        <h1>Что исследуем?</h1>
      </div>
      <nav className="activity-choices" aria-label="Занятия">
        {activities.map((a) => (
          <button key={a.id} onClick={() => choose(a.id)}>
            <Icon name={a.icon} size={30} />
            <span>
              {a.name}
              <small>{a.hint}</small>
            </span>
            <Icon name="next" size={20} />
          </button>
        ))}
      </nav>
    </section>
  );
}
export function WoodlandChooser({
  finds,
  choose,
  sessionOnly,
}: {
  finds: string[];
  choose: (id: string) => void;
  sessionOnly: boolean;
}) {
  return (
    <section className="woodland-chooser">
      <div className="chooser-heading">
        <h1>Куда отправимся?</h1>
        <p>
          Ищи маленькие формы среди коры, мха и листьев. Коснись, чтобы
          рассмотреть.
        </p>
      </div>
      <div className="woodland-choices">
        {woodlands.map((w, i) => (
          <button
            key={w.id}
            onClick={() => choose(w.id)}
            aria-label={`Искать: ${w.title}`}
          >
            <img src={w.image} alt="" />
            <span className="woodland-choice-caption">
              <span>
                <small>0{i + 1}</small>
                <strong>{w.title}</strong>
                <span>{w.description}</span>
              </span>
              <span className="find-count" aria-label="Найдено">
                {w.spots.filter((s) => finds.includes(s.id)).length} /{" "}
                {w.spots.length}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="chooser-note">
        Учебные сцены созданы с ИИ; размещение условное, не карта находок. Без
        таймеров и штрафов.
        {sessionOnly &&
          " Прогресс этой вкладки не удалось сохранить на устройстве."}
      </p>
    </section>
  );
}
export function SpeciesChooser({
  choose,
  visited,
}: {
  choose: (id: TaxonId) => void;
  visited: string[];
}) {
  return (
    <section className="species-chooser">
      <div className="chooser-heading">
        <h1>Чью жизнь проследим?</h1>
        <p>От споры через рост одной клетки — к спороношению.</p>
      </div>
      <div className="species-choices">
        {taxa.map((t) => (
          <button
            key={t.id}
            onClick={() => choose(t.id)}
            aria-label={`Развитие: ${t.latinName}`}
          >
            <Art taxon={t.id} label={`${t.latinName}: иллюстрация ИИ`} />
            <span>
              <i>{t.latinName}</i>
              {scientificNames[t.id].synonym && (
                <small>Также: {scientificNames[t.id].synonym}</small>
              )}
              <small>
                {
                  new Set(visited.filter((id) => id.startsWith(`${t.id}/`)))
                    .size
                }{" "}
                / {stageSequence.length} этапов
              </small>
            </span>
            <Icon name="next" size={20} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function SearchScene({
  woodland,
  finds,
  reveal,
  inspect,
  change,
  back,
}: {
  woodland: Woodland;
  finds: string[];
  reveal: (id: string) => void;
  inspect: (taxon: TaxonId, findId: string) => void;
  change: (woodlandId: string) => void;
  back: () => void;
}) {
  const host = useRef<HTMLElement>(null);
  const [size, setSize] = useState({ width: 1536, height: 1024 });
  const [announcement, setAnnouncement] = useState("");
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const magnifier = useRef<HTMLDivElement>(null);
  const dismissButton = useRef<HTMLButtonElement>(null);
  const [lensSize, setLensSize] = useState({ width: 300, height: 370 });
  const selected = woodland.spots.find((spot) => spot.id === selectedId);
  const dismiss = () => {
    setSelectedId(null);
    host.current
      ?.querySelector<HTMLButtonElement>(`[data-find="${selectedId}"]`)
      ?.focus({ preventScroll: true });
  };
  useLayoutEffect(() => {
    if (!selectedId || !magnifier.current) return;
    dismissButton.current?.focus({ preventScroll: true });
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.target.getBoundingClientRect();
      setLensSize({ width: box.width, height: box.height });
    });
    observer.observe(magnifier.current);
    return () => observer.disconnect();
  }, [selectedId]);
  useEffect(() => {
    if (!selectedId) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedId(null);
        host.current
          ?.querySelector<HTMLButtonElement>(`[data-find="${selectedId}"]`)
          ?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [selectedId]);
  useLayoutEffect(() => {
    const el = host.current!;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const worldWidth = Math.max(size.width, size.height * 1.5);
  const worldHeight = worldWidth / 1.5;
  // The clue and its support share the SAME source-to-screen transform.
  // Only the deliberately opened magnifier is clamped into the viewport.
  const project = (spot: Woodland["spots"][number]) => ({
    x: (worldWidth * spot.x) / 100 - (worldWidth - size.width) / 2,
    y: (worldHeight * spot.y) / 100 - (worldHeight - size.height) / 2,
  });
  const origin = selected ? project(selected) : { x: 0, y: 0 };
  const lensLeft = Math.max(
    16,
    Math.min(
      size.width - lensSize.width - 16,
      origin.x < size.width / 2
        ? origin.x + 42
        : origin.x - lensSize.width - 42,
    ),
  );
  const lensTop = Math.max(
    84,
    Math.min(
      size.height - lensSize.height - 16,
      origin.y - lensSize.height / 2,
    ),
  );
  const woodlandIndex = woodlands.findIndex(
    (place) => place.id === woodland.id,
  );
  const previous =
    woodlands[(woodlandIndex + woodlands.length - 1) % woodlands.length];
  const next = woodlands[(woodlandIndex + 1) % woodlands.length];
  return (
    <section
      ref={host}
      className="search-scene"
      aria-label={`${woodland.title}: поиск миксомицетов`}
    >
      <div
        className="search-world"
        style={{ width: worldWidth, height: worldWidth / 1.5 }}
      >
        <img
          className="search-environment"
          src={woodland.image}
          alt=""
          onError={() => setFailed(true)}
        />
      </div>
      <SceneWeather weather={woodland.weather} />
      {woodland.spots.map((spot) => {
        const found = finds.includes(spot.id);
        const point = project(spot);
        const isSelected = spot.id === selectedId;
        return (
          <button
            key={spot.id}
            data-find={spot.id}
            className={`hiding-place ${found ? "is-found" : ""} ${isSelected ? "is-selected" : ""}`}
            aria-label={
              found
                ? `Рассмотреть находку: ${scientificNames[spot.taxon].name}`
                : `Осмотреть: ${spot.label}`
            }
            aria-pressed={found}
            aria-expanded={isSelected}
            aria-controls={isSelected ? "search-magnifier" : undefined}
            aria-describedby="search-material"
            style={{
              left: point.x,
              top: point.y,
            }}
            onClick={() => {
              if (!found) {
                reveal(spot.id);
                setAnnouncement(
                  `Найдено: ${scientificNames[spot.taxon].name}. Открыто увеличение.`,
                );
              }
              setSelectedId(spot.id);
            }}
          >
            {spot.visibleClue !== false && (
              <span
                className="search-clue"
                aria-hidden="true"
                style={{
                  width: worldWidth * specimenPatchSize(spot) / 1536,
                  transform: `translate(-${specimenContact(spot)[0]}%, -${specimenContact(spot)[1]}%)`,
                }}
              >
                <SearchSpecimen woodland={woodland} spot={spot} />
              </span>
            )}
          </button>
        );
      })}
      {selected && (
        <>
          <svg className="search-origin-line" aria-hidden="true">
            <line
              x1={origin.x}
              y1={origin.y}
              x2={lensLeft + lensSize.width / 2}
              y2={lensTop + lensSize.height / 2}
            />
          </svg>
          <div
            ref={magnifier}
            className="search-magnifier"
            id="search-magnifier"
            role="dialog"
            aria-modal="false"
            aria-label={scientificNames[selected.taxon].name}
            style={{ left: lensLeft, top: lensTop }}
          >
            <div className="search-magnified-image">
              <SearchSpecimen
                woodland={woodland}
                spot={selected}
                label={`${scientificNames[selected.taxon].name}: увеличение, иллюстрация ИИ`}
              />
              <button
                ref={dismissButton}
                className="search-dismiss"
                onClick={dismiss}
                aria-label="Закрыть увеличение"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="search-magnified-caption">
              <i>{scientificNames[selected.taxon].name}</i>
              <button
                className="search-learn"
                onClick={() => inspect(selected.taxon, selected.id)}
              >
                Узнать больше <Icon name="next" size={20} />
              </button>
            </div>
          </div>
        </>
      )}
      <BackButton back={back} label="Назад к выбору места" />
      <nav
        className="search-places"
        aria-label={`Места поиска. Сейчас: ${woodland.title}`}
      >
        <button
          onClick={() => change(previous.id)}
          aria-label={`Предыдущее место: ${previous.title}`}
        >
          <Icon name="back" size={20} />
        </button>
        <span aria-label={`Место ${woodlandIndex + 1} из ${woodlands.length}`}>
          {woodlandIndex + 1} / {woodlands.length}
        </span>
        <button
          onClick={() => change(next.id)}
          aria-label={`Следующее место: ${next.title}`}
        >
          <Icon name="next" size={20} />
        </button>
      </nav>
      <span className="sr-only" id="search-material">
        Коснись детали, чтобы рассмотреть организм в увеличении. Сведения — по
        кнопке «Узнать больше». Закрыть увеличение — Escape.
      </span>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {failed && (
        <p className="search-error" role="alert">
          Лес не загрузился. Вернись и открой это место ещё раз.
        </p>
      )}
    </section>
  );
}

export function DevelopmentScene({
  taxon,
  cycle,
  stage,
  index,
  back,
  backLabel,
  select,
  photos,
  details,
}: {
  taxon: Taxon;
  cycle: LifeCycle;
  stage: LifeStage;
  index: number;
  back: () => void;
  backLabel: string;
  select: (id: string) => void;
  photos: () => void;
  details: () => void;
}) {
  const stages = cycle.stages.filter((s) => s.id !== "rest");
  const rail = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const pickerButton = useRef<HTMLButtonElement>(null);
  const [pickingStage, setPickingStage] = useState(false);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!pickingStage) return;
    const selected = rail.current?.querySelector<HTMLElement>(
      '[aria-current="step"]',
    );
    if (selected && rail.current) {
      rail.current.scrollLeft =
        selected.offsetLeft -
        rail.current.offsetWidth / 2 +
        selected.offsetWidth / 2;
      selected.focus({ preventScroll: true });
    }
  }, [stage.id, pickingStage]);
  useEffect(() => {
    if (!pickingStage) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !controls.current?.contains(event.target)
      )
        setPickingStage(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [pickingStage]);
  function closePicker() {
    setPickingStage(false);
    pickerButton.current?.focus({ preventScroll: true });
  }
  return (
    <section
      className="development-focus"
      aria-label={`Развитие ${taxon.latinName}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && pickingStage) {
          event.preventDefault();
          closePicker();
        }
      }}
    >
      <div className="development-top">
        <BackButton back={back} label={backLabel} />
        <i className="development-name">{taxon.latinName}</i>
        <button
          className="quiet-photo"
          onClick={photos}
          aria-label="Посмотреть реальные фотографии"
        >
          <Icon name="camera" size={20} />
          <span>Фото</span>
        </button>
      </div>
      <div
        className="development-image"
        onPointerDown={(event) => {
          gesture.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          if (!gesture.current) return;
          const dx = event.clientX - gesture.current.x,
            dy = event.clientY - gesture.current.y;
          gesture.current = null;
          if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)
            select(
              stages[
                Math.max(
                  0,
                  Math.min(stages.length - 1, index + (dx < 0 ? 1 : -1)),
                )
              ].id,
            );
        }}
        onPointerCancel={() => {
          gesture.current = null;
        }}
      >
        <Art
          key={`${taxon.id}/${stage.id}`}
          taxon={taxon.id}
          stage={stage.illustration}
          label={`${stage.label}. Учебная реконструкция ИИ, не фотография`}
        />
      </div>
      <div className="development-observation">
        <div className="development-caption-space">
          {/* Reserve the tallest caption in this cycle, including font scaling,
              so advancing never moves the controls under a finger. */}
          <div className="development-caption-measure" aria-hidden="true">
            {stages.map((item, itemIndex) => (
              <section key={item.id}>
                <h1>{item.label}</h1>
                <p>{stageBrief[item.id]}</p>
                <span className="model-note-measure">
                  <span>
                    Реконструкция ИИ ·{" "}
                    {itemIndex < stages.findIndex((s) => s.id === "network")
                      ? "схема группы"
                      : "условные форма и цвет"}{" "}
                    · разные масштабы
                  </span>
                  <Icon name="info" size={16} />
                </span>
              </section>
            ))}
          </div>
        <div
          className="development-caption"
          key={`${taxon.id}/${stage.id}`}
          aria-live="polite"
        >
          <h1>{stage.label}</h1>
          <p>{stageBrief[stage.id]}</p>
          <button
            className="model-note"
            onClick={details}
            aria-label="О реконструкции и источниках"
          >
            <span>
              Реконструкция ИИ ·{" "}
              {index < stages.findIndex((s) => s.id === "network")
                ? "схема группы"
                : "условные форма и цвет"}{" "}
              · разные масштабы
            </span>
            <Icon name="info" size={16} />
          </button>
        </div>
        </div>
        <div className="development-controls" ref={controls}>
          <div className="development-stepper">
            <button
              className="step-button"
              disabled={index === 0}
              onClick={() => select(stages[index - 1].id)}
              aria-label="Предыдущий этап"
            >
              <Icon name="back" />
            </button>
            <button
              ref={pickerButton}
              className="stage-picker-toggle"
              aria-label={`Выбрать этап. Сейчас ${index + 1} из ${stages.length}: ${stage.shortLabel}`}
              aria-expanded={pickingStage}
              aria-controls="development-stage-picker"
              onClick={() => setPickingStage((open) => !open)}
            >
              <span className="stage-position">
                {index + 1} / {stages.length}
              </span>
              <span className="stage-picker-label">Этапы</span>
            </button>
            <button
              className="step-button next-stage"
              onClick={() => select(stages[(index + 1) % stages.length].id)}
              aria-label={
                index === stages.length - 1 ? "Снова к споре" : "Следующий этап"
              }
            >
              <Icon name={index === stages.length - 1 ? "cycle" : "next"} />
            </button>
          </div>
          <div
            id="development-stage-picker"
            className="development-stage-picker"
            hidden={!pickingStage}
          >
            <div
              className="development-rail"
              ref={rail}
              role="group"
              aria-label="Этапы развития"
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                  return;
                const buttons = [
                  ...event.currentTarget.querySelectorAll("button"),
                ];
                const focused = buttons.indexOf(
                  document.activeElement as HTMLButtonElement,
                );
                const next =
                  buttons[
                    Math.max(
                      0,
                      Math.min(
                        buttons.length - 1,
                        focused + (event.key === "ArrowRight" ? 1 : -1),
                      ),
                    )
                  ];
                event.preventDefault();
                next?.focus({ preventScroll: true });
                if (next)
                  event.currentTarget.scrollLeft =
                    next.offsetLeft -
                    event.currentTarget.clientWidth / 2 +
                    next.clientWidth / 2;
              }}
            >
              {stages.map((s, i) => (
                <button
                  key={s.id}
                  aria-label={`Этап ${i + 1}: ${s.shortLabel}`}
                  aria-current={i === index ? "step" : undefined}
                  onClick={() => {
                    select(s.id);
                    closePicker();
                  }}
                >
                  <span>{i + 1}</span>
                  <small>{s.shortLabel}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function treePref(key: string, fallback: number | boolean) {
  try {
    return (
      JSON.parse(sessionStorage.getItem(`mixor-tree-${key}`) ?? "null") ??
      fallback
    );
  } catch {
    return fallback;
  }
}
function rememberTree(key: string, value: number | boolean) {
  try {
    sessionStorage.setItem(`mixor-tree-${key}`, JSON.stringify(value));
  } catch {
    /* Navigation remains available. */
  }
}
function TaxonomyBranch({
  node,
  select,
}: {
  node: TaxonomyNode;
  select: (id: TaxonId) => void;
}) {
  const [open, setOpen] = useState(() => Boolean(treePref(node.name, true)));
  return (
    <li className={`taxonomy-node ${node.taxon ? "species-leaf" : ""}`}>
      {node.taxon ? (
        <button
          onClick={() => select(node.taxon!)}
          aria-label={`Рассмотреть: ${node.name}`}
        >
          <Art taxon={node.taxon} label="" />
          <span>
            <i>{node.name}</i>
            <small>{node.rank}</small>
          </span>
          <Icon name="next" size={16} />
        </button>
      ) : (
        <details
          open={open}
          onToggle={(event) => {
            setOpen(event.currentTarget.open);
            rememberTree(node.name, event.currentTarget.open);
          }}
        >
          <summary>
            <span>
              {node.name}
              <small>{node.rank}</small>
            </span>
          </summary>
          <ul>
            {node.children?.map((child) => (
              <TaxonomyBranch key={child.name} node={child} select={select} />
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}
export function ClassificationTree({
  select,
  sources,
}: {
  select: (id: TaxonId) => void;
  sources: () => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (scroll.current)
      scroll.current.scrollTop = Number(treePref("scroll", 0));
  }, []);
  return (
    <section className="classification-scene">
      <div className="classification-heading">
        <h1>Дерево жизни</h1>
        <button className="text-button" onClick={sources}>
          <Icon name="info" size={20} /> Источники
        </button>
      </div>
      <div
        className="classification-scroll"
        ref={scroll}
        onScroll={(event) =>
          rememberTree("scroll", event.currentTarget.scrollTop)
        }
      >
        <div className="tree-ancestry">
          Eukaryota <span>›</span> Amoebozoa <span>›</span> Eumycetozoa
        </div>
        <div className="classification-root">
          <strong>{taxonomyTree.name}</strong>
          <small>{taxonomyTree.rank}</small>
        </div>
        <ul className="classification-branches">
          {taxonomyTree.children?.map((node) => (
            <TaxonomyBranch key={node.name} node={node} select={select} />
          ))}
        </ul>
      </div>
    </section>
  );
}
