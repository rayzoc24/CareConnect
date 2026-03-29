/**
 * Trending Issues Widget
 * Fetches and displays trending issues from the API
 */

class TrendingIssuesWidget {
  constructor(containerId = "trending-issues-container", limit = 5) {
    this.container = document.getElementById(containerId);
    this.limit = limit;
    this.isLoading = false;

    if (!this.container) {
      console.error(`Container with ID "${containerId}" not found`);
      return;
    }

    this.init();
  }

  init() {
    this.render();
    this.fetchTrendingIssues();
  }

  /**
   * Renders the initial skeleton loading state
   */
  render() {
    this.container.innerHTML = `
      <div class="trending-section">
        <div class="trending-header">
          <span class="trending-icon">🔥</span>
          <h2>Trending Issues</h2>
        </div>
        <div class="trending-container" id="trending-list">
          ${this.renderSkeletons()}
        </div>
      </div>
    `;
  }

  /**
   * Renders loading skeleton cards
   */
  renderSkeletons() {
    return Array(Math.min(this.limit, 5))
      .fill(0)
      .map(
        () => `
      <div class="trending-skeleton-card">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta">
          <div class="skeleton-tag"></div>
          <div class="skeleton-tag"></div>
        </div>
        <div class="skeleton-footer">
          <div class="skeleton-badge"></div>
          <div class="skeleton-badge"></div>
        </div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Fetches trending issues from API
   */
  async fetchTrendingIssues() {
    if (this.isLoading) return;

    this.isLoading = true;

    try {
      const response = await fetch(
        `/api/issues/trending?limit=${this.limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.trending && Array.isArray(data.trending)) {
        this.renderTrendingIssues(data.trending);
      } else {
        this.renderEmpty();
      }
    } catch (error) {
      console.error("Error fetching trending issues:", error);
      this.renderError(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Renders trending issues cards
   */
  renderTrendingIssues(issues) {
    const trendingList = document.getElementById("trending-list");

    if (!trendingList) return;

    if (issues.length === 0) {
      this.renderEmpty();
      return;
    }

    trendingList.innerHTML = issues
      .map((issue, index) => this.createIssueCard(issue, index))
      .join("");
  }

  /**
   * Creates a single issue card HTML
   */
  createIssueCard(issue, index) {
    const {
      id,
      title,
      category,
      location,
      votes,
      priority,
      status,
    } = issue;

    const priorityLevel = this.getPriorityLevel(priority);
    const categoryDisplay = this.formatText(category);
    const locationDisplay = this.formatLocation(location);

    return `
      <div class="trending-card" data-issue-id="${id}">
        <h3 class="trending-card-title">${this.escapeHtml(title)}</h3>
        
        <div class="trending-card-meta">
          <span class="meta-tag category-tag">${this.escapeHtml(categoryDisplay)}</span>
          <span class="meta-tag location-tag">${this.escapeHtml(locationDisplay)}</span>
        </div>

        <div class="trending-card-footer">
          <div class="votes-section">
            <span class="vote-icon">👍</span>
            <span class="vote-count">${votes || 0} votes</span>
          </div>
          <span class="priority-badge priority-${priorityLevel}">
            ${this.getPriorityLabel(priorityLevel)}
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Determines priority level based on priority score
   */
  getPriorityLevel(priority) {
    if (priority === undefined || priority === null) {
      return "medium";
    }

    if (priority >= 70) return "high";
    if (priority >= 40) return "medium";
    return "low";
  }

  /**
   * Gets priority label with symbol
   */
  getPriorityLabel(level) {
    const labels = {
      high: "🔴 High",
      medium: "🟡 Medium",
      low: "🟢 Low",
    };
    return labels[level] || "Medium";
  }

  /**
   * Formats category text
   */
  formatText(text) {
    if (!text) return "General";
    return String(text)
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Formats location object into readable string
   */
  formatLocation(location) {
    if (!location) return "Unknown Location";

    if (typeof location === "string") {
      return location;
    }

    const parts = [];
    if (location.area) parts.push(location.area);
    if (location.district) parts.push(location.district);
    if (location.state) parts.push(location.state);

    return parts.length > 0 ? parts.join(", ") : "Unknown Location";
  }

  /**
   * Escapes HTML special characters
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

  /**
   * Renders error state with retry button
   */
  renderError(error) {
    const trendingList = document.getElementById("trending-list");

    if (!trendingList) return;

    trendingList.innerHTML = `
      <div class="trending-error">
        <div class="trending-error-icon">⚠️</div>
        <p class="trending-error-message">
          Unable to load trending issues. Please try again.
        </p>
        <button class="retry-button" onclick="location.reload()">
          → Retry
        </button>
      </div>
    `;
  }

  /**
   * Renders empty state
   */
  renderEmpty() {
    const trendingList = document.getElementById("trending-list");

    if (!trendingList) return;

    trendingList.innerHTML = `
      <div class="trending-empty">
        <div class="trending-empty-icon">📭</div>
        <p class="trending-empty-message">
          No trending issues yet. Check back soon!
        </p>
      </div>
    `;
  }
}

/**
 * Auto-initialize widget on DOM ready
 */
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("trending-issues-container");
  if (container) {
    new TrendingIssuesWidget("trending-issues-container", 5);
  }
});
