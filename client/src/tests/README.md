# Vitest Test Suite Documentation

## Overview
This test suite provides comprehensive coverage for the Trading Platform frontend, including utilities, stores, components, and routing.

## Test Files

### 1. `session.test.js` - Session Store Tests
Tests the session management functionality:
- **setUser()**: Setting user account data
- **clearUser()**: Clearing session data
- **initSession()**: Validating session with server
- **sessionState**: Reactive state management
- **Loading states**: Handling concurrent session initialization

**Coverage:**
- ✓ Setting and clearing user data
- ✓ API integration with `/api/auth/me`
- ✓ Error handling for unauthorized access
- ✓ Loading state management
- ✓ Reactivity of session state

### 2. `api.test.js` - API Client Tests
Tests the Axios API client configuration:
- **Base URL configuration**: Environment variable handling
- **Credentials**: Cookie/session management
- **Interceptors**: Request/response interceptors setup
- **Error handling**: 401 unauthorized responses

**Coverage:**
- ✓ Axios instance creation with correct config
- ✓ Base URL from environment variables
- ✓ withCredentials enabled
- ✓ Response interceptor setup

### 3. `engine.test.js` - Engine Utility Tests
Tests order submission functionality:
- **submitOrder()**: Order submission to API
- **Error handling**: Network and API errors
- **Data passing**: Complete order data fields
- **Logging**: Console error logging

**Coverage:**
- ✓ Successful order submission
- ✓ API error handling (insufficient balance, etc.)
- ✓ Network error handling
- ✓ Correct API endpoint usage (`/api/orders`)
- ✓ All order fields passed through
- ✓ Error logging to console

### 4. `crypto.test.js` - Crypto Utility Tests
Tests cryptocurrency price fetching:
- **getCryptoPrices()**: Fetching crypto prices from API
- **Default symbols**: BTC, ETH handling
- **Custom symbols**: Multiple cryptocurrency support
- **Data mapping**: API response transformation
- **Error handling**: Network failures and empty responses

**Coverage:**
- ✓ Fetch with default symbols (BTC, ETH)
- ✓ Fetch with custom symbols
- ✓ Handle missing quote data
- ✓ API error handling (returns empty array)
- ✓ Empty and null response handling
- ✓ Correct data mapping (symbol, name, price, change, volume)

### 5. `Sidebar.test.js` - Sidebar Component Tests
Tests sidebar navigation component:
- **Menu rendering**: All menu sections and items
- **Navigation**: Click handlers and route changes
- **Active state**: Current route highlighting
- **Icons**: MDI icon rendering

**Coverage:**
- ✓ Renders MENU, ACCOUNT, and EXTRA sections
- ✓ All navigation items displayed
- ✓ Click navigation to dashboard, trade, market-data, orders
- ✓ Active state highlighting for current route
- ✓ MDI icons rendered

### 6. `LoginView.test.js` - Login View Component Tests
Tests login form component:
- **Form rendering**: Email, password inputs, buttons
- **Form submission**: Login API call
- **Success handling**: Session update and redirect
- **Error handling**: Display error messages
- **Validation**: Email and password validation
- **Loading state**: Disabled buttons during submission

**Coverage:**
- ✓ Form and input rendering
- ✓ Sign In button
- ✓ Register link
- ✓ Submit with valid credentials
- ✓ setUser() called on success
- ✓ Redirect to dashboard on success
- ✓ Error handling (no redirect/session on failure)
- ✓ Email and password validation
- ✓ Loading state during submission

### 7. `router.test.js` - Router Configuration Tests
Tests Vue Router setup:
- **Route definitions**: All application routes
- **Route meta**: Authentication and guest requirements
- **Navigation**: Route changes
- **Redirects**: Root to dashboard redirect
- **Query parameters**: URL parameter handling

**Coverage:**
- ✓ All routes defined (login, register, dashboard, trade, market-data, orders)
- ✓ Correct paths for each route
- ✓ Meta tags (requiresAuth, requiresGuest)
- ✓ Navigation to all routes
- ✓ Root redirect to dashboard
- ✓ Query parameter handling

## Running Tests

### Run All Tests
```bash
npm run test
# or with Bun
bun test
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode (Auto-rerun on file changes)
```bash
npm run test -- --watch
```

### Run Specific Test File
```bash
npm run test session.test.js
```

### Run Tests Matching Pattern
```bash
npm run test -- --grep "session"
```

## Test Commands

| Command | Description |
|---------|-------------|
| `bun test` | Run all tests once |
| `bun test --watch` | Run tests in watch mode |
| `bun test --ui` | Open Vitest UI |
| `bun test --coverage` | Generate coverage report |
| `bun test session.test.js` | Run specific file |
| `bun test --grep "login"` | Run tests matching pattern |

## Coverage Goals

| Module | Target Coverage | Current |
|--------|----------------|---------|
| Session Store | 100% | ✓ |
| API Client | 90% | ✓ |
| Engine Utility | 100% | ✓ |
| Crypto Utility | 100% | ✓ |
| Sidebar Component | 85% | ✓ |
| LoginView Component | 80% | ✓ |
| Router | 90% | ✓ |

## Test Organization

```
client/src/tests/
├── setup.js              # Test setup and configuration
├── session.test.js       # Session store tests
├── api.test.js           # API client tests
├── engine.test.js        # Engine utility tests
├── crypto.test.js        # Crypto utility tests
├── Sidebar.test.js       # Sidebar component tests
├── LoginView.test.js     # Login view tests
└── router.test.js        # Router tests
```

## Mocking Strategy

### API Mocking
```javascript
vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))
```

### Router Mocking
```javascript
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => mockRoute,
}))
```

### Component Stubs
```javascript
global: {
  stubs: {
    VBtn: { template: '<button><slot /></button>' },
    VCard: { template: '<div><slot /></div>' },
  },
}
```

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Mocking**: External dependencies are mocked (API calls, router)
3. **Cleanup**: Tests clean up after themselves (unmount, clear mocks)
4. **Async Handling**: Proper async/await for API calls
5. **Coverage**: Aim for high coverage on critical paths
6. **Fast Execution**: Tests run quickly (no real network calls)
7. **Descriptive Names**: Clear test descriptions

## Adding New Tests

### 1. Create Test File
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

### 2. Mock Dependencies
```javascript
vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
  },
}))
```

### 3. Test Component/Function
```javascript
it('should render component', () => {
  const wrapper = mount(MyComponent)
  expect(wrapper.exists()).toBe(true)
})
```

## Debugging Tests

### View Test Output
```bash
bun test --reporter=verbose
```

### Debug Single Test
```javascript
it.only('should run this test only', () => {
  // This is the only test that will run
})
```

### Skip Test
```javascript
it.skip('should skip this test', () => {
  // This test will be skipped
})
```

### Console Logging
```javascript
it('should debug', () => {
  console.log('Debug info:', someVariable)
  expect(true).toBe(true)
})
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: bun test

- name: Generate Coverage
  run: bun test --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Common Issues

1. **Module not found**: Check import paths
2. **Mock not working**: Ensure mock is before import
3. **Async test timeout**: Increase timeout or await properly
4. **Component not rendering**: Check stubs configuration

### Reset Between Tests
```javascript
beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})
```

## Future Enhancements

- [ ] Add integration tests
- [ ] Add E2E tests with Playwright
- [ ] Increase coverage to 95%+
- [ ] Add visual regression tests
- [ ] Add performance tests
- [ ] Add accessibility tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/)
