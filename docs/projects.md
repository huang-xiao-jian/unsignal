# 项目规范

## 功能拆分

功能拆分为多个子包，前缀统一为：`unsignal`，例如：`@unsignal/react`

```shell
└── packages
    ├── vue
    └── react
    └── core
```

## 包职责划分

| 包                | 职责                            |
| :---------------- | :------------------------------ |
| `@unsignal/vue`   | Signal binding for Vue3         |
| `@unsignal/react` | Signal binding for React19      |
| `@unsignal/core`  | Signal enhancement for original |
