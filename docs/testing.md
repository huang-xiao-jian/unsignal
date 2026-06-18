# Automation Testing Conventions

## Tech Stack

- Test Tool: `vitest`
  Test Docs: `https://vitest.dev/llms.txt`
  Context7 Library Id: `/vitest-dev/vitest`

## Testing Conventions

### File Organization Conventions

- Test case files use `*.test.ts` naming
- Unit test cases follow the proximity principle, placed alongside the source file
- Unit test `Test fixtures` follow the proximity principle, placed alongside the source file

```shell
├── inference
│   └── __fixtures__
│   └── observer.ts
│   ├── observer.test.ts
```

### Test Code Conventions

- `vitest` APIs must be explicitly imported; do not rely on globals
- `vitest` test case descriptions must be written entirely in English

```ts
import { describe, expect, it, rstest } from 'vitest';

it('should return single point', () => {
  // Arrange, Act, Assert pattern
});
```

### Running Tests

`vitest` supports filtering test cases by scope:

```bash
# Run specific test cases
pnpm vitest run -t "should return single point"

# Run test cases with file names containing "observer"
pnpm vitest run "observer"

# Run test cases for a specific package
pnpm vitest run --project @unsignal/react
```
