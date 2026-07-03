# unsignal

`unsignal` is a TypeScript-first reactive toolkit that brings proven reactive capabilities into one coherent signal model.

The project started as a signal extension, but its direction is now broader: keep a small explicit primitive runtime, then layer semantic reactive utilities inspired by systems such as MobX, Vue reactivity, Angular signals, and related reactive models. The goal is not to clone those libraries or wrap a single upstream runtime. The goal is to provide predictable primitives, explicit lifecycle semantics, and framework adapters that compose cleanly.

## Packages

| Package              | Responsibility                                                     |
| :------------------- | :----------------------------------------------------------------- |
| `@unsignal/baseline` | Built-in primitive signal runtime                                  |
| `@unsignal/core`     | Framework-agnostic reactive utilities built on baseline primitives |
| `@unsignal/react`    | React 19 binding for the unsignal reactive model                   |
| `@unsignal/vue`      | Vue 3 binding for the unsignal reactive model                      |

## Direction

- Keep primitive signal behavior small, explicit, and framework-agnostic
- Compose higher-level capabilities such as reactions, watchers, cleanup, async resources, batching, and actions on top of the baseline runtime
- Avoid duplicated APIs across packages by keeping each package responsible for a clear layer
- Make lifecycle and disposal behavior predictable across core utilities and framework bindings

## License

MIT
