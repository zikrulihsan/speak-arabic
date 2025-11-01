/**
 * Converts Float32Array audio data to PCM16 format and creates a Blob
 * @param float32Array - Raw audio data from audio processing
 * @returns Blob containing PCM16 audio data
 */
export function createPcmBlob(float32Array: Float32Array): Blob {
    // Convert Float32Array to Int16Array (PCM16 format)
    const pcm16 = new Int16Array(float32Array.length);

    for (let i = 0; i < float32Array.length; i++) {
        // Clamp the value between -1 and 1
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        // Convert to 16-bit integer
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return new Blob([pcm16.buffer], { type: 'audio/pcm' });
}

/**
 * Converts a Blob to base64 string
 * @param blob - The blob to convert
 * @returns Promise resolving to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // Remove the data URL prefix (e.g., "data:audio/pcm;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
