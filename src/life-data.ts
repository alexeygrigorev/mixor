import type { TaxonId } from "./data";

export type LifeIllustration =
  | "spore"
  | "cells"
  | "fusion"
  | "zygote"
  | "division"
  | "young"
  | "spreading"
  | "veins"
  | "network"
  | "forming"
  | "fruit"
  | "rest";

export type LifeStage = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  question: string;
  illustration: LifeIllustration;
  sourceUrls: string[];
} & ({ kind: "photo"; photoId: string } | { kind: "diagram"; photoId?: never });

export type LifeTransition = {
  from: string;
  to: string;
  label?: string;
  /** Conditional side route, not the next item in a linear slideshow. */
  optional?: boolean;
};

export type LifeCycle = {
  taxonId: TaxonId;
  stages: LifeStage[];
  transitions: LifeTransition[];
  scopeNote: string;
  sourceUrls: string[];
};

const mnhn = "https://www.mnhn.fr/fr/blob";
const warwick =
  "https://warwick.ac.uk/fac/sci/lifesci/outreach/slimemold/facts/";
const geneseo = "https://milnepublishing.geneseo.edu/botany/chapter/physarum/";
const amoeboflagellates = "https://mycosphere.org/pdf/Mycosphere_7_2_1.pdf";
const arcyriaCulture = "https://jbior.org/uploads/online_first/18/18-OF6.pdf";

/** Array order is a reading order. Only transitions describe biological routes. */
const preparedCycles = {
  physarum: {
    taxonId: "physarum",
    scopeNote:
      "Упрощённый половой цикл Physarum polycephalum. Снимки разных экземпляров; схемы условны, без масштаба и сроков. Покой — боковая ветвь, а амёбная и жгутиковая формы могут сменять друг друга. У отдельных линий возможны другие пути размножения: схема не описывает все варианты.",
    sourceUrls: [mnhn, warwick, geneseo, amoeboflagellates],
    stages: [
      {
        id: "spore",
        label: "Спора прорастает",
        shortLabel: "Спора",
        description:
          "Спора — маленькая клетка в защитной оболочке. Споры расселяются из плодовых тел; при подходящих условиях и наличии воды спора прорастает, выпуская подвижную клетку. Её строение здесь показано условно.",
        question:
          "Что выходит из оболочки: готовая жёлтая сеть или маленькая клетка?",
        kind: "diagram",
        illustration: "spore",
        sourceUrls: [mnhn, geneseo],
      },
      {
        id: "cells",
        label: "Амёбы и клетки со жгутиками",
        shortLabel: "Клетки",
        description:
          "Миксамёбы ползают, поглощают бактерии и делятся надвое. В свободной воде возможна плавающая форма со жгутиками; она может вернуться к амёбной. Это альтернативные формы, а не обязательные последовательные ступени. При неблагоприятных условиях клетка может переждать в защитной цисте.",
        question: "Какая из нарисованных клеток приспособлена плавать в воде?",
        kind: "diagram",
        illustration: "cells",
        sourceUrls: [amoeboflagellates, warwick],
      },
      {
        id: "fusion",
        label: "Совместимые клетки сливаются",
        shortLabel: "Слияние",
        description:
          "В половом цикле две совместимые клетки сливаются, затем объединяются их ядра. Получается одна клетка — зигота. Её ядро начинает делиться, а сама клетка растёт, не разделяясь на множество отдельных амёб.",
        question: "После слияния остаются две отдельные клетки или одна?",
        kind: "diagram",
        illustration: "fusion",
        sourceUrls: [mnhn, geneseo],
      },
      {
        id: "network",
        label: "Плазмодий растёт и питается",
        shortLabel: "Плазмодий",
        description:
          "Плазмодий — одна большая клетка с множеством ядер. Он распространяется по поверхности и образует сеть тяжей, внутри которой течёт содержимое клетки. На снимке видна жёлтая сеть на древесине; ядра и течение по неподвижному фото не различить.",
        question: "Можешь проследить один тяж до места, где он разветвляется?",
        kind: "photo",
        photoId: "physarum-plasmodium",
        illustration: "network",
        sourceUrls: [
          geneseo,
          "https://commons.wikimedia.org/wiki/File:Physarum_polycephalum_plasmodium.jpg",
        ],
      },
      {
        id: "fruit",
        label: "Плодовые тела выпускают споры",
        shortLabel: "Плодовые тела",
        description:
          "При переходе к размножению плазмодий формирует спороносные структуры — плодовые тела. Внутри образуются споры, которые затем рассеиваются. На снимке видны головки на тонких ножках; отдельные споры здесь не показаны. Новый плазмодий развивается через прорастание спор.",
        question: "Чем головки на ножках отличаются от распластанной сети?",
        kind: "photo",
        photoId: "physarum-macro",
        illustration: "fruit",
        sourceUrls: [
          mnhn,
          geneseo,
          "https://commons.wikimedia.org/wiki/File:Physarum_polycephalum_10744588.jpg",
        ],
      },
      {
        id: "rest",
        label: "Склероций: переждать сухость",
        shortLabel: "Покой",
        description:
          "При высыхании плазмодий может образовать склероций — устойчивую покоящуюся структуру. При увлажнении он способен снова стать активным плазмодием. Это боковая ветвь сохранения жизни; она не обязана предшествовать плодовым телам. Схема не задаёт точную форму склероция.",
        question: "К какой стадии ведёт возвращение из покоя?",
        kind: "diagram",
        illustration: "rest",
        sourceUrls: [warwick, geneseo],
      },
    ],
    transitions: [
      {
        from: "spore",
        to: "cells",
        label: "Прорастание при подходящих условиях",
      },
      {
        from: "cells",
        to: "cells",
        label: "Амёба ↔ жгутиковая форма; амёба ↔ циста",
        optional: true,
      },
      {
        from: "cells",
        to: "fusion",
        label: "Встреча совместимых клеток в половом цикле",
      },
      {
        from: "fusion",
        to: "network",
        label: "Рост и деление ядер внутри одной клетки",
      },
      { from: "network", to: "fruit", label: "Переход к спороношению" },
      { from: "fruit", to: "spore", label: "Образование и рассеивание спор" },
      {
        from: "network",
        to: "rest",
        label: "Высыхание: возможен покой",
        optional: true,
      },
      {
        from: "rest",
        to: "network",
        label: "Увлажнение: возможно возобновление роста",
        optional: true,
      },
    ],
  },
  arcyria: {
    taxonId: "arcyria",
    scopeNote:
      "Общая схема полового цикла миксомицетов для знакомства с Arcyria denudata. Культура этого вида описана в исследовании, но слияние и ветвь покоя здесь объяснены на уровне группы. Фото плодовых тел имеют определение источника; бледный кадр не подтверждает отдельную стадию. Это не серия одного организма и не расписание развития.",
    sourceUrls: [amoeboflagellates, arcyriaCulture, warwick],
    stages: [
      {
        id: "spore",
        label: "Спора даёт начало клетке",
        shortLabel: "Спора",
        description:
          "Споры образуются в плодовых телах. В исследовании культуры Arcyria denudata наблюдали прорастание спор и выход подвижных клеток. На схеме показан сам принцип; точный рисунок поверхности споры нужно рассматривать под микроскопом.",
        question: "Почему крупная башенка на фото не является одной спорой?",
        kind: "diagram",
        illustration: "spore",
        sourceUrls: [arcyriaCulture, amoeboflagellates],
      },
      {
        id: "cells",
        label: "Маленькие клетки ищут пищу",
        shortLabel: "Клетки",
        description:
          "У миксомицетов питающиеся амёбные клетки могут делиться. При наличии свободной воды возможна жгутиковая форма, при неблагоприятных условиях — защитная циста. В культуре Arcyria наблюдали подвижные клетки; рисунок объясняет общие формы, не воспроизводит конкретную микрофотографию вида.",
        question: "Что поможет отличить ползающую клетку от плавающей?",
        kind: "diagram",
        illustration: "cells",
        sourceUrls: [amoeboflagellates, arcyriaCulture],
      },
      {
        id: "fusion",
        label: "Слияние в половом цикле",
        shortLabel: "Слияние",
        description:
          "В общей половой схеме миксомицетов совместимые клетки и их ядра сливаются. Из полученной зиготы может вырасти плазмодий. Этот переход показан по данным о группе: для сфотографированных экземпляров Arcyria слияние не наблюдалось.",
        question: "Какое событие делает две клетки одной?",
        kind: "diagram",
        illustration: "fusion",
        sourceUrls: [amoeboflagellates],
      },
      {
        id: "network",
        label: "Плазмодий распространяется",
        shortLabel: "Плазмодий",
        description:
          "Растущий плазмодий содержит много ядер в общей клетке. В исследовании Arcyria denudata описан белый плазмодий с жилками и растущими веерами; позже его цвет менялся. Здесь учебная схема: проверенного фото этой стадии в нашей подборке нет.",
        question:
          "Чем растущая сеть отличается от отдельных клеток предыдущей стадии?",
        kind: "diagram",
        illustration: "network",
        sourceUrls: [arcyriaCulture, amoeboflagellates],
      },
      {
        id: "fruit",
        label: "Спороносные башенки",
        shortLabel: "Плодовые тела",
        description:
          "Из плазмодия развиваются плодовые тела со спорами. На фото, подписанном Arcyria denudata, видны красные вытянутые структуры на ножках. Описание вида отмечает внутри сеть нитей — капиллиций; её детали и отдельные споры требуют микроскопа. Споры расселяются и могут прорасти.",
        question: "Где у плодового тела тонкая ножка, а где спороносная часть?",
        kind: "photo",
        photoId: "arcyria-habitat",
        illustration: "fruit",
        sourceUrls: [
          arcyriaCulture,
          "https://commons.wikimedia.org/wiki/File:Arcyria_denudata_(45131851675).jpg",
        ],
      },
      {
        id: "rest",
        label: "Возможная ветвь покоя",
        shortLabel: "Покой",
        description:
          "В общем цикле миксомицетов плазмодий может переждать высыхание в склероции и возобновить рост при увлажнении. Это пояснение о группе; склероций Arcyria на наших снимках не подтверждён. Светлый цвет сам по себе не означает покой.",
        question: "Достаточно ли одного цвета, чтобы узнать стадию?",
        kind: "diagram",
        illustration: "rest",
        sourceUrls: [warwick],
      },
    ],
    transitions: [
      { from: "spore", to: "cells", label: "Прорастание" },
      {
        from: "cells",
        to: "cells",
        label: "Альтернативные формы: амёба, жгутиковая клетка, циста",
        optional: true,
      },
      {
        from: "cells",
        to: "fusion",
        label: "Совместимость; общий половой путь группы",
      },
      {
        from: "fusion",
        to: "network",
        label: "Рост одной клетки и деление ядер",
      },
      { from: "network", to: "fruit", label: "Формирование плодовых тел" },
      { from: "fruit", to: "spore", label: "Образование и рассеивание спор" },
      {
        from: "network",
        to: "rest",
        label: "Возможный покой: схема группы",
        optional: true,
      },
      {
        from: "rest",
        to: "network",
        label: "Возобновление роста: схема группы",
        optional: true,
      },
    ],
  },
} satisfies Partial<Record<TaxonId, LifeCycle>>;

const growthSource =
  "https://www.tandfonline.com/doi/full/10.1080/15592324.2015.1074368";
const sexualDevelopmentSource = "https://pubmed.ncbi.nlm.nih.gov/2398347/";
const veinDevelopmentSource =
  "https://www.jstage.jst.go.jp/article/biophysico/22/1/22_e220002/_pdf";
const morphologySource =
  "https://mushrooms.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?id=99672";
const sequence = [
  "spore",
  "cells",
  "fusion",
  "zygote",
  "division",
  "young",
  "spreading",
  "veins",
  "network",
  "forming",
  "fruit",
] as const;
export const stageSequence = sequence;

const growthStages: LifeStage[] = [
  {
    id: "zygote",
    illustration: "zygote",
    label: "Одна клетка — зигота",
    shortLabel: "Зигота",
    description:
      "После слияния клеток и их ядер образуется зигота. Это пока маленькая клетка с одним ядром, а не готовая сеть. Рисунок показывает общий половой путь миксомицетов, не микрофотографию конкретного вида.",
    question: "Где проходит общая граница клетки?",
    kind: "diagram",
    sourceUrls: [sexualDevelopmentSource, growthSource, amoeboflagellates],
  },
  {
    id: "division",
    illustration: "division",
    label: "Ядра делятся, клетка — нет",
    shortLabel: "Деление ядер",
    description:
      "Зигота питается и растёт. Ядро делится внутри той же клетки: сначала два ядра, затем их становится больше. Между ними не образуются клеточные перегородки. Число ядер на рисунке иллюстрирует принцип, а не обязательный срок развития.",
    question: "Два ядра — это две клетки?",
    kind: "diagram",
    sourceUrls: [sexualDevelopmentSource, growthSource, amoeboflagellates],
  },
  {
    id: "young",
    illustration: "young",
    label: "Молодой плазмодий растёт",
    shortLabel: "Молодой плазмодий",
    description:
      "Повторные деления ядер и питание постепенно увеличивают одну непрерывную клетку. Молодой плазмодий распластывается и вытягивает выросты. Это ещё не большая сеть; форма и число ядер здесь условны, масштаб меняется между кадрами.",
    question: "Найди край одной непрерывной клетки.",
    kind: "diagram",
    sourceUrls: [growthSource, amoeboflagellates],
  },
  {
    id: "spreading",
    illustration: "spreading",
    label: "Плазмодий распластывается",
    shortLabel: "Разрастание",
    description:
      "Растущая клетка занимает всё больше поверхности: её край расширяется широкими лопастями. Ядер становится больше, но при переходе к общему виду они уже не показаны по отдельности. Это учебное приближение постепенного роста, а не отдельная обязательная стадия с фиксированной формой. Механизм показан по исследованиям Physarum; для остальных видов это модель группы.",
    question: "Как расширяется общий край клетки?",
    kind: "diagram",
    sourceUrls: [veinDevelopmentSource, growthSource],
  },
  {
    id: "veins",
    illustration: "veins",
    label: "Появляются первые тяжи",
    shortLabel: "Первые тяжи",
    description:
      "В распластанном плазмодии выделяются соединённые тяжи, по которым перемещается содержимое клетки. Между растущими участками пока немного связей; сеть продолжает перестраиваться. Это части одной клетки, не собравшиеся вместе амёбы. Реконструкция опирается на наблюдение образования каналов в Physarum, не на съёмку раннего развития каждого вида.",
    question: "Можешь пройти по тяжу от одного растущего края до другого?",
    kind: "diagram",
    sourceUrls: [veinDevelopmentSource, growthSource],
  },
  {
    id: "forming",
    illustration: "forming",
    label: "Начинается спороношение",
    shortLabel: "Зачатки плодовых тел",
    description:
      "При переходе к спороношению плазмодий перестраивается: возникают зачатки будущих спороносных структур. Их форма зависит от вида. Это реконструкция перехода, а не кадр документальной серии одного экземпляра.",
    question: "Чем зачатки отличаются от распластанного плазмодия?",
    kind: "diagram",
    sourceUrls: [morphologySource, growthSource],
  },
];

const fruitDescriptions: Partial<Record<TaxonId, string>> = {
  fuligo:
    "У Fuligo septica спороносная структура — эталий, общая подушковидная масса. Под светлой коркой формируется тёмная масса спор. Жёлтый плазмодий и зрелый эталий — разные состояния; цвет сам по себе не доказывает стадию.",
  lycogala:
    "У Lycogala epidendrum формируются округлые сидячие спороносные тела. При созревании розоватые молодые структуры буреют; внутри образуется масса спор. Виды комплекса Lycogala epidendrum нельзя надёжно различать только по цвету или общему снимку.",
  stemonitis:
    "У Stemonitis axifera вытянутые цилиндрические спорангии стоят на тонких тёмных ножках. Зрелые структуры несут ржаво-коричневую споровую массу. После рассеивания спор может оставаться тонкий сетчатый каркас.",
  trichia:
    "У Hemitrichia decipiens, известной также как Trichia decipiens, созревают грушевидные спорангии на ножках. Яркие молодые структуры сменяются охристо-бурыми; при раскрытии оболочки обнажаются споры и нити капиллиция.",
  tubifera:
    "У Tubifera ferruginosa множество тесно стоящих трубчатых спорангиев образуют общее скопление — псевдоэталий. Молодые розово-оранжевые структуры по мере созревания буреют. Это не коралл и не гриб со шляпками.",
  didymium:
    "У Didymium squamulosum спорангии обычно стоят на коротких светлых ножках. Снаружи видны белые известковые кристаллы, внутри — тёмные споры. Белый налёт не означает, что весь организм находится в стадии покоя.",
};
const ids: TaxonId[] = [
  "physarum",
  "arcyria",
  "fuligo",
  "lycogala",
  "stemonitis",
  "trichia",
  "tubifera",
  "didymium",
];

function makeCycle(id: TaxonId): LifeCycle {
  const prepared =
    id === "physarum" || id === "arcyria" ? preparedCycles[id] : undefined;
  const common = preparedCycles.physarum.stages
    .filter((s) => ["spore", "cells", "fusion"].includes(s.id))
    .map((s) => ({ ...s, sourceUrls: [growthSource, amoeboflagellates] }));
  const network: LifeStage = {
    id: "network",
    illustration: "network",
    label: "Развитый плазмодий",
    shortLabel: "Плазмодий",
    description:
      "Плазмодий — одна растущая многоядерная клетка. Он распространяется по субстрату и поглощает пищу. Форма, толщина тяжей и окраска зависят от вида и условий; здесь условная реконструкция, не определительный признак и не проверенное фото этой стадии.",
    question: "Как меняется площадь, которую занимает одна клетка?",
    kind: "diagram",
    sourceUrls: [growthSource, morphologySource],
  };
  const fruit: LifeStage = {
    id: "fruit",
    illustration: "fruit",
    label: "Созревают споры",
    shortLabel: "Плодовые тела",
    description: fruitDescriptions[id] ?? "В плодовых телах созревают споры.",
    question: "Откуда могут начать новую жизнь расселяющиеся споры?",
    kind: "diagram",
    sourceUrls: [morphologySource],
  };
  const existing = prepared?.stages ?? [
    ...common,
    network,
    fruit,
    { ...preparedCycles.arcyria.stages[5], sourceUrls: [warwick] },
  ];
  const all = [...existing, ...growthStages];
  const stages = sequence
    .map((key) => all.find((s) => s.id === key)!)
    .concat(all.filter((s) => s.id === "rest"));
  const mainTransitions: LifeTransition[] = sequence.map((key, index) => ({
    from: key,
    to: sequence[(index + 1) % sequence.length],
    label:
      key === "fruit"
        ? "Рассеивание и прорастание спор"
        : "Следующий этап учебной последовательности",
  }));
  return {
    taxonId: id,
    stages,
    scopeNote:
      prepared?.scopeNote ??
      "Общая схема полового цикла миксомицетов с примером спороношения выбранного вида. Ранние клетки и рост — учебная реконструкция на уровне группы; форма и цвет плазмодия условны. Это не серия одного экземпляра, не определитель и не расписание. Возможны иные репродуктивные пути и стадии покоя.",
    sourceUrls: [
      ...new Set([
        ...(prepared?.sourceUrls ?? [amoeboflagellates, morphologySource]),
        growthSource,
        sexualDevelopmentSource,
        veinDevelopmentSource,
      ]),
    ],
    transitions: [
      ...mainTransitions,
      {
        from: "cells",
        to: "cells",
        label: "Амёба ↔ жгутиковая форма; возможна циста",
        optional: true,
      },
      {
        from: "network",
        to: "rest",
        label: "Возможен покой при неблагоприятных условиях",
        optional: true,
      },
      {
        from: "rest",
        to: "network",
        label: "Возможно возобновление роста",
        optional: true,
      },
    ],
  };
}
export const lifeCycles = Object.fromEntries(
  ids.map((id) => [id, makeCycle(id)]),
) as Record<TaxonId, LifeCycle>;
export const cycles = lifeCycles;

export const stageBrief: Record<string, string> = {
  spore: "Из защитной оболочки выходит маленькая подвижная клетка.",
  cells:
    "Клетки питаются. Амёбная и жгутиковая формы могут сменять друг друга.",
  fusion: "В половом цикле две совместимые клетки начинают сливаться.",
  zygote: "После слияния ядер остаётся одна маленькая клетка с одним ядром.",
  division:
    "Ядро делится. Два ядра остаются внутри одной клетки — без перегородки.",
  young:
    "Ядер становится больше. Та же клетка растёт и вытягивает первые выросты.",
  spreading:
    "Край одной клетки расширяется широкими лопастями. На общем плане ядра уже не показаны по отдельности.",
  veins:
    "Внутри той же клетки появляются соединённые тяжи. Связей пока немного — сеть только складывается.",
  network:
    "Плазмодий распространяется по субстрату. Это всё ещё одна многоядерная клетка.",
  forming: "Плазмодий перестраивается в зачатки спороносных структур.",
  fruit:
    "В плодовых телах созревают споры. Они расселяются — цикл может начаться снова.",
};
