export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
}

export function nowIsoString(): string {
  return new Date().toISOString();
}
