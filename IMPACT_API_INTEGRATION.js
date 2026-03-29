/**
 * User Impact API - Frontend Integration Examples
 * 
 * Use these code snippets to integrate the user impact metrics
 * in your volunteer and NGO dashboards
 */

// ============================================
// EXAMPLE 1: Fetch and Display User Impact
// ============================================

async function loadUserImpact() {
  try {
    const response = await fetch('/api/impact/me');
    
    if (response.status === 401) {
      console.log('User not authenticated');
      return;
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const impact = await response.json();
    displayImpactMetrics(impact);
  } catch (error) {
    console.error('Failed to load user impact:', error);
  }
}

function displayImpactMetrics(impact) {
  console.log('User Impact Data:', impact);
  
  if (impact.role === 'volunteer') {
    console.log(`
      📊 Volunteer Impact
      Issues Created: ${impact.totalIssues}
      Issues Resolved: ${impact.resolvedIssues}
      Votes Given: ${impact.votesGiven}
      Impact Score: ${impact.impactScore}
    `);
  } else if (impact.role === 'foundation' || impact.role === 'ngo') {
    console.log(`
      🏢 NGO Impact
      Issues Claimed: ${impact.totalIssues}
      Issues Resolved: ${impact.resolvedIssues}
      Impact Score: ${impact.impactScore}
    `);
  }
}

// ============================================
// EXAMPLE 2: Display in HTML Card Component
// ============================================

function createImpactCard(impact) {
  if (impact.role === 'volunteer') {
    return `
      <div class="impact-card">
        <h3>Your Impact</h3>
        <div class="impact-grid">
          <div class="impact-item">
            <span class="label">Issues Created</span>
            <span class="value">${impact.totalIssues}</span>
          </div>
          <div class="impact-item">
            <span class="label">Resolved</span>
            <span class="value">${impact.resolvedIssues}</span>
          </div>
          <div class="impact-item">
            <span class="label">Votes Cast</span>
            <span class="value">${impact.votesGiven}</span>
          </div>
          <div class="impact-item highlight">
            <span class="label">Impact Score</span>
            <span class="value">${impact.impactScore}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="impact-card">
        <h3>Organization Impact</h3>
        <div class="impact-grid">
          <div class="impact-item">
            <span class="label">Issues Claimed</span>
            <span class="value">${impact.totalIssues}</span>
          </div>
          <div class="impact-item">
            <span class="label">Issues Resolved</span>
            <span class="value">${impact.resolvedIssues}</span>
          </div>
          <div class="impact-item highlight">
            <span class="label">Impact Score</span>
            <span class="value">${impact.impactScore}</span>
          </div>
        </div>
      </div>
    `;
  }
}

// ============================================
// EXAMPLE 3: Real-time Impact Updates
// ============================================

class ImpactTracker {
  constructor(refreshInterval = 60000) { // Update every minute
    this.refreshInterval = refreshInterval;
    this.currentUser = null;
  }

  start() {
    // Load on init
    this.refresh();
    // Set up auto-refresh
    setInterval(() => this.refresh(), this.refreshInterval);
  }

  async refresh() {
    try {
      const response = await fetch('/api/impact/me');
      if (response.ok) {
        this.currentUser = await response.json();
        this.onUpdate(this.currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh impact:', error);
    }
  }

  onUpdate(impact) {
    // Override this method to handle updates
    console.log('Impact updated:', impact);
  }
}

// Usage:
const tracker = new ImpactTracker(60000); // Refresh every 60 seconds
tracker.onUpdate = function(impact) {
  // Update UI elements when impact changes
  document.querySelector('.impact-score').textContent = impact.impactScore;
  document.querySelector('.resolved-count').textContent = impact.resolvedIssues;
};
tracker.start();

// ============================================
// EXAMPLE 4: Add to Dashboard Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Load existing dashboard code...
  
  // New: Load user impact
  try {
    const response = await fetch('/api/impact/me');
    if (response.ok) {
      const impact = await response.json();
      
      // Insert impact card into dashboard
      const dashboardContainer = document.querySelector('.dashboard-main');
      const impactCard = createImpactCard(impact);
      dashboardContainer.insertAdjacentHTML('afterbegin', impactCard);
    }
  } catch (error) {
    console.error('Failed to load impact metrics:', error);
  }
});

// ============================================
// EXAMPLE 5: CSS Styling for Impact Components
// ============================================

/*
.impact-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
  margin-bottom: 2rem;
}

.impact-cards h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.impact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.impact-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.impact-item.highlight {
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid rgba(255, 215, 0, 0.5);
}

.impact-item .label {
  display: block;
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.impact-item .value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
}
*/
