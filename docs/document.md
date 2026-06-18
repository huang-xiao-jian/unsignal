# Documentation Conventions

## Type Reference Declarations

- Cross-document references to `interface` declarations within `markdown block` are allowed, using `ES Module` import syntax

```ts
// Reference the FieldDataSource type declared in spec.md
import { FieldDataSource } from './spec.md';
```

## Mermaid Usage Conventions

- Use English exclusively by default; avoid Chinese content

### Class Diagram

- Use simplified class diagrams by default; do not declare `properties` + `methods`
- Class association relationships must use the standard relationship definitions; do not invent custom ones
