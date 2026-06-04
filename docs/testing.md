# 自动化测试规范

## 技术栈

- Test Tool: `vitest`
  Test Docs: `https://vitest.dev/llms.txt`
  Context7 Library Id: `/vitest-dev/vitest`

## 测试规范

### 文件组织规范

- 测试用例文件使用 `*.test.ts` 命名
- 单元测试用例使用就近原则，与源文件放置于相同位置
- 单元测试 `Test fixtures`，使用就近原则，与源文件放置于相同位置

```shell
├── inference
│   └── __fixtures__
│   └── observer.ts
│   ├── observer.test.ts
```

### 测试代码规范

- `vitest` API 必须明确的导入，不依赖全局变量
- `vitest` 测试用例描述必须使用全英语

```ts
import { describe, expect, it, rstest } from 'vitest';

it('should return single point', () => {
  // Arrange, Act, Assert pattern
});
```

### 测试运行

`vitest` 支持测试用例范围过滤：

```bash
# 运行特定测试用例
pnpm vitest run -t "should return single point"

# 运行文件名包含 observer 的测试用例
pnpm vitest run "observer"

# 运行特定 package 的测试用例文件
pnpm vitest run --project @unsignal/react
```
