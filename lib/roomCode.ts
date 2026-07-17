const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O — avoid confusion with 1/0

/** Generates a short, easy-to-read-aloud room code for sharing. */
export function generateRoomCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
