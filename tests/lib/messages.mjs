// The page's contract for its six messages, which the gates hold it to: the names in sequence order,
// each with the eye it is read from (az, el in degrees), and the start view. The page reports the
// messages as window.__cloud.messages; the gates use these values, not the page's, so a page that
// moves an eye, or forms a message for an eye other than the one it reports, cannot carry the
// gates along with it. scripts/shoot.mjs keeps its own copy (EYES).
export const MESSAGES = Object.freeze([
  { name: 'hello-world', az: 38, el: 14 },
  { name: 'face', az: 98, el: 18 },
  { name: 'what', az: 158, el: 16 },
  { name: 'a', az: 218, el: 20 },
  { name: 'beautiful', az: 278, el: 16 },
  { name: 'world', az: 338, el: 18 },
].map(Object.freeze));
export const NAMES = MESSAGES.map((m) => m.name);
export const START = Object.freeze({ az: 8, el: -16 });

const DEG = Math.PI / 180;
const dir = ({ az, el }) => [Math.cos(el * DEG) * Math.sin(az * DEG), Math.sin(el * DEG), Math.cos(el * DEG) * Math.cos(az * DEG)];
// Degrees between two views ({ az, el } in degrees), by the chord, which keeps precision near 0.
export function angleDeg(a, b) {
  const p = dir(a), q = dir(b);
  return (2 * Math.asin(Math.min(1, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) / 2))) / DEG;
}
// The index of the message whose eye the view is at, within `tol` degrees, or -1.
export const eyeAt = (view, tol = 1e-6) => MESSAGES.findIndex((m) => angleDeg(view, m) <= tol);
// The view halfway between two messages' eyes, along the shorter way round in azimuth.
export function midpoint(a, b) {
  const d = ((((b.az - a.az) % 360) + 540) % 360) - 180;
  return { az: (((a.az + d / 2) % 360) + 360) % 360, el: (a.el + b.el) / 2 };
}
