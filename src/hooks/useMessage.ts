import { useLocaleStore } from "./useLocaleStore";

/**
 * A hook to get a localized message that automatically updates when the locale changes.
 * @param key The key of the message to retrieve from messages.json.
 * @param fallback The fallback text to display if the key is not found.
 * @param substitutions Optional substitutions for the message.
 * @returns The localized message string.
 */
export const useMessage = (
  key: string,
  fallback: string,
  substitutions?: string | string[]
) => {
  const messages = useLocaleStore(state => state.messages);

  const entry = messages[key];
  if (!entry) {
    return fallback; // Return fallback if key not found
  }

  let message = entry.message;

  if (substitutions) {
    if (Array.isArray(substitutions)) {
      substitutions.forEach((sub, i) => {
        message = message.replace(new RegExp(`\\$${i + 1}`, 'g'), sub);
      });
    } else {
      message = message.replace(/\$1/g, substitutions);
    }
  }

  return message;
};
