/**
 * Loose Indian mobile number check: 10 digits, optionally preceded by a
 * country code (+91 / 91 / 0). Strips everything else first so "98765 43210"
 * or "+91-98765-43210" both pass - participants are typing this on a phone
 * mid-hunt, not filling out a form carefully.
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, '').replace(/^0+(?=\d{10}$)/, '').replace(/^91(?=\d{10}$)/, '');
}

export function isValidPhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return /^[6-9]\d{9}$/.test(digits);
}
