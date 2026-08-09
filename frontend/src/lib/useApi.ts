import useSWR, { useSWRConfig } from "swr";
import { api } from "./api";

function buildQuery(params?: Record<string, string | number | boolean>) {
  if (!params || Object.keys(params).length === 0) return "";
  return "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
}

function makeKey(url: string, params?: Record<string, string | number | boolean>) {
  return params ? [url, params] : url;
}

export function useApi<T = any>(url: string | null, params?: Record<string, string | number | boolean>) {
  const key = url ? makeKey(url, params) : null;
  const qs = buildQuery(params);
  const { data, error, isLoading, mutate } = useSWR<T>(
    key,
    () => api.get(url + qs).then((r) => r.data),
    { revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  return { data, error, loading: isLoading, mutate };
}

export function useApiList<T = any>(url: string | null, params?: Record<string, string | number | boolean>) {
  const { data, ...rest } = useApi<{ results?: T[] } | T[]>(url, params);
  const list = Array.isArray(data) ? data : data?.results ?? [];
  return { data: list, ...rest };
}

/**
 * Prefetch a list of API URLs in background — warms SWR cache
 * so navigation is instant. Safe to call on mount.
 */
export function usePrefetch(urls: (string | [string, Record<string, string | number | boolean>] | null)[]) {
  const { mutate } = useSWRConfig();
  const prefetch = () => {
    for (const entry of urls) {
      if (!entry) continue;
      const [url, params] = Array.isArray(entry) ? entry : [entry, undefined];
      const qs = buildQuery(params);
      const key = makeKey(url, params);
      // Fire-and-forget: warm SWR cache
      mutate(key, api.get(url + qs).then((r) => r.data).catch(() => {}), { revalidate: false });
    }
  };
  return prefetch;
}
