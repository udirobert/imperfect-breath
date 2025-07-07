// This is a shim file to fix the lodash imports in Recharts and other libraries
// Re-export lodash functions that are commonly used with default imports

// Import and re-export the commonly used lodash functions in Recharts
import * as get from "lodash/get";
import * as isNil from "lodash/isNil";
import * as isString from "lodash/isString";
import * as isFunction from "lodash/isFunction";
import * as isArray from "lodash/isArray";
import * as isObject from "lodash/isObject";
import * as isEqual from "lodash/isEqual";
import * as last from "lodash/last";

// Re-export as both named and default exports
export { get, isNil, isString, isFunction, isArray, isObject, isEqual, last };

// Default exports for backwards compatibility
export default {
  get: get.default || get,
  isNil: isNil.default || isNil,
  isString: isString.default || isString,
  isFunction: isFunction.default || isFunction,
  isArray: isArray.default || isArray,
  isObject: isObject.default || isObject,
  isEqual: isEqual.default || isEqual,
  last: last.default || last,
};
