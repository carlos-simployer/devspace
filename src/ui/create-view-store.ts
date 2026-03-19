import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

/**
 * Setter that mirrors React's useState signature:
 * accepts either a direct value or an updater function.
 */
type StateSetter<T> = (v: T | ((prev: T) => T)) => void;

/**
 * For each key K in the defaults object, produce:
 *   K:       the value (same type)
 *   setK:    a useState-compatible setter
 * Plus a `reset()` that restores defaults.
 */
type ViewStoreState<D extends Record<string, unknown>> = D & {
  [K in keyof D as `set${Capitalize<string & K>}`]: StateSetter<D[K]>;
} & { reset: () => void };

/**
 * Creates a Zustand vanilla store with auto-generated setters for every field.
 *
 * Usage:
 *   const pipelinesStore = createViewStore({
 *     focus: "sidebar" as FocusArea,
 *     sidebarIndex: 0,
 *     listIndex: 0,
 *   });
 *
 * Produces a store with: focus, setFocus, sidebarIndex, setSidebarIndex, ...
 * Each setter accepts `value` or `(prev) => value`, matching useState.
 */
export function createViewStore<D extends Record<string, unknown>>(
  defaults: D,
) {
  const store = createStore<ViewStoreState<D>>()((set, get) => {
    const state = { ...defaults } as ViewStoreState<D>;

    for (const key of Object.keys(defaults)) {
      const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      (state as any)[setterName] = (v: unknown) => {
        const resolved = typeof v === "function" ? v((get() as any)[key]) : v;
        set({ [key]: resolved } as any);
      };
    }

    state.reset = () => set({ ...defaults } as any);

    return state;
  });

  return store;
}

/**
 * React hook to consume a view store (re-exports zustand's useStore).
 */
export { useStore };
