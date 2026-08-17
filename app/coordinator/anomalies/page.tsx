"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Activity, AlertTriangle, CheckCircle2, Clock, Filter } from "lucide-react";

interface Alert {
  id: number;
  patient_id: number;
  biometric_type: string;
  patient_value: number;
  cohort_mean: number;
  z_score: number;
  alert_tier: string;
  created_at: string;
  resolved: boolean;
}

const TIER_STYLES: Record<string, { badge: string; border: string; row: string }> = {
  RED: {
    badge: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    row: "bg-red-50/50 dark:bg-red-900/10",
  },
  AMBER: {
    badge: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    row: "bg-amber-50/50 dark:bg-amber-900/10",
  },
  GREEN: {
    badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    row: "",
  },
};

export default function AnomaliesPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("unresolved");
  const [tierFilter, setTierFilter] = useState<"ALL" | "RED" | "AMBER" | "GREEN">("ALL");

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) return;

    // Load from first available trial
    fetch("/api/trials", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((trials) => {
        const trialId = Array.isArray(trials) && trials[0]?.id;
        if (!trialId) { setLoading(false); return; }
        return fetch(`/api/coordinator/anomalies/${trialId}`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then((r) => r && r.ok ? r.json() : [])
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = (id: number) => {
    const token = localStorage.getItem("trialgo_token");
    fetch(`/api/monitoring/anomalies/${id}/resolve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => {
      if (r.ok) setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, resolved: true } : a));
    });
  };

  const filtered = alerts.filter((a) => {
    const statusMatch = filter === "all" || (filter === "unresolved" ? !a.resolved : a.resolved);
    const tierMatch = tierFilter === "ALL" || a.alert_tier === tierFilter;
    return statusMatch && tierMatch;
  });

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Anomaly Monitor
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {alerts.filter((a) => !a.resolved).length} active alerts requiring attention
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            {(["all", "unresolved", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tier filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(["ALL", "RED", "AMBER", "GREEN"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                tierFilter === t
                  ? t === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : t === "RED"
                    ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                    : t === "AMBER"
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                    : "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Scanning for physiological outliers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">All clear!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">No anomalies match your current filters.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((alert) => {
              const styles = TIER_STYLES[alert.alert_tier] || TIER_STYLES.GREEN;
              return (
                <div
                  key={alert.id}
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-md ${
                    alert.resolved ? "opacity-60 bg-slate-50 dark:bg-slate-900/50" : styles.row + " " + styles.border
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.badge}`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                            {alert.biometric_type.replace(/_/g, " ")}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${styles.badge}`}>
                            {alert.alert_tier} ALERT
                          </span>
                          {alert.resolved && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                              <CheckCircle2 className="h-3 w-3" /> Resolved
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                          Patient ID: <span className="text-slate-900 dark:text-white">#{alert.patient_id}</span> · 
                          Value: <span className="font-bold text-blue-600">{alert.patient_value?.toFixed(1)}</span> · 
                          Cohort Mean: {alert.cohort_mean?.toFixed(1)}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                          <span className="font-medium italic">Z-score: {alert.z_score?.toFixed(2)}σ</span>
                        </div>
                      </div>
                    </div>
                    {!alert.resolved && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-400"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
