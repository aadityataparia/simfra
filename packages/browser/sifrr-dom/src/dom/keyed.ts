/* eslint-disable max-lines */
import { makeEqual } from './makeequal';
import { ISifrrElement } from './types';

// Inspired from https://github.com/Freak613/stage0/blob/master/reconcile.js
// This is almost straightforward implementation of reconcillation algorithm
// based on ivi documentation:
// https://github.com/localvoid/ivi/blob/2c81ead934b9128e092cc2a5ef2d3cabc73cb5dd/packages/ivi/src/vdom/implementation.ts#L1366
// With some fast paths from Surplus implementation:
// https://github.com/adamhaile/surplus/blob/master/src/runtime/content.ts#L86
//
// How this implementation differs from others, is that it's working with data directly,
// without maintaining nodes arrays, and manipulates dom only when required

export function makeChildrenEqualKeyed(
  parent: ISifrrElement,
  newData: ISifrrElement[],
  createFn: {
    (state: any): ISifrrElement;
  },
  key: string | number
) {
  const newL = newData.length,
    oldL = parent.childNodes.length;

  if (oldL === 0) {
    for (let i = 0; i < newL; i++) {
      parent.appendChild(createFn(newData[i]));
    }
    return;
  }

  // reconciliation
  let prevStart = 0,
    newStart = 0,
    loop = true,
    prevEnd = oldL - 1,
    newEnd = newL - 1,
    prevStartNode: ISifrrElement = <ISifrrElement>parent.firstChild,
    prevEndNode: ISifrrElement = <ISifrrElement>parent.lastChild,
    finalNode: ISifrrElement,
    a: any,
    b: any,
    _node: ISifrrElement;

  fixes: while (loop) {
    loop = false;

    // Skip prefix
    (a = prevStartNode.state), (b = newData[newStart]);
    while (a[key] === b[key]) {
      makeEqual(prevStartNode, b);
      prevStart++;
      prevStartNode = <ISifrrElement>prevStartNode.nextSibling;
      newStart++;
      if (prevEnd < prevStart || newEnd < newStart) break fixes;
      (a = prevStartNode.state), (b = newData[newStart]);
    }

    // Skip suffix
    (a = prevEndNode.state), (b = newData[newEnd]);
    while (a[key] === b[key]) {
      makeEqual(prevEndNode, b);
      prevEnd--;
      finalNode = prevEndNode;
      prevEndNode = <ISifrrElement>prevEndNode.previousSibling;
      newEnd--;
      if (prevEnd < prevStart || newEnd < newStart) break fixes;
      (a = prevEndNode.state), (b = newData[newEnd]);
    }

    // Fast path to swap backward
    (a = prevEndNode.state), (b = newData[newStart]);
    while (a[key] === b[key]) {
      loop = true;
      makeEqual(prevEndNode, b);
      _node = <ISifrrElement>prevEndNode.previousSibling;
      parent.insertBefore(prevEndNode, prevStartNode);
      prevEndNode = _node;
      prevEnd--;
      newStart++;
      if (prevEnd < prevStart || newEnd < newStart) break fixes;
      (a = prevEndNode.state), (b = newData[newStart]);
    }

    // Fast path to swap forward
    (a = prevStartNode.state), (b = newData[newEnd]);
    while (a[key] === b[key]) {
      loop = true;
      makeEqual(prevStartNode, b);
      _node = <ISifrrElement>prevStartNode.nextSibling;
      parent.insertBefore(prevStartNode, prevEndNode.nextSibling);
      finalNode = prevStartNode;
      prevEndNode = <ISifrrElement>prevStartNode.previousSibling;
      prevStartNode = _node;
      prevStart++;
      newEnd--;
      if (prevEnd < prevStart || newEnd < newStart) break fixes;
      (a = prevStartNode.state), (b = newData[newEnd]);
    }
  }

  // Fast path for shrink
  if (newEnd < newStart) {
    if (prevStart <= prevEnd) {
      let next: Node | ISifrrElement;
      while (prevStart <= prevEnd) {
        if (prevEnd === 0) {
          parent.removeChild(prevEndNode);
        } else {
          next = prevEndNode.previousSibling;
          parent.removeChild(prevEndNode);
          prevEndNode = <ISifrrElement>next;
        }
        prevEnd--;
      }
    }
    return;
  }

  // Fast path for add
  if (prevEnd < prevStart) {
    if (newStart <= newEnd) {
      while (newStart <= newEnd) {
        _node = createFn(newData[newStart]);
        parent.insertBefore(_node, finalNode);
        newStart++;
      }
    }
    return;
  }

  const oldKeys = new Array(newEnd + 1 - newStart),
    newKeys = new Map(),
    nodes = new Array(prevEnd - prevStart + 1),
    toDelete = [];

  for (let i = newStart; i <= newEnd; i++) {
    // Positions for reusing nodes from current DOM state
    oldKeys[i] = -1;
    // Index to resolve position from current to new
    newKeys.set(newData[i][key], i);
  }

  let reusingNodes = 0;
  while (prevStart <= prevEnd) {
    if (newKeys.has(prevStartNode.state[key])) {
      oldKeys[newKeys.get(prevStartNode.state[key])] = prevStart;
      reusingNodes++;
    } else {
      toDelete.push(prevStartNode);
    }
    nodes[prevStart] = prevStartNode;
    prevStartNode = <ISifrrElement>prevStartNode.nextSibling;
    prevStart++;
  }

  // Remove extra nodes
  for (let i = 0; i < toDelete.length; i++) {
    parent.removeChild(toDelete[i]);
  }

  // Fast path for full replace
  if (reusingNodes === 0) {
    for (let i = newStart; i <= newEnd; i++) {
      // Add extra nodes
      parent.insertBefore(createFn(newData[i]), prevStartNode);
    }
    return;
  }

  const longestSeq = longestPositiveIncreasingSubsequence(oldKeys, newStart);

  let lisIdx = longestSeq.length - 1,
    tmpD: ISifrrElement;
  for (let i = newEnd; i >= newStart; i--) {
    if (longestSeq[lisIdx] === i) {
      finalNode = nodes[oldKeys[i]];
      makeEqual(finalNode, newData[i]);
      lisIdx--;
    } else {
      if (oldKeys[i] === -1) {
        tmpD = createFn(newData[i]);
      } else {
        tmpD = nodes[oldKeys[i]];
        makeEqual(tmpD, newData[i]);
      }
      parent.insertBefore(tmpD, finalNode);
      finalNode = tmpD;
    }
  }
}

// Picked from
// https://github.com/adamhaile/surplus/blob/master/src/runtime/content.ts#L368

// return an array of the indices of ns that comprise the longest increasing subsequence within ns
export function longestPositiveIncreasingSubsequence(ns: number[], newStart: number) {
  const seq = [],
    is = [],
    pre = new Array(ns.length);
  let l = -1;

  for (let i = newStart, len = ns.length; i < len; i++) {
    const n = ns[i];
    if (n < 0) continue;
    const j = findGreatestIndexLEQ(seq, n);
    if (j !== -1) pre[i] = is[j];
    if (j === l) {
      l++;
      seq[l] = n;
      is[l] = i;
    } else if (n < seq[j + 1]) {
      seq[j + 1] = n;
      is[j + 1] = i;
    }
  }

  for (let i = is[l]; l > -1; i = pre[i], l--) {
    seq[l] = i;
  }

  return seq;
}

function findGreatestIndexLEQ(seq: number[], n: number) {
  // invariant: lo is guaranteed to be index of a value <= n, hi to be >
  // therefore, they actually start out of range: (-1, last + 1)
  let lo = -1,
    hi = seq.length;

  // fast path for simple increasing sequences
  if (hi > 0 && seq[hi - 1] <= n) return hi - 1;

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (seq[mid] > n) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return lo;
}
