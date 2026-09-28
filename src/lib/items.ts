import { ITEMS_A } from "./items-a";
import { ITEMS_B } from "./items-b";
import type { Item } from "./model";

// v0.2 (2026-09-25): misiones rediseñadas (consignas cortas, arreglar como cambios, A6.3 nuevo, A7.1 con hueco, A4.3 en 7×7).
export const TEST_VERSION = "epc6-v0.2";
export const ITEMS: Item[] = [...ITEMS_A, ...ITEMS_B];
export { ITEMS_A, ITEMS_B };

export function itemById(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}
