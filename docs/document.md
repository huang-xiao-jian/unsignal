# 文档规范

## 类型引用声明

- 允许跨文档引用 `markdown block` 中声明的 `interface`，语法参考 `ES Module` 模块引用

```ts
// 引用 spec.md 文档中出现 FieldDataSource 类型
import { FieldDataSource } from './spec.md';
```

## Mermaid 使用规范

- 默认内部使用全英语，尽量避免使用中文内容

### Class Diagram

- 默认使用简易类图，不声明 `properties` + `methods`
- 类关联关系必须使用规范定义的关系，不得自行生造
