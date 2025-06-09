"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenObject = flattenObject;
exports.unflattenObject = unflattenObject;
/**
 * Flattens a nested object into a flat object with dot-separated keys
 * @param obj Object to flatten
 * @param prefix Prefix for nested keys
 * @returns Flattened object
 */
function flattenObject(obj, prefix) {
    if (prefix === void 0) { prefix = ''; }
    return Object.keys(obj).reduce(function (acc, key) {
        var prefixedKey = prefix ? "".concat(prefix, ".").concat(key) : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            // Recursively flatten nested objects
            Object.assign(acc, flattenObject(obj[key], prefixedKey));
        }
        else if (Array.isArray(obj[key])) {
            // Handle arrays by creating indexed keys
            obj[key].forEach(function (item, index) {
                if (typeof item === 'object' && item !== null) {
                    // If array contains objects, flatten them
                    Object.assign(acc, flattenObject(item, "".concat(prefixedKey, "[").concat(index, "]")));
                }
                else {
                    // For primitive values in array
                    acc["".concat(prefixedKey, "[").concat(index, "]")] = String(item);
                }
            });
        }
        else {
            // For primitive values
            acc[prefixedKey] = obj[key] === null ? '' : String(obj[key]);
        }
        return acc;
    }, {});
}
/**
 * Unflattens a flat object with dot-separated keys into a nested object
 * @param obj Object to unflatten
 * @returns Unflattened object
 */
function unflattenObject(obj) {
    var result = {};
    Object.keys(obj).forEach(function (key) {
        // Handle array notation: key[index]
        var arrayMatch = /^(.*)\[(\d+)\]$/.exec(key);
        if (arrayMatch) {
            var arrayKey = arrayMatch[1], indexStr = arrayMatch[2];
            var index = parseInt(indexStr, 10);
            // Split the key by dots to get path segments
            var segments = arrayKey.split('.');
            // Traverse to the correct location and ensure arrays exist
            var current = result;
            for (var i = 0; i < segments.length; i++) {
                var segment = segments[i];
                if (i === segments.length - 1) {
                    // Last segment - create array if needed
                    if (!current[segment]) {
                        current[segment] = [];
                    }
                    // Ensure the array is large enough
                    while (current[segment].length <= index) {
                        current[segment].push(null);
                    }
                    current[segment][index] = obj[key];
                }
                else {
                    // Not the last segment - create object if needed
                    if (!current[segment]) {
                        current[segment] = {};
                    }
                    current = current[segment];
                }
            }
        }
        else {
            // Regular dot notation
            var segments = key.split('.');
            // Traverse to the correct location
            var current = result;
            for (var i = 0; i < segments.length; i++) {
                var segment = segments[i];
                if (i === segments.length - 1) {
                    // Last segment - set the value
                    current[segment] = obj[key];
                }
                else {
                    // Not the last segment - create object if needed
                    if (!current[segment]) {
                        current[segment] = {};
                    }
                    current = current[segment];
                }
            }
        }
    });
    return result;
}
