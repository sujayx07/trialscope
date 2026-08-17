"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Globe2, Database, Clock, Search, AlertCircle, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

interface RegistryEntry {
  id: number;
  source: string;
  data: any;
  fetched_at: string;
}

export default function DiscoveryPage({ params }: { params: Promise<{ trialId: string }> }) {
  const [trialId, setTrialId] = useState("");
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    Promise.resolve(params).then((p) => setTrialId(p.trialId));
  }, [params]);

  useEffect(() => {
    if (!trialId) return;
    const token = localStorage.getItem("trialgo_token");
    if (!token) { setLoading(false); return; }
    fetch(`/api/pharma/discovery/${trialId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setError("Failed to load global discovery data"))
      .finally(() => setLoading(false));
  }, [trialId]);

  const toggle = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  /* Group entries by source registry */
  const grouped: Record<string, RegistryEntry[]> = {};
  entries
    .filter((e) => !searchTerm || JSON.stringify(e.data).toLowerCase().includes(searchTerm.toLowerCase()) || (e.source || "").toLowerCase().includes(searchTerm.toLowerCase()))
    .forEach((e) => {
      const key = e.source || "Unknown";
      (grouped[key] ||= []).push(e);
    });

  const sourceColors: Record<string, string> = {
    clinicaltrials: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    who: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    fhir: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    pubmed: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };

  const getColor = (source: string) => {
    const lower = source.toLowerCase();
    for (const [key, color] of Object.entries(sourceColors)) {
      if (lower.includes(key)) return color;
    }
    return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return d; }
  };

  const extractTrialInfo = (data: any) => {
    if (!data || typeof data !== "object") return null;
    return {
      title: data.title || data.study_title || data.official_title || data.brief_title || data.name || null,
      status: data.status || data.overall_status || data.recruitment_status || null,
      phase: data.phase || data.study_phase || null,
      condition: data.condition || data.disease || data.conditions || null,
      location: data.location || data.country || data.facility || null,
      url: data.url || data.source_url || data.link || null,
      nct_id: data.nct_id || data.nctId || data.trial_id || null,
    };
  };

  return (
    <PageTransition>
      <div>
        <div className="mb-6">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
            <Globe2 className="h-6 w-6 text-blue-600 dark:text-blue-400" /> Global Discovery
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Raw data from global medical registries for Trial #{trialId}
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search registries, conditions, locations…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Scanning global registries…
            </div>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
            <Globe2 className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            <p className="font-semibold text-slate-900 dark:text-white">No registry data found yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">AI agents are scanning medical registries worldwide for matching trials</p>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {entries.length} records from {Object.keys(grouped).length} registries
              </span>
              {Object.keys(grouped).map((src) => (
                <span key={src} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getColor(src)}`}>
                  <Database className="h-3 w-3" /> {src} ({grouped[src].length})
                </span>
              ))}
            </div>

            {/* Registry groups */}
            <div className="space-y-4">
              {Object.entries(grouped).map(([source, items]) => (
                <div key={source} className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-700">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getColor(source)}`}>
                      <Database className="h-3 w-3" /> {source}
                    </span>
                    <span className="text-xs text-slate-400">{items.length} records</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {items.map((entry) => {
                      const info = extractTrialInfo(entry.data);
                      return (
                        <div key={entry.id} className="px-5 py-3">
                          <button
                            onClick={() => toggle(entry.id)}
                            className="flex w-full items-start justify-between text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {info?.title || `Record #${entry.id}`}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                {info?.nct_id && (
                                  <span className="font-mono text-blue-600 dark:text-blue-400">{info.nct_id}</span>
                                )}
                                {info?.status && (
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    info.status.toLowerCase().includes("recruit") ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                    info.status.toLowerCase().includes("complet") ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" :
                                    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  }`}>
                                    {info.status}
                                  </span>
                                )}
                                {info?.phase && <span>Phase: {info.phase}</span>}
                                {info?.condition && (
                                  <span>🩺 {Array.isArray(info.condition) ? info.condition.join(", ") : info.condition}</span>
                                )}
                                {info?.location && (
                                  <span>📍 {Array.isArray(info.location) ? info.location.join(", ") : typeof info.location === "object" ? JSON.stringify(info.location) : info.location}</span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                <Clock className="h-3 w-3" /> {formatDate(entry.fetched_at)}
                                {info?.url && (
                                  <a href={info.url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>
                                    <ExternalLink className="h-3 w-3" /> View source
                                  </a>
                                )}
                              </div>
                            </div>
                            <span className="ml-3 mt-1 shrink-0 text-slate-400">
                              {expanded[entry.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </span>
                          </button>
                          {expanded[entry.id] && (
                            <div className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                              <pre className="max-h-80 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                {JSON.stringify(entry.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
