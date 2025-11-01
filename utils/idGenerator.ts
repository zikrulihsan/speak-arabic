/**
 * Generates a unique ID for chat messages
 * Uses crypto.randomUUID() if available, otherwise falls back to timestamp + random
 */
let counter = 0;

export function generateUniqueId(): string {
    // Try to use crypto.randomUUID() if available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback: timestamp + counter + random number
    counter = (counter + 1) % 10000;
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);

    return `${timestamp}-${counter}-${random}`;
}
