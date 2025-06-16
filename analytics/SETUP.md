1. **Install Dependencies**
   ```bash
   pip install django-redis redis hiredis
   ```

2. **Enable Redis Cache**
   - Uncomment the Redis cache configuration in `sumy/settings.py` (lines 112-122)
   - Uncomment the session cache configuration (lines 132-133)
   - Start Redis server:
     ```bash
     docker run -d -p 6379:6379 redis:alpine
     # or
     redis-server
     ```

3. **Run Database Optimizations**
   ```bash
   python manage.py optimize_database
   ```

4. **Apply Migrations**
   ```bash
   python manage.py migrate
   ```

## Testing

Run the analytics tests:
```bash
python manage.py test analytics
```

## API Endpoints

The analytics API is now available at `/api/analytics/` with the following endpoints:

- `/api/analytics/endpoint-usage/` - View endpoint usage statistics
- `/api/analytics/search/users/` - Advanced user search
- `/api/analytics/search/threads/` - Advanced thread search
- `/api/analytics/search/multi/` - Multi-type search
- `/api/analytics/dashboard/` - Admin analytics dashboard

See `API_DOCUMENTATION.md` for full details.