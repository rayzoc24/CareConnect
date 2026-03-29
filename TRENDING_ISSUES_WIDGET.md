# 🔥 Trending Issues Widget - Integration Guide

## Overview

The Trending Issues Widget is a modern, responsive component that displays the top trending issues from your CareConnect platform. It features animated cards, color-coded priority badges, and automatic data fetching from your backend API.

## Files Included

1. **trending-issues.js** - Main widget class with fetch and render logic
2. **trending-issues-styles.css** - Complete styling with responsive design
3. **trending-issues-component.html** - Standalone demo page
4. **TRENDING_ISSUES_WIDGET.md** - This documentation file

## Quick Start

### 1. Add Files to Your HTML

```html
<!-- In the <head> section -->
<link rel="stylesheet" href="trending-issues-styles.css">

<!-- Before closing </body> tag -->
<script src="trending-issues.js"></script>
```

### 2. Add Container Div

Place this where you want the widget to appear:

```html
<div id="trending-issues-container"></div>
```

### 3. That's It!

The widget auto-initializes on DOM ready. No additional code needed.

## Integration Examples

### Example 1: Add to index.html Homepage

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="trending-issues-styles.css">
</head>
<body>
  <h1>Welcome to CareConnect</h1>
  
  <!-- Trending Issues Section -->
  <div id="trending-issues-container"></div>
  
  <script src="trending-issues.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

### Example 2: Add to volunteer-home.html Dashboard

Place it after the user profile section and before other dashboard content:

```html
<div class="dashboard-container">
  <!-- User profile section -->
  <div class="user-profile">
    <!-- ... existing profile content ... -->
  </div>

  <!-- Impact card (existing) -->
  <div id="impact-card-container"></div>

  <!-- Trending Issues Widget (NEW) -->
  <div id="trending-issues-container"></div>

  <!-- Rest of dashboard -->
  <div id="leaderboard-tab">
    <!-- ... existing leaderboard ... -->
  </div>
</div>
```

### Example 3: Add to ngo-home.html Dashboard

Same structure as volunteer dashboard:

```html
<div class="ngo-dashboard">
  <!-- NGO profile -->
  <div id="impact-card-container"></div>
  
  <!-- Trending Issues - NEW -->
  <div id="trending-issues-container"></div>
  
  <!-- Leaderboard -->
  <div id="leaderboard-tab"></div>
</div>
```

## Customization

### Change Number of Issues Displayed

```javascript
// In your HTML before closing </body>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    new TrendingIssuesWidget('trending-issues-container', 10); // Show 10 instead of 5
  });
</script>
```

### Custom Container ID

```html
<!-- Use a custom ID -->
<div id="my-trending-widget"></div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    new TrendingIssuesWidget('my-trending-widget', 5);
  });
</script>
```

## Styling Customization

The component uses CSS variables and classes that can be overridden:

### Change Primary Color (Purple to Blue)

```css
/* Add this to your CSS file */
.trending-section {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
}

.trending-card:hover {
  border-left-color: #3b82f6;
}
```

### Change Priority Colors

```css
.priority-high {
  background: #fee2e2;
  color: #991b1b;
  border-color: #dc2626;
}

.priority-medium {
  background: #fef3c7;
  color: #92400e;
  border-color: #f59e0b;
}

.priority-low {
  background: #dcfce7;
  color: #15803d;
  border-color: #22c55e;
}
```

### Modify Card Layout

```css
.trending-container {
  grid-template-columns: repeat(2, 1fr); /* 2 columns instead of auto */
  gap: 2rem; /* Increase spacing */
}
```

## Features

### 1. **Smart Priority Highlighting**
- High priority (score ≥ 70): 🔴 Red badge
- Medium priority (score 40-69): 🟡 Yellow badge
- Low priority (score < 40): 🟢 Green badge

### 2. **Loading States**
- Skeleton animation while fetching data
- Shows 5 placeholder cards during load
- Smooth transition to real data

### 3. **Error Handling**
- Graceful error messages with retry button
- Empty state when no issues available
- Console error logging for debugging

### 4. **Responsive Design**
- Desktop: 5-column grid
- Tablet: 3-column grid
- Mobile: Single column (stacked)
- Fully touch-friendly

### 5. **Interactive Elements**
- Hover animations on cards
- Pulsing fire emoji in header
- Smooth transitions and transforms
- Hover lift effect on cards

## API Integration

The widget expects the following API endpoint:

```
GET /api/issues/trending?limit=5
```

### Expected Response Format

```json
{
  "trending": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Road Infrastructure Repair",
      "category": "infrastructure",
      "location": {
        "state": "Maharashtra",
        "district": "Mumbai",
        "area": "Bandra"
      },
      "votes": 45,
      "priority": 85,
      "status": "in-progress",
      "createdAt": "2024-03-25T10:30:00Z"
    }
  ],
  "total": 5,
  "limit": 5
}
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lightweight: ~15KB minified CSS + 8KB minified JS
- No external dependencies
- Optimized animations (CSS-based, not JavaScript)
- Lazy load ready

## Troubleshooting

### Widget not showing?

1. Check that the container div exists:
   ```html
   <div id="trending-issues-container"></div>
   ```

2. Verify CSS file is loaded:
   ```html
   <link rel="stylesheet" href="trending-issues-styles.css">
   ```

3. Verify JS file is loaded:
   ```html
   <script src="trending-issues.js"></script>
   ```

4. Open browser console (F12) for any error messages

### API not responding?

1. Verify the backend server is running on port 3000
2. Check that `/api/issues/trending` endpoint exists
3. Test endpoint directly: `curl http://localhost:3000/api/issues/trending`

### Styling conflicts?

1. If styles don't apply, increase CSS specificity
2. Use `!important` as a last resort for overrides
3. Check for conflicting CSS from other files

## Advanced Usage

### Custom Error Handling

```javascript
class CustomTrendingWidget extends TrendingIssuesWidget {
  renderError(error) {
    // Custom error handling
    console.log('Custom error handler:', error);
    super.renderError(error);
  }
}

// Use custom widget
new CustomTrendingWidget('trending-issues-container', 5);
```

### Refresh Widget

```javascript
const widget = new TrendingIssuesWidget('trending-issues-container', 5);

// Later, refresh the data
widget.fetchTrendingIssues();
```

### Manual Initialization

```javascript
// Instead of auto-init, manually control initialization
document.removeEventListener('DOMContentLoaded', TrendingIssuesWidget);

// Create when ready
const widget = new TrendingIssuesWidget('trending-issues-container', 5);
```

## Style Classes Reference

| Class | Purpose |
|-------|---------|
| `.trending-section` | Main container wrapper |
| `.trending-header` | Header with title |
| `.trending-container` | Cards grid layout |
| `.trending-card` | Individual issue card |
| `.priority-high` | High priority badge |
| `.priority-medium` | Medium priority badge |
| `.priority-low` | Low priority badge |
| `.trending-error` | Error state display |
| `.trending-empty` | Empty state display |

## Next Steps

1. ✅ Add to your homepage for discoverability
2. ✅ Add to user dashboards for personalized trending
3. ✅ Implement auto-refresh logic (every 5 minutes)
4. ✅ Add "View All" link to dedicated trending page
5. ✅ Track user interactions with trending issues

## Support

For issues or questions about the component:
1. Check browser console for error messages
2. Review API response format matches expected structure
3. Verify all files are in the correct directory
4. Test with a fresh page load (clear cache if needed)

---

**Last Updated:** March 30, 2026  
**Component Version:** 1.0  
**API Dependency:** `/api/issues/trending` endpoint
