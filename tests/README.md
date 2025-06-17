## Installation

```bash
pip install -r requirements-test.txt
```

## Running Tests

### Basic Test Run
```bash
pytest
```

### With Visual Reports
```bash
python tests/test_runner.py
```

### Specific Module Tests
```bash
# Run only accounts tests
pytest tests/accounts/

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Skip slow tests
pytest -m "not slow"
```

### Coverage Report
```bash
pytest --cov=. --cov-report=html
```

## Test Structure

```
tests/
├── __init__.py
├── conftest.py          # Pytest configuration and fixtures
├── factories.py         # Test data factories
├── base.py             # Base test classes
├── test_runner.py      # Visual report generator
├── accounts/
│   ├── unit/
│   │   ├── test_models.py
│   │   └── test_views.py
│   └── integration/
│       └── test_auth_flow.py
├── mainapp/
│   ├── unit/
│   │   ├── test_models.py
│   │   └── test_views.py
│   └── integration/
│       └── test_forum_flow.py
├── noticeboard/
│   └── ...
├── news/
│   └── ...
└── map/
    └── ...
```

## Writing Tests

### Unit Test Example
```python
from tests.base import BaseTestCase

class TestUserModel(BaseTestCase):
    @BaseTestCase.doc
    def test_user_creation(self):
        """
        Test user creation with email
        
        Verifies:
        - User can be created
        - Email is validated
        """
        user = User.objects.create_user(
            email='test@edu.p.lodz.pl',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@edu.p.lodz.pl')
```

### Integration Test Example
```python
from tests.base import BaseAPITestCase

class TestForumFlow(BaseAPITestCase):
    def test_complete_thread_lifecycle(self):
        """Test thread creation to deletion"""
        # Create thread
        response = self.client.post('/api/threads/', {...})
        self.assertEqual(response.status_code, 201)
        
        # Add posts, vote, edit, delete...
```

### Using Factories
```python
from tests.factories import UserFactory, ThreadFactory

# Create single object
user = UserFactory(email='custom@edu.p.lodz.pl')

# Create batch
threads = ThreadFactory.create_batch(10)

# Create with relations
thread = ThreadWithPostsFactory(num_posts=5)
```

## Test Markers

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.slow` - Slow tests (>1s)
- `@pytest.mark.performance` - Performance tests
- `@pytest.mark.django_db` - Tests requiring database

## Visual Reports

The test runner generates comprehensive HTML reports with:

- Test result summary (pie chart)
- Slowest tests (bar chart)
- Code coverage by module (bar chart)
- Test execution timeline (Gantt chart)
- Failed test details

Reports are saved to `reports/visual-test-report.html`

## CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests

GitHub Actions workflow includes:
- PostgreSQL service container
- Test execution with coverage
- Visual report generation
- PR comments with results

## Performance Testing

```python
class TestPerformance(BaseTestCase, PerformanceTestMixin):
    def test_thread_list_performance(self):
        """Test response time under 1s"""
        ThreadFactory.create_batch(100)
        
        response = self.assertResponseTime(
            self.client.get,
            max_time=1.0,
            '/api/threads/'
        )
```

## Debugging Failed Tests

1. Check the visual report at `reports/visual-test-report.html`
2. View detailed pytest output with `-vv` flag
3. Use `--pdb` to drop into debugger on failure
4. Check test database state with `--reuse-db`

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Use descriptive test names and docstrings
3. **Performance**: Use factories instead of fixtures for large datasets
4. **Coverage**: Aim for >80% code coverage
5. **Documentation**: Document complex test scenarios

## Troubleshooting

### Database Issues
```bash
# Reset test database
python manage.py flush --database=test

# Run migrations
python manage.py migrate --database=test
```

### Slow Tests
```bash
# Profile test execution
pytest --durations=10
```

### Coverage Gaps
```bash
# Show missing lines
pytest --cov-report=term-missing
```