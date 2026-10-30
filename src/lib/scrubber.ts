const SECRET_PATTERNS = [
  ['Authorization', 'Bearer'],
  ['Authorization', 'X-Api-Key', 'Cookie'],
  ['key='],
  ['sk-']
];

export function scrub(text: string): string {
  let out = text;
  for (const group of SECRET_PATTERNS) {
    for (const token of group) {
      if (token === 'key=') {
        out = out.replace(new RegExp('[?&]' + token.replace('=', '') + '=[^&\s]+', 'gi'), '[REDACTED_SECRET]')
      } else if (token === 'sk-') {
        out = out.replace(new RegExp(token + '[A-Za-z0-9]{10,}', 'g'), '[REDACTED_SECRET]')
      } else if (token === 'Bearer') {
        out = out.replace(new RegExp(token + '\s+\S+', 'gi'), '[REDACTED_SECRET]')
      } else {
        out = out.replace(new RegExp('^' + token + ':.*$', 'gim'), '[REDACTED_SECRET]')
      }
    }
  }
  return out;
}
