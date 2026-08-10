"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { api } from "@/lib/api";
import { resolveActiveSchoolId } from "@/components/school/activeSchool";

type DataMap = Record<string, any[]>;

export function useSchoolApi(endpoints: Record<string, string>) {
  const locale = useLocale();
  const [data, setData] = useState<DataMap>({});
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const endpointsRef = useRef(endpoints);
  const firstLoadRef = useRef(true);

  const fetchAll = useCallback(async () => {
    if (!firstLoadRef.current) setRefreshing(true);
    const id = await resolveActiveSchoolId();
    setSchoolId(id);
    const params: string[] = [];
    if (id) params.push(`school=${id}`);
    params.push(`locale=${locale}`);
    const schoolParam = params.length ? `?${params.join("&")}` : "";
    const entries = Object.entries(endpointsRef.current);
    const results = await Promise.all(
      entries.map(([key, ep]) =>
        api
          .get(`${ep}${schoolParam}`)
          .then((r) => ({ key, list: Array.isArray(r.data) ? r.data : r.data.results || [] }))
          .catch(() => ({ key, list: [] })),
      ),
    );
    const next: DataMap = {};
    for (const r of results) next[r.key] = r.list;
    setData(next);
    firstLoadRef.current = false;
    setInitialLoading(false);
    setRefreshing(false);
  }, [locale]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, schoolId, initialLoading, refreshing, refresh: fetchAll };
}
