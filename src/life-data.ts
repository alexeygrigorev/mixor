import type { TaxonId } from "./data";

export type LifeIllustration = "spore" | "cells" | "fusion" | "network" | "fruit" | "rest";

export type LifeStage = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  question: string;
  illustration: LifeIllustration;
  sourceUrls: string[];
} & (
  | { kind: "photo"; photoId: string }
  | { kind: "diagram"; photoId?: never }
);

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
const warwick = "https://warwick.ac.uk/fac/sci/lifesci/outreach/slimemold/facts/";
const geneseo = "https://milnepublishing.geneseo.edu/botany/chapter/physarum/";
const amoeboflagellates = "https://mycosphere.org/pdf/Mycosphere_7_2_1.pdf";
const arcyriaCulture = "https://jbior.org/uploads/online_first/18/18-OF6.pdf";

/** Array order is a reading order. Only transitions describe biological routes. */
export const cycles = {
  physarum: {
    taxonId: "physarum",
    scopeNote: "Упрощённый половой цикл Physarum polycephalum. Снимки разных экземпляров; схемы условны, без масштаба и сроков. Покой — боковая ветвь, а амёбная и жгутиковая формы могут сменять друг друга. У отдельных линий возможны другие пути размножения: схема не описывает все варианты.",
    sourceUrls: [mnhn, warwick, geneseo, amoeboflagellates],
    stages: [
      {
        id: "spore", label: "Спора прорастает", shortLabel: "Спора",
        description: "Спора — маленькая клетка в защитной оболочке. Споры расселяются из плодовых тел; при подходящих условиях и наличии воды спора прорастает, выпуская подвижную клетку. Её строение здесь показано условно.",
        question: "Что выходит из оболочки: готовая жёлтая сеть или маленькая клетка?",
        kind: "diagram", illustration: "spore", sourceUrls: [mnhn, geneseo],
      },
      {
        id: "cells", label: "Амёбы и клетки со жгутиками", shortLabel: "Клетки",
        description: "Миксамёбы ползают, поглощают бактерии и делятся надвое. В свободной воде возможна плавающая форма со жгутиками; она может вернуться к амёбной. Это альтернативные формы, а не обязательные последовательные ступени. При неблагоприятных условиях клетка может переждать в защитной цисте.",
        question: "Какая из нарисованных клеток приспособлена плавать в воде?",
        kind: "diagram", illustration: "cells", sourceUrls: [amoeboflagellates, warwick],
      },
      {
        id: "fusion", label: "Совместимые клетки сливаются", shortLabel: "Слияние",
        description: "В половом цикле две совместимые клетки сливаются, затем объединяются их ядра. Получается одна клетка — зигота. Её ядро начинает делиться, а сама клетка растёт, не разделяясь на множество отдельных амёб.",
        question: "После слияния остаются две отдельные клетки или одна?",
        kind: "diagram", illustration: "fusion", sourceUrls: [mnhn, geneseo],
      },
      {
        id: "network", label: "Плазмодий растёт и питается", shortLabel: "Плазмодий",
        description: "Плазмодий — одна большая клетка с множеством ядер. Он распространяется по поверхности и образует сеть тяжей, внутри которой течёт содержимое клетки. На снимке видна жёлтая сеть на древесине; ядра и течение по неподвижному фото не различить.",
        question: "Можешь проследить один тяж до места, где он разветвляется?",
        kind: "photo", photoId: "physarum-plasmodium", illustration: "network",
        sourceUrls: [geneseo, "https://commons.wikimedia.org/wiki/File:Physarum_polycephalum_plasmodium.jpg"],
      },
      {
        id: "fruit", label: "Плодовые тела выпускают споры", shortLabel: "Плодовые тела",
        description: "При переходе к размножению плазмодий формирует спороносные структуры — плодовые тела. Внутри образуются споры, которые затем рассеиваются. На снимке видны головки на тонких ножках; отдельные споры здесь не показаны. Новый плазмодий развивается через прорастание спор.",
        question: "Чем головки на ножках отличаются от распластанной сети?",
        kind: "photo", photoId: "physarum-macro", illustration: "fruit",
        sourceUrls: [mnhn, geneseo, "https://commons.wikimedia.org/wiki/File:Physarum_polycephalum_10744588.jpg"],
      },
      {
        id: "rest", label: "Склероций: переждать сухость", shortLabel: "Покой",
        description: "При высыхании плазмодий может образовать склероций — устойчивую покоящуюся структуру. При увлажнении он способен снова стать активным плазмодием. Это боковая ветвь сохранения жизни; она не обязана предшествовать плодовым телам. Схема не задаёт точную форму склероция.",
        question: "К какой стадии ведёт возвращение из покоя?",
        kind: "diagram", illustration: "rest", sourceUrls: [warwick, geneseo],
      },
    ],
    transitions: [
      { from: "spore", to: "cells", label: "Прорастание при подходящих условиях" },
      { from: "cells", to: "cells", label: "Амёба ↔ жгутиковая форма; амёба ↔ циста", optional: true },
      { from: "cells", to: "fusion", label: "Встреча совместимых клеток в половом цикле" },
      { from: "fusion", to: "network", label: "Рост и деление ядер внутри одной клетки" },
      { from: "network", to: "fruit", label: "Переход к спороношению" },
      { from: "fruit", to: "spore", label: "Образование и рассеивание спор" },
      { from: "network", to: "rest", label: "Высыхание: возможен покой", optional: true },
      { from: "rest", to: "network", label: "Увлажнение: возможно возобновление роста", optional: true },
    ],
  },
  arcyria: {
    taxonId: "arcyria",
    scopeNote: "Общая схема полового цикла миксомицетов для знакомства с Arcyria denudata. Культура этого вида описана в исследовании, но слияние и ветвь покоя здесь объяснены на уровне группы. Фото плодовых тел имеют определение источника; бледный кадр не подтверждает отдельную стадию. Это не серия одного организма и не расписание развития.",
    sourceUrls: [amoeboflagellates, arcyriaCulture, warwick],
    stages: [
      {
        id: "spore", label: "Спора даёт начало клетке", shortLabel: "Спора",
        description: "Споры образуются в плодовых телах. В исследовании культуры Arcyria denudata наблюдали прорастание спор и выход подвижных клеток. На схеме показан сам принцип; точный рисунок поверхности споры нужно рассматривать под микроскопом.",
        question: "Почему крупная башенка на фото не является одной спорой?",
        kind: "diagram", illustration: "spore", sourceUrls: [arcyriaCulture, amoeboflagellates],
      },
      {
        id: "cells", label: "Маленькие клетки ищут пищу", shortLabel: "Клетки",
        description: "У миксомицетов питающиеся амёбные клетки могут делиться. При наличии свободной воды возможна жгутиковая форма, при неблагоприятных условиях — защитная циста. В культуре Arcyria наблюдали подвижные клетки; рисунок объясняет общие формы, не воспроизводит конкретную микрофотографию вида.",
        question: "Что поможет отличить ползающую клетку от плавающей?",
        kind: "diagram", illustration: "cells", sourceUrls: [amoeboflagellates, arcyriaCulture],
      },
      {
        id: "fusion", label: "Слияние в половом цикле", shortLabel: "Слияние",
        description: "В общей половой схеме миксомицетов совместимые клетки и их ядра сливаются. Из полученной зиготы может вырасти плазмодий. Этот переход показан по данным о группе: для сфотографированных экземпляров Arcyria слияние не наблюдалось.",
        question: "Какое событие делает две клетки одной?",
        kind: "diagram", illustration: "fusion", sourceUrls: [amoeboflagellates],
      },
      {
        id: "network", label: "Плазмодий распространяется", shortLabel: "Плазмодий",
        description: "Растущий плазмодий содержит много ядер в общей клетке. В исследовании Arcyria denudata описан белый плазмодий с жилками и растущими веерами; позже его цвет менялся. Здесь учебная схема: проверенного фото этой стадии в нашей подборке нет.",
        question: "Чем растущая сеть отличается от отдельных клеток предыдущей стадии?",
        kind: "diagram", illustration: "network", sourceUrls: [arcyriaCulture, amoeboflagellates],
      },
      {
        id: "fruit", label: "Спороносные башенки", shortLabel: "Плодовые тела",
        description: "Из плазмодия развиваются плодовые тела со спорами. На фото, подписанном Arcyria denudata, видны красные вытянутые структуры на ножках. Описание вида отмечает внутри сеть нитей — капиллиций; её детали и отдельные споры требуют микроскопа. Споры расселяются и могут прорасти.",
        question: "Где у плодового тела тонкая ножка, а где спороносная часть?",
        kind: "photo", photoId: "arcyria-habitat", illustration: "fruit",
        sourceUrls: [arcyriaCulture, "https://commons.wikimedia.org/wiki/File:Arcyria_denudata_(45131851675).jpg"],
      },
      {
        id: "rest", label: "Возможная ветвь покоя", shortLabel: "Покой",
        description: "В общем цикле миксомицетов плазмодий может переждать высыхание в склероции и возобновить рост при увлажнении. Это пояснение о группе; склероций Arcyria на наших снимках не подтверждён. Светлый цвет сам по себе не означает покой.",
        question: "Достаточно ли одного цвета, чтобы узнать стадию?",
        kind: "diagram", illustration: "rest", sourceUrls: [warwick],
      },
    ],
    transitions: [
      { from: "spore", to: "cells", label: "Прорастание" },
      { from: "cells", to: "cells", label: "Альтернативные формы: амёба, жгутиковая клетка, циста", optional: true },
      { from: "cells", to: "fusion", label: "Совместимость; общий половой путь группы" },
      { from: "fusion", to: "network", label: "Рост одной клетки и деление ядер" },
      { from: "network", to: "fruit", label: "Формирование плодовых тел" },
      { from: "fruit", to: "spore", label: "Образование и рассеивание спор" },
      { from: "network", to: "rest", label: "Возможный покой: схема группы", optional: true },
      { from: "rest", to: "network", label: "Возобновление роста: схема группы", optional: true },
    ],
  },
} satisfies Partial<Record<TaxonId, LifeCycle>>;

/** Missing entries deliberately mean no prepared species cycle. */
export const lifeCycles: Partial<Record<TaxonId, LifeCycle>> = cycles;
