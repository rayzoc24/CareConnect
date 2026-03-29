// Leaderboard Component JavaScript

class LeaderboardComponent {
    constructor() {
        this.currentTab = 'volunteers';
        this.currentRange = 'weekly';
        this.baseUrl = '/api/leaderboard';
        
        this.elements = {
            volunteers: document.getElementById('volunteersLeaderboard'),
            ngos: document.getElementById('ngosLeaderboard'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            rangeButtons: document.querySelectorAll('.range-btn'),
            loadingSpinner: document.getElementById('loadingSpinner'),
        };

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadLeaderboard();
    }

    attachEventListeners() {
        // Tab switching
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.tab-btn').dataset.tab);
            });
        });

        // Range toggle
        this.elements.rangeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchRange(e.target.closest('.range-btn').dataset.range);
            });
        });
    }

    switchTab(tab) {
        if (this.currentTab === tab) return;

        this.currentTab = tab;

        // Update button states
        this.elements.tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) btn.classList.add('active');
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');

        this.loadLeaderboard();
    }

    switchRange(range) {
        if (this.currentRange === range) return;

        this.currentRange = range;

        // Update button states
        this.elements.rangeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.range === range) btn.classList.add('active');
        });

        this.loadLeaderboard();
    }

    async loadLeaderboard() {
        try {
            this.showLoading(true);

            const endpoint = `${this.baseUrl}/${this.currentTab}?range=${this.currentRange}`;
            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.renderLeaderboard(data);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            this.showError(`Failed to load leaderboard: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    renderLeaderboard(data) {
        const containerSelector = this.currentTab === 'volunteers' ? 'volunteers' : 'ngos';
        const container = this.elements[containerSelector];

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="leaderboard-empty">
                    <div class="leaderboard-empty-icon">📊</div>
                    <p class="leaderboard-empty-text">No data available yet. Start contributing!</p>
                </div>
            `;
            return;
        }

        // Limit to top 10
        const top10 = data.slice(0, 10);
        container.innerHTML = top10.map(user => this.createCard(user)).join('');
    }

    createCard(user) {
        const rank = user.rank || 0;
        const medal = this.getMedalEmoji(rank);
        const isTop3 = rank <= 3;

        const rankBadgeClass = this.getRankBadgeClass(rank);
        const cardClass = isTop3 ? 'leaderboard-card top-3' : 'leaderboard-card';

        const scoreBreakdownHtml = this.formatScoreBreakdown(user.scoreBreakdown);

        return `
            <div class="${cardClass}">
                <div class="rank-badge ${rankBadgeClass}">
                    ${medal || rank}
                </div>
                <div class="card-info">
                    <div class="card-header">
                        <p class="user-name">${this.escapeHtml(user.name || 'Anonymous')}</p>
                        <p class="user-role">${user.role || 'Volunteer'}</p>
                    </div>
                    <div class="score-breakdown">
                        ${scoreBreakdownHtml}
                    </div>
                </div>
                <div class="card-score">
                    <div class="total-score">${user.totalScore}</div>
                    <div class="score-label">Points</div>
                </div>
            </div>
        `;
    }

    getMedalEmoji(rank) {
        const medals = ['', '🥇', '🥈', '🥉'];
        return medals[rank] || '';
    }

    getRankBadgeClass(rank) {
        if (rank === 1) return 'rank-badge rank-1';
        if (rank === 2) return 'rank-badge rank-2';
        if (rank === 3) return 'rank-badge rank-3';
        return 'rank-badge rank-other';
    }

    formatScoreBreakdown(breakdown) {
        if (!breakdown) return '';

        const items = [];

        if (this.currentTab === 'volunteers') {
            // For volunteers: created, resolved, votes
            if (breakdown.created !== undefined) {
                items.push(`<span class="score-item"><span class="score-item-label">${breakdown.created}</span> created</span>`);
            }
            if (breakdown.resolved !== undefined) {
                items.push(`<span class="score-item"><span class="score-item-label">${breakdown.resolved}</span> resolved</span>`);
            }
            if (breakdown.votes !== undefined) {
                items.push(`<span class="score-item"><span class="score-item-label">${breakdown.votes}</span> votes</span>`);
            }
        } else {
            // For NGOs: claimed, completed
            if (breakdown.claimed !== undefined) {
                items.push(`<span class="score-item"><span class="score-item-label">${breakdown.claimed}</span> claimed</span>`);
            }
            if (breakdown.completed !== undefined) {
                items.push(`<span class="score-item"><span class="score-item-label">${breakdown.completed}</span> resolved</span>`);
            }
        }

        return items.join('');
    }

    showLoading(show) {
        if (show) {
            this.elements.loadingSpinner.classList.add('active');
        } else {
            this.elements.loadingSpinner.classList.remove('active');
        }
    }

    showError(message) {
        const containerSelector = this.currentTab === 'volunteers' ? 'volunteers' : 'ngos';
        const container = this.elements[containerSelector];

        container.innerHTML = `
            <div class="leaderboard-error">
                ⚠️ ${this.escapeHtml(message)}
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LeaderboardComponent();
});
