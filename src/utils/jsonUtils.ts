/**
 * Flattens a nested object into a flat object with dot-separated keys
 * @param obj Object to flatten
 * @param prefix Prefix for nested keys
 * @returns Flattened object
 */
export function flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, string> {
    return Object.keys(obj).reduce((acc: Record<string, string>, key: string) => {
        const prefixedKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            // Recursively flatten nested objects
            Object.assign(acc, flattenObject(obj[key], prefixedKey));
        } else if (Array.isArray(obj[key])) {
            // Handle arrays by creating indexed keys
            obj[key].forEach((item: any, index: number) => {
                if (typeof item === 'object' && item !== null) {
                    // If array contains objects, flatten them
                    Object.assign(acc, flattenObject(item, `${prefixedKey}[${index}]`));
                } else {
                    // For primitive values in array
                    acc[`${prefixedKey}[${index}]`] = String(item);
                }
            });
        } else {
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
export function unflattenObject(obj: Record<string, string>): Record<string, any> {
    const result: Record<string, any> = {};

    Object.keys(obj).forEach(key => {
        // Handle array notation: key[index]
        const arrayMatch = /^(.*)\[(\d+)\]$/.exec(key);

        if (arrayMatch) {
            const [, arrayKey, indexStr] = arrayMatch;
            const index = parseInt(indexStr, 10);

            // Split the key by dots to get path segments
            const segments = arrayKey.split('.');

            // Traverse to the correct location and ensure arrays exist
            let current = result;
            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];

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
                } else {
                    // Not the last segment - create object if needed
                    if (!current[segment]) {
                        current[segment] = {};
                    }
                    current = current[segment];
                }
            }
        } else {
            // Regular dot notation
            const segments = key.split('.');

            // Traverse to the correct location
            let current = result;
            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];

                if (i === segments.length - 1) {
                    // Last segment - set the value
                    current[segment] = obj[key];
                } else {
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