"use client";

import { useEffect, useRef } from "react";
import { EndpointDetail } from "../lib/api";
import Link from "next/link";

type Props = {
  endpoint: EndpointDetail | null;
  onClose: () => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h4>
      <div className="text-xs leading-relaxed text-zinc-700">
        {children}
      </div>
    </div>
  );
}

export default function EndpointDetailModal({ endpoint, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (endpoint) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [endpoint]);

  if (!endpoint) return null;

  const isNR = endpoint.category_slug === "nr";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isNR
                  ? "bg-blue-100 text-blue-700"
                  : "bg-violet-100 text-violet-700"
              }`}>
                {endpoint.category}
              </span>
              <code className="font-mono text-xs font-medium text-zinc-600">
                {endpoint.name}
              </code>
            </div>
            <h2 className="text-sm font-semibold text-zinc-900 leading-snug">
              {endpoint.full_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            aria-label="Tutup"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 px-5 py-4">
          <Section title="Apa itu?">
            {endpoint.biological_role}
          </Section>

          <Section title="Dampak Kesehatan">
            {endpoint.health_impact}
          </Section>

          <Section title="Konteks Regulasi">
            {endpoint.regulatory_context}
          </Section>

          <Section title="Contoh Disruptor Terkenal">
            <ul className="list-inside list-disc space-y-0.5">
              {endpoint.example_disruptors.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Section>

          <Section title="Bagaimana Diukur (Tox21 Assay)">
            {endpoint.assay_description}
          </Section>

          {/* Footer link */}
          <div className="border-t border-zinc-100 pt-3">
            <Link
              href="/endpoints"
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-800 underline transition-colors"
            >
              Lihat semua 12 endpoint Tox21 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
