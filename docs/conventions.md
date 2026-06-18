# Code Conventions

## Object-Oriented Principles

- Follow `SOLID` principles
- Favor composition over inheritance
- Prefer `Class` over `Function` for organizing business logic

### Naming Conventions

- Classes: `PascalCase` (e.g. `UserRepository`)
- Class members: `Camel Case` (e.g. `findAvailableDiscount`)
- Private members: use `private` descriptor only, avoid special prefix (.e.g `#` or `_`)
- Constant variables: `SCREAMING_SNAKE_CASE` (`MAX_RETRY_COUNT`)
- Function name: `Camel Case` (e.g. `findDiscountRule`)
- Interface name: `PascalCase` without `I` prefix
- Enum name: `PascalCase`
- Enum key: `SCREAMING_SNAKE_CASE` (`MAX_RETRY_COUNT`)

String-style `Enum` declaration:

```ts
enum Colors {
  RED = 'red',
  GREEN = 'green',
}
```

### Organization Conventions

- Define contracts by declaring interfaces
- Prefer small, single-purpose classes with fewer than 5 public methods and fewer than 10 properties
- `Class` file naming uses `pascal case` (e.g. `UserRepository.ts`)
- `Function` file naming uses `Camel Case` (e.g. `findDiscountRule.ts`)

### Import Conventions

- Namespace imports are prohibited (e.g. `import React from 'react'` or `import type React from 'react'`)
- Named imports are required; import only the types or functions needed

```ts
// ✅ Correct
import type { ReactElement, ReactNode, ComponentType } from 'react';
import { createElement, createContext, useContext } from 'react';

// ❌ Incorrect
import React from 'react';
import type React from 'react';
```

### Code Formatting

- Code formatting conventions follow the [prettier](../.prettierrc) configuration
