import { ITEMS_A } from "./items-a";
import { ITEMS_B } from "./items-b";
import type { Item } from "./model";

export const TEST_VERSION = "epc6-v0.1";
export const ITEMS: Item[] = [...ITEMS_A, ...ITEMS_B];
export { ITEMS_A, ITEMS_B };

export function itemById(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}
