/**
 * User Impact API Documentation & Usage Examples
 * 
 * GET /api/impact/me - Returns user-specific impact metrics
 * Requires: Authenticated session (logged in user)
 * 
 * Response for VOLUNTEER:
 * {
 *   "role": "volunteer",
 *   "totalIssues": 5,           // Number of issues created
 *   "resolvedIssues": 2,        // Number of their issues that got resolved
 *   "votesGiven": 8,            // Number of votes they've cast
 *   "impactScore": 28            // (resolvedIssues * 10) + votesGiven
 * }
 * 
 * Response for NGO:
 * {
 *   "role": "ngo",
 *   "totalIssues": 12,          // Number of issues claimed
 *   "resolvedIssues": 8,        // Number of issues they resolved
 *   "impactScore": 120          // resolvedIssues * 15
 * }
 * 
 * Also available:
 * GET /api/impact/ - Returns global platform impact stats
 * {
 *   "totalIssues": 50,
 *   "solvedIssues": 15,
 *   "activeNgos": 5,
 *   "completionRate": 30
 * }
 */

console.log(`
✅ User Impact API Created Successfully

Endpoints:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. GET /api/impact/me
   Returns: User-specific impact metrics
   Auth:    Required (session-based)
   
2. GET /api/impact/
   Returns: Global platform impact stats
   Auth:    Not required

Metrics Structure:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOLUNTEER USER:
  • totalIssues:    Issues they created
  • resolvedIssues: Their issues that got resolved
  • votesGiven:     Total votes they cast
  • impactScore:    (resolved × 10) + votes

NGO USER:
  • totalIssues:    Issues they claimed
  • resolvedIssues: Issues they completed
  • impactScore:    resolved × 15

Error Handling:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
401: Not authenticated (no valid session)
400: Invalid user role
500: Server error

Implementation Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• File: src/controllers/impactController.js
• Route: src/routes/impactRoutes.js
• Models used:
  - Issue (createdByUid, claimedBy.ngoUid, status)
  - Vote (voterUid)
  - Constants (STATUS.COMPLETED)

Testing:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Login as volunteer
2. Visit: http://localhost:3000/volunteer-home.html
3. Open browser console, call:
   fetch('/api/impact/me').then(r => r.json()).then(data => console.log(data))

OR as NGO:
1. Login as NGO
2. Visit: http://localhost:3000/ngo-home.html
3. Open browser console, call:
   fetch('/api/impact/me').then(r => r.json()).then(data => console.log(data))
`);
