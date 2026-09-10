import { useId } from "react";
import type { TaxonId } from "./data";
import type { HidingPlace, Woodland } from "./search-data";

// Original atlas contact landmarks. Each macro frame retains the complete
// native organism AND its continuous wood/leaf surface, including contact detail.
export const specimenFrames: Record<TaxonId, {
  tile: number;
  contact: [number, number];
  support: "wood" | "leaf";
}> = {
  physarum: { tile: 0, contact: [50, 70], support: "wood" },
  arcyria: { tile: 1, contact: [50, 70], support: "wood" },
  fuligo: { tile: 2, contact: [52, 86], support: "wood" },
  lycogala: { tile: 3, contact: [50, 84], support: "wood" },
  stemonitis: { tile: 4, contact: [50, 72], support: "wood" },
  trichia: { tile: 5, contact: [50, 70], support: "wood" },
  tubifera: { tile: 6, contact: [52, 87], support: "wood" },
  didymium: { tile: 7, contact: [64, 88], support: "leaf" },
};
export const macroInset = 4;
export const macroExtent = 100 - macroInset * 2;
// These source silhouettes only protect the intact bodies from the peripheral
// leaf fade. The broad continuous native leaf below/between them stays present;
// this is not the former body-extraction mask.
const leafBodyProtection = [
  "M41 151 C37 130 48 115 65 109 C81 99 106 104 120 119 C139 137 137 162 123 179 Q111 191 94 193 L91 200 L80 205 L67 202 L72 191 Q48 185 41 151 Z",
  "M286 116 Q285 87 309 70 Q333 56 357 68 Q382 77 388 108 Q391 135 369 151 L351 160 L351 166 L338 173 L315 169 L320 159 Q292 155 286 116 Z",
  "M167 192 Q169 162 199 149 Q227 139 251 156 Q271 169 273 200 Q275 226 249 239 L242 248 L250 257 L235 263 L213 270 L196 265 L200 249 L209 239 Q180 235 170 213 Z",
  "M30 259 Q29 234 53 219 Q77 206 103 219 Q128 228 130 256 Q133 284 108 297 L85 308 L94 320 L90 327 L66 334 L53 329 L49 317 L58 302 Q32 290 30 259 Z",
  "M314 198 Q316 166 338 151 Q366 138 393 152 Q422 163 427 193 Q433 224 412 242 L388 256 L398 269 L389 282 L368 289 L344 283 L327 271 L334 265 L343 251 Q315 238 314 198 Z",
  "M237 326 Q235 301 258 287 Q283 276 307 287 Q332 297 335 322 Q338 349 317 366 L304 373 L313 384 L306 391 L281 395 L260 390 L268 382 L268 371 Q241 361 237 326 Z",
];
export const specimenContact = (spot: HidingPlace) =>
  specimenFrames[spot.taxon].contact.map(value => macroInset + value * macroExtent / 100);

// Preserve the previous organism's source-to-scene scale; restoring its native
// substrate must not make resting clues bigger just to disguise a contact defect.
export const specimenPatchSize = (spot: HidingPlace) =>
  spot.size * 8 * (spot.taxon === "physarum" ? .64 : .7) / (macroExtent / 100);

/** Both views use this exact macro patch. Only display size changes.
 * No body extraction, invented shadows, independent recoloring or lens swap. */
export function SearchSpecimen({ woodland, spot, label = "" }: {
  woodland: Woodland;
  spot: HidingPlace;
  label?: string;
}) {
  const instance = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const frame = specimenFrames[spot.taxon];
  const patch = specimenPatchSize(spot);
  const contact = specimenContact(spot);
  const horizontal = "macro-horizontal-" + instance;
  const vertical = "macro-vertical-" + instance;
  const horizontalMask = "macro-horizontal-mask-" + instance;
  const verticalMask = "macro-vertical-mask-" + instance;
  const boundary = "macro-boundary-" + instance;
  const leafEdge = "macro-leaf-edge-" + instance;
  const leafMask = "macro-leaf-mask-" + instance;
  const networkEdge = "macro-network-edge-" + instance;
  const networkMask = "macro-network-mask-" + instance;
  const isNetwork = spot.taxon === "physarum";
  return <svg className="search-composite" viewBox="0 0 100 100"
    role={label ? "img" : undefined} aria-label={label || undefined}
    aria-hidden={label ? undefined : true}
    data-specimen={spot.id} data-source-tile={frame.tile}
    data-contact={contact.join(",")} data-patch-size={patch}
    data-support={frame.support}>
    <defs>
      <clipPath id={boundary}><circle cx="50" cy="50" r="50" /></clipPath>
      {frame.support === "leaf" && <>
        <filter id={leafEdge} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <mask id={leafMask} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style={{maskType:"alpha"}}>
          <path d="M4 41 L6 25 Q8 20 19 21 Q27 21 31 29 Q45 19 60 19 L65 9 Q75 4 85 13 L89 31 Q96 30 100 39 L101 58 L95 70 Q93 86 81 96 L52 100 23 93 1 82 -2 58 Z"
            fill="white" filter={"url(#" + leafEdge + ")"} />
          <g fill="white" transform="translate(-1.115 -1.115) scale(0.23)">
            {leafBodyProtection.map((d, index) => <path key={index} d={d} />)}
          </g>
        </mask>
      </>}
      {isNetwork && <>
        <filter id={networkEdge} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <mask id={networkMask} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style={{maskType:"alpha"}}>
          {/* Keep continuous wood under the whole network. Only its outer join
              follows the irregular growth perimeter, rather than a UI disc. */}
          <path d="M14 5 L28 10 L39 12 L48 18 L58 9 L65 3 L74 10 L86 4 L92 18 L87 29 L102 29 L99 43 L94 53 L103 65 L94 75 L103 87 L97 101 L82 99 L69 105 L56 98 L42 100 L24 98 L16 92 L19 80 L7 77 L3 69 L11 57 L1 49 L13 40 L11 28 L7 21 Z"
            fill="white" filter={"url(#" + networkEdge + ")"} />
          {/* Source-traced peripheral branches retain their immediate native
              support; this protection does not extract the central network. */}
          <path d="M12 17 L17 1 M65 13 L64 4 M84 18 L87 5 M88 35 L100 34 M11 49 L0 47 M12 66 L0 68 M91 62 L99 66 M91 89 L100 91 M58 90 L59 100"
            fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </>}
      <linearGradient id={horizontal} x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="white" stopOpacity="0" />
        <stop offset=".025" stopColor="white" />
        <stop offset=".975" stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={vertical} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="white" stopOpacity="0" />
        <stop offset=".025" stopColor="white" />
        <stop offset=".975" stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <mask id={horizontalMask} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style={{maskType:"alpha"}}>
        <rect width="100" height="100" fill={"url(#" + horizontal + ")"} />
      </mask>
      <mask id={verticalMask} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style={{maskType:"alpha"}}>
        <rect width="100" height="100" fill={"url(#" + vertical + ")"} />
      </mask>
    </defs>
    <g clipPath={frame.support === "leaf" || isNetwork ? undefined : "url(#" + boundary + ")"}>
      <image data-scene-context="" href={woodland.image}
        x={contact[0] - spot.x * 1536 / patch}
        y={contact[1] - spot.y * 1024 / patch}
        width={153600 / patch} height={102400 / patch}
        preserveAspectRatio="none" />
      <svg data-macro-frame="" x={macroInset} y={macroInset}
        width={macroExtent} height={macroExtent}
        viewBox="0 0 100 100" overflow="hidden">
        <g mask={"url(#" + horizontalMask + ")"}>
          <g mask={"url(#" + verticalMask + ")"}>
            <g mask={frame.support === "leaf" ? "url(#" + leafMask + ")" : isNetwork ? "url(#" + networkMask + ")" : undefined}>
            <image href="/assets/art/organisms-v2.webp"
              x={-(frame.tile % 4) * 102 - 1}
              y={-Math.floor(frame.tile / 4) * 102 - 1}
              width="408" height="204" preserveAspectRatio="none" />
            </g>
          </g>
        </g>
      </svg>
    </g>
  </svg>;
}
