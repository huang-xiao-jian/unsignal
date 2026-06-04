import type { App, Plugin } from 'vue';
import { Observer } from './Observer';

export const SignalPlugin: Plugin = {
  install(app: App): void {
    app.component('Observer', Observer);
  },
};
