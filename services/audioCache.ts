// Audio cache service using localStorage
// Stores generated audio to avoid repeated API calls for the same text

const CACHE_PREFIX = 'audio_cache_';
const CACHE_VERSION = 'v1';
const MAX_CACHE_SIZE = 50; // Maximum number of cached audio items
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheEntry {
  text: string;
  audio: string;
  timestamp: number;
}

// Simple hash function for creating cache keys
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function getCacheKey(text: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${hashString(text)}`;
}

// Get all cache keys from localStorage
function getAllCacheKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX + CACHE_VERSION)) {
      keys.push(key);
    }
  }
  return keys;
}

// Clean up old cache entries if exceeding max size
function cleanupOldEntries(): void {
  const keys = getAllCacheKeys();
  if (keys.length <= MAX_CACHE_SIZE) return;

  // Get all entries with timestamps
  const entries: { key: string; timestamp: number }[] = keys.map(key => {
    const item = localStorage.getItem(key);
    if (!item) return { key, timestamp: 0 };
    try {
      const entry: CacheEntry = JSON.parse(item);
      return { key, timestamp: entry.timestamp };
    } catch {
      return { key, timestamp: 0 };
    }
  });

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest entries
  const entriesToRemove = entries.slice(0, keys.length - MAX_CACHE_SIZE);
  entriesToRemove.forEach(entry => localStorage.removeItem(entry.key));
}

export function getCachedAudio(text: string): string | null {
  try {
    const key = getCacheKey(text);
    const item = localStorage.getItem(key);
    if (!item) return null;

    const entry: CacheEntry = JSON.parse(item);

    // Check if cache has expired (TTL: 1 hour)
    const now = Date.now();
    const age = now - entry.timestamp;
    if (age > CACHE_TTL) {
      console.log('Audio cache expired:', text.substring(0, 50));
      localStorage.removeItem(key);
      return null;
    }

    // Verify the text matches (hash collision check)
    if (entry.text === text) {
      console.log('Audio cache hit:', text.substring(0, 50));
      return entry.audio;
    }

    return null;
  } catch (error) {
    console.error('Error reading audio cache:', error);
    return null;
  }
}

export function setCachedAudio(text: string, audio: string): void {
  try {
    const key = getCacheKey(text);
    const entry: CacheEntry = {
      text,
      audio,
      timestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(entry));
    console.log('Audio cached:', text.substring(0, 50));

    // Cleanup old entries after adding new one
    cleanupOldEntries();
  } catch (error) {
    console.error('Error caching audio:', error);
    // If localStorage is full, try to cleanup and retry once
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        cleanupOldEntries();
        const key = getCacheKey(text);
        const entry: CacheEntry = { text, audio, timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (retryError) {
        console.error('Failed to cache audio even after cleanup:', retryError);
      }
    }
  }
}

export function clearAudioCache(): void {
  const keys = getAllCacheKeys();
  keys.forEach(key => localStorage.removeItem(key));
  console.log('Audio cache cleared');
}

export function getCacheStats(): { count: number; keys: string[] } {
  const keys = getAllCacheKeys();
  return {
    count: keys.length,
    keys,
  };
}
