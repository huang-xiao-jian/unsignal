import {
  computed,
  createModel,
  type Model,
  type ModelFactory,
  type ReadonlySignal,
  type Signal,
} from '@preact/signals-core';

type ReadonlyModelFields<TModel> = {
  [Key in keyof TModel]: TModel[Key] extends ReadonlySignal<unknown>
    ? TModel[Key]
    : TModel[Key] extends Signal<infer U>
      ? ReadonlySignal<U>
      : TModel[Key] extends (...args: any[]) => any
        ? TModel[Key]
        : TModel[Key] extends object
          ? ReadonlyModel<TModel[Key]>
          : TModel[Key];
};

export type ReadonlyModel<TModel> = Omit<Model<TModel>, keyof TModel> & ReadonlyModelFields<TModel>;

export type ReadonlyModelConstructor<TModel, TFactoryArgs extends any[] = []> = new (
  ...args: TFactoryArgs
) => ReadonlyModel<TModel>;

export function readonly<T>(source: Signal<T>): ReadonlySignal<T>;
export function readonly<T>(source: ReadonlySignal<T>): ReadonlySignal<T>;
export function readonly<T>(source: Signal<T> | ReadonlySignal<T>): ReadonlySignal<T> {
  return computed(() => source.value);
}

export function createReadonlyModel<TModel, TFactoryArgs extends any[] = []>(
  modelFactory: ModelFactory<TModel, TFactoryArgs>
): ReadonlyModelConstructor<TModel, TFactoryArgs> {
  return createModel(modelFactory) as ReadonlyModelConstructor<TModel, TFactoryArgs>;
}
