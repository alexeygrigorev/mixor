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
import { PhotoWalkScene } from "./photo-walk-scene";
import { getPhotoWalkView, PHOTO_WALK_ENTRY } from "./photo-walk-data";

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
      hint: "Осмотрись, пройди по тропе, найди скрытые детали",
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
  choose,
  sessionOnly,
}: {
  finds: string[];
  choose: (id: string) => void;
  sessionOnly: boolean;
}) {
  return (
    <section className="woodland-chooser woodland-chooser-walk">
      <div className="chooser-heading">
        <h1>В лес за открытиями</h1>
        <p>Двигай фотографию, заглядывай к пням и веткам, замечай маленьких обитателей.</p>
      </div>
      <div className="woodland-choices">
        {woodlands.map((woodland) => <button key={woodland.id} onClick={() => choose(woodland.id)} aria-label={`Искать: ${woodland.title}`}>
          <img src={woodland.image} alt="" />
          <span className="woodland-choice-caption">
            <span>
              <strong>{woodland.title}</strong>
              <span>{woodland.description}</span>
            </span>
            <Icon name="next" size={24} />
          </span>
        </button>)}
      </div>
      {sessionOnly && <p className="chooser-note">Прогресс этой вкладки не удалось сохранить на устройстве.</p>}
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

export function SearchScene(props: {
  woodland: Woodland;
  viewId?: string;
  finds: string[];
  reveal: (id: string) => void;
  inspect: (taxon: TaxonId, findId: string) => void;
  change: (woodlandId: string) => void;
  back: () => void;
  settings?: () => void;
}) {
  // Old bookmarks remain usable, but never revive the retired generated scenes.
  const view = getPhotoWalkView(props.viewId ?? props.woodland.id)
    ?? getPhotoWalkView(PHOTO_WALK_ENTRY)!;
  return <PhotoWalkScene view={view} change={props.change} back={props.back} settings={props.settings} inspect={props.inspect} />;
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
