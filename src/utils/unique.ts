export const getUnique = <T>(arr: T[], by: (t: T) => string) => {
  const set = new Set(arr.map(by));
  // biome-ignore lint/style/noNonNullAssertion: cannot be null
  return set.values().map(id => arr.find(value => by(value) === id)!);
};
