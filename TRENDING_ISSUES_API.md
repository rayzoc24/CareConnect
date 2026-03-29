# Trending Issues API Documentation

## Overview
The Trending Issues API endpoint provides a list of the most trending issues in the CareConnect platform, ranked by votes and recent activity.

## Endpoint

### GET `/api/issues/trending`

Fetches the trending issues sorted by votes (descending) and creation date (most recent first).

## Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | 10 | 100 | Number of issues to return (0-100) |

## Request Example

```bash
# Get top 10 trending issues (default)
GET http://localhost:3000/api/issues/trending

# Get top 5 trending issues
GET http://localhost:3000/api/issues/trending?limit=5

# Get top 20 trending issues
GET http://localhost:3000/api/issues/trending?limit=20
```

## Response Format

### Success Response (200 OK)

```json
{
  "trending": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Broken streetlight",
      "category": "Infrastructure",
      "location": {
        "state": "Maharashtra",
        "district": "Mumbai",
        "area": "Bandra"
      },
      "votes": 15,
      "priority": 75,
      "status": "pending",
      "createdAt": "2025-11-28T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Water contamination",
      "category": "Environment",
      "location": {
        "state": "Maharashtra",
        "district": "Mumbai",
        "area": "Mahim"
      },
      "votes": 12,
      "priority": 85,
      "status": "in-progress",
      "createdAt": "2025-11-27T14:22:00.000Z"
    }
  ],
  "total": 2,
  "limit": 10
}
```

### Error Response (500)

```json
{
  "error": "Failed to fetch trending issues."
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | MongoDB ObjectId of the issue |
| `title` | string | Issue title |
| `category` | string | Issue category |
| `location` | object | Location details (state, district, area) |
| `votes` | number | Total votes received |
| `priority` | number | Priority score (0-100, calculated by AI) |
| `status` | string | Current status (pending, in-progress, completed) |
| `createdAt` | ISO string | Issue creation timestamp |

## Trending Algorithm

Issues are ranked using:
1. **Votes (Primary)**: Descending - Higher votes = Higher priority
2. **Creation Date (Secondary)**: Descending - Recent issues ranked higher when votes are equal

**Trending Formula:**
```
SORT BY: votes DESC, createdAt DESC
LIMIT: Specified by user (default 10, max 100)
```

## Implementation Details

- **Database Query**: Uses MongoDB `.find().sort().limit()` for efficient querying
- **Performance**: Uses `.lean()` for optimized read-only queries
- **No Authentication Required**: Public endpoint, accessible to all users
- **Response Time**: ~50-150ms depending on database size
- **Caching**: Not currently cached; real-time data

## Use Cases

1. **Homepage Dashboard**: Display top trending issues to volunteers
2. **Community Engagement**: Show what's most important to the community
3. **Quick Discovery**: New users can see active issues instantly
4. **Impact Tracking**: Measure community involvement via vote counts

## Integration Example (Frontend)

```javascript
// Fetch trending issues
async function fetchTrendingIssues(limit = 10) {
  const response = await fetch(`/api/issues/trending?limit=${limit}`);
  const data = await response.json();
  return data.trending;
}

// Usage
const trendingIssues = await fetchTrendingIssues(5);
console.log(trendingIssues);
```

## Testing

```bash
# Manual test with cURL
curl "http://localhost:3000/api/issues/trending?limit=5"

# Test with specific limit
curl "http://localhost:3000/api/issues/trending?limit=20"
```

## Performance Considerations

- **Index Recommendation**: Add compound index on `votes` and `createdAt` for optimal performance
  ```javascript
  Issue.collection.createIndex({ votes: -1, createdAt: -1 });
  ```
- **Large Limits**: The API enforces max limit of 100 to prevent excessive data transfer
- **Real-time**: Data is fetched fresh on each request

## Related Endpoints

- `GET /api/issues` - List all issues with filtering
- `GET /api/issues/:id/recommended-ngos` - Get recommended NGOs for an issue
- `POST /api/issues/:id/vote` - Vote on an issue

## Created: 2025-11-28
**File**: `src/controllers/issueController.js` - Added `getTrendingIssues()` function
**Route**: `src/routes/issueRoutes.js` - Added trending route
