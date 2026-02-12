export const uniqueFactory = <T>(
  count: number,
  factory: () => T,
  uniqueField: keyof T,
  maxAttemptsMultiplier = 10,
): T[] => {
  const items: T[] = [];
  const existingKeys = new Set<unknown>();
  let attempts = 0;
  const maxAttempts = count * maxAttemptsMultiplier;

  while (items.length < count && attempts < maxAttempts) {
    attempts++;
    const item = factory();
    const key = item[uniqueField];

    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      items.push(item);
    }
  }

  return items;
};
