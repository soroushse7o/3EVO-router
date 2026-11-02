export function stripNullBytes(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\0/g, "");
}
