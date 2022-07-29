import { create } from '@wonderlandlabs/collect';

export function emitterMap(matches: any, processor: (matches, addKey) => void) {
  const map = create(new Map());

  const addKey = (key, value) => {
    if (map.hasKey(key)) {
      map.get(key).push(value);
    } else {
      map.set(key, [value])
    }
  }

  processor(matches, addKey);

  return map;
}
