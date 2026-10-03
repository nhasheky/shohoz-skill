const BN = "০১২৩৪৫৬৭৮৯";

/** Convert Bangla numerals (০-৯) to English digits. */
export function toEnglishDigits(input: string): string {
  return String(input ?? "").replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
}

/** Keep only a leading + and digits, converting Bangla numerals. */
export function cleanPhoneInput(input: string): string {
  const s = toEnglishDigits(input).trim();
  const plus = s.startsWith("+") ? "+" : "";
  return plus + s.replace(/[^\d]/g, "");
}

/** At least 11 digits; a country code (+88…) is allowed. */
export function isValidPhone(input: string): boolean {
  return /^\+?\d{11,15}$/.test(cleanPhoneInput(input));
}
