// based on https://github.com/Freak613/stage0/blob/master/index.js
import { TEXT_NODE, TREE_WALKER } from './constants';
import { SifrrRef, SifrrBindCreatorFxn, SifrrBindMap } from './types';
const TW_SHARED = TREE_WALKER();

export function collect(
  element: HTMLElement | DocumentFragment,
  stateMap: SifrrRef[]
): HTMLElement[] {
  const l = stateMap.length,
    refs = new Array(l);
  TW_SHARED.currentNode = element;
  for (let i = 0, n: number; i < l; i++) {
    n = stateMap[i].idx;
    while (--n) element = <HTMLElement>TW_SHARED.nextNode();
    refs[i] = element;
  }
  return refs;
}

export function create(
  node: HTMLElement | DocumentFragment,
  fxn: SifrrBindCreatorFxn,
  passedValue: any
): SifrrRef[] {
  const TW = TREE_WALKER();
  const indices: SifrrRef[] = [];
  let ref: SifrrBindMap[] | 0,
    idx = 0,
    ntr: HTMLElement;
  TW.currentNode = node;
  while (node) {
    if (node.nodeType === TEXT_NODE && (<Text>(<unknown>node)).data.trim() === '') {
      ntr = <HTMLElement>node;
      node = <HTMLElement>TW.nextNode();
      ntr.remove();
    } else {
      if ((ref = fxn(<HTMLElement>node, passedValue))) {
        indices.push({ idx: idx + 1, ref });
        idx = 1;
      } else {
        idx++;
      }
      node = <HTMLElement>TW.nextNode();
    }
  }
  return indices;
}
