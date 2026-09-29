# Forest discovery learning content

Source review: 2026-09-29. Content: `src/photo-walk-learning.ts`.

Each discovery opens general biology for its group, with two short Russian paragraphs, three facts and an observation prompt. The four groups are myxomycetes, lichens, fungi with mushroom-like fruiting bodies, and woodlice. The text does not identify the illustrated objects to species or treat them as observations from the source video.

The renderer can use `getLearning(kind)` without loading an atlas or fetching external pages. Sources are optional further-reading links. The existing short artwork label remains the renderer's responsibility; the learning text does not repeat the removed disclaimer.

| Group | Source and supported claims |
| --- | --- |
| Myxomycetes | [RHS: Slime Moulds](https://www.rhs.org.uk/biodiversity/slime-moulds): habitats, bacterial feeding, plasmodium, small and fragile spore-bearing structures, spores returning to microscopic cells. [MNHN: Blob](https://www.mnhn.fr/fr/blob): amoeboid relationship and the multinucleate cell of the plasmodium. |
| Lichens | [Australian National Botanic Gardens: What is a lichen?](https://www.anbg.gov.au/lichen/what-is-lichen.html): fungal and photosynthetic partners, carbohydrate production, fungal threads, growth forms and substrates. [Kew: The lichen that invented sunscreen](https://www.kew.org/read-and-watch/lichen-that-invented-sunscreen): fungal partnership with algae or cyanobacteria, sometimes both. |
| Fungi | [Kew: What in earth?](https://www.kew.org/read-and-watch/what-is-fungi): hyphae, mycelium, fruiting bodies, spores, dispersal and forms other than mushrooms. [Natural History Museum: Life in soil](https://www.nhm.ac.uk/discover/life-in-soil.html): decomposition and recycling of nutrients. |
| Woodlice | [Natural History Museum: Log piles](https://www.nhm.ac.uk/discover/how-to-make-a-log-pile-to-provide-shelter-for-garden-wildlife.html): terrestrial crustaceans, moist shelters and feeding on decaying plants. [Natural History Museum: Minibeast identification](https://www.nhm.ac.uk/discover/how-to-make-pitfall-trap-to-catch-insects.html): seven pairs of legs and segmented body. |

The internal atlas link is a comparison: “Другой миксомицет: живая сеть”, with the stable taxon ID `physarum`. It opens the existing card, whose scientific name is managed by the atlas. The orange game artwork is not identified as that taxon. No atlas link is supplied for the other groups because the current atlas contains myxomycetes.

Observation prompts ask players to compare visible features. They do not require a species identification, collecting specimens, tasting fungi, or disturbing an animal's shelter. The wording concerns general biology; it does not establish a measured size, developmental sequence or ecological relationship for any particular object in the video.

Source limits: the RHS page uses broad historical “slime mould” terminology; its statements about aggregation and a single protist kingdom are not repeated. The MNHN account focuses on one studied species; its speed, learning experiments and culture conditions are not generalized to all myxomycetes. The woodlouse text says “adult” for the seven pairs of legs and avoids claiming that all woodlice roll into a ball or have identical respiratory structures.
