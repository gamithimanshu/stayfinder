import { useEffect, useRef, useState } from "react";
import { API } from "../utils/api";

const DEFAULT_REFRESH_MS = 30000;

const getErrorMessage = (error, fallbackMessage) => (
  error?.response?.data?.message ||
  error?.message ||
  fallbackMessage
);

export function useDashboardData({
  endpoint,
  enabled,
  initialData,
  normalize,
  fallbackMessage,
  refreshMs = DEFAULT_REFRESH_MS,
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const normalizeRef = useRef(normalize);

  normalizeRef.current = normalize;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadData = async (isSilent = false) => {
      if (!cancelled) {
        if (isSilent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }

      try {
        const response = await API.get(endpoint);
        if (!cancelled) {
          const nextData = normalizeRef.current ? normalizeRef.current(response?.data) : response?.data;
          setData(nextData);
          setError("");
          setLastUpdatedAt(response?.data?.lastUpdatedAt || new Date().toISOString());
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError, fallbackMessage));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    }, refreshMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    };

    const handleFocus = () => {
      loadData(true);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    loadData();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, endpoint, fallbackMessage, refreshMs]);

  return {
    data,
    error,
    loading,
    refreshing,
    lastUpdatedAt,
  };
}
