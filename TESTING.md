# Testing Documentation

This document provides comprehensive information about the testing infrastructure for the Schoolgle Improvement Next.js application.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage](#coverage)
- [Continuous Integration](#continuous-integration)

## Overview

This project uses **Vitest** as the primary testing framework, along with **React Testing Library** for component testing. The testing infrastructure is designed to be fast, modern, and fully integrated with the Next.js application.

## Testing Stack

### Core Libraries

- **Vitest** (v2.1.8) - Fast unit test framework powered by Vite
- **@testing-library/react** (v16.1.0) - React component testing utilities
- **@testing-library/user-event** (v14.5.2) - User interaction simulation
- **@testing-library/jest-dom** (v6.6.3) - Custom DOM matchers
- **jsdom** (v25.0.1) - DOM implementation for Node.js

### Additional Tools

- **@vitest/ui** - Interactive UI for test results
- **@vitest/coverage-v8** - Code coverage reporting
- **@vitejs/plugin-react** - React support for Vitest

## Installation

Install all testing dependencies:

```bash
npm install
```

The testing dependencies are already configured in `package.json` under `devDependencies`.

## Running Tests

### Available Commands

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/CD)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Command Details

#### Watch Mode (npm test)
- Runs tests in watch mode
- Automatically re-runs tests when files change
- Best for active development
- Press `h` in the terminal for help and shortcuts

#### Run Once (npm run test:run)
- Runs all tests once and exits
- Ideal for CI/CD pipelines
- Returns exit code 0 on success, non-zero on failure

#### UI Mode (npm run test:ui)
- Opens an interactive browser-based UI
- Visualize test results and file coverage
- Debug tests visually
- View test execution time

#### Coverage (npm run test:coverage)
- Generates code coverage reports
- Creates HTML, JSON, and text reports
- Output directory: `coverage/`
- Open `coverage/index.html` in a browser to view detailed coverage

## Test Structure

### Configuration Files

```
project-root/
├── vitest.config.ts          # Vitest configuration
├── src/
│   ├── test/
│   │   └── setup.ts          # Global test setup
│   ├── lib/
│   │   ├── extractors.test.ts
│   │   ├── ai-evidence-matcher.test.ts
│   │   ├── assessment-updater.test.ts
│   │   └── ofsted-framework.test.ts
│   └── components/
│       └── OfstedFrameworkView.test.tsx
└── package.json
```

### Test Files

Test files are co-located with the source files they test, using the naming convention:
- `*.test.ts` for TypeScript unit tests
- `*.test.tsx` for React component tests
- `*.spec.ts` / `*.spec.tsx` are also supported

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { calculateAIRating } from './ofsted-framework';

describe('calculateAIRating', () => {
  it('should return "exceptional" for 100% coverage', () => {
    const rating = calculateAIRating(10, 10);
    expect(rating).toBe('exceptional');
  });

  it('should return "not_assessed" when evidence count is 0', () => {
    const rating = calculateAIRating(0, 10);
    expect(rating).toBe('not_assessed');
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Mocking

#### Module Mocking

```typescript
import { vi } from 'vitest';

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({ ... })
      }
    }
  }))
}));
```

#### Function Mocking

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue(Promise.resolve('async value'));
```

### Testing Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Test from the user's perspective

2. **Use Descriptive Test Names**
   ```typescript
   it('should return "exceptional" when all evidence is found')
   ```

3. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should calculate correctly', () => {
     // Arrange
     const input = 10;

     // Act
     const result = calculate(input);

     // Assert
     expect(result).toBe(20);
   });
   ```

4. **Test Edge Cases**
   - Empty inputs
   - Null/undefined values
   - Boundary conditions
   - Error scenarios

5. **Keep Tests Independent**
   - Each test should be runnable in isolation
   - Use `beforeEach` for setup
   - Clean up after tests

## Test Files Overview

### 1. extractors.test.ts
Tests document extraction functions:
- PDF parsing (currently disabled message)
- DOCX text extraction with mammoth
- PPTX parsing (currently disabled message)
- Excel/spreadsheet parsing
- Image OCR with OpenAI

**Key Tests:**
- Successful text extraction
- Error handling
- API integration with OpenAI
- Base64 encoding for images

### 2. ai-evidence-matcher.test.ts
Tests AI-powered evidence matching:
- Model selection based on document type
- Document matching to Ofsted framework
- Batch processing of multiple documents
- Fallback model retry logic
- JSON response parsing

**Key Tests:**
- OCR model selection for images
- Vision model selection for charts
- Primary model for text documents
- Error handling and fallback
- Progress tracking in batch operations

### 3. assessment-updater.test.ts
Tests assessment update logic:
- Converting evidence to assessments
- Generating category summaries
- Calculating readiness percentages
- Formatting for frontend display
- Markdown report generation

**Key Tests:**
- Evidence counting and deduplication
- AI rating calculation
- Rationale generation
- Category-level aggregation
- Report formatting

### 4. ofsted-framework.test.ts
Tests Ofsted framework utilities:
- AI rating calculation (exceptional to urgent improvement)
- Category readiness calculations
- Overall readiness scoring
- Framework data structure validation

**Key Tests:**
- Rating thresholds (100%, 80%, 60%, 40%)
- Score averaging across categories
- Edge cases at boundaries
- Data structure integrity

### 5. OfstedFrameworkView.test.tsx
Tests the main framework UI component:
- Component rendering
- Category expansion/collapse
- Assessment display
- Evidence count display
- User authentication integration

**Key Tests:**
- Basic rendering
- User interactions
- Props handling
- Accessibility
- Data structure handling

## Coverage

### Coverage Thresholds

The project aims for:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Viewing Coverage

```bash
npm run test:coverage
```

Then open `coverage/index.html` in your browser for an interactive coverage report.

### Excluded from Coverage

- `node_modules/`
- `src/test/` (test utilities)
- `**/*.d.ts` (type definitions)
- `**/*.config.*` (configuration files)
- Test files themselves

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

## Debugging Tests

### Visual Debugging

1. Use Vitest UI:
   ```bash
   npm run test:ui
   ```

2. Add `console.log` statements in tests

3. Use `screen.debug()` from React Testing Library:
   ```typescript
   import { screen } from '@testing-library/react';

   screen.debug(); // Prints DOM to console
   ```

### VSCode Integration

Install the Vitest VSCode extension for:
- Inline test results
- Run/debug individual tests
- Coverage highlighting

### Common Issues

**Tests timing out:**
```typescript
it('should complete', async () => {
  // ...
}, 10000); // Increase timeout to 10s
```

**Mock not working:**
- Ensure mocks are defined before imports
- Use `vi.clearAllMocks()` in `beforeEach`

**Async issues:**
- Use `waitFor` from Testing Library
- Return promises or use `async/await`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Vitest API Reference](https://vitest.dev/api/)

## Contributing

When adding new features:
1. Write tests alongside code
2. Aim for comprehensive coverage
3. Test edge cases and error scenarios
4. Update this documentation if adding new testing patterns

## Support

For questions or issues with testing:
1. Check this documentation
2. Review existing test files for examples
3. Consult Vitest/Testing Library documentation
4. Ask the team for guidance
