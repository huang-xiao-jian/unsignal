export type StoreChangeCallback = () => void;

export interface SignalStore<Snapshot> {
  subscribe: (onStoreChange: StoreChangeCallback) => () => void;
  getSnapshot: () => Snapshot;
  getServerSnapshot: () => Snapshot;
}

export type DisposerFn = () => void;
