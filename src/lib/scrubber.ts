const SECRET_PATTERNS = [
  ['Authorization', 'Bearer'],
  ['Authorization', 'X-Api-Key', 'Cookie'],
  ['key='],
  ['sk-'],
  ['password'],
  ['secret'],
  ['token'],
  ['api_key'],
  ['access_token'],
  ['refresh_token'],
  ['Basic'],
];

export function scrub(text: string): string {
  let out = text;
  for (const group of SECRET_PATTERNS) {
    for (const token of group) {
      if (token === 'key=' || token === 'password' || token === 'secret' || token === 'token' || token === 'api_key' || token === 'access_token' || token === 'refresh_token') {
        const param = token.replace('=', '');
        out = out.replace(new RegExp('([?&])' + param + '=[^&\\s]+', 'gi'), '$1' + '[REDACTED_SECRET]')
      } else if (token === 'sk-') {
        out = out.replace(new RegExp(token + '[A-Za-z0-9]{10,}', 'g'), '[REDACTED_SECRET]')
      } else if (token === 'Bearer') {
        out = out.replace(new RegExp(token + '\\s+\\S+', 'gi'), '[REDACTED_SECRET]')
      } else if (token === 'Basic') {
        out = out.replace(new RegExp(token + '\\s+\\S+', 'gi'), '[REDACTED_SECRET]')
      } else {
        out = out.replace(new RegExp('^' + token + ':.*$', 'gim'), token + ': [REDACTED_SECRET]')
      }
    }
  }
  return out;
}
