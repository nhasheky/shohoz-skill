const BN_MAP: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

/** Convert Bangla numerals (০-৯) to English digits. */
export function toEnglishDigits(input: unknown): string {
  return String(input ?? '').replace(/[০-৯]/g, (d) => BN_MAP[d] ?? d);
}

/** Keep only a leading + and digits (Bangla numerals converted). */
export function cleanPhone(input: unknown): string {
  const s = toEnglishDigits(input).trim();
  const plus = s.startsWith('+') ? '+' : '';
  return plus + s.replace(/\D/g, '');
}

export function phoneDigits(input: unknown): string {
  return toEnglishDigits(input).replace(/\D/g, '');
}

/**
 * Canonical stored form. Bangladeshi local numbers become +8801XXXXXXXXX;
 * numbers with a country code are kept as +<digits>.
 */
export function normalizePhone(input?: string | null): string | undefined {
  if (!input) return undefined;
  const digits = phoneDigits(input);
  if (!digits) return undefined;
  if (digits.length === 11 && digits.startsWith('01')) return '+88' + digits;
  if (digits.length === 13 && digits.startsWith('8801')) return '+88' + digits.slice(2);
  if (digits.startsWith('88') && digits.length >= 12) return '+' + digits;
  return '+' + digits;
}

/** Short, readable device label from a User-Agent string. */
export function parseDevice(ua: string): string {
  if (!ua) return 'Unknown device';
  const os = /iPhone/i.test(ua)
    ? 'iPhone'
    : /iPad/i.test(ua)
      ? 'iPad'
      : /Android/i.test(ua)
        ? ua.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build|\))/i)?.[1]?.trim() || 'Android'
        : /Windows/i.test(ua)
          ? 'Windows'
          : /Mac OS X|Macintosh/i.test(ua)
            ? 'Mac'
            : /Linux/i.test(ua)
              ? 'Linux'
              : 'Unknown OS';
  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\//i.test(ua)
      ? 'Opera'
      : /Chrome\//i.test(ua) && !/Chromium/i.test(ua)
        ? 'Chrome'
        : /Firefox\//i.test(ua)
          ? 'Firefox'
          : /Safari\//i.test(ua)
            ? 'Safari'
            : 'Browser';
  return `${os} · ${browser}`;
}
