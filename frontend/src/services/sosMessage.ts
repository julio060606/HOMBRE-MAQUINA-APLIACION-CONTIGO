export const SOS_MESSAGE_LIMIT = 240;

export function normalizeSosMessage(message = ''): string {
  const normalized = message.trim();
  if (normalized.length > SOS_MESSAGE_LIMIT) throw new Error('El mensaje debe tener como máximo 240 caracteres.');
  const invalidControl = [...normalized].some(character => {
    const code = character.codePointAt(0)!;
    return (code < 32 || (code >= 127 && code <= 159)) && !['\n', '\r', '\t'].includes(character);
  });
  if (invalidControl) throw new Error('El mensaje contiene caracteres de control no permitidos.');
  return normalized;
}
