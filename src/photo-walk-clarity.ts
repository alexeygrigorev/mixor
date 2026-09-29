let serial = 0;
/** Mild edge contrast only. This uses the original pixels, never synthesized detail.
 * It is deliberately not described as super-resolution. */
export function photoClarityFilter() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  const defs = document.createElementNS(ns, "defs");
  const filter = document.createElementNS(ns, "filter");
  const id = `photo-clarity-${++serial}`;
  filter.id = id;
  filter.setAttribute("color-interpolation-filters", "sRGB");
  filter.setAttribute("x", "0"); filter.setAttribute("y", "0");
  filter.setAttribute("width", "100%"); filter.setAttribute("height", "100%");
  const kernel = document.createElementNS(ns, "feConvolveMatrix");
  kernel.setAttribute("order", "3");
  kernel.setAttribute("kernelMatrix", "0 -.08 0 -.08 1.32 -.08 0 -.08 0");
  kernel.setAttribute("divisor", "1"); kernel.setAttribute("preserveAlpha", "true");
  kernel.setAttribute("edgeMode", "duplicate");
  filter.append(kernel); defs.append(filter); svg.append(defs);
  return { element: svg, url: `url(#${id})` };
}
