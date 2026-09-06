/**
 * The Event code that appears in the QR URL.
 *
 * Crockford base32: no I, L, O or U, so nothing is ambiguous when a Taster
 * reads it off a printed sheet in bad restaurant lighting and types it by hand.
 * Six characters is ~1.07 billion combinations — not enumerable in practice —
 * and short enough to be typeable at all.
 *
 * Random, never sequential: sequential codes would let anyone walk the whole
 * group's history one increment at a time.
 */
export const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CODE_LENGTH = 6;

export function generateEventCode(
  random: () => number = Math.random,
): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    const index = Math.floor(random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[index] ?? CODE_ALPHABET[0];
  }
  return code;
}

/**
 * Accepts what a Taster actually types: lower case, and the letters Crockford
 * treats as digits — I and L read as 1, O reads as 0. U is not remapped because
 * Crockford excludes it to avoid accidental obscenity, not because it collides.
 */
export function normaliseEventCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0")
    .replace(/[^0-9A-Z]/g, "");
}

export function isValidEventCode(input: string): boolean {
  const code = normaliseEventCode(input);
  if (code.length !== CODE_LENGTH) return false;
  return [...code].every((ch) => CODE_ALPHABET.includes(ch));
}
