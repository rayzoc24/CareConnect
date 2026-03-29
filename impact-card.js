/**
 * Impact Card Component
 * Fetches and displays user impact metrics
 */

class ImpactCard {
  constructor() {
    this.baseUrl = '/api/impact/me';
    this.elements = {
      container: document.getElementById('impactCardContainer'),
      loading: document.querySelector('.impact-card-loading'),
      content: document.querySelector('.impact-card-content'),
      error: document.querySelector('.impact-card-error'),
      totalIssuesValue: document.getElementById('totalIssuesValue'),
      issuesLabel: document.getElementById('issuesLabel'),
      resolvedIssuesValue: document.getElementById('resolvedIssuesValue'),
      engagementIcon: document.getElementById('engagementIcon'),
      engagementLabel: document.getElementById('engagementLabel'),
      engagementValue: document.getElementById('engagementValue'),
      engagementSub: document.getElementById('engagementSub'),
      resolutionPercent: document.getElementById('resolutionPercent'),
      progressBarFill: document.getElementById('progressBarFill'),
      impactScore: document.getElementById('impactScore'),
      achievementBadge: document.getElementById('achievementBadge'),
      viewActivityBtn: document.querySelector('.btn-view-activity'),
      leaderboardBtn: document.querySelector('.btn-view-leaderboard'),
      retryBtn: document.querySelector('.btn-retry')
    };

    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadImpactData();
  }

  attachEventListeners() {
    if (this.elements.retryBtn) {
      this.elements.retryBtn.addEventListener('click', () => this.loadImpactData());
    }
    if (this.elements.viewActivityBtn) {
      this.elements.viewActivityBtn.addEventListener('click', () => {
        alert('Activity view coming soon! 📊');
      });
    }
    if (this.elements.leaderboardBtn) {
      this.elements.leaderboardBtn.addEventListener('click', () => {
        // Trigger leaderboard tab if available
        const leaderboardTab = document.querySelector('[data-tab="leaderboard-content"]');
        if (leaderboardTab) {
          leaderboardTab.click();
        } else {
          alert('Switch to Leaderboard tab to see rankings 🏆');
        }
      });
    }
  }

  async loadImpactData() {
    try {
      this.showLoading(true);

      const response = await fetch(this.baseUrl);

      if (response.status === 401) {
        this.showError('Please log in to see your impact');
        return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this.renderImpactData(data);
    } catch (error) {
      console.error('Failed to load impact data:', error);
      this.showError('Failed to load your impact data. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  renderImpactData(data) {
    // Update based on role
    if (data.role === 'volunteer') {
      this.renderVolunteerImpact(data);
    } else if (data.role === 'foundation' || data.role === 'ngo') {
      this.renderNgoImpact(data);
    }

    // Common updates
    this.elements.impactScore.textContent = data.impactScore;
    this.updateAchievementBadge(data.impactScore);
    this.showContent();
  }

  renderVolunteerImpact(data) {
    this.elements.totalIssuesValue.textContent = data.totalIssues;
    this.elements.issuesLabel.textContent = 'Created';
    this.elements.resolvedIssuesValue.textContent = data.resolvedIssues;
    this.elements.engagementIcon.textContent = '👍';
    this.elements.engagementLabel.textContent = 'Votes';
    this.elements.engagementValue.textContent = data.votesGiven;
    this.elements.engagementSub.textContent = 'Cast on issues';

    // Calculate resolution rate
    const resolutionRate = data.totalIssues > 0
      ? Math.round((data.resolvedIssues / data.totalIssues) * 100)
      : 0;
    this.updateProgressBar(resolutionRate);
  }

  renderNgoImpact(data) {
    this.elements.totalIssuesValue.textContent = data.totalIssues;
    this.elements.issuesLabel.textContent = 'Claimed';
    this.elements.resolvedIssuesValue.textContent = data.resolvedIssues;
    this.elements.engagementIcon.textContent = '🎯';
    this.elements.engagementLabel.textContent = 'Completion';
    this.elements.engagementValue.textContent = `${Math.round((data.resolvedIssues / (data.totalIssues || 1)) * 100)}%`;
    this.elements.engagementSub.textContent = 'Rate';

    // Calculate resolution rate
    const resolutionRate = data.totalIssues > 0
      ? Math.round((data.resolvedIssues / data.totalIssues) * 100)
      : 0;
    this.updateProgressBar(resolutionRate);
  }

  updateProgressBar(percentage) {
    this.elements.progressBarFill.style.width = `${percentage}%`;
    this.elements.resolutionPercent.textContent = `${percentage}%`;
  }

  updateAchievementBadge(score) {
    const badge = this.elements.achievementBadge;
    
    // Remove all level classes
    badge.classList.remove('level-1', 'level-2', 'level-3', 'level-4');

    let level = 1;
    let achievement = '🌱';
    let text = 'Getting Started';

    if (score >= 200) {
      level = 4;
      achievement = '💎';
      text = 'Legend';
    } else if (score >= 100) {
      level = 3;
      achievement = '🌳';
      text = 'Ecosystem Champion';
    } else if (score >= 50) {
      level = 2;
      achievement = '🌿';
      text = 'Active Contributor';
    }

    badge.classList.add(`level-${level}`);
    badge.querySelector('.badge-icon').textContent = achievement;
    badge.querySelector('.badge-text').textContent = text;
  }

  showLoading(show) {
    if (show) {
      this.elements.loading.style.display = 'block';
      this.elements.content.style.display = 'none';
      this.elements.error.style.display = 'none';
    } else {
      this.elements.loading.style.display = 'none';
    }
  }

  showContent() {
    this.elements.loading.style.display = 'none';
    this.elements.content.style.display = 'block';
    this.elements.error.style.display = 'none';
  }

  showError(message) {
    this.elements.loading.style.display = 'none';
    this.elements.content.style.display = 'none';
    this.elements.error.style.display = 'block';
    this.elements.error.querySelector('.error-message').textContent = message;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ImpactCard();
});
