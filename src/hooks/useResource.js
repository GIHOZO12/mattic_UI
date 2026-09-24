import { useCallback, useEffect, useReducer, useRef, useState } from "react";

export function useResource(key, loader, enabled = true, refreshInterval = 0) {
  const fn = useRef(loader);
  useEffect(() => {
    fn.current = loader;
  });
  const [revision, reload] = useReducer((n) => n + 1, 0);
  const [state, setState] = useState({
    data: null,
    loading: enabled,
    error: null,
  });
  const stableKey = JSON.stringify(key);
  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setState((old) => ({ ...old, loading: true, error: null }));
    Promise.resolve()
      .then(() =>
        controller.signal.aborted ? undefined : fn.current(controller.signal),
      )
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [stableKey, revision, enabled]);
  useEffect(() => {
    if (!enabled || !refreshInterval) return;
    let controller;
    const refresh = async () => {
      if (document.hidden || controller) return;
      controller = new AbortController();
      const request = controller;
      try {
        const data = await fn.current(request.signal);
        if (!request.signal.aborted)
          setState({ data, loading: false, error: null });
      } catch {
        // Keep the last successful page during a temporary connection failure.
      } finally {
        if (controller === request) controller = null;
      }
    };
    const interval = setInterval(refresh, refreshInterval);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(interval);
      controller?.abort();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [stableKey, enabled, refreshInterval]);
  const updateData = useCallback((updater) => {
    setState((previous) => ({ ...previous, data: updater(previous.data) }));
  }, []);
  return { ...state, reload, updateData };
}

export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const active = useRef(false);
  const run = useCallback(async (action) => {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err);
      return undefined;
    } finally {
      active.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, error, run, setError };
}
