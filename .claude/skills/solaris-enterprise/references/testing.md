# Testing Standards

## Testing Pyramid

```
         ╱  E2E Tests  ╲         Few, slow, critical flows only
        ╱  (Playwright)  ╲
       ╱───────────────────╲
      ╱  Integration Tests  ╲    Moderate, API endpoints
     ╱   (API + Services)    ╲
    ╱─────────────────────────╲
   ╱       Unit Tests          ╲  Many, fast, focused
  ╱  (services, utils, hooks)  ╲
 ╱──────────────────────────────╲
```

## What to Test

```
100% COVERAGE (must test):
  Services (all business logic)
  Utilities (formatting, validation, calculations)
  API endpoints (happy path + error cases)
  Auth flows
  Payment/financial logic

80%+ COVERAGE (should test):
  React hooks
  Component behavior (user interactions)
  Database repositories

OPTIONAL:
  UI rendering (snapshots, sparingly)
  Visual regression
```

## Test File Location

```
Source:  src/services/user.service.ts
Test:    tests/unit/services/user.service.test.ts

Source:  src/app/api/v1/users/route.ts
Test:    tests/integration/api/users.test.ts

Flow:    User registration
Test:    tests/e2e/auth.spec.ts
```

## Test Naming

```typescript
describe("UserService", () => {
  describe("create", () => {
    it("should create a user with valid data", async () => {})
    it("should throw ConflictError when email exists", async () => {})
    it("should send welcome email after creation", async () => {})
    it("should default role to member when not specified", async () => {})
    it("should lowercase email before saving", async () => {})
  })
})

// Pattern: "should [expected behavior] when [condition]"
```

## Test Structure (AAA Pattern)

```typescript
it("should throw ConflictError when email already exists", async () => {
  // Arrange — set up test data
  const existingUser = { id: "usr_1", email: "test@example.com" }
  vi.spyOn(userRepository, "findByEmail").mockResolvedValue(existingUser)

  // Act & Assert — run the code and check the result
  await expect(
    userService.create({ email: "test@example.com", name: "Test", password: "12345678" })
  ).rejects.toThrow(ConflictError)
})
```

## Test Rules

1. Each test asserts ONE thing
2. Tests are independent (no test depends on another)
3. Tests are deterministic (no flaky tests)
4. Mocks are minimal — only mock external boundaries
5. Use factories for test data
6. Clean up after each test (proper teardown)
7. Never test implementation details — test behavior
8. Every test must have a clear description

## Test Anti-Patterns to Avoid

- Testing implementation details instead of behavior
- Excessive mocking (testing the mock, not the code)
- Brittle tests that break on refactoring
- Tests that pass but don't verify anything meaningful
- Shared mutable state between tests
- No assertions in test (empty expect)
- Test names that don't describe expected behavior
