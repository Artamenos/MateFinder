export function faceitLevelClass(level: number | string | null | undefined) {
  const numericLevel = typeof level === "number"
    ? level
    : Math.max(...String(level ?? "").match(/\d+/g)?.map(Number) ?? [0]);

  if (numericLevel >= 10) return "faceit-level-red";
  if (numericLevel >= 8) return "faceit-level-orange";
  if (numericLevel >= 4) return "faceit-level-yellow";
  if (numericLevel >= 2) return "faceit-level-green";
  if (numericLevel >= 1) return "faceit-level-white";
  return "faceit-level-empty";
}
