// Estates Audit Configuration
// --- ACTION REQUIRED ---
// Paste your Google Sheet ID and API Key below to connect your data.

export const config = {
    /**
     * The ID of the Google Sheet to fetch data from.
     * Replace the placeholder with your actual Sheet ID.
     * Example: '1MSI42F1B80v7X_6fCSWtmIdQF0wTlHe6AnMw0SstZ4s'
     */
    get SHEET_ID(): string {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('estates_audit_sheet_id') || '1MSI42F1B80v7X_6fCSWtmIdQF0wTlHe6AnMw0SstZ4s';
        }
        return '1MSI42F1B80v7X_6fCSWtmIdQF0wTlHe6AnMw0SstZ4s';
    },

    /**
     * The Google Cloud API Key with Google Sheets API enabled.
     * Replace the placeholder with your actual API Key.
     * Example: 'AIzaSyAFX-_Pxp36PuMevKF69h_ookWAnGtzs4Y'
     */
    get API_KEY(): string {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('estates_audit_api_key') || 'AIzaSyAFX-_Pxp36PuMevKF69h_ookWAnGtzs4Y';
        }
        return 'AIzaSyAFX-_Pxp36PuMevKF69h_ookWAnGtzs4Y';
    },

    /**
     * Demo mode flag - shows sample data when no real data is configured
     */
    get IS_DEMO_MODE(): boolean {
        if (typeof window !== 'undefined') {
            const sheetId = localStorage.getItem('estates_audit_sheet_id');
            const apiKey = localStorage.getItem('estates_audit_api_key');
            return !sheetId || !apiKey || sheetId === '1MSI42F1B80v7X_6fCSWtmIdQF0wTlHe6AnMw0SstZ4s';
        }
        return true;
    }
};
