import { isObject } from "italia-ts-commons/lib/types";

/**
 * Return an object filtering out keys that point to null values.
 */

export function withoutNullValues<T, K extends keyof T>(
  obj: T
): { [P in keyof T]?: Exclude<T[P], null> } {
  const keys = Object.keys(obj);
  // tslint:disable-next-line: no-inferred-empty-object-type
  return keys.reduce((acc, key) => {
    const value = obj[key as K];
    return value !== null
      ? Object.assign({}, acc, {
          // tslint:disable-next-line:no-any
          [key]: isObject(value) ? withoutNullValues(value) : value
        })
      : acc;
  }, {});
}
