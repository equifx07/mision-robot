import { ITEMS_A } from "./items-a";
import { ITEMS_B } from "./items-b";
import type { Item } from "./model";

// Banco de misiones. Las pruebas de 4.º y 6.º toman misiones de acá (ver tests.ts).
export const ITEMS: Item[] = [...ITEMS_A, ...ITEMS_B];
export { ITEMS_A, ITEMS_B };

export function itemById(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}
