import type { TaxonId } from "./data.ts";
import type { PhotoWalkObjectKind } from "./photo-walk-data.ts";

export type PhotoWalkLearningSource = Readonly<{
  title: string;
  organization: string;
  url: string;
}>;

export type PhotoWalkLearning = Readonly<{
  title: string;
  paragraphs: readonly [string, string];
  facts: readonly [string, string, string];
  observation: string;
  sources: readonly PhotoWalkLearningSource[];
  /** Comparisons with atlas examples, never identifications of a hidden object. */
  atlasLinks: readonly Readonly<{ taxonId: TaxonId; label: string }>[];
}>;

// General biology for four discovery groups. Source scope and editorial choices:
// docs/PHOTO_WALK_LEARNING.md. No species is inferred from the game artwork.
const learning: Readonly<Record<PhotoWalkObjectKind, PhotoWalkLearning>> = {
  myxomycete: {
    title: "Миксомицет",
    paragraphs: [
      "Миксомицеты родственны амёбам и умеют медленно перемещаться. Во время питания они могут образовывать плазмодий: мягкое тело, которое меняет форму и поглощает бактерии. Его можно встретить во влажной древесине и среди опавших листьев.",
      "Позже плазмодий может образовать плодовые тела со спорами. У многих миксомицетов они похожи на крошечные шарики на ножках. Споры расселяются, а в подходящих условиях из них появляются микроскопические клетки.",
    ],
    facts: [
      "Миксомицеты не относятся к грибам.",
      "У плазмодия одна клетка с множеством ядер.",
      "Плодовые тела часто настолько малы, что их удобнее рассматривать через лупу.",
    ],
    observation: "Приблизь находку и проверь, у всех ли шариков видны ножки. На настоящей прогулке сфотографируй похожую находку, не касаясь хрупких плодовых тел.",
    sources: [
      { title: "Slime Moulds", organization: "Royal Horticultural Society", url: "https://www.rhs.org.uk/biodiversity/slime-moulds" },
      { title: "Qu’est-ce qu’un blob ?", organization: "Muséum national d’Histoire naturelle", url: "https://www.mnhn.fr/fr/blob" },
    ],
    atlasLinks: [{ taxonId: "physarum", label: "Другой миксомицет: живая сеть" }],
  },
  lichen: {
    title: "Лишайник",
    paragraphs: [
      "В лишайнике вместе живут гриб и водоросль или цианобактерия. Водоросль или цианобактерия использует свет, чтобы создавать питательные вещества, которыми пользуется и гриб.",
      "Грибные нити образуют большую часть тела лишайника. У разных лишайников оно напоминает корочку, маленькие листочки или ветвящийся кустик. На коре можно заметить несколько разных форм рядом.",
    ],
    facts: [
      "Такое тесное совместное существование называют симбиозом.",
      "Цианобактерии умеют использовать свет для фотосинтеза.",
      "Лишайники растут не только на коре, но и на камнях и почве.",
    ],
    observation: "Приблизь край лишайника и проверь, прижат ли он к коре или отходит от неё маленькими лопастями. На прогулке сравни две находки, не соскребая их.",
    sources: [
      { title: "What is a lichen?", organization: "Australian National Botanic Gardens", url: "https://www.anbg.gov.au/lichen/what-is-lichen.html" },
      { title: "The lichen that invented sunscreen", organization: "Royal Botanic Gardens, Kew", url: "https://www.kew.org/read-and-watch/lichen-that-invented-sunscreen" },
    ],
    atlasLinks: [],
  },
  fungus: {
    title: "Небольшой гриб",
    paragraphs: [
      "Знакомые шляпка и ножка образуют плодовое тело гриба. Большая часть его тела может скрываться в почве или древесине: это сеть тонких нитей, которую называют грибницей, или мицелием.",
      "В плодовом теле образуются споры. Когда спора попадает в подходящие условия, из неё может вырасти новая грибница. Многие лесные грибы разлагают мёртвые листья и древесину, возвращая питательные вещества в почву.",
    ],
    facts: [
      "Одна нить грибницы называется гифой.",
      "Споры могут переноситься ветром и животными.",
      "Не все грибы образуют шляпку и ножку.",
    ],
    observation: "Сравни высоту ножек и форму шляпок. На настоящей прогулке сфотографируй гриб сверху и сбоку, оставив его на месте. Найденные грибы не пробуй.",
    sources: [
      { title: "What in earth? Understanding what fungi really are", organization: "Royal Botanic Gardens, Kew", url: "https://www.kew.org/read-and-watch/what-is-fungi" },
      { title: "Life in soil", organization: "Natural History Museum, London", url: "https://www.nhm.ac.uk/discover/life-in-soil.html" },
    ],
    atlasLinks: [],
  },
  creature: {
    title: "Мокрица",
    paragraphs: [
      "Мокрица относится к наземным ракообразным и приходится родственницей креветкам и ракам. Под её панцирем спрятано гораздо больше ног, чем у насекомого: у взрослой мокрицы семь пар.",
      "Под корой и опавшими листьями мокрица находит влажное укрытие и пищу. Она поедает разлагающиеся растительные остатки и помогает им превращаться в частицы, которые дальше перерабатывают другие обитатели почвы.",
    ],
    facts: [
      "У взрослой мокрицы 14 ходильных ног, а у насекомого всего 6.",
      "Панцирь состоит из отдельных пластинок.",
      "В её пищу входят опавшие листья и разлагающаяся древесина.",
    ],
    observation: "Найди усики и отдельные пластинки панциря. Если встретишь живую мокрицу, понаблюдай, как она перебирает ногами, и оставь её в укрытии.",
    sources: [
      { title: "How to make a log pile to provide shelter for garden wildlife", organization: "Natural History Museum, London", url: "https://www.nhm.ac.uk/discover/how-to-make-a-log-pile-to-provide-shelter-for-garden-wildlife.html" },
      { title: "How to make a pitfall trap to catch insects and other minibeasts", organization: "Natural History Museum, London", url: "https://www.nhm.ac.uk/discover/how-to-make-pitfall-trap-to-catch-insects.html" },
    ],
    atlasLinks: [],
  },
};

export function getLearning(kind: PhotoWalkObjectKind): PhotoWalkLearning {
  return learning[kind];
}
