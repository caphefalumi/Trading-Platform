# Frontend Button & Utility Testing Checklist

## Test Environment Setup
- [x] Backend server running on http://localhost:3001
- [x] Frontend server running on http://localhost:3000
- [ ] Database connected and migrated
- [ ] Environment variables configured

## Authentication Features

### Login View (`/login`)
**Buttons to Test:**
- [ ] "Sign In" button - Submit login form
  - Test with valid credentials
  - Test with invalid credentials
  - Test with empty fields
  - Verify loading state appears
  - Verify error messages display correctly
- [ ] "Google OAuth" button - Login with Google
  - Test OAuth flow
  - Verify session creation
- [ ] "Register" link button - Navigate to registration
  - Verify navigation works

**Utilities to Test:**
- [ ] Email validation (format check)
- [ ] Password validation (required check)
- [ ] API client call to `/api/auth/login`
- [ ] Session state management (setUser)
- [ ] Redirect to dashboard on success
- [ ] Error handling and display

### Register View (`/register`)
**Buttons to Test:**
- [ ] "Register" button - Submit registration form
  - Test with valid data
  - Test with existing email
  - Test with weak password
  - Test with invalid email format
  - Verify loading state
  - Verify success message
  - Verify auto-redirect to login after 2 seconds
- [ ] "Sign in" link button - Navigate to login
  - Verify navigation works

**Utilities to Test:**
- [ ] Email validation (format + required)
- [ ] Password validation (min 8 characters)
- [ ] API client call to `/api/auth/register`
- [ ] Form reset on success
- [ ] Error handling per field

## Navigation Features

### App.vue Navigation
**Buttons to Test:**
- [ ] "Sign out" button (top bar)
  - Verify logout API call to `/api/auth/logout`
  - Verify session cleared
  - Verify redirect to login
- [ ] "Dashboard" button - Navigate to dashboard
- [ ] "Sign in" button (when logged out)

### Sidebar Navigation (`Sidebar.vue`)
**Buttons to Test:**
- [ ] Dashboard menu item - Navigate to `/dashboard`
- [ ] Trade menu item - Navigate to `/trade`
- [ ] Market Data menu item - Navigate to `/market`
- [ ] Portfolio menu item - Navigate to `/dashboard`
- [ ] Orders menu item - Navigate to `/orders`
- [ ] Settings menu item (placeholder)
- [ ] History menu item (placeholder)
- [ ] News menu item (placeholder)
- [ ] Feedback menu item (placeholder)

**Utilities to Test:**
- [ ] Active route highlighting
- [ ] Router navigation
- [ ] Visual hover effects

## Dashboard View (`/dashboard`)

### Account Balance Buttons
**Buttons to Test:**
- [ ] "Add Demo Funds" button (when no balance)
  - Opens demo credit modal
- [ ] "Deposit" button
  - Opens deposit modal
- [ ] "Withdraw" button
  - Opens withdraw modal
- [ ] "Demo Credit" button
  - Opens demo credit modal

### Deposit Modal
**Buttons to Test:**
- [ ] "Deposit" submit button
  - Test with valid amount
  - Test with invalid amount (0 or negative)
  - Verify loading state
  - Verify success/error feedback
  - Verify balance refresh
- [ ] "Cancel" button
  - Closes modal

**Utilities to Test:**
- [ ] Amount validation (number, positive)
- [ ] Optional currency input
- [ ] API call to `/api/accounts/:id/deposit`
- [ ] Balance data refresh after deposit
- [ ] Modal overlay click to close

### Withdraw Modal
**Buttons to Test:**
- [ ] "Withdraw" submit button
  - Test with valid amount
  - Test with amount exceeding balance
  - Test with invalid amount
  - Verify loading state
  - Verify success/error feedback
- [ ] "Cancel" button
  - Closes modal

**Utilities to Test:**
- [ ] Amount validation
- [ ] Currency selection
- [ ] API call to `/api/accounts/:id/withdraw`
- [ ] Balance data refresh after withdrawal
- [ ] Insufficient funds error handling

### Demo Credit Modal
**Buttons to Test:**
- [ ] "Add Demo Credit" submit button
  - Test adding demo funds
  - Verify loading state
  - Verify balance update
- [ ] "Cancel" button
  - Closes modal

**Utilities to Test:**
- [ ] Amount input (if configurable)
- [ ] API call to demo credit endpoint
- [ ] Balance refresh

### Chart Interactions
**Buttons to Test:**
- [ ] Chart symbol tabs (BTC, ETH, etc.)
  - Switch between different cryptocurrencies
  - Verify chart updates
- [ ] Time period buttons (1H, 4H, 1D, 1W, 1M)
  - Switch time periods
  - Verify chart data updates

**Utilities to Test:**
- [ ] ECharts initialization
- [ ] Chart data fetching
- [ ] Real-time data updates
- [ ] Chart rendering performance

### Data Loading
**Utilities to Test:**
- [ ] Balance fetching from `/api/accounts/:id/balances`
- [ ] Portfolio fetching from `/api/accounts/:id/portfolio`
- [ ] Market data fetching
- [ ] Loading states display
- [ ] Empty state handling
- [ ] Error handling

## Trade View (`/trade`)

### Order Form
**Buttons to Test:**
- [ ] "Use Market" button
  - Fills price field with current market price
  - Test with different instruments
- [ ] "Buy/Sell" submit button
  - Test BUY order submission
  - Test SELL order submission
  - Test with all required fields
  - Test with missing fields
  - Verify loading state
  - Verify success feedback
  - Verify form reset after success

**Form Inputs to Test:**
- [ ] Instrument selection dropdown
  - Lists all available instruments
  - Shows current price in dropdown
  - Updates market info panel on change
- [ ] Side radio buttons (Buy/Sell)
  - Switch between buy and sell
  - Verify button color changes
- [ ] Order type dropdown
  - Select LIMIT order type
- [ ] Price input
  - Number validation
  - Decimal places (0.01)
  - Price hint displays (% vs market)
  - Manual price entry
- [ ] Quantity input
  - Number validation
  - High decimal precision (0.00000001)
  - Total hint displays (price × quantity)
- [ ] Time in Force dropdown
  - Select GTC, Day, IOC, FOK
- [ ] Client Order ID (optional)
  - Custom ID input
  - Auto-generation if empty

**Utilities to Test:**
- [ ] Form validation
- [ ] submitOrder utility function
- [ ] API call to `/api/orders`
- [ ] Real-time price updates
- [ ] Market data polling
- [ ] Price hint calculation
- [ ] Total calculation
- [ ] Success/error snackbar display

### Market Information Panel
**Features to Test:**
- [ ] Real-time price display
- [ ] 24h change percentage
- [ ] 24h volume
- [ ] Live/Offline status indicator
- [ ] Market data updates via polling
- [ ] Instrument details display

### Recent Executions
**Features to Test:**
- [ ] Execution list display
- [ ] Side indicators (Buy/Sell icons)
- [ ] Timestamp formatting
- [ ] Auto-update on new executions

## Market Data View (`/market`)

### Market Data Features
**Features to Test:**
- [ ] Instrument list display
- [ ] Real-time price updates
- [ ] Price change indicators
- [ ] Volume display
- [ ] Instrument selection/navigation
- [ ] Data refresh mechanism

**Utilities to Test:**
- [ ] Market data fetching
- [ ] Data caching
- [ ] Price formatting
- [ ] Update intervals

## Order History View (`/orders`)

### Order List
**Features to Test:**
- [ ] Order list display
- [ ] Order status display
- [ ] Order details (instrument, side, price, quantity)
- [ ] Timestamp formatting
- [ ] Pagination (if implemented)
- [ ] Filter by status (if implemented)

**Buttons to Test:**
- [ ] Cancel order button (if implemented)
- [ ] Order details expand (if implemented)

**Utilities to Test:**
- [ ] Order fetching from `/api/accounts/:id/orders`
- [ ] Order status formatting
- [ ] Side formatting (Buy/Sell)
- [ ] Price and quantity formatting

## Utility Functions Testing

### API Client (`utils/api.js`)
**Test Cases:**
- [ ] Base URL configuration (VITE_API_URL)
- [ ] Credentials inclusion (withCredentials: true)
- [ ] 401 response handling
  - Clears user session
  - Redirects to login
- [ ] Error response handling
- [ ] Request interceptors
- [ ] Response interceptors

### Session Management (`stores/session.js`)
**Test Cases:**
- [ ] `setUser()` - Sets account data
- [ ] `clearUser()` - Clears account data
- [ ] `initSession()` - Validates session with server
  - Calls `/api/auth/me`
  - Sets account if valid
  - Clears if invalid
- [ ] `sessionState.isLoading` flag
- [ ] Reactive state updates

### Router (`router/router.js`)
**Test Cases:**
- [ ] Route definitions
- [ ] Route guards (requiresAuth)
- [ ] Guest-only routes (requiresGuest)
- [ ] Session initialization before navigation
- [ ] Redirect to login if unauthorized
- [ ] Redirect to dashboard if already logged in
- [ ] Wildcard route redirect

### Engine Utility (`utils/engine.js`)
**Test Cases:**
- [ ] `submitOrder()` function
- [ ] API call to `/api/orders`
- [ ] Error handling
- [ ] Response data return

### Crypto Utility (`utils/crypto.js`)
**Test Cases:**
- [ ] `getCryptoPrices()` function
- [ ] Symbol parameter handling
- [ ] API call to `/api/latest-quotes`
- [ ] Data transformation
- [ ] Error handling
- [ ] Empty data handling

## Visual & UX Testing

### Loading States
- [ ] Button loading spinners
- [ ] Page loading indicators
- [ ] Disabled state during loading
- [ ] Loading overlays

### Feedback Mechanisms
- [ ] Success messages
- [ ] Error messages
- [ ] Validation messages
- [ ] Toast/Snackbar notifications
- [ ] Alert components
- [ ] Closable feedback

### Form Validation
- [ ] Required field validation
- [ ] Email format validation
- [ ] Number validation
- [ ] Min/max validation
- [ ] Real-time validation feedback
- [ ] Form-level validation

### Responsive Design
- [ ] Mobile layout
- [ ] Tablet layout
- [ ] Desktop layout
- [ ] Button sizes on different screens
- [ ] Modal responsiveness

## Error Handling

### Network Errors
- [ ] API timeout handling
- [ ] Network offline handling
- [ ] 500 server errors
- [ ] 404 not found errors
- [ ] 401 unauthorized errors
- [ ] 403 forbidden errors
- [ ] 400 bad request errors

### Validation Errors
- [ ] Field-specific errors display
- [ ] Form-level errors display
- [ ] Clear errors on input change
- [ ] Error message styling

### Session Errors
- [ ] Expired session handling
- [ ] Invalid session handling
- [ ] Session refresh logic

## Performance Testing

### Optimization Checks
- [ ] Component re-render optimization
- [ ] API call debouncing (if applicable)
- [ ] Data caching
- [ ] Lazy loading
- [ ] Memory leaks (especially with intervals/polling)

### Data Polling
- [ ] Market data polling interval
- [ ] Cleanup on component unmount
- [ ] Polling pause when inactive
- [ ] Efficient data updates

## Security Testing

### Authentication
- [ ] Credentials not exposed in URLs
- [ ] CSRF protection (cookies with httpOnly)
- [ ] XSS prevention
- [ ] Session expiration
- [ ] Secure logout

### Data Validation
- [ ] Client-side validation
- [ ] Server-side validation
- [ ] SQL injection prevention (backend)
- [ ] Input sanitization

## Browser Compatibility

### Test Browsers
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browsers

### Features to Test
- [ ] CSS support
- [ ] JavaScript ES6+ features
- [ ] Fetch/Axios requests
- [ ] LocalStorage/Cookies
- [ ] Vue 3 reactivity

## Integration Testing

### Complete User Flows
- [ ] **Registration → Login → Dashboard Flow**
  1. Register new account
  2. Verify email
  3. Login with credentials
  4. View dashboard

- [ ] **Trading Flow**
  1. Login
  2. Add demo funds
  3. Navigate to trade view
  4. Select instrument
  5. Enter order details
  6. Submit buy order
  7. View order in history
  8. Check balance update

- [ ] **Balance Management Flow**
  1. View current balance
  2. Deposit funds
  3. Check balance update
  4. Withdraw funds
  5. Verify balance decrease

## Known Issues & Fixes

### Issues Found:
1. **CMC Client Configuration** - Fixed env var names to use VITE_ prefix
2. **Market Data Polling** - Check cleanup on unmount
3. **Form Reset** - Ensure all forms reset properly after submission

### Recommended Fixes:
1. Add proper error boundaries
2. Implement retry logic for failed API calls
3. Add optimistic UI updates
4. Implement proper loading skeletons
5. Add request cancellation for unmounted components

## Testing Tools

### Manual Testing
- Browser DevTools
- Network tab for API calls
- Console for errors
- Vue DevTools for state inspection

### Automated Testing (Future)
- Jest for unit tests
- Cypress for e2e tests
- Testing Library for component tests

## Status Legend
- [ ] Not tested
- [x] Tested and working
- [!] Tested with issues
- [~] Partially working

---

## Summary
Total Features: ~100+
Tested: 2
Working: 2
Issues: 0

Last Updated: October 31, 2025
