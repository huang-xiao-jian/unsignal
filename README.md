# unsignal

`unsignal` is a TypeScript-first reactive toolkit that brings proven reactive capabilities into one coherent signal model, inspired by reactive systems such as `MobX`, `Vue`, `Angular signals`.

## Packages

| Package              | Responsibility                                           |
| :------------------- | :------------------------------------------------------- |
| `@unsignal/baseline` | Built-in primitive signal runtime                        |
| `@unsignal/core`     | Extended reactive utilities built on baseline primitives |
| `@unsignal/rxjs`     | RxJS interoperability for the unsignal reactive model    |
| `@unsignal/react`    | React 19 binding for the unsignal reactive model         |
| `@unsignal/vue`      | Vue 3 binding for the unsignal reactive model            |

## Direction

- Keep primitive signal behavior small, explicit, and framework-agnostic
- Compose higher-level capabilities such as reactions, watchers, cleanup, async resources, batching, and actions on top of the baseline runtime
- Avoid duplicated APIs across packages by keeping each package responsible for a clear layer
- Make lifecycle and disposal behavior predictable across core utilities and framework bindings

## License

MIT
