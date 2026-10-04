// Color-neutral pictures. Each takes a fill color and returns inner SVG markup
// for a 100×100 viewBox. Colored shapes always carry a dark outline so a white
// picture stays visible on a white card.

const OUTLINE = 'stroke="#333" stroke-width="3" stroke-linejoin="round"';
const LINE = 'fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"';

const PICTURES = {
  car: (c) => `
    <path d="M10 62 Q10 50 22 50 L30 50 L38 34 Q40 30 46 30 L64 30 Q70 30 72 34 L80 50 Q90 50 90 62 L90 70 L10 70 Z" fill="${c}" ${OUTLINE}/>
    <path d="M42 36 L36 50 L54 50 L54 36 Z" fill="#CFE8FF" ${OUTLINE}/>
    <path d="M58 36 L58 50 L74 50 L68 36 Z" fill="#CFE8FF" ${OUTLINE}/>
    <circle cx="30" cy="72" r="9" fill="#333"/><circle cx="30" cy="72" r="3.5" fill="#fff"/>
    <circle cx="70" cy="72" r="9" fill="#333"/><circle cx="70" cy="72" r="3.5" fill="#fff"/>`,

  heart: (c) => `
    <path d="M50 85 C20 64 8 48 8 33 C8 20 18 12 29 12 C38 12 45 17 50 25 C55 17 62 12 71 12 C82 12 92 20 92 33 C92 48 80 64 50 85 Z" fill="${c}" ${OUTLINE}/>`,

  star: (c) => `
    <polygon points="50,12 61.8,35.8 88,39.6 69,58.2 73.5,84.4 50,72 26.5,84.4 31,58.2 12,39.6 38.2,35.8" fill="${c}" ${OUTLINE}/>`,

  balloon: (c) => `
    <path d="M50 72 Q44 80 50 86 Q56 92 50 98" ${LINE}/>
    <ellipse cx="50" cy="40" rx="26" ry="30" fill="${c}" ${OUTLINE}/>
    <path d="M46 74 L54 74 L50 69 Z" fill="${c}" ${OUTLINE}/>
    <ellipse cx="40" cy="28" rx="5" ry="8" fill="#fff" opacity=".5"/>`,

  ball: (c) => `
    <circle cx="50" cy="50" r="38" fill="${c}" ${OUTLINE}/>
    <path d="M14 40 Q50 58 86 40" ${LINE}/>
    <path d="M14 60 Q50 78 86 60" ${LINE}/>`,

  flower: (c) => `
    <path d="M50 62 L50 96" fill="none" stroke="#43A047" stroke-width="5" stroke-linecap="round"/>
    <circle cx="50" cy="20" r="14" fill="${c}" ${OUTLINE}/>
    <circle cx="69" cy="33.8" r="14" fill="${c}" ${OUTLINE}/>
    <circle cx="61.8" cy="56.2" r="14" fill="${c}" ${OUTLINE}/>
    <circle cx="38.2" cy="56.2" r="14" fill="${c}" ${OUTLINE}/>
    <circle cx="31" cy="33.8" r="14" fill="${c}" ${OUTLINE}/>
    <circle cx="50" cy="40" r="11" fill="#FFF8E1" ${OUTLINE}/>`,

  fish: (c) => `
    <polygon points="70,50 92,30 92,70" fill="${c}" ${OUTLINE}/>
    <ellipse cx="45" cy="50" rx="32" ry="22" fill="${c}" ${OUTLINE}/>
    <circle cx="28" cy="45" r="5" fill="#333"/><circle cx="26.5" cy="43.5" r="1.6" fill="#fff"/>`,

  butterfly: (c) => `
    <path d="M48 26 Q42 14 36 12 M52 26 Q58 14 64 12" ${LINE}/>
    <ellipse cx="32" cy="38" rx="20" ry="16" transform="rotate(-20 32 38)" fill="${c}" ${OUTLINE}/>
    <ellipse cx="68" cy="38" rx="20" ry="16" transform="rotate(20 68 38)" fill="${c}" ${OUTLINE}/>
    <ellipse cx="36" cy="66" rx="14" ry="12" fill="${c}" ${OUTLINE}/>
    <ellipse cx="64" cy="66" rx="14" ry="12" fill="${c}" ${OUTLINE}/>
    <ellipse cx="50" cy="50" rx="5" ry="26" fill="#333"/>`,

  kite: (c) => `
    <path d="M50 76 Q40 84 50 90 Q60 96 50 100" ${LINE}/>
    <polygon points="50,8 78,40 50,76 22,40" fill="${c}" ${OUTLINE}/>
    <path d="M50 8 L50 76 M22 40 L78 40" fill="none" stroke="#333" stroke-width="2"/>`,

  hat: (c) => `
    <rect x="28" y="24" width="44" height="52" rx="4" fill="${c}" ${OUTLINE}/>
    <rect x="28" y="58" width="44" height="9" fill="#333" opacity=".35"/>
    <rect x="12" y="72" width="76" height="11" rx="5.5" fill="${c}" ${OUTLINE}/>`,
};

export const PICTURE_IDS = Object.keys(PICTURES);

export function renderPicture(id, hex) {
  const draw = PICTURES[id];
  if (!draw) throw new Error(`unknown picture: ${id}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">${draw(hex)}</svg>`;
}
