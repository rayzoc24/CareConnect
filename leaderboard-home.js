/**
 * Leaderboard Widget for Homepage
 * Handles both dashboard and homepage layouts
 */

class LeaderboardWidget {
  constructor(containerId = "leaderboard-list") {
    this.container = document.getElementById(containerId);
    this.currentType = "volunteers";
    this.currentRange = "weekly";
    this.baseUrl = "/api/leaderboard";
    this.isLoading = false;

    if (!this.container) {
      console.error(`Container with ID "${containerId}" not found`);
      return;
    }

    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadLeaderboard();
  }

  /**
   * Attach event listeners to control buttons
   */
  attachEventListeners() {
    // Type toggle buttons (Volunteers/NGOs)
    document.querySelectorAll('[data-type]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        if (type === this.currentType) return;

        // Update active state
        document
          .querySelectorAll('[data-type]')
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.currentType = type;
        this.loadLeaderboard();
      });
    });

    // Range toggle buttons (Weekly/Monthly)
    document.querySelectorAll('[data-range]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const range = btn.dataset.range;
        if (range === this.currentRange) return;

        // Update active state
        document
          .querySelectorAll('[data-range]')
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.currentRange = range;
        this.loadLeaderboard();
      });
    });
  }

  /**
   * Fetch leaderboard data from API
   */
  async loadLeaderboard() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    try {
      const endpoint = `${this.baseUrl}/${this.currentType}?range=${this.currentRange}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        this.renderLeaderboard(data.leaderboard);
      } else {
        this.renderEmpty();
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      this.renderError(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render leaderboard items
   */
  renderLeaderboard(items) {
    this.container.innerHTML = items
      .map((item, index) => this.createLeaderboardItem(item, index + 1))
      .join("");
  }

  /**
   * Create individual leaderboard item HTML
   */
  createLeaderboardItem(item, rank) {
    const name = item.name || item.orgName || "Unknown";
    const score = item.totalScore || item.score || 0;

    // Extract stats from breakdown
    let stats = {};
    if (item.scoreBreakdown) {
      stats = {
        label1: "Issues",
        value1: item.scoreBreakdown.issuesCreated || 0,
        label2: "Resolved",
        value2: item.scoreBreakdown.issuesResolved || 0,
      };
    } else {
      stats = {
        label1: "Issues",
        value1: item.issuesClaimed || 0,
        label2: "Resolved",
        value2: item.issuesResolved || 0,
      };
    }

    const rankClass = `rank-${rank}`;
    const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

    return `
      <div class="leaderboard-item ${rankClass}" data-rank="${rank}">
        <div class="rank-badge">${rankEmoji}</div>
        <h3 class="leaderboard-name">${this.escapeHtml(name)}</h3>
        <div class="leaderboard-score">
          Impact Score
          <span class="score-value">${score}</span>
        </div>
        <div class="leaderboard-stats">
          <div class="stat-item">
            <div class="stat-item-label">${stats.label1}</div>
            <div class="stat-item-value">${stats.value1}</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-label">${stats.label2}</div>
            <div class="stat-item-value">${stats.value2}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show loading skeleton
   */
  showLoading() {
    this.container.innerHTML = Array(3)
      .fill(0)
      .map(
        () => `
      <div class="leaderboard-item leaderboard-skeleton" style="height: 220px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; position: absolute; top: 12px; right: 12px;"></div>
        <div style="width: 60%; height: 24px; margin-bottom: 12px;"></div>
        <div style="width: 40%; height: 16px;"></div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Show error state
   */
  renderError(error) {
    this.container.innerHTML = `
      <div class="leaderboard-empty" style="grid-column: 1/-1;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <p style="margin: 0; font-weight: 600;">Unable to load leaderboard</p>
        <p style="margin: 0.5rem 0 1.5rem; font-size: 0.9rem; color: #999;">Please try again later</p>
        <button onclick="location.reload()" style="
          background: #22a97d;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        ">
          Retry
        </button>
      </div>
    `;
  }

  /**
   * Show empty state
   */
  renderEmpty() {
    this.container.innerHTML = `
      <div class="leaderboard-empty" style="grid-column: 1/-1;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
        <p style="margin: 0; font-weight: 600;">No leaderboard data yet</p>
        <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #999;">Come back soon!</p>
      </div>
    `;
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text || "").replace(/[&<>"']/g, (m) => map[m]);
  }
}

/**
 * Auto-initialize on DOM ready
 */
document.addEventListener("DOMContentLoaded", () => {
  // Initialize homepage leaderboard
  const homeContainer = document.getElementById("leaderboard-list");
  if (homeContainer) {
    new LeaderboardWidget("leaderboard-list");
  }

  // Initialize dashboard leaderboards (if they exist)
  const dashboardContainers = document.querySelectorAll("[data-leaderboard]");
  dashboardContainers.forEach((container) => {
    // Dashboard leaderboards use different IDs
  });
});
