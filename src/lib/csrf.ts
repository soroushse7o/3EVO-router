export function validateCSRF(header: string | null, session: string | undefined): boolean {
  if (!header) return false;
  return header === session?.slice(0, 16);
}
