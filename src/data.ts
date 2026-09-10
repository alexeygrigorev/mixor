export type TaxonId = "physarum" | "arcyria" | "fuligo" | "lycogala" | "stemonitis" | "trichia" | "tubifera" | "didymium";

export type Scene = "entrance" | "base" | "atlas" | "portrait" | "cycle" | "research" | "journal" | "capture";

export type MediaRole = "hero" | "habitat" | "detail" | "stage";

export type MediaItem = {
  id: string;
  taxonId: TaxonId;
  src: string;
  role: MediaRole;
  title: string;
  caption: string;
  alt: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
};

export type Taxon = {
  id: TaxonId;
  commonName: string;
  commonNameType: "descriptive";
  latinName: string;
  rank: string;
  eyebrow: string;
  summary: string;
  notice: string;
  habitat: string;
  sourceRefs: string[];
  accent: "amber" | "rose";
  media: MediaItem[];
};

export const media: MediaItem[] = [
  {
    id: "physarum-blob",
    taxonId: "physarum",
    src: "/assets/images/physarum-blob.webp",
    role: "hero",
    title: "Blob (Physarum polycephalum)",
    caption: "Жёлтая масса с сетчатыми участками на срубленном стволе. Автор указывает Груневальд в Берлине; название вида взято из источника.",
    alt: "Бугристая жёлтая масса и тонкие сетчатые участки на тёмной коре",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Blob_(Physarum_polycephalum).jpg",
    author: "Le Bernemi",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  {
    id: "physarum-petri",
    taxonId: "physarum",
    src: "/assets/images/physarum-petri.webp",
    role: "habitat",
    title: "Physarum polycephalum",
    caption: "Плазмодий на древесине. Стадия названа в исходном описании; условия культивирования не указаны.",
    alt: "Жёлто-оранжевый плазмодий образует сетку на коричневой древесине",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Physarum_polycephalum.jpg",
    author: "HelenGinger",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
  {
    id: "physarum-macro",
    taxonId: "physarum",
    src: "/assets/images/physarum-macro.webp",
    role: "detail",
    title: "Physarum polycephalum 10744588",
    caption: "Плодовые тела с изогнутыми головками на тонких ножках. Commons сохраняет имя Physarum polycephalum; исходная запись iNaturalist теперь использует Badhamia polycephala.",
    alt: "Желтоватые лопастные головки плодовых тел на тонких коричневых ножках",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Physarum_polycephalum_10744588.jpg",
    author: "Katja Schulz",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  {
    id: "physarum-plasmodium",
    taxonId: "physarum",
    src: "/assets/images/physarum-plasmodium.webp",
    role: "stage",
    title: "Physarum polycephalum plasmodium",
    caption: "Источник подписывает плазмодий Physarum polycephalum на коре. Видны толстые тяжи и тонкая сеть; связи с другими снимками в одну серию нет.",
    alt: "Тонкая жёлтая сеть плазмодия на субстрате",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Physarum_polycephalum_plasmodium.jpg",
    author: "frankenstoen",
    license: "CC BY 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
  },
  {
    id: "arcyria-habitat",
    taxonId: "arcyria",
    src: "/assets/images/arcyria-habitat.webp",
    role: "habitat",
    title: "Arcyria denudata",
    caption: "Красные вытянутые плодовые тела на коротких ножках. Древесный субстрат виден; определение Arcyria denudata взято из подписи автора.",
    alt: "Группа красных плодовых тел Arcyria denudata на тёмном стволе",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Arcyria_denudata_(45131851675).jpg",
    author: "Lukas from London, England",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  {
    id: "arcyria-pink",
    taxonId: "arcyria",
    src: "/assets/images/arcyria-pink.webp",
    role: "hero",
    title: "Arcyria denudata 103374798",
    caption: "Розово-красные плодовые тела на светлой древесине; часть поверхности рыхлая. Вид указан источником; степень зрелости отдельно не установлена.",
    alt: "Розовые плодовые тела Arcyria denudata на коре",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Arcyria_denudata_103374798.jpg",
    author: "Erik",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  {
    id: "arcyria-detail",
    taxonId: "arcyria",
    src: "/assets/images/arcyria-detail.webp",
    role: "detail",
    title: "Arcyria denudata 19055009",
    caption: "Белёсые вытянутые структуры рядом с буроватыми. Источник называет Arcyria denudata; предположение автора о последовательности стадий не подтверждает стадию каждой структуры.",
    alt: "Множество белёсых вытянутых структур и отдельные буроватые группы на древесине",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Arcyria_denudata_19055009.jpg",
    author: "cwwood",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  {
    id: "arcyria-cluster",
    taxonId: "arcyria",
    src: "/assets/images/arcyria-cluster.webp",
    role: "stage",
    title: "Arcyria denudata 25025847",
    caption: "Красно-оранжевые плодовые тела группами на тёмной древесине. Определение — по источнику; это отдельная находка, не следующий кадр развития.",
    alt: "Группы красно-оранжевых вытянутых плодовых тел на тёмной древесине",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Arcyria_denudata_25025847.jpg",
    author: "Sarah Culliton",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  {
    "id": "fuligo-portrait",
    "taxonId": "fuligo",
    "src": "/assets/photos/fuligo-portrait.jpg",
    "role": "hero",
    "title": "2011-01-16 Fuligo septica.jpg",
    "caption": "Жёлтые разветвлённые массы покрывают древесную щепу. Файл источника подписан Fuligo septica; точная стадия отдельно не установлена.",
    "alt": "Жёлтые бугристые и разветвлённые массы на тёмной щепе, за ними двор",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:2011-01-16_Fuligo_septica.jpg",
    "author": "frankenstoen from Port Washington, Ohio",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0/"
  },
  {
    "id": "fuligo-detail",
    "taxonId": "fuligo",
    "src": "/assets/photos/fuligo-detail.jpg",
    "role": "detail",
    "title": "Dog vomit slime mold - Flickr - brewbooks.jpg",
    "caption": "Светлая бугристая масса с жёлтыми и сетчатыми участками на разрушенном пне. Автор подписывает Fuligo septica; снимок показывает отдельную находку.",
    "alt": "Светло-жёлтая бугристая масса и тонкие сетчатые участки на тёмном пне",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Dog_vomit_slime_mold_-_Flickr_-_brewbooks.jpg",
    "author": "brewbooks from near Seattle, USA",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/"
  },
  {
    "id": "lycogala-portrait",
    "taxonId": "lycogala",
    "src": "/assets/photos/lycogala-portrait.jpg",
    "role": "hero",
    "title": "Lycogala epidendrum (19614125611).jpg",
    "caption": "Оранжевые округлые плодовые тела на растительном субстрате. Имя Lycogala epidendrum взято из источника; по цвету вид не устанавливается.",
    "alt": "Оранжевые округлые плодовые тела среди тёмных древесных волокон",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Lycogala_epidendrum_(19614125611).jpg",
    "author": "Andrew C",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0/"
  },
  {
    "id": "lycogala-detail",
    "taxonId": "lycogala",
    "src": "/assets/photos/lycogala-detail.jpg",
    "role": "detail",
    "title": "Lycogala epidendrum (2022).jpg",
    "caption": "Серо-коричневые округлые формы на древесине. В исходном описании написано «Lycogala epidendrium», в заголовке — Lycogala epidendrum. Связь с первым кадром в одну историю развития не установлена.",
    "alt": "Серо-коричневые шаровидные структуры группой на древесине",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Lycogala_epidendrum_(2022).jpg",
    "author": "Давид Андронов",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/"
  },
  {
    "id": "stemonitis-portrait",
    "taxonId": "stemonitis",
    "src": "/assets/photos/stemonitis-portrait.jpg",
    "role": "hero",
    "title": "Stemonitis axifera.jpg",
    "caption": "Белые вытянутые структуры на тонких чёрных ножках. Автор подписывает Stemonitis axifera; время и степень зрелости из этого фото не устанавливаются.",
    "alt": "Пучок белых вытянутых структур на блестящих чёрных ножках",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Stemonitis_axifera.jpg",
    "author": "Lebrac",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "id": "stemonitis-fruit",
    "taxonId": "stemonitis",
    "src": "/assets/photos/stemonitis-fruit.jpg",
    "role": "detail",
    "title": "Stemonitis axifera 55573699.jpg",
    "caption": "Микроскопический кадр из записи Stemonitis axifera: тонкая сеть и округлые частицы вокруг тёмной оси. Калибровка и окрашивание в выбранных метаданных не указаны.",
    "alt": "Тёмная ось, тонкая сетка нитей и множество округлых коричневатых частиц на светлом фоне",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Stemonitis_axifera_55573699.jpg",
    "author": "bjoerns",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "id": "trichia-portrait",
    "taxonId": "trichia",
    "src": "/assets/photos/trichia-portrait.jpg",
    "role": "hero",
    "title": "Trichia decipiens (25563535374).jpg",
    "caption": "Оранжевые округлые структуры на тёмной древесине. Автор называет Trichia decipiens; одна окраска не подтверждает вид или степень зрелости.",
    "alt": "Группы гладких оранжевых округлых структур на тёмной древесине",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Trichia_decipiens_(25563535374).jpg",
    "author": "Björn S...",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/"
  },
  {
    "id": "trichia-detail",
    "taxonId": "trichia",
    "src": "/assets/photos/trichia-detail.jpg",
    "role": "detail",
    "title": "Trichia decipiens (49251741308).jpg",
    "caption": "Близкий кадр оранжевых головок на светлых основаниях. Имя Trichia decipiens взято из источника; это самостоятельный снимок без подтверждённой связи с первым.",
    "alt": "Блестящие оранжевые головки на белёсых вытянутых основаниях",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Trichia_decipiens_(49251741308).jpg",
    "author": "Philippe Garcelon",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0/"
  },
  {
    "id": "tubifera-portrait",
    "taxonId": "tubifera",
    "src": "/assets/photos/tubifera-portrait.jpg",
    "role": "hero",
    "title": "Tubifera ferruginosa (27663631133).jpg",
    "caption": "Плотная оранжевая группа с различимыми округлыми концами коротких трубочек. Имя Tubifera ferruginosa — по источнику; сроки развития не установлены.",
    "alt": "Оранжевые округлые концы тесно расположенных трубочек над мхом",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tubifera_ferruginosa_(27663631133).jpg",
    "author": "Björn S...",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/"
  },
  {
    "id": "tubifera-detail",
    "taxonId": "tubifera",
    "src": "/assets/photos/tubifera-detail.jpg",
    "role": "detail",
    "title": "Tubifera ferruginosa (28233865066).jpg",
    "caption": "Оранжевое скопление над мхом, рядом растительные остатки. Другой снимок из коллекции автора; последовательность развития по этим двум кадрам не задаётся.",
    "alt": "Широкое оранжевое скопление мелких округлых структур на мху",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tubifera_ferruginosa_(28233865066).jpg",
    "author": "Björn S...",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/"
  },
  {
    "id": "didymium-portrait",
    "taxonId": "didymium",
    "src": "/assets/photos/didymium-portrait.jpg",
    "role": "hero",
    "title": "Didymium squamulosum 12947597.jpg",
    "caption": "Светлые округлые плодовые тела с тёмными участками поверхности. Источник подписывает Didymium squamulosum; степень сохранности отдельных структур различается.",
    "alt": "Группа белёсых округлых плодовых тел с тёмными раскрытыми участками",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Didymium_squamulosum_12947597.jpg",
    "author": "Thomas Laxton",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "id": "didymium-detail",
    "taxonId": "didymium",
    "src": "/assets/photos/didymium-detail.jpg",
    "role": "detail",
    "title": "Didymium squamulosum 30679733.jpg",
    "caption": "Отдельное светлое плодовое тело на ножке; на поверхности видны тёмные точки. Определение Didymium squamulosum взято из источника, физический масштаб не указан.",
    "alt": "Светлая округлая головка на ножке с неровной поверхностью и тёмными точками",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Didymium_squamulosum_30679733.jpg",
    "author": "Thomas Laxton",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
];

export const taxa: Taxon[] = [
  {
    id: "physarum",
    commonName: "Жёлтая сеть",
    commonNameType: "descriptive",
    latinName: "Physarum polycephalum",
    rank: "вид · учебная карточка",
    eyebrow: "ПЛАЗМОДИЙ В ДВИЖЕНИИ",
    summary: "Живой плазмодий образует тонкую сеть и меняет её, исследуя влажную поверхность.",
    notice: "«Жёлтая сеть» — описательное имя. Определения фото взяты из источников. Physarum polycephalum — используемое здесь учебное имя; в пересмотре 2023 года и NCBI вид назван Badhamia polycephala.",
    habitat: "Влажные затенённые места, включая разлагающуюся древесину. Субстрат на фото не устанавливает состав пищи.",
    sourceRefs: ["https://www.mnhn.fr/fr/blob", "https://milnepublishing.geneseo.edu/botany/chapter/physarum/", "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=5791", "https://repository.naturalis.nl/pub/800436/PERS2023051001002-A.pdf"],
    accent: "amber",
    media: media.filter((item) => item.taxonId === "physarum"),
  },
  {
    id: "arcyria",
    commonName: "Красные башенки",
    commonNameType: "descriptive",
    latinName: "Arcyria denudata",
    rank: "вид по подписи источника",
    eyebrow: "ФОРМА, КОТОРУЮ ХОЧЕТСЯ РАССМОТРЕТЬ",
    summary: "Маленькие красные плодовые тела заметны на коре, но цвет сам по себе не доказывает вид.",
    notice: "«Красные башенки» — описательное имя. Вид взят из подписей авторов; цвет не доказывает определение. Ранние стадии объясняются общей схемой миксомицетов, с указанными границами применимости.",
    habitat: "Разлагающаяся древесина: такой субстрат указан в исследовании и виден на фотографиях. Условия каждого экземпляра могут различаться.",
    sourceRefs: ["https://jbior.org/uploads/online_first/18/18-OF6.pdf", "https://commons.wikimedia.org/wiki/File:Arcyria_denudata_(45131851675).jpg"],
    accent: "rose",
    media: media.filter((item) => item.taxonId === "arcyria"),
  },
  {
    "id": "fuligo",
    "commonName": "Жёлтые облачка",
    "commonNameType": "descriptive",
    "latinName": "Fuligo septica",
    "rank": "вид по подписи источника",
    "eyebrow": "МЯГКИЕ ОЧЕРТАНИЯ",
    "summary": "Жёлтые и кремовые массы на щепе и древесине. Рассмотри, где поверхность плотная, а где разветвлённая.",
    "notice": "«Жёлтые облачка» — описательное имя. Определения взяты из подписей источников и не прошли независимую экспертизу. Видовой цикл для этой карточки пока не подготовлен.",
    "habitat": "На выбранных фото видны древесная щепа и разрушенный пень; среда каждой находки описывается отдельно.",
    "sourceRefs": [
      "https://commons.wikimedia.org/wiki/File:2011-01-16_Fuligo_septica.jpg",
      "https://commons.wikimedia.org/wiki/File:Dog_vomit_slime_mold_-_Flickr_-_brewbooks.jpg"
    ],
    "accent": "amber",
    media: media.filter((item) => item.taxonId === "fuligo"),
  },
  {
    "id": "lycogala",
    "commonName": "Лесные шарики",
    "commonNameType": "descriptive",
    "latinName": "Lycogala epidendrum",
    "rank": "вид по подписи источника",
    "eyebrow": "ОКРУГЛЫЕ ФОРМЫ",
    "summary": "В подборке есть оранжевые и серо-коричневые округлые формы. Похожий силуэт помогает сравнивать, но не устанавливает вид.",
    "notice": "«Лесные шарики» — описательное имя. Определения взяты из подписей источников и не прошли независимую экспертизу. Видовой цикл для этой карточки пока не подготовлен.",
    "habitat": "На фотографиях видны древесина и растительные остатки. Это контекст снимков, не полный перечень местообитаний.",
    "sourceRefs": [
      "https://commons.wikimedia.org/wiki/File:Lycogala_epidendrum_(19614125611).jpg",
      "https://commons.wikimedia.org/wiki/File:Lycogala_epidendrum_(2022).jpg"
    ],
    "accent": "rose",
    media: media.filter((item) => item.taxonId === "lycogala"),
  },
  {
    "id": "stemonitis",
    "commonName": "Тонкие башенки",
    "commonNameType": "descriptive",
    "latinName": "Stemonitis axifera",
    "rank": "вид по подписи источника",
    "eyebrow": "РАССМОТРИ ОПОРУ",
    "summary": "На одном фото вытянутые белые структуры держатся на тонких ножках; микроскопический кадр открывает сетчатые детали.",
    "notice": "«Тонкие башенки» — описательное имя. Определения взяты из подписей источников и не прошли независимую экспертизу. Видовой цикл для этой карточки пока не подготовлен.",
    "habitat": "На общем снимке виден край древесного субстрата. Условия подготовки микроскопического материала не указаны.",
    "sourceRefs": [
      "https://commons.wikimedia.org/wiki/File:Stemonitis_axifera.jpg",
      "https://commons.wikimedia.org/wiki/File:Stemonitis_axifera_55573699.jpg"
    ],
    "accent": "amber",
    media: media.filter((item) => item.taxonId === "stemonitis"),
  },
  {
    "id": "trichia",
    "commonName": "Янтарные капельки",
    "commonNameType": "descriptive",
    "latinName": "Trichia decipiens",
    "rank": "вид по подписи источника",
    "eyebrow": "ГОЛОВКА И ОСНОВАНИЕ",
    "summary": "Гладкие оранжевые головки и светлые основания хорошо различимы на выбранных снимках. Найди границу между ними.",
    "notice": "«Янтарные капельки» — описательное имя. Определения взяты из подписей источников и не прошли независимую экспертизу. Видовой цикл для этой карточки пока не подготовлен.",
    "habitat": "Древесный субстрат виден на обоих снимках; влажность и условия роста по фото не измерялись.",
    "sourceRefs": [
      "https://commons.wikimedia.org/wiki/File:Trichia_decipiens_(25563535374).jpg",
      "https://commons.wikimedia.org/wiki/File:Trichia_decipiens_(49251741308).jpg"
    ],
    "accent": "amber",
    media: media.filter((item) => item.taxonId === "trichia"),
  },
  {
    "id": "tubifera",
    "commonName": "Коралловые скопления",
    "commonNameType": "descriptive",
    "latinName": "Tubifera ferruginosa",
    "rank": "вид по подписи источника",
    "eyebrow": "МНОГО ФОРМ РЯДОМ",
    "summary": "Оранжевое скопление состоит из тесно расположенных структур. На краю легче заметить отдельные округлые концы.",
    "notice": "«Коралловые скопления» — описательное имя. Определения взяты из подписей источников и не прошли независимую экспертизу. Видовой цикл для этой карточки пока не подготовлен.",
    "habitat": "На снимках видны мох и растительные остатки. Они показывают окружение, но не доказывают, чем организм питается.",
    "sourceRefs": [
      "https://commons.wikimedia.org/wiki/File:Tubifera_ferruginosa_(27663631133).jpg",
      "https://commons.wikimedia.org/wiki/File:Tubifera_ferruginosa_(28233865066).jpg"
    ],
    "accent": "rose",
    media: media.filter((item) => item.taxonId === "tubifera"),
  },
  {
    "id": "didymium",
    "commonName": "Светлые головки",
    "commonNameType": "descriptive",
    "latinName": "Didymium squamulosum",
    "rank": "вид по подписи источника",
    "eyebrow": "ПОВЕРХНОСТЬ ПОД ЛУПОЙ",
    "summary": "Светлые округлые плодовые тела с тёмными участками. Сравни общий план с отдельной головкой на ножке.",
    "notice": "«Светлые головки» — описательное имя. Определения взяты из подписей источников и не прошли независимую экспертизу. Видовой цикл для этой карточки пока не подготовлен.",
    "habitat": "Растительный субстрат виден у оснований. Точный состав субстрата и условия находки здесь не установлены.",
    "sourceRefs": [
      "https://commons.wikimedia.org/wiki/File:Didymium_squamulosum_12947597.jpg",
      "https://commons.wikimedia.org/wiki/File:Didymium_squamulosum_30679733.jpg"
    ],
    "accent": "amber",
    media: media.filter((item) => item.taxonId === "didymium"),
  },
];

export const cycleStages = [
  {
    id: "spore",
    label: "Спора",
    kicker: "СХЕМА",
    text: "Это фрагмент цикла. Из споры выходит подвижная клетка; в половом цикле совместимые клетки сливаются, прежде чем вырастет плазмодий. Здесь эти промежуточные формы не показаны.",
    photoId: null,
  },
  {
    id: "plasmodium",
    label: "Плазмодий",
    kicker: "ФОТОГРАФИЯ",
    text: "Плазмодий — активная стадия, которую можно рассматривать как сеть. Снимок взят из открытой коллекции.",
    photoId: "physarum-plasmodium",
  },
  {
    id: "fruiting",
    label: "Плодовые тела",
    kicker: "ФОТОГРАФИЯ",
    text: "Плодовые тела формируют и выпускают споры. Здесь отдельный снимок спороносной стадии; фото не является продолжением съёмки плазмодия.",
    photoId: "physarum-macro",
  },
] as const;

export const navLabels = {
  base: "База",
  atlas: "Атлас",
  portrait: "Портрет",
  cycle: "Стадии",
  research: "Исследовательский вопрос",
  journal: "Журнал",
  capture: "Новая находка",
} as const;

export function getTaxon(id: TaxonId): Taxon {
  return taxa.find((taxon) => taxon.id === id) ?? taxa[0];
}

export function getMedia(id: string): MediaItem {
  return media.find((item) => item.id === id) ?? media[0];
}
