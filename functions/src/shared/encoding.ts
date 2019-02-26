type StringMap = { [s: string]: string };

const ESCAPES: StringMap = {
  ":": "0col0",
  " ": "0spc0"
};

export enum Direction {
  ENCODE = "ENCODE",
  DECODE = "DECODE"
}

/**
 * Ex: github.token --> GITHUB_TOKEN
 */
export function toEnvKey(key: string): string {
  return key.toUpperCase().replace(".", "_");
}

export function encodeKey(key: string): string {
  // From the docs:
  // A variable key can contain digts, letters, dashes, and slashes,
  // and the max length for a name is 256 characters.
  let encoded = key;

  // Replace some bad characters with made up 'escapes'
  Object.keys(ESCAPES).forEach(char => {
    encoded = encoded.replace(char, ESCAPES[char]);
  });

  // Make sure we will be able to read the key back
  const decodeTest = decodeKey(encoded);
  if (decodeTest !== encoded) {
    throw `Cannot encode key: ${encoded} !== ${decodeTest}`;
  }

  return encoded;
}

export function decodeKey(key: string): string {
  let decoded = key;

  Object.keys(ESCAPES).forEach(char => {
    decoded = decoded.replace(ESCAPES[char], char);
  });

  return decoded;
}

export function sanitizeKey(key: string) {
  return key.toLowerCase().trim();
}

// TODO: Rename this function
export function toFlatConfig(ob: any, dir: Direction): StringMap {
  const flattened = flattenObject(ob);
  const result: StringMap = {};
  for (const key in flattened) {
    let newKey = sanitizeKey(key);

    switch (dir) {
      case Direction.ENCODE:
        newKey = encodeKey(newKey);
        break;
      case Direction.DECODE:
        newKey = decodeKey(newKey);
        break;
    }

    const val = flattened[key];
    result[newKey] = val;
  }

  return result;
}

/**
 * Decode all the KEYS of an object of arbitrary depth.
 */
export function deepDecodeObject(ob: any): any {
  if (typeof ob !== "object") {
    return ob;
  }

  const toReturn: any = {};
  for (const i in ob) {
    if (!ob.hasOwnProperty(i)) {
      continue;
    }

    const decodedKey = decodeKey(i);

    const val = ob[i];
    if (typeof val == "object" && !Array.isArray(val)) {
      const decodedObject = deepDecodeObject(val);
      toReturn[decodedKey] = decodedObject;
    } else {
      toReturn[decodedKey] = val;
    }
  }

  return toReturn;
}

/**
 * Source: https://gist.github.com/penguinboy/762197
 */
function flattenObject(ob: any): any {
  const toReturn: any = {};

  for (const i in ob) {
    if (!ob.hasOwnProperty(i)) {
      continue;
    }

    if (typeof ob[i] == "object") {
      const flatObject = flattenObject(ob[i]);
      for (const x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) {
          continue;
        }

        toReturn[i + "." + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}
