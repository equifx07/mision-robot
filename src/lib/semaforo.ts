// Escala semáforo del panel: del rojo oscuro (lo peor) al verde oscuro (lo mejor), más un gris
// para lo que no es ni bueno ni malo. Los verdes tiran apenas a verde azulado para que no se
// confundan con los rojos en daltonismo (validado con la guía de visualización de datos).
// El color siempre va con su número o una etiqueta. Diseño: https://claude.ai/artifact/9WpvhDytQGPBmpPRatJJ75

export type Tone = "critico" | "bajo" | "regular" | "intermedio" | "bien" | "muybien" | "neutro";

export type ToneStyle = {
  label: string;
  /** Relleno fuerte (barras, celdas) y el color de texto que va encima. */
  fill: string;
  text: string;
  /** Fondo suave (etiquetas) y su tinta. */
  tint: string;
  ink: string;
};

export const TONES: Record<Tone, ToneStyle> = {
  critico: { label: "Crítico", fill: "#761515", text: "#FFFFFF", tint: "#F3D6D3", ink: "#761515" },
  bajo: { label: "Bajo", fill: "#C62D26", text: "#FFFFFF", tint: "#FADBD6", ink: "#9B2019" },
  regular: { label: "Regular", fill: "#EE7D1E", text: "#22211F", tint: "#FDE4CC", ink: "#8A430C" },
  intermedio: { label: "Intermedio", fill: "#F8D85A", text: "#22211F", tint: "#FCF1C4", ink: "#6E5600" },
  bien: { label: "Bien", fill: "#2FA784", text: "#22211F", tint: "#D5EFE5", ink: "#146B50" },
  muybien: { label: "Muy bien", fill: "#0E6B55", text: "#FFFFFF", tint: "#CFE5DD", ink: "#0B5443" },
  neutro: { label: "Dato de contexto", fill: "#E6E3DC", text: "#22211F", tint: "#EFEBE3", ink: "#55504A" },
};

/** Los seis tonos, de peor a mejor. */
export const SCALE: Tone[] = ["critico", "bajo", "regular", "intermedio", "bien", "muybien"];

export const TONE_MEANING: Record<Tone, string> = {
  critico: "Peor que un rojo común: hay que mirarlo primero.",
  bajo: "Está mal: por debajo de lo esperado.",
  regular: "Flojo: le falta para llegar a lo esperado.",
  intermedio: "Más o menos: cerca de lo esperado.",
  bien: "Está bien: lo esperado o un poco más.",
  muybien: "Mejor que un verde común: por encima de lo esperado.",
  neutro: "No es ni bueno ni malo: es un dato de contexto.",
};

// ───────── Porcentaje de acierto ─────────

export function pctTone(v: number): Tone {
  if (!Number.isFinite(v)) return "neutro";
  return v < 0.3 ? "critico" : v < 0.45 ? "bajo" : v < 0.6 ? "regular" : v < 0.75 ? "intermedio" : v < 0.9 ? "bien" : "muybien";
}
export const PCT_RANGES: Record<Exclude<Tone, "neutro">, string> = {
  critico: "menos de 30%",
  bajo: "30 a 44%",
  regular: "45 a 59%",
  intermedio: "60 a 74%",
  bien: "75 a 89%",
  muybien: "90% o más",
};

// ───────── Niveles de desempeño ─────────

export const LEVEL_TONE: Record<string, Tone> = { inicial: "bajo", desarrollo: "intermedio", logrado: "bien", avanzado: "muybien" };

// ───────── Discriminación de una misión ─────────

export function discTone(r: number): Tone {
  if (!Number.isFinite(r)) return "neutro";
  return r < 0 ? "critico" : r < 0.2 ? "bajo" : r < 0.3 ? "intermedio" : r < 0.4 ? "bien" : "muybien";
}
export const DISC_SCALE: { tone: Tone; label: string; range: string }[] = [
  { tone: "critico", label: "Revisar urgente", range: "negativa" },
  { tone: "bajo", label: "Separa poco", range: "0 a 0,19" },
  { tone: "intermedio", label: "Aceptable", range: "0,20 a 0,29" },
  { tone: "bien", label: "Buena", range: "0,30 a 0,39" },
  { tone: "muybien", label: "Muy buena", range: "0,40 o más" },
];

// ───────── Confiabilidad (alfa de Cronbach) ─────────

export function alphaTone(a: number): { tone: Tone; label: string } {
  if (!Number.isFinite(a)) return { tone: "neutro", label: "Faltan datos" };
  if (a < 0.6) return { tone: "bajo", label: "Baja" };
  if (a < 0.7) return { tone: "regular", label: "Floja" };
  if (a < 0.8) return { tone: "intermedio", label: "Aceptable" };
  if (a < 0.9) return { tone: "bien", label: "Buena" };
  return { tone: "muybien", label: "Muy buena" };
}

// ───────── Diferencia entre dos grupos (d de Cohen) ─────────

export type DStyle = { fill: string; text: string; label: string };

export function dStyle(d: number): DStyle {
  if (!Number.isFinite(d)) return { fill: TONES.neutro.tint, text: TONES.neutro.ink, label: "sin datos" };
  if (d <= -0.8) return { fill: TONES.critico.fill, text: TONES.critico.text, label: "mucho peor" };
  if (d <= -0.5) return { fill: TONES.bajo.fill, text: TONES.bajo.text, label: "peor" };
  if (d <= -0.2) return { fill: TONES.bajo.tint, text: TONES.bajo.ink, label: "algo peor" };
  if (d < 0.2) return { fill: TONES.neutro.fill, text: TONES.neutro.text, label: "parecidos" };
  if (d < 0.5) return { fill: TONES.bien.tint, text: TONES.bien.ink, label: "algo mejor" };
  if (d < 0.8) return { fill: TONES.bien.fill, text: TONES.bien.text, label: "mejor" };
  return { fill: TONES.muybien.fill, text: TONES.muybien.text, label: "mucho mejor" };
}
export const D_SCALE: { fill: string; label: string; range: string }[] = [
  { fill: TONES.critico.fill, label: "mucho peor", range: "−0,8 o menos" },
  { fill: TONES.bajo.fill, label: "peor", range: "−0,8 a −0,5" },
  { fill: TONES.bajo.tint, label: "algo peor", range: "−0,5 a −0,2" },
  { fill: TONES.neutro.fill, label: "parecidos", range: "−0,2 a 0,2" },
  { fill: TONES.bien.tint, label: "algo mejor", range: "0,2 a 0,5" },
  { fill: TONES.bien.fill, label: "mejor", range: "0,5 a 0,8" },
  { fill: TONES.muybien.fill, label: "mucho mejor", range: "0,8 o más" },
];

/** Tamaño de una diferencia en palabras (referencia habitual de Cohen). */
export function dSize(d: number): string {
  const a = Math.abs(d);
  return a >= 0.8 ? "grande" : a >= 0.5 ? "mediana" : a >= 0.2 ? "pequeña" : "casi nula";
}

// ───────── Estado de una misión (calidad de la prueba) ─────────

export function itemStatus(p: number, rpb: number): { tone: Tone; label: string } {
  if (!Number.isFinite(p)) return { tone: "neutro", label: "Sin datos" };
  if (!Number.isFinite(rpb)) {
    if (p >= 0.99) return { tone: "neutro", label: "Todos acertaron" };
    if (p <= 0.01) return { tone: "bajo", label: "Nadie la resolvió" };
    return { tone: "neutro", label: "Faltan datos" };
  }
  if (rpb < 0) return { tone: "critico", label: "Revisar urgente" };
  if (rpb < 0.2) return { tone: "bajo", label: "Revisar: separa poco" };
  if (p > 0.9) return { tone: "neutro", label: "Muy fácil" };
  if (p < 0.25) return { tone: "intermedio", label: "Muy difícil" };
  if (rpb < 0.3) return { tone: "intermedio", label: "Aceptable" };
  return { tone: "bien", label: "Funciona bien" };
}

/** Por debajo de esta cantidad de chicos, los indicadores son orientativos. */
export const FEW_DATA = 30;

// ───────── Respuestas apuradas (menos es mejor) ─────────

export function rushTone(v: number): Tone {
  if (!Number.isFinite(v)) return "neutro";
  return v < 0.03 ? "muybien" : v < 0.06 ? "bien" : v < 0.1 ? "intermedio" : v < 0.15 ? "regular" : v < 0.25 ? "bajo" : "critico";
}
export const RUSH_SCALE: { tone: Tone; range: string }[] = [
  { tone: "muybien", range: "menos de 3%" },
  { tone: "bien", range: "3 a 5%" },
  { tone: "intermedio", range: "6 a 9%" },
  { tone: "regular", range: "10 a 14%" },
  { tone: "bajo", range: "15 a 24%" },
  { tone: "critico", range: "25% o más" },
];

// ───────── Tiempos (no son ni buenos ni malos: escala neutra, más oscuro = más tiempo) ─────────

export const TIME_BINS: { max: number; fill: string; text: string; label: string }[] = [
  { max: 20, fill: "#F1EFEA", text: "#22211F", label: "menos de 20 s" },
  { max: 40, fill: "#DCD7CC", text: "#22211F", label: "20 a 39 s" },
  { max: 60, fill: "#B9B2A4", text: "#22211F", label: "40 a 59 s" },
  { max: 90, fill: "#7D766A", text: "#FFFFFF", label: "60 a 89 s" },
  { max: Infinity, fill: "#4A453E", text: "#FFFFFF", label: "90 s o más" },
];
export function timeBin(seconds: number) {
  return TIME_BINS.find((b) => seconds < b.max) ?? TIME_BINS[TIME_BINS.length - 1];
}
