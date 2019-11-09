import shouldMerge from '../utils/shouldmerge';
import { SifrrElementInterface } from './types';
const objCon = {}.constructor;

export class Store<T> {
  private listeners: Function[];
  public value: T;
  public addListener: Function;

  constructor(initial: T) {
    this.value = initial;
    this.listeners = [];
    this.addListener = this.listeners.push.bind(this.listeners);
  }

  set(newValue: T) {
    if (shouldMerge(this.value, newValue)) {
      if (this.value.constructor === objCon) Object.assign(this.value, newValue);
      else this.value = newValue;
    }
    this.update();
  }

  update() {
    this.listeners.forEach(l => l());
    this.onUpdate();
  }

  onUpdate() {}
}

export function bindStoresToElement(
  element: SifrrElementInterface,
  stores: Store<any>[] | Store<any> = []
) {
  const update = element.update.bind(element);
  if (Array.isArray(stores)) stores.forEach(s => s.addListener(update));
  else stores.addListener(update);
}
