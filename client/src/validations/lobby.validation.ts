// Mirrors the server's zod rules so users get instant feedback.
const NAME_PATTERN = /^[\p{L}\p{N} _.'-]+$/u;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

export function validateDisplayName(value: string): string | null {
  const name = value.trim();

  if (name.length < 2 || name.length > 30) {
    return "Display name must be between 2 and 30 characters.";
  }
  if (!NAME_PATTERN.test(name)) {
    return "Display name contains unsupported characters.";
  }
  return null;
}

export function validateRoomCode(value: string): string | null {
  return ROOM_CODE_PATTERN.test(value.trim().toUpperCase())
    ? null
    : "Enter a valid 6-character room code.";
}
