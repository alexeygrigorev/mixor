import type { TaxonId } from "./data";

export const taxonomySources = [
  {
    title: "Leontyev et al., 2019 — классификация Myxomycetes",
    url: "https://phytotaxa.mapress.com/pt/article/view/phytotaxa.399.3.5/22660",
  },
  {
    title: "García-Martín et al., 2023 — Physarales, Badhamia polycephala",
    url: "https://repository.naturalis.nl/pub/800436/PERS2023051001002-A.pdf",
  },
  {
    title: "Yatsiuk et al., 2025 — Arcyriaceae и Hemitrichiaceae",
    url: "https://fuse-journal.org/images/Issues/Vol15Art4.pdf",
  },
  {
    title: "Shchepin et al., 2026 — Columellomycetidae",
    url: "https://www.bioacad.com/article/doi.org/10.65390/fdiv.2026.136015",
  },
];
export const scientificNames: Record<
  TaxonId,
  { name: string; synonym?: string; genus: string }
> = {
  physarum: {
    name: "Badhamia polycephala",
    synonym: "Physarum polycephalum",
    genus: "Badhamia",
  },
  arcyria: { name: "Arcyria denudata", genus: "Arcyria" },
  fuligo: { name: "Fuligo septica", genus: "Fuligo" },
  lycogala: { name: "Lycogala epidendrum", genus: "Lycogala" },
  stemonitis: { name: "Stemonitis axifera", genus: "Stemonitis" },
  trichia: {
    name: "Hemitrichia decipiens",
    synonym: "Trichia decipiens",
    genus: "Hemitrichia",
  },
  tubifera: { name: "Tubifera ferruginosa", genus: "Tubifera" },
  didymium: { name: "Didymium squamulosum", genus: "Didymium" },
};

export type TaxonomyNode = {
  name: string;
  rank: string;
  taxon?: TaxonId;
  children?: TaxonomyNode[];
};
function genus(id: TaxonId): TaxonomyNode {
  return {
    name: scientificNames[id].genus,
    rank: "род",
    children: [{ name: scientificNames[id].name, rank: "вид", taxon: id }],
  };
}
/** A sourced classification, not a time-calibrated phylogeny. Only prepared species are leaves. */
export const taxonomyTree: TaxonomyNode = {
  name: "Myxomycetes",
  rank: "класс · миксомицеты",
  children: [
    {
      name: "Columellomycetidae",
      rank: "подкласс · тёмные споры",
      children: [
        {
          name: "Physarales",
          rank: "порядок",
          children: [
            {
              name: "Physaraceae",
              rank: "семейство",
              children: [genus("physarum"), genus("fuligo")],
            },
            {
              name: "Didymiaceae",
              rank: "семейство",
              children: [genus("didymium")],
            },
          ],
        },
        {
          name: "Stemonitidales",
          rank: "порядок",
          children: [
            {
              name: "Stemonitidaceae",
              rank: "семейство",
              children: [genus("stemonitis")],
            },
          ],
        },
      ],
    },
    {
      name: "Lucisporomycetidae",
      rank: "подкласс · светлые споры",
      children: [
        {
          name: "Trichiales",
          rank: "порядок",
          children: [
            {
              name: "Arcyriaceae",
              rank: "семейство",
              children: [genus("arcyria")],
            },
            {
              name: "Hemitrichiaceae",
              rank: "семейство",
              children: [genus("trichia")],
            },
          ],
        },
        {
          name: "Reticulariales",
          rank: "порядок",
          children: [
            {
              name: "Reticulariaceae",
              rank: "семейство",
              children: [genus("lycogala"), genus("tubifera")],
            },
          ],
        },
      ],
    },
  ],
};
