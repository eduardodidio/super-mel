/**
 * Word filter for level names — kid-safe community.
 * Client-side blocklist of Portuguese profanities and slurs.
 * Case-insensitive and diacritic-insensitive.
 */

const BLOCKED_WORDS: string[] = [
  // Common Portuguese profanities
  "merda", "porra", "caralho", "foda", "puta",
  "bosta", "cuzao", "viado", "arrombado", "buceta",
  "cacete", "pinto", "piroca", "rola", "xoxota",
  "corno", "vagabundo", "vagabunda", "fdp", "pqp",
  "safado", "safada", "desgraca", "maldito", "maldita",
  "otario", "otaria", "babaca", "imbecil", "idiota",
  "burro", "burra", "retardado", "retardada",
  "vadia", "piranha", "galinha", "rameira",
  "cu", "cuzinho", "cuzuda",
  "punheta", "punheteiro", "broxa",
  "bicha", "veado", "sapatao",
  "nojento", "nojenta", "porco", "porca",
  "cocaina", "maconha", "droga", "crack",
  // Leetspeak / substitutions
  "m3rda", "p0rra", "car4lho", "f0da",
  "put4", "b0sta", "cuz4o",
  // Slurs
  "nazista", "nazi", "hitler",
  "racista", "macaco",
  // English profanities (common in Brazilian internet)
  "fuck", "shit", "bitch", "dick", "ass",
  "pussy", "nigger", "faggot", "whore",
  // Kill/violence
  "matar", "morrer", "suicidio", "estupro",
];

/**
 * Normalize a string: lowercase, remove diacritics, remove non-alphanumeric.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9]/g, "");     // remove non-alphanumeric
}

/**
 * Check if a string contains any blocked words.
 * Returns the first matched word or null.
 */
export function findBlockedWord(text: string): string | null {
  const normalized = normalize(text);

  for (const word of BLOCKED_WORDS) {
    const normalizedWord = normalize(word);
    // Skip very short words (2 chars) to avoid false positives — unless exact match
    if (normalizedWord.length <= 2) {
      // For short blocked words like "cu", require word boundary or exact match
      const regex = new RegExp(`(^|[^a-z])${normalizedWord}($|[^a-z])`);
      if (regex.test(normalized)) {
        return word;
      }
    } else if (normalized.includes(normalizedWord)) {
      return word;
    }
  }
  return null;
}

/**
 * Validate a level name.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateLevelName(name: string): { valid: boolean; reason?: string } {
  if (!name.trim()) {
    return { valid: false, reason: "Nome nao pode ser vazio" };
  }
  if (name.length > 30) {
    return { valid: false, reason: "Nome muito longo (max 30 caracteres)" };
  }
  const blocked = findBlockedWord(name);
  if (blocked) {
    return { valid: false, reason: "Nome contem palavra inadequada" };
  }
  return { valid: true };
}
