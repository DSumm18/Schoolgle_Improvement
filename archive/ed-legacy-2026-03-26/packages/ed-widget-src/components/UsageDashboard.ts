/**
 * Usage Dashboard - Monitor Free Tier Limits
 * Shows real-time usage of Gemini and Google TTS
 */

export interface UsageStats {
  ai: {
    requestsToday: number;
    limit: number;
    percentUsed: number;
  };
  voice: {
    charsThisMonth: number;
    limit: number;
    percentUsed: number;
  };
  totalCost: number;
}

export class UsageDashboard {
  private container: HTMLElement;
  private isVisible = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'ed-usage-dashboard';
    this.container.style.display = 'none';
    document.body.appendChild(this);
    
    this.render();
  }

  /**
   * Show/hide dashboard
   */
  public toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'block' : 'none';
  }

  /**
   * Update usage statistics
   */
  public update(stats: UsageStats): void {
    const aiPercentClass = this.getStatusClass(stats.ai.percentUsed);
    const voicePercentClass = this.getStatusClass(stats.voice.percentUsed);

    this.container.innerHTML = `
      <div class="ed-usage-panel">
        <h3>📊 Ed Usage Monitor</h3>
        <button class="ed-usage-close" onclick="this.parentElement.parentElement.style.display='none'">✕</button>
        
        <div class="ed-usage-section">
          <h4>🧠 AI Requests (Gemini Free)</h4>
          <div class="ed-usage-bar">
            <div class="ed-usage-fill ${aiPercentClass}" style="width: ${stats.ai.percentUsed}%"></div>
          </div>
          <p class="ed-usage-stats">
            ${stats.ai.requestsToday} / ${stats.ai.limit} requests today
            <span class="ed-usage-${aiPercentClass}">(${stats.ai.percentUsed.toFixed(1)}%)</span>
          </p>
          <p class="ed-usage-note">
            Remaining: ${stats.ai.limit - stats.ai.requestsToday} requests
            ${stats.ai.percentUsed > 80 ? '<br>⚠️ Approaching daily limit!' : ''}
          </p>
        </div>

        <div class="ed-usage-section">
          <h4>🎙️ Voice Characters (Google TTS Free)</h4>
          <div class="ed-usage-bar">
            <div class="ed-usage-fill ${voicePercentClass}" style="width: ${stats.voice.percentUsed}%"></div>
          </div>
          <p class="ed-usage-stats">
            ${this.formatNumber(stats.voice.charsThisMonth)} / ${this.formatNumber(stats.voice.limit)} chars this month
            <span class="ed-usage-${voicePercentClass}">(${stats.voice.percentUsed.toFixed(1)}%)</span>
          </p>
          <p class="ed-usage-note">
            Remaining: ~${Math.floor((stats.voice.limit - stats.voice.charsThisMonth) / 800)} conversations
            ${stats.voice.percentUsed > 80 ? '<br>⚠️ Approaching monthly limit!' : ''}
          </p>
        </div>

        <div class="ed-usage-section ed-usage-cost">
          <h4>💰 Total Cost</h4>
          <p class="ed-usage-cost-amount">£${stats.totalCost.toFixed(2)}</p>
          <p class="ed-usage-note">
            ${stats.totalCost === 0 ? '🎉 All within free tiers!' : 'Some paid usage occurred'}
          </p>
        </div>

        <div class="ed-usage-tips">
          <h5>💡 Cost Optimization Tips</h5>
          <ul>
            <li>Enable response caching (saves 50-70%)</li>
            <li>Use template responses for common questions</li>
            <li>Set per-school daily limits</li>
            <li>Monitor this dashboard daily</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Get status class based on percentage
   */
  private getStatusClass(percent: number): string {
    if (percent < 50) return 'good';
    if (percent < 75) return 'warning';
    return 'danger';
  }

  /**
   * Format large numbers
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Render dashboard styles
   */
  private render(): void {
    const style = document.createElement('style');
    style.textContent = `
      .ed-usage-dashboard {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999999;
        font-family: 'Inter', sans-serif;
      }

      .ed-usage-panel {
        background: rgba(15, 23, 42, 0.98);
        border-radius: 16px;
        padding: 24px;
        min-width: 320px;
        max-width: 400px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(45, 212, 191, 0.3);
        color: #ffffff;
      }

      .ed-usage-panel h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #2dd4bf;
      }

      .ed-usage-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
      }

      .ed-usage-close:hover {
        color: #ffffff;
      }

      .ed-usage-section {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .ed-usage-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .ed-usage-section h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
        color: #e2e8f0;
      }

      .ed-usage-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .ed-usage-fill {
        height: 100%;
        transition: width 0.3s ease;
      }

      .ed-usage-fill.good {
        background: linear-gradient(90deg, #22c55e, #16a34a);
      }

      .ed-usage-fill.warning {
        background: linear-gradient(90deg, #f59e0b, #d97706);
      }

      .ed-usage-fill.danger {
        background: linear-gradient(90deg, #ef4444, #dc2626);
      }

      .ed-usage-stats {
        margin: 0 0 4px 0;
        font-size: 13px;
        color: #cbd5e1;
        display: flex;
        justify-content: space-between;
      }

      .ed-usage-good { color: #22c55e; font-weight: 600; }
      .ed-usage-warning { color: #f59e0b; font-weight: 600; }
      .ed-usage-danger { color: #ef4444; font-weight: 600; }

      .ed-usage-note {
        margin: 0;
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.4;
      }

      .ed-usage-cost {
        text-align: center;
      }

      .ed-usage-cost-amount {
        font-size: 32px;
        font-weight: 700;
        margin: 8px 0;
        color: #2dd4bf;
      }

      .ed-usage-tips {
        background: rgba(45, 212, 191, 0.1);
        border-radius: 8px;
        padding: 12px;
        margin-top: 16px;
      }

      .ed-usage-tips h5 {
        margin: 0 0 8px 0;
        font-size: 12px;
        font-weight: 600;
        color: #2dd4bf;
      }

      .ed-usage-tips ul {
        margin: 0;
        padding-left: 20px;
        font-size: 11px;
        line-height: 1.6;
        color: #cbd5e1;
      }

      .ed-usage-tips li {
        margin-bottom: 4px;
      }

      @media (max-width: 768px) {
        .ed-usage-dashboard {
          right: 10px;
          left: 10px;
        }

        .ed-usage-panel {
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Destroy dashboard
   */
  public destroy(): void {
    this.container.remove();
  }
}

/**
 * Create global keyboard shortcut to show usage
 */
export function initUsageDashboard(aiClient: any, voiceClient: any): UsageDashboard {
  const dashboard = new UsageDashboard();

  // Keyboard shortcut: Ctrl+Shift+U to toggle dashboard
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'U') {
      e.preventDefault();
      
      // Get current stats
      const aiStats = aiClient.getUsageStats();
      const voiceStats = voiceClient.getUsageStats();
      
      dashboard.update({
        ai: {
          requestsToday: aiStats.requestsToday,
          limit: 1500,
          percentUsed: aiStats.percentUsed,
        },
        voice: {
          charsThisMonth: voiceStats.charsUsedThisMonth,
          limit: 4000000,
          percentUsed: voiceStats.percentUsed,
        },
        totalCost: 0, // Free tier!
      });
      
      dashboard.toggle();
    }
  });

  return dashboard;
}

