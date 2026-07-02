import {
  action as createAction,
  computed as createComputed,
  signal,
  type ReadonlySignal,
  type Signal,
} from '@unsignal/baseline';

export function observable<TThis extends object, TValue>(
  value: ClassAccessorDecoratorTarget<TThis, TValue>,
  context: ClassAccessorDecoratorContext<TThis, TValue>
): ClassAccessorDecoratorResult<TThis, TValue> {
  const sources = new WeakMap<TThis, Signal<TValue>>();

  function getSource(instance: TThis): Signal<TValue> {
    let source = sources.get(instance);
    if (source === undefined) {
      source = signal(value.get.call(instance));
      sources.set(instance, source);
    }
    return source;
  }

  return {
    get(this: TThis) {
      return getSource(this).value;
    },
    set(this: TThis, nextValue: TValue) {
      getSource(this).value = nextValue;
    },
    init(this: TThis, initialValue: TValue) {
      sources.set(this, signal(initialValue));
      return initialValue;
    },
  };
}

export function computed<TThis extends object, TValue>(
  value: (this: TThis) => TValue,
  context: ClassGetterDecoratorContext<TThis, TValue>
): (this: TThis) => TValue {
  const sources = new WeakMap<TThis, ReadonlySignal<TValue>>();
  void context;

  return function computedGetter(this: TThis): TValue {
    let source = sources.get(this);
    if (source === undefined) {
      source = createComputed(() => value.call(this));
      sources.set(this, source);
    }
    return source.value;
  };
}

type ActionMethod<TThis, TArgs extends unknown[], TReturn> = (
  this: TThis,
  ...args: TArgs
) => TReturn;

type ActionDecorator = {
  <TThis, TArgs extends unknown[], TReturn>(
    value: ActionMethod<TThis, TArgs, TReturn>,
    context: ClassMethodDecoratorContext<TThis, ActionMethod<TThis, TArgs, TReturn>>
  ): ActionMethod<TThis, TArgs, TReturn>;
  bound<TThis extends object, TArgs extends unknown[], TReturn>(
    value: ActionMethod<TThis, TArgs, TReturn>,
    context: ClassMethodDecoratorContext<TThis, ActionMethod<TThis, TArgs, TReturn>>
  ): ActionMethod<TThis, TArgs, TReturn>;
};

function actionDecorator<TThis, TArgs extends unknown[], TReturn>(
  value: ActionMethod<TThis, TArgs, TReturn>,
  context: ClassMethodDecoratorContext<TThis, ActionMethod<TThis, TArgs, TReturn>>
): ActionMethod<TThis, TArgs, TReturn> {
  void context;
  return createAction(value) as ActionMethod<TThis, TArgs, TReturn>;
}

function boundActionDecorator<TThis extends object, TArgs extends unknown[], TReturn>(
  value: ActionMethod<TThis, TArgs, TReturn>,
  context: ClassMethodDecoratorContext<TThis, ActionMethod<TThis, TArgs, TReturn>>
): ActionMethod<TThis, TArgs, TReturn> {
  const wrapped = createAction(value) as ActionMethod<TThis, TArgs, TReturn>;

  if (context.private) {
    throw new TypeError('action.bound does not support private methods');
  }

  context.addInitializer(function actionBoundInitializer(this: TThis) {
    Object.defineProperty(this, context.name, {
      configurable: true,
      value: wrapped.bind(this),
      writable: true,
    });
  });

  return wrapped;
}

export const action = Object.assign(actionDecorator, {
  bound: boundActionDecorator,
}) as ActionDecorator;
