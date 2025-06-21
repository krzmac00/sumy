# Performance Testing Guide

This guide explains how to run performance tests to verify that PoliConnect can handle 10,000+ concurrent users with fast response times.

## Requirements

The system must meet the following performance criteria:
- **Response Time**: Average response time < 200ms for read operations
- **95th Percentile**: P95 response time < 500ms for read operations  
- **Write Operations**: Average response time < 500ms
- **Error Rate**: Less than 1% under normal load
- **Concurrent Users**: Support 10,000+ concurrent users

## Test Types

### 1. Django Performance Tests

Located in `tests/performance/test_load_performance.py`

Run with pytest:
```bash
# Run all performance tests
python -m pytest tests/performance/ -v

# Run specific test
python -m pytest tests/performance/test_load_performance.py::TestHighLoadPerformance::test_read_heavy_load -v

# Run with performance markers
python -m pytest tests/performance/ -v -m performance
```

#### Available Tests:
- `test_read_heavy_load` - Simulates 10,000 GET requests
- `test_write_heavy_load` - Tests write operation performance
- `test_mixed_load` - 80% read, 20% write operations
- `test_database_connection_pooling` - Verifies connection pooling
- `test_cache_effectiveness` - Tests cache performance improvement
- `test_forum_list_performance` - Forum endpoint < 100ms requirement
- `test_search_performance` - Search endpoint < 200ms requirement

### 2. Locust Load Testing

More realistic distributed load testing using Locust.

#### Installation:
```bash
pip install locust
```

#### Running Locust:

**With Web UI** (recommended for exploration):
```bash
locust -f locustfile.py --host=http://localhost:8000
```
Then open http://localhost:8089 and configure:
- Number of users: 10000
- Spawn rate: 100 users/second
- Host: http://localhost:8000

**Headless Mode** (for CI/CD):
```bash
# 10,000 users, spawn 100/sec, run for 5 minutes
locust -f locustfile.py --host=http://localhost:8000 --headless -u 10000 -r 100 -t 5m

# With specific user types
locust -f locustfile.py --host=http://localhost:8000 --headless -u 10000 -r 100 -t 5m --html report.html
```

#### User Types:
- **PoliConnectUser** (70%): Regular student users
- **MobileAppUser** (29%): Mobile app usage patterns  
- **AdminUser** (1%): Admin/moderator actions

### 3. Database Performance

Check database query performance:
```bash
# Enable query logging
python manage.py shell
>>> from django.db import connection
>>> connection.queries  # View all queries

# Run with query analysis
python manage.py test tests.performance --debug-sql
```

## Performance Optimization Tips

### 1. Database Optimization
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'  # 30 second timeout
        },
        'CONN_MAX_AGE': 600,  # Connection pooling
    }
}
```

### 2. Caching Configuration
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PARSER_CLASS': 'redis.connection.HiredisParser',
            'CONNECTION_POOL_CLASS': 'redis.BlockingConnectionPool',
            'CONNECTION_POOL_CLASS_KWARGS': {
                'max_connections': 50,
                'timeout': 20,
            },
        },
        'TIMEOUT': 300,  # 5 minutes default
    }
}
```

### 3. Query Optimization
```python
# Use select_related and prefetch_related
threads = Thread.objects.select_related('author').prefetch_related('posts')

# Add database indexes
class Meta:
    indexes = [
        models.Index(fields=['created_date']),
        models.Index(fields=['author', '-created_date']),
    ]
```

### 4. Middleware Optimization
```python
# Disable unnecessary middleware in production
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Remove in production: 'debug_toolbar.middleware.DebugToolbarMiddleware',
]
```

## Load Testing Best Practices

### 1. Prepare Test Data
```bash
# Create test users for load testing
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> for i in range(200):
...     User.objects.create_user(
...         email=f'loadtest{i}@edu.p.lodz.pl',
...         password='testpass123'
...     )

# Or use the populate script
python manage.py populate_mock_data --no-input
```

### 2. System Preparation
```bash
# Increase system limits
ulimit -n 65536  # Increase file descriptors

# Monitor during tests
htop  # CPU and memory
iotop  # Disk I/O
netstat -an | grep ESTABLISHED | wc -l  # Connection count
```

### 3. Analyze Results

#### Locust Metrics to Monitor:
- **RPS (Requests Per Second)**: Should handle 1000+ RPS
- **Response Times**: Median < 100ms, 95%ile < 500ms
- **Failure Rate**: Should stay below 1%
- **User Count**: Should handle 10,000 without degradation

#### Django Test Metrics:
- **Average Response Time**: Printed after each test
- **P95 Response Time**: 95th percentile latency
- **Error Rate**: Percentage of failed requests
- **Queries per Request**: Database efficiency

## Continuous Performance Testing

### GitHub Actions Integration:
```yaml
name: Performance Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Run nightly
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Performance Tests
        run: |
          python -m pytest tests/performance/ -v --tb=short
      - name: Run Locust Test
        run: |
          locust -f locustfile.py --host=http://localhost:8000 \
            --headless -u 1000 -r 50 -t 2m --html report.html
      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: performance-report
          path: report.html
```

## Troubleshooting

### Common Issues:

1. **"Too many open files"**
   ```bash
   # Increase limit
   ulimit -n 65536
   ```

2. **Database connection errors**
   ```python
   # Increase connection pool
   DATABASES['default']['OPTIONS']['max_connections'] = 200
   ```

3. **Memory issues**
   ```bash
   # Monitor memory usage
   free -h
   # Adjust Django settings
   DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
   ```

4. **Slow queries**
   ```bash
   # Enable slow query log in PostgreSQL
   ALTER SYSTEM SET log_min_duration_statement = 100;  # Log queries > 100ms
   ```

## Performance Baselines

Based on testing, expected performance metrics:

| Endpoint | Avg Response | P95 Response | Notes |
|----------|-------------|--------------|-------|
| GET /threads/ | 50-80ms | 150ms | With pagination |
| GET /advertisements/ | 40-60ms | 120ms | Cached |
| GET /events/ | 60-100ms | 200ms | User-specific |
| POST /threads/ | 150-250ms | 400ms | Creates thread |
| Search | 100-150ms | 300ms | Full-text search |

## Reporting

Performance test results should include:
1. Test configuration (users, duration, endpoints)
2. Response time percentiles (50th, 95th, 99th)
3. Throughput (requests/second)
4. Error rates and types
5. Resource utilization (CPU, memory, database)
6. Recommendations for improvement