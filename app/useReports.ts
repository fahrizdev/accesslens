import { useCallback, useEffect, useRef, useState } from "react";
import { deleteReport, loadReports, saveReport } from "./reportStorage";
import { sortReports, type BarrierReport } from "./reports";

export default function useReports() {
  const [reports, setReports] = useState<BarrierReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [failures, setFailures] = useState<Record<string, string>>({});
  const [unsaved, setUnsaved] = useState<Set<string>>(() => new Set());
  const versions = useRef(new Map<string, number>());
  const deleted = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    void loadReports()
      .then((saved) => {
        if (!active) return;
        setReports((current) => {
          const combined = new Map(saved.map((report) => [report.id, report]));
          current.forEach((report) => combined.set(report.id, report));
          deleted.current.forEach((id) => combined.delete(id));
          return sortReports([...combined.values()]);
        });
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load saved reports.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const clearSaveState = useCallback((id: string) => {
    setUnsaved((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
    setFailures((items) => {
      const next = { ...items };
      delete next[id];
      return next;
    });
  }, []);

  const persist = useCallback(
    async (report: BarrierReport): Promise<boolean> => {
      const version = (versions.current.get(report.id) || 0) + 1;
      versions.current.set(report.id, version);
      // Keep a usable copy for this visit even when browser storage fails.
      setReports((items) =>
        sortReports([report, ...items.filter((item) => item.id !== report.id)]),
      );
      setUnsaved((ids) => new Set(ids).add(report.id));
      try {
        await saveReport(report);
        if (versions.current.get(report.id) === version)
          clearSaveState(report.id);
        return true;
      } catch (error) {
        if (versions.current.get(report.id) === version) {
          setFailures((items) => ({
            ...items,
            [report.id]:
              error instanceof Error
                ? error.message
                : "Could not save on this device. Download your report before closing this tab.",
          }));
        }
        return false;
      }
    },
    [clearSaveState],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteReport(id);
      deleted.current.add(id);
      versions.current.set(id, (versions.current.get(id) || 0) + 1);
      setReports((items) => items.filter((report) => report.id !== id));
      clearSaveState(id);
    },
    [clearSaveState],
  );

  return {
    reports,
    loading,
    persist,
    remove,
    hasUnsaved: unsaved.size > 0,
    storageWarning: Object.values(failures)[0] || loadError,
  };
}
