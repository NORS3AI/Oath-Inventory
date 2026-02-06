# Testing Documentation

## Overview

The Oath Research Peptide Inventory System includes a comprehensive test suite built with Vitest and React Testing Library. All 111 tests are passing, providing confidence in the core business logic, data layer, and UI components.

## Test Infrastructure

### Technology Stack

- **Vitest**: Fast, modern test framework compatible with Vite
- **React Testing Library**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **happy-dom**: Lightweight DOM environment for faster tests

### Configuration

- **vitest.config.js**: Main configuration file
- **src/test/setup.js**: Test setup with mocks for localStorage and matchMedia
- Coverage provider: v8
- Test environment: happy-dom

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### Unit Tests (111 tests total)

#### 1. Stock Status (19 tests)
**File**: `src/utils/stockStatus.test.js`

Tests the color-coded stock status system:
- Status calculation based on quantity thresholds
- ON_ORDER status when hasActiveOrder flag is true
- Support for negative quantities (back-ordering)
- Custom threshold configurations
- Status priority sorting
- Default threshold values

**Coverage**:
- `calculateStockStatus()`: All edge cases including negative quantities
- `getStatusConfig()`: Valid and invalid status codes
- `needsOrdering()`: All stock statuses
- `sortByStatusPriority()`: Array sorting and immutability

#### 2. Sales Readiness (20 tests)
**File**: `src/utils/salesReadiness.test.js`

Tests the three-point validation system (Purity + Net Weight + Label):
- Individual requirement checks
- Combined validation logic
- Missing requirement detection
- Filtering by readiness status
- Statistics calculation

**Coverage**:
- `checkSalesReadiness()`: All combinations of missing requirements
- `getReadinessConfig()`: Both READY and BLOCKED states
- `filterByReadiness()`: ALL, READY, and BLOCKED filters
- `getReadinessStats()`: Comprehensive statistics

#### 3. CSV Parser (29 tests)
**File**: `src/utils/csvParser.test.js`

Tests the flexible CSV import system:
- Field mapping with multiple column name variations
- Case-insensitive header matching
- Numeric quantity parsing (including negatives)
- Product exclusion with regex patterns
- Empty row filtering
- Metadata field generation
- CSV export functionality

**Coverage**:
- `transformPeptideData()`: All field mappings and transformations
- `getDefaultFieldMapping()`: Complete field mapping structure
- `validatePeptideData()`: Required fields, warnings, and errors
- `exportToCSV()`: Export with default and custom fields

**Key Features Tested**:
- Product → Peptide ID mapping
- SKU → Name mapping
- Size → Net Weight mapping
- Status → Notes mapping
- Incoming Arrival → Ordered Date mapping
- Case-insensitive exclusion patterns (e.g., "a1 Test" matches "A1 TEST")
- Negative quantities for back-ordering

#### 4. Database Layer (26 tests)
**File**: `src/lib/db.test.js`

Tests the IndexedDB abstraction layer structure:
- All four stores (peptides, orders, labels, settings)
- CRUD operations availability
- Specialized methods (bulkImport, getByPeptideId)
- Store structure validation

**Coverage**:
- `db.peptides`: getAll, get, set, update, delete, clear, bulkImport
- `db.orders`: getAll, get, set, update, delete, clear, getByPeptideId
- `db.labels`: getInventory, setInventory, getLabeled, markLabeled, isLabeled, clear
- `db.settings`: get, set, getAll, getStockThresholds, setStockThresholds

**Note**: These tests verify the API structure. Full integration testing with actual IndexedDB operations would require browser environment.

#### 5. Dark Mode Hook (8 tests)
**File**: `src/hooks/useDarkMode.test.js`

Tests the dark mode functionality:
- Initialization from localStorage
- System preference fallback
- Toggle functionality
- DOM class manipulation
- localStorage persistence

**Coverage**:
- Initial state management
- Toggle state changes
- Document class list updates
- localStorage read/write operations

#### 6. Toast Component (9 tests)
**File**: `src/components/Toast.test.jsx`

Tests the toast notification system:
- Provider initialization
- Context availability
- Toast display for all types (success, error, warning, info)
- Error handling when used without provider

**Coverage**:
- `ToastProvider`: Rendering and context provision
- `useToast`: All toast methods (success, error, warning, info)
- Error boundary behavior

## Test Results

```
Test Files: 6 passed (6)
Tests:      111 passed (111)
Duration:   ~3.5s
```

### Breakdown by File

| File | Tests | Status |
|------|-------|--------|
| stockStatus.test.js | 19 | ✓ All passing |
| salesReadiness.test.js | 20 | ✓ All passing |
| csvParser.test.js | 29 | ✓ All passing |
| db.test.js | 26 | ✓ All passing |
| useDarkMode.test.js | 8 | ✓ All passing |
| Toast.test.jsx | 9 | ✓ All passing |

## Testing Best Practices

### 1. Test Organization
- Each test file mirrors the source file structure
- Tests are grouped by describe blocks for logical organization
- Test names clearly describe what is being tested

### 2. Test Isolation
- Each test is independent and can run in any order
- beforeEach/afterEach hooks ensure clean state
- No shared mutable state between tests

### 3. Edge Cases
- Negative quantities (back-ordering)
- Null/undefined values
- Empty arrays and objects
- Invalid inputs
- Case-insensitive matching

### 4. Real-World Scenarios
- Multiple field name variations for CSV columns
- Complex product exclusion patterns
- Three-point validation with partial requirements
- Status transitions with active orders

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

```bash
# CI mode (exits with code 0 or 1)
npm run test:run
```

## Future Enhancements

### Integration Tests (Phase 9 - In Progress)
- Full IndexedDB CRUD operations
- CSV import end-to-end workflow
- Order lifecycle complete flow

### End-to-End Tests (Phase 9 - Pending)
- Critical user workflows
- Multi-tab navigation
- Data persistence across sessions
- Export functionality

### User Acceptance Testing (Phase 9 - Pending)
- Real-world data scenarios
- Performance benchmarks
- Cross-browser compatibility

## Debugging Tests

### Run specific test file
```bash
npx vitest src/utils/stockStatus.test.js
```

### Run tests in watch mode
```bash
npm test
```

### Run tests with UI
```bash
npm run test:ui
```

### View coverage report
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Known Limitations

1. **Database Tests**: Current tests verify API structure only. Full integration tests with actual IndexedDB require browser environment.

2. **Timer Tests**: Toast auto-dismiss tests are simplified due to timer complexity in test environment. Functionality works correctly in production.

3. **LocalStorage Mocking**: Some tests use simplified localStorage mocks. Full E2E tests would verify actual browser storage.

## Contributing

When adding new features:

1. Write tests first (TDD approach when possible)
2. Ensure all existing tests pass: `npm run test:run`
3. Aim for >80% code coverage
4. Include edge cases and error scenarios
5. Document complex test scenarios

## Support

For questions about testing:
- Review existing test files for examples
- Check Vitest documentation: https://vitest.dev
- Check React Testing Library docs: https://testing-library.com/react
