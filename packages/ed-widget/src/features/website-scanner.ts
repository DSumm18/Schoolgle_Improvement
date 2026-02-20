/**
 * Ed Auto-Scanner
 * Automatically triggers website scan when Ed widget loads in website mode
 * Runs silently in the background
 */

interface ScanConfig {
  websiteUrl: string;
  organizationId: string;
  mode: 'website' | 'support' | 'school';
}

interface ScanStatus {
  lastScanned: string | null;
  totalPages: number;
  needsScan: boolean;
}

const SCAN_CHECK_KEY = 'ed_scan_check';
const SCAN_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if a new scan is needed
 */
function needsScan(organizationId: string): boolean {
  try {
    const lastCheck = localStorage.getItem(`${SCAN_CHECK_KEY}_${organizationId}`);
    if (!lastCheck) return true;

    const timeSinceLastCheck = Date.now() - parseInt(lastCheck);
    return timeSinceLastCheck > SCAN_COOLDOWN;
  } catch {
    return true;
  }
}

/**
 * Mark scan as checked
 */
function markScanChecked(organizationId: string): void {
  try {
    localStorage.setItem(`${SCAN_CHECK_KEY}_${organizationId}`, Date.now().toString());
  } catch (e) {
    console.debug('[Ed Scanner] Failed to mark scan checked:', e);
  }
}

/**
 * Trigger automatic website scan
 */
export async function triggerAutoScan(config: ScanConfig): Promise<void> {
  // Only auto-scan in website mode
  if (config.mode !== 'website') {
    console.debug('[Ed Scanner] Skipping scan - not in website mode');
    return;
  }

  // Check cooldown
  if (!needsScan(config.organizationId)) {
    console.debug('[Ed Scanner] Skipping scan - cooldown period');
    return;
  }

  console.log('[Ed Scanner] Triggering automatic website scan...');

  try {
    // Check if there's existing knowledge
    const checkResponse = await fetch(`/api/ed/website-scan?organizationId=${config.organizationId}`);

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log('[Ed Scanner] Existing knowledge:', checkData.totalKnowledgeItems || 0, 'pages');

      // Only do full scan if this is first time or it's been a while
      const fullScan = !checkData.totalKnowledgeItems || checkData.totalKnowledgeItems < 10;

      // Trigger scan
      const scanResponse = await fetch('/api/ed/website-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: config.websiteUrl,
          organizationId: config.organizationId,
          fullScan,
        }),
      });

      if (scanResponse.ok) {
        const scanData = await scanResponse.json();
        console.log('[Ed Scanner] Scan completed:', scanData);

        // Mark as checked
        markScanChecked(config.organizationId);
      } else {
        console.error('[Ed Scanner] Scan failed:', await scanResponse.text());
      }
    }
  } catch (error) {
    console.error('[Ed Scanner] Error during auto-scan:', error);
  }
}

/**
 * Get scan status for display
 */
export async function getScanStatus(organizationId: string): Promise<ScanStatus | null> {
  try {
    const response = await fetch(`/api/ed/website-scan?organizationId=${organizationId}`);
    if (!response.ok) return null;

    const data = await response.json();
    const lastScanned = data.lastScan || null;

    return {
      lastScanned,
      totalPages: data.totalKnowledgeItems || 0,
      needsScan: needsScan(organizationId),
    };
  } catch (error) {
    console.error('[Ed Scanner] Failed to get scan status:', error);
    return null;
  }
}
