"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { resolveActiveSchoolId } from "@/components/school/activeSchool";

type DataMap = Record<string, any[]>;

export function useSchoolApi(endpoints: Record<string, string>) {
  const [data, setData] = useState<DataMap>({});
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const endpointsRef = useRef(endpoints);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const id = await resolveActiveSchoolId();
    setSchoolId(id);
    const schoolParam = id ? `?school=${id}` : "";
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
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, schoolId, loading, refresh: fetchAll };
}
