"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FhirIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("trialgo_token");
    if (!token) { router.replace("/login"); return; }
    fetch("/api/pharma/trials", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const first = Array.isArray(data) && data[0];
        router.replace(first ? `/pharma/fhir/${first.id}` : "/pharma/analytics");
      })
      .catch(() => router.replace("/pharma/analytics"));
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center text-slate-500 dark:text-slate-400">
      Loading FHIR export…
    </div>
  );
}
