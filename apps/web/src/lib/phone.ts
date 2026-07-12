export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^0-9 ()+-]/g, "");
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");

  let normalized = digits;
  if (normalized.startsWith("90") && normalized.length === 12) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith("0") && normalized.length === 11) {
    normalized = normalized.slice(1);
  }

  return /^5\d{9}$/.test(normalized);
}
