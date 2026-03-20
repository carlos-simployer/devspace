import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FocusNodeConfig {
  id: string; // e.g. "sidebar", "list", "commands"
  order: number; // tab order for focus cycling (lower = first)
  onFocus?: () => void; // called when this node gains focus
  onBlur?: () => void; // called when this node loses focus
}

export interface FocusContextValue {
  focusedId: string;
  setFocus: (id: string) => void;
  focusNext: () => void;
  focusPrev: () => void;
  trap: (id: string) => void; // trap focus (for dialogs)
  release: () => void; // release trap, restore previous focus
  isFocused: (id: string) => boolean;
}

export interface FocusProviderProps {
  initialFocus: string;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Internal registry context
// ---------------------------------------------------------------------------

interface FocusRegistryValue {
  register: (config: FocusNodeConfig) => void;
  unregister: (id: string) => void;
}

const FocusRegistryContext = createContext<FocusRegistryValue>({
  register: () => {},
  unregister: () => {},
});

// ---------------------------------------------------------------------------
// Focus context
// ---------------------------------------------------------------------------

const FocusContext = createContext<FocusContextValue>({
  focusedId: "",
  setFocus: () => {},
  focusNext: () => {},
  focusPrev: () => {},
  trap: () => {},
  release: () => {},
  isFocused: () => false,
});

// ---------------------------------------------------------------------------
// FocusProvider
// ---------------------------------------------------------------------------

export function FocusProvider({ initialFocus, children }: FocusProviderProps) {
  const [focusedId, setFocusedId] = useState(initialFocus);
  const [trappedId, setTrappedId] = useState<string | null>(null);

  const previousFocusId = useRef<string>(initialFocus);
  const nodes = useRef<Map<string, FocusNodeConfig>>(new Map());

  // Keep a ref for current focusedId so callbacks stay stable
  const focusedIdRef = useRef(focusedId);
  focusedIdRef.current = focusedId;

  const trappedIdRef = useRef(trappedId);
  trappedIdRef.current = trappedId;

  const setFocus = useCallback((id: string) => {
    if (trappedIdRef.current !== null && id !== trappedIdRef.current) {
      return; // focus is trapped — ignore requests to other nodes
    }
    const oldId = focusedIdRef.current;
    if (oldId === id) return;

    const oldNode = nodes.current.get(oldId);
    const newNode = nodes.current.get(id);

    setFocusedId(id);
    oldNode?.onBlur?.();
    newNode?.onFocus?.();
  }, []);

  const getSortedNodes = useCallback(() => {
    return Array.from(nodes.current.values()).sort((a, b) => a.order - b.order);
  }, []);

  const focusNext = useCallback(() => {
    if (trappedIdRef.current !== null) return;
    const sorted = getSortedNodes();
    if (sorted.length === 0) return;
    const idx = sorted.findIndex((n) => n.id === focusedIdRef.current);
    const nextIdx = idx < 0 ? 0 : (idx + 1) % sorted.length;
    setFocus(sorted[nextIdx]!.id);
  }, [getSortedNodes, setFocus]);

  const focusPrev = useCallback(() => {
    if (trappedIdRef.current !== null) return;
    const sorted = getSortedNodes();
    if (sorted.length === 0) return;
    const idx = sorted.findIndex((n) => n.id === focusedIdRef.current);
    const prevIdx =
      idx <= 0 ? sorted.length - 1 : (idx - 1 + sorted.length) % sorted.length;
    setFocus(sorted[prevIdx]!.id);
  }, [getSortedNodes, setFocus]);

  const trap = useCallback((id: string) => {
    previousFocusId.current = focusedIdRef.current;
    setTrappedId(id);
    // Bypass the trap check — directly set focus to the trapped node
    const oldId = focusedIdRef.current;
    if (oldId !== id) {
      const oldNode = nodes.current.get(oldId);
      const newNode = nodes.current.get(id);
      setFocusedId(id);
      oldNode?.onBlur?.();
      newNode?.onFocus?.();
    }
  }, []);

  const release = useCallback(() => {
    const restoreId = previousFocusId.current;
    setTrappedId(null);
    // Directly set focus bypassing trap check (trap is being cleared)
    const oldId = focusedIdRef.current;
    if (oldId !== restoreId) {
      const oldNode = nodes.current.get(oldId);
      const newNode = nodes.current.get(restoreId);
      setFocusedId(restoreId);
      oldNode?.onBlur?.();
      newNode?.onFocus?.();
    }
  }, []);

  const isFocused = useCallback(
    (id: string) => focusedIdRef.current === id,
    [],
  );

  // --- Registry ---

  const register = useCallback((config: FocusNodeConfig) => {
    nodes.current.set(config.id, config);
  }, []);

  const unregister = useCallback(
    (id: string) => {
      nodes.current.delete(id);
      // If the unmounted node was trapped, auto-release
      if (trappedIdRef.current === id) {
        release();
      }
    },
    [release],
  );

  const registryValue = useMemo(
    () => ({ register, unregister }),
    [register, unregister],
  );

  const contextValue = useMemo<FocusContextValue>(
    () => ({
      focusedId,
      setFocus,
      focusNext,
      focusPrev,
      trap,
      release,
      isFocused,
    }),
    [
      focusedId,
      trappedId,
      setFocus,
      focusNext,
      focusPrev,
      trap,
      release,
      isFocused,
    ],
  );

  return React.createElement(
    FocusRegistryContext.Provider,
    { value: registryValue },
    React.createElement(
      FocusContext.Provider,
      { value: contextValue },
      children,
    ),
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useFocus(): FocusContextValue {
  return useContext(FocusContext);
}

export function useFocusNode(config: FocusNodeConfig): {
  isFocused: boolean;
  focus: () => void;
} {
  const ctx = useContext(FocusContext);
  const registry = useContext(FocusRegistryContext);

  // Register synchronously during render so the nodes map is always
  // up-to-date (effects may not have fired yet when other hooks read it).
  registry.register({
    id: config.id,
    order: config.order,
    onFocus: config.onFocus,
    onBlur: config.onBlur,
  });

  // Unregister on unmount (and auto-release if trapped)
  useEffect(() => {
    return () => {
      registry.unregister(config.id);
    };
  }, [config.id, registry]);

  const focus = useCallback(() => {
    ctx.setFocus(config.id);
  }, [ctx.setFocus, config.id]);

  return {
    isFocused: ctx.focusedId === config.id,
    focus,
  };
}
