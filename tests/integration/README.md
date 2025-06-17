# Cross-Module Integration Tests Documentation

## Overview

This documentation describes the integration tests that verify interactions between different modules in the PoliConnect application. These tests ensure that the various components work together seamlessly to provide a cohesive user experience.

## Test Structure

The integration tests are organized into the following test classes:

### 1. TestUserContentCreationFlow
Tests the complete user journey from registration to content creation across multiple modules.

#### Key Test Scenarios:
- **User Registration and Activation**: Verifies the complete registration flow
- **Authentication**: Tests login and JWT token generation
- **Forum Participation**: Creating threads and posts
- **Advertisement Creation**: Posting items for sale or announcements
- **Social Interactions**: Commenting on other users' content
- **Event Management**: Creating personal calendar events

#### What It Validates:
- User accounts work correctly with all modules
- Authentication tokens are properly accepted across all APIs
- Content ownership is correctly tracked
- Cross-module data integrity is maintained

### 2. TestForumUserInteractions
Focuses on interactions between forum features and user profiles.

#### Key Test Scenarios:
- **Anonymous Posting**: 
  - Users can post anonymously while system tracks the author
  - Anonymous content displays correctly without revealing identity
  - Authors can still manage their anonymous content
  
- **User Blacklist**:
  - Users can blacklist other users
  - Blacklisted content filtering (when implemented)
  - Admin content visibility rules

#### What It Validates:
- Privacy features work correctly
- User preferences affect content visibility
- Permission systems are properly enforced

### 3. TestNewsAndForumIntegration
Tests the integration between news publishing and forum discussions.

#### Key Test Scenarios:
- **Role-Based Publishing**:
  - Only lecturers can publish news
  - Students cannot create news items
  - Proper permission enforcement
  
- **News Categories**:
  - Hierarchical category structure
  - Category-based filtering
  
- **Event Information**:
  - News can include event details
  - Event dates and locations are properly stored

#### What It Validates:
- Role-based permissions work across modules
- Content categorization is consistent
- News module integrates with discussion features

### 4. TestAdvertisementUserPermissions
Comprehensive testing of the advertisement system with user permissions.

#### Key Test Scenarios:
- **Advertisement Lifecycle**:
  - Creation with all required fields
  - Edit/delete permissions (owner only)
  - Expiry handling
  
- **Comment System**:
  - Public vs private comments
  - Activity tracking
  - Notification triggers

#### What It Validates:
- Permission system prevents unauthorized modifications
- Comment privacy settings work correctly
- Activity tracking updates appropriately
- Expired content is handled properly

### 5. TestEventCalendarIntegration
Tests personal event management and calendar features.

#### Key Test Scenarios:
- **Personal Events**:
  - Users can create private events
  - Events are user-specific
  - Date filtering works correctly
  
- **Event Categories**:
  - Different event types (private, important, exam, etc.)
  - Category-based visibility rules
  
- **Bulk Operations**:
  - Creating multiple events at once
  - Recurring event patterns

#### What It Validates:
- User isolation for private content
- Date-based filtering accuracy
- Bulk operation efficiency
- Calendar data integrity

### 6. TestMapBuildingIntegration
Tests the map module's integration with events and navigation.

#### Key Test Scenarios:
- **Building Hierarchy**:
  - Buildings contain floors
  - Floors contain rooms
  - Proper nesting in API responses
  
- **Location Integration**:
  - Events can reference room locations
  - Location search functionality
  - GPS coordinate handling

#### What It Validates:
- Hierarchical data structures work correctly
- Location references are consistent
- Spatial data is properly serialized

### 7. TestCrossModuleSearch
Verifies search functionality works across all content types.

#### Key Test Scenarios:
- **Unified Search**:
  - Search finds threads, news, and advertisements
  - Results are module-specific
  - Relevance ranking
  
- **Permission-Aware Search**:
  - Search respects content visibility rules
  - Private content is excluded appropriately

#### What It Validates:
- Search indexes all content types
- Results respect permissions
- Search performance is acceptable

### 8. TestAnalyticsIntegration
Tests that user actions are properly tracked for analytics.

#### Key Test Scenarios:
- **Activity Tracking**:
  - API endpoint usage is recorded
  - User actions are logged
  - Performance metrics are captured
  
- **Analytics Access**:
  - Analytics data can be retrieved
  - Aggregation works correctly

#### What It Validates:
- Analytics middleware is working
- Data is properly stored
- No performance impact on main operations

## Running the Integration Tests

### Run all integration tests:
```bash
pytest tests/integration/ -v
```

### Run specific test class:
```bash
pytest tests/integration/test_cross_module_interactions.py::TestUserContentCreationFlow -v
```

### Run with coverage:
```bash
pytest tests/integration/ --cov=. --cov-report=html
```

### Run with performance tracking:
```bash
pytest tests/integration/ -v --tb=short -m "not slow"
```

## Test Data Management

The integration tests use Factory Boy factories to create test data:

- **UserFactory**: Creates student users
- **LecturerFactory**: Creates lecturer users with elevated permissions
- **ThreadFactory**: Creates forum threads
- **PostFactory**: Creates forum posts
- **AdvertisementFactory**: Creates noticeboard advertisements
- **CommentFactory**: Creates advertisement comments
- **EventFactory**: Creates calendar events
- **NewsItemFactory**: Creates news articles
- **NewsCategoryFactory**: Creates news categories
- **BuildingFactory**: Creates map buildings
- **FloorFactory**: Creates building floors
- **RoomFactory**: Creates rooms

## Best Practices for Integration Tests

1. **Test Real User Workflows**: Focus on testing actual user journeys rather than individual API endpoints
2. **Verify Cross-Module Data**: Ensure data created in one module is accessible/usable in others
3. **Test Permission Boundaries**: Verify that permissions are enforced across module boundaries
4. **Use Realistic Data**: Create test data that represents real-world usage patterns
5. **Clean Test Isolation**: Each test should set up its own data and not depend on others
6. **Performance Awareness**: Integration tests can be slow, so mark long-running tests appropriately

## Common Issues and Solutions

### Issue: Tests fail due to missing migrations
**Solution**: Run `python manage.py migrate` before running tests

### Issue: Authentication failures in tests
**Solution**: Ensure test users are activated and use the `authenticate()` helper method

### Issue: Timezone-related failures
**Solution**: Always use `timezone.now()` instead of `datetime.now()`

### Issue: Factory conflicts
**Solution**: Use `django_get_or_create` for unique fields in factories

## Contributing New Integration Tests

When adding new integration tests:

1. **Identify Cross-Module Interactions**: Look for features that span multiple Django apps
2. **Create Realistic Scenarios**: Base tests on actual user workflows
3. **Document Test Purpose**: Use docstrings to explain what each test validates
4. **Use Existing Factories**: Leverage the existing test factories for consistency
5. **Consider Performance**: Mark slow tests with `@pytest.mark.slow`
6. **Maintain Test Independence**: Don't rely on database state from other tests

## Performance Considerations

Integration tests can be slower than unit tests because they:
- Create more database records
- Make actual API calls
- Test complete workflows

To maintain reasonable test execution time:
- Use `create_batch()` for bulk object creation
- Minimize database queries with `select_related()` and `prefetch_related()`
- Use transaction rollback between tests
- Consider parallel test execution with `pytest-xdist`

## Future Improvements

1. **Add WebSocket Testing**: Test real-time features when implemented
2. **Email Integration Tests**: Verify email notifications across modules
3. **File Upload Tests**: Test profile pictures and attachment handling
4. **Advanced Search Tests**: Test full-text search and filtering combinations
5. **Performance Benchmarks**: Add specific performance targets for each workflow