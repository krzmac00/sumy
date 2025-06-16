# Analytics API Documentation

## Overview

The Analytics API provides comprehensive endpoint usage tracking, advanced search functionality, and performance optimization features for the Sumy backend.

## Base URL
```
/api/analytics/
```

## Authentication
All endpoints require authentication unless otherwise specified. Use JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Endpoint Usage Analytics

#### List Endpoint Usage
```
GET /api/analytics/endpoint-usage/
```

**Query Parameters:**
- `method`: Filter by HTTP method (GET, POST, etc.)
- `is_deprecated`: Filter deprecated endpoints (true/false)
- `search`: Search endpoints by path or view name
- `ordering`: Order by field (e.g., `-last_accessed`, `total_requests`)
- `page`: Page number (default: 1)
- `page_size`: Results per page (default: 20, max: 100)

**Response:**
```json
{
  "count": 150,
  "next": "http://api.example.com/analytics/endpoint-usage/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "endpoint": "/api/v1/threads/",
      "method": "GET",
      "view_name": "thread-list",
      "last_accessed": "2024-01-20T10:30:00Z",
      "first_accessed": "2024-01-01T08:00:00Z",
      "total_requests": 15420,
      "total_errors": 23,
      "avg_response_time": 45.3,
      "min_response_time": 12.5,
      "max_response_time": 523.7,
      "is_deprecated": false,
      "deprecation_date": null,
      "days_since_last_access": 0,
      "is_unused": false,
      "error_rate": 0.15
    }
  ]
}
```

#### Get Unused Endpoints
```
GET /api/analytics/endpoint-usage/unused/
```

Returns endpoints not accessed in the last 30 days.

#### Get Usage Summary
```
GET /api/analytics/endpoint-usage/summary/
```

**Response:**
```json
{
  "total_endpoints": 87,
  "active_endpoints": 65,
  "unused_endpoints": 22,
  "deprecated_endpoints": 5,
  "total_requests_today": 4532,
  "avg_response_time_today": 42.7,
  "error_rate_today": 0.8
}
```

#### Deprecate Endpoint
```
POST /api/analytics/endpoint-usage/{id}/deprecate/
```

**Permissions:** Admin only

#### Activate Endpoint
```
POST /api/analytics/endpoint-usage/{id}/activate/
```

**Permissions:** Admin only

### 2. Search Endpoints

#### Search Users
```
GET /api/analytics/search/users/
```

**Query Parameters:**
- `q`: Search query (required)
- `role`: Filter by role (student/lecturer/admin)
- `is_active`: Filter by active status (true/false)
- `page`: Page number
- `page_size`: Results per page

**Response:**
```json
{
  "count": 25,
  "page": 1,
  "page_size": 20,
  "results": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "profile": {
        "bio": "Computer Science student",
        "profile_picture": "/media/profiles/john.jpg"
      }
    }
  ]
}
```

#### Search Threads
```
GET /api/analytics/search/threads/
```

**Query Parameters:**
- `q`: Search query (required)
- `category`: Filter by category
- `author`: Filter by author ID
- `date_from`: Filter by start date (YYYY-MM-DD)
- `date_to`: Filter by end date (YYYY-MM-DD)
- `is_pinned`: Filter pinned threads (true/false)
- `has_votes`: Filter threads with votes (true/false)

#### Multi-Search
```
GET /api/analytics/search/multi/
```

Search across multiple content types simultaneously.

**Query Parameters:**
- `q`: Search query (required)
- `types[]`: Content types to search (user, thread, post, news, notice)
- `limit`: Results per type (default: 5)

**Response:**
```json
{
  "query": "django",
  "results": {
    "users": [...],
    "threads": [...],
    "posts": [...],
    "news": [...],
    "notices": [...]
  }
}
```

#### Search Suggestions
```
GET /api/analytics/search/suggestions/
```

**Query Parameters:**
- `q`: Query prefix (min 2 characters)
- `type`: Search type filter
- `limit`: Max suggestions (default: 10)

**Response:**
```json
[
  {
    "query": "django tutorial",
    "frequency": 45,
    "last_used": "2024-01-20T09:15:00Z"
  }
]
```

### 3. Search History

#### Get User Search History
```
GET /api/analytics/search/history/
```

Returns the authenticated user's search history.

#### Clear Search History
```
DELETE /api/analytics/search/history/
```

### 4. Analytics Dashboard

#### Get Dashboard Data
```
GET /api/analytics/dashboard/
```

**Permissions:** Admin only

**Response:**
```json
{
  "endpoint_stats": {
    "total": 87,
    "active": 65,
    "deprecated": 5,
    "high_error_rate": 3
  },
  "top_endpoints": [...],
  "slowest_endpoints": [...],
  "request_volume": [
    {
      "date": "2024-01-14",
      "requests": 3245
    }
  ],
  "search_stats": {
    "total_searches": 1523,
    "unique_queries": 487,
    "avg_execution_time": 23.4
  },
  "search_by_type": [
    {
      "search_type": "thread",
      "count": 823
    }
  ]
}
```

## Filtering and Sorting

### Universal Filtering
All list endpoints support advanced filtering:

#### Basic Filters
- Exact match: `?field=value`
- Contains: `?field__icontains=value`
- Greater than: `?field__gt=value`
- Less than: `?field__lt=value`
- Range: `?field__range=min,max`
- Date: `?field__date=2024-01-20`

#### Complex Queries
Use the `q` parameter with JSON:
```
?q={"or": [{"title__icontains": "django"}, {"category": "tutorial"}]}
```

### Sorting
Use the `ordering` parameter:
- Single field: `?ordering=created_at`
- Descending: `?ordering=-created_at`
- Multiple fields: `?ordering=-votes,created_at`

### Field Selection
Limit response fields:
```
?fields=id,title,created_at
```

## Performance Features

### Caching
- List responses are cached for 5 minutes
- Individual object responses are cached for 10 minutes
- Cache is automatically invalidated on updates

### Query Optimization
All endpoints use:
- `select_related()` for foreign keys
- `prefetch_related()` for many-to-many relations
- Database indexes for common queries

### Bulk Operations
POST, PUT, and PATCH endpoints support bulk operations by sending an array:
```json
[
  {"title": "Thread 1", "content": "..."},
  {"title": "Thread 2", "content": "..."}
]
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Query parameter 'q' is required"
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 429 Too Many Requests
```json
{
  "detail": "Request was throttled. Expected available in 86400 seconds."
}
```

## Rate Limiting
- Anonymous users: 100 requests/day
- Authenticated users: 1000 requests/day

## Webhooks
(Future feature) Register webhooks for:
- Endpoint deprecation notifications
- High error rate alerts
- Usage threshold alerts

## Migration Guide

### Updating Existing ViewSets
To add optimizations to existing viewsets:

```python
from analytics.mixins import OptimizedModelViewSet, QueryOptimizationMixin
from analytics.filters import UniversalFilterSet

class YourViewSet(QueryOptimizationMixin, viewsets.ModelViewSet):
    select_related_fields = ['user', 'category']
    prefetch_related_fields = ['tags', 'comments__user']
    filterset_class = UniversalFilterSet
```

### Adding Caching
```python
from analytics.mixins import CacheInvalidationMixin

class YourViewSet(CacheInvalidationMixin, viewsets.ModelViewSet):
    cache_prefix = 'your_model'
    cache_timeout = 300  # 5 minutes
```

## Best Practices

1. **Search Optimization**
   - Use specific search types instead of multi-search when possible
   - Add filters to narrow results
   - Implement search result caching for repeated queries

2. **Endpoint Management**
   - Regularly review unused endpoints
   - Deprecate endpoints before removal
   - Monitor error rates and response times

3. **Caching Strategy**
   - Use field selection to reduce cache size
   - Implement cache warming for frequently accessed data
   - Monitor cache hit rates

4. **Performance Monitoring**
   - Set up alerts for slow endpoints (>200ms)
   - Track database query counts
   - Monitor Redis memory usage

## Example Integration

### Frontend Search Implementation
```javascript
// Search with autocomplete
async function searchWithSuggestions(query) {
  // Get suggestions
  const suggestions = await fetch(
    `/api/analytics/search/suggestions/?q=${query}`
  ).then(r => r.json());

  // Perform actual search
  const results = await fetch(
    `/api/analytics/search/multi/?q=${query}&types[]=thread&types[]=user`
  ).then(r => r.json());

  return { suggestions, results };
}

// Track clicked results
async function trackClickedResult(searchQueryId, resultId, resultType) {
  await fetch('/api/analytics/search-history/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      search_query: searchQueryId,
      clicked_result_id: resultId,
      clicked_result_type: resultType
    })
  });
}
```

### Backend Integration
```python
# Use optimized viewsets
from analytics.optimizations import OptimizedThreadViewSet

# In urls.py
router.register(r'threads', OptimizedThreadViewSet)

# Add search to existing viewset
from analytics.mixins import SearchableViewMixin
from analytics.search import SearchService

class ThreadViewSet(SearchableViewMixin, viewsets.ModelViewSet):
    search_service = SearchService.search_threads
```