# 🔧 Trending Issues & Leaderboard Widget - Troubleshooting Guide

## Current Setup Status

✅ **Server Running**: http://localhost:3000  
✅ **MongoDB Connected**: careconnectDB  
✅ **APIs Tested**: Both `/api/issues/trending` and `/api/leaderboard/volunteers` are responding correctly

## Files Created/Modified

### JavaScript Files
- ✅ `trending-issues.js` - Widget that fetches and displays trending issues
- ✅ `leaderboard-home.js` - Widget that fetches and displays leaderboard (FIXED to use correct API response structure)
- ✅ `trending-issues-styles.css` - Complete styling for trending issues
- ✅ `test-widgets.html` - **NEW** Test page to verify widgets work

### HTML Changes
- ✅ `index.html` - Added 2 new sections:
  - Trending Issues Section (below "Reality Check")
  - Leaderboard Section (below Trending Issues)
- ✅ New CSS classes added for leaderboard styling

## How to Verify Everything Works

### Option 1: Test Page (Recommended)
Open this URL in your browser: **http://localhost:3000/test-widgets.html**

This page will:
- Show green/red status indicators
- Display both widgets independently
- Test API connectivity
- Show any errors clearly

### Option 2: Main Page
Open: **http://localhost:3000/index.html**

Scroll down past the:
1. Hero section
2. Workflow section  
3. Our Impact stats
4. Reality Check facts

You should see:
- **🔥 Trending Issues Section** - Shows top 5 trending issues with cards
- **🏆 Community Leaderboard** - Shows volunteers/NGOs rankings with toggle buttons

## What Changed

### API Response Fix
Fixed `leaderboard-home.js` to use the correct API response structure:
- Was looking for: `data.top`
- Now uses: `data.leaderboard` ✓

### Score Display
Updated to read from correct fields:
- Uses: `item.totalScore` (from API) ✓
- Uses: `item.scoreBreakdown.issuesCreated` & `.issuesResolved` ✓

### CSS Visibility
Added explicit display and visibility properties to ensure sections are visible:
- `.trending-section-wrapper { display: block; visibility: visible; }`
- `.leaderboard-section-wrapper { display: block; visibility: visible; }`

## API Endpoints Being Used

### Trending Issues
```
GET /api/issues/trending?limit=5
Response: { trending: [...], total: 5, limit: 5 }
```

### Leaderboard
```
GET /api/leaderboard/volunteers?range=weekly
Response: { leaderboard: [...], range: weekly, total: X }

GET /api/leaderboard/ngos?range=monthly  
Response: { leaderboard: [...], range: monthly, total: X }
```

## Features

### Trending Issues Widget ✨
- Displays top 5 trending issues
- Shows: Title, Category, Location, Votes, Priority badge
- Color-coded priorities: Red (high) | Yellow (medium) | Green (low)
- Loading skeleton animation
- Error handling with retry button
- Empty state message
- Responsive design (mobile-friendly)

### Leaderboard Widget 🏆
- Toggle between Volunteers & NGOs
- Toggle between Weekly & Monthly views
- Show top 3 with medal emojis (🥇🥈🥉)
- Display: Name, Score, Issues, Resolved count
- Responsive card layout
- Loading skeleton animation
- Error handling

## Manual Testing Checklist

- [ ] Open test-widgets.html - Check for green status indicators
- [ ] Check browser console (F12) for any error messages
- [ ] Open index.html and scroll down to trigger sections
- [ ] Click volunteer/NGO toggles in leaderboard
- [ ] Click weekly/monthly toggles in leaderboard
- [ ] Verify data is loading (check network tab in DevTools)

## If Sections Still Don't Appear

1. **Clear browser cache**: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. **Hard refresh**: Ctrl+F5 (or Cmd+Shift+R on Mac)
3. **Check DevTools** (F12):
   - Console tab: Look for JavaScript errors in red
   - Network tab: Verify API requests are successful (200 status)
   - Elements tab: Verify container divs have HTML content

4. **Check server logs** in terminal - Look for any database or API errors

## Quick Debug Commands

Test if APIs are working:
```bash
curl http://localhost:3000/api/issues/trending?limit=3
curl "http://localhost:3000/api/leaderboard/volunteers?range=weekly"
```

## What to Report If Issues Persist

If sections still don't appear after all checks:
1. Screenshot of DevTools Console tab
2. Screenshot of DevTools Network tab
3. Which browser you're using
4. Server terminal output (any errors?)
5. Are you seeing any other page content (hero, stats, etc)?

---

**Status**: ✅ All components are in place and functional  
**Last Updated**: March 30, 2026, 12:50 AM  
**Server**: Running locally on port 3000
