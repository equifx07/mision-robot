import type { CSSProperties } from "react";
import type { Cell, GameMap } from "@/lib/model";
import { canvasArt, mazeArt, placeRobot, type Fail, type RobotState } from "@/lib/art";
import type { Seg } from "@/lib/sim";

type Props = {
  map: GameMap;
  /** Posición del robot (por defecto, el inicio; en lienzo espera al costado del punto verde). */
  robotAt?: Cell;
  /** Pose del robot. */
  robotState?: RobotState;
  /** Recorrido a dibujar (revisión y animación). */
  visited?: Cell[];
  /** Rastro pintado a mostrar en lienzo (por defecto, la figura objetivo). */
  trail?: Set<Seg>;
  /** Color del rastro en lienzo. */
  color?: string;
  /** Lienzo: figura objetivo tenue de fondo. */
  ghost?: Set<Seg>;
  hideRobot?: boolean;
  /** Laberinto: recorrido de un programa con error, en rojo, con la marca del choque. */
  fail?: Fail;
  /** Muestra las coordenadas de cada casilla (solo revisión). */
  showCoords?: boolean;
  /**
   * Agranda el mapa para llenar el ancho disponible, sin pasar `maxScale` veces su tamaño
   * ni la altura de la pantalla menos `reserve` píxeles.
   */
  fit?: { maxScale: number; reserve: number; share?: number };
  className?: string;
};

/** Robot centrado en (x, y); con scale = 1 mide unos 52 px de alto. */
export function Robot({ x, y, scale = 1, state = "normal" }: { x: number; y: number; scale?: number; state?: RobotState }) {
  return <g dangerouslySetInnerHTML={{ __html: placeRobot(x, y, 52 * scale, state) }} />;
}

export function MapView({ map, robotAt, robotState, visited, trail, color, ghost, hideRobot, fail, showCoords, fit, className }: Props) {
  const art =
    map.kind === "maze"
      ? mazeArt(map, { robotAt, robotState, visited, showCoords, fail })
      : canvasArt(map, { robotAt, robotState, trail, showCoords, color, hideRobot, ghost });
  let style: CSSProperties = { maxWidth: "100%", height: "auto", display: "block" };
  if (fit) {
    const ratio = (art.w / art.h).toFixed(4);
    const share = fit.share ?? 1;
    // ancho = el menor entre maxScale × tamaño natural y lo que permite el alto de la pantalla (y nunca más que el contenedor)
    style = {
      width: `min(${Math.round(art.w * fit.maxScale)}px, max(${Math.round(art.w * 0.75)}px, calc((100vh - ${fit.reserve}px) * ${share} * ${ratio})))`,
      maxWidth: "100%",
      height: "auto",
      display: "block",
    };
  }
  return (
    <svg
      viewBox={`0 0 ${art.w} ${art.h}`}
      width={art.w}
      height={art.h}
      style={style}
      className={className}
      role="img"
      aria-label={map.kind === "maze" ? "Mapa de islas unidas por puentes" : "Figura a dibujar"}
      dangerouslySetInnerHTML={{ __html: art.svg }}
    />
  );
}
