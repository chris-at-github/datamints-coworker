import { useEffect, useEffectEvent, useState } from "react";

export type LoadState<T> = {
  // null while loading or after an error.
  data: T | null;
  error: string;
  reload: () => void;
};

type Result<T> = { key: string; data: T | null; error: string };

// Loads data whenever key changes; an outdated answer is dropped. Loading is
// derived from the key of the last result, so the effect sets state only in
// the callbacks. useEffectEvent reads the current load without restarting.
export function useLoad<T>(key: string, load: () => Promise<T>): LoadState<T> {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const requestKey = `${key}#${version}`;
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    let ignore = false;

    runLoad().then(
      (data) => !ignore && setResult({ key: requestKey, data, error: "" }),
      (error: unknown) =>
        !ignore &&
        setResult({ key: requestKey, data: null, error: error instanceof Error ? error.message : "Loading failed" }),
    );

    return () => {
      ignore = true;
    };
  }, [requestKey]);

  const current = result?.key === requestKey ? result : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? "",
    reload: () => setVersion((value) => value + 1),
  };
}
