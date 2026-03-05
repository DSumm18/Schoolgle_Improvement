/**
 * Shared utility to identify and handle AbortErrors gracefully in Next.js Dev Mode.
 * This prevents "signal is aborted without reason" from surfacing as a fatal overlay.
 */

export const isAbortError = (err: any): boolean => {
    if (!err) return false;

    const name = err.name?.toLowerCase() || '';
    const message = err.message?.toLowerCase() || '';
    const code = err.code?.toString().toLowerCase() || '';

    return (
        name === 'aborterror' ||
        message.includes('aborted') ||
        message.includes('abort') ||
        code === 'abort' ||
        name === 'taskabort'
    );
};

export const safeAuthLog = (message: string, error: any) => {
    if (isAbortError(error)) {
        // Log as info/log to keep the console clean but available for debugging
        console.info(`[Auth Safety] ${message} (aborted/expected)`);
    } else {
        // Serious errors still go to console.error
        console.error(`[Auth Safety] ${message}:`, error);
    }
};
