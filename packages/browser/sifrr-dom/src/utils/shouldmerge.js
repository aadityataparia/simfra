// @param (oldState, newState)
export default (a, b) => {
  if (typeof a !== 'object') return a !== b;
  if (a === null || b === null) return a === b;
  for (const key in b) {
    if (!(key in a) || a[key] !== b[key]) return true;
  }
  return false;
};
