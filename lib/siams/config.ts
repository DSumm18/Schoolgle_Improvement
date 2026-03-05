// Configuration loaded from localStorage (user can set via Settings modal)

export const config = {
  /**
   * Get Sheet ID from localStorage or fallback to DEMO mode
   */
  get SHEET_ID(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('siams_sheet_id') || 'DEMO_MODE';
    }
    return 'DEMO_MODE';
  },

  /**
   * Get API Key from localStorage or fallback to DEMO mode
   */
  get API_KEY(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('siams_api_key') || 'DEMO_MODE';
    }
    return 'DEMO_MODE';
  },

  /**
   * Check if we're in demo mode
   */
  get IS_DEMO_MODE(): boolean {
    return this.SHEET_ID === 'DEMO_MODE' || this.API_KEY === 'DEMO_MODE';
  },
};