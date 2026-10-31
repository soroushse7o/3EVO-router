const dicts: Record<string, any> = {};
let locale = "en";

export async function loadLocales() {
  if (Object.keys(dicts).length === 0) {
    dicts.en = (await import("../../locales/en.json")).default;
    dicts.fa = (await import("../../locales/fa.json")).default;
  }
}
export function setLocale(l: string) { locale = l; }
export function getLocale() { return locale; }
export function isRTL() { return locale === "fa"; }
export function t(key: string): string {
  const parts = key.split(".");
  let cur: any = dicts[locale];
  for (const p of parts) {
    if (!cur) return key;
    cur = cur[p];
  }
  return String(cur ?? key);
}
export { dicts };
