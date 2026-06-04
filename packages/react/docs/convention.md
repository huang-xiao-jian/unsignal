# React 代码规范

## 事件回调

回调函数命名使用 `on` 作为前缀

```tsx
function AntdRuleWorkspaceView() {
  // ✅ 推荐
  const onAddition = () => {};
  // ❌ 不推荐
  const handleAddition = () => {};

  return (
    <Button type="dashed" block onClick={onAddition}>
      添加规则组
    </Button>
  );
}
```
