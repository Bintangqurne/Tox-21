"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, EndpointDetail } from "../lib/api";

function EndpointCard({ ep, onClick }: { ep: EndpointDetail; onClick: () => void }) {
  const isNR = ep.category_slug === "nr";
  return (
    <div
      id={ep.name}
      className="rounded-lg border border-zinc-200 bg-white p-4 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          isNR
            ? "bg-blue-100 text-blue-700"
            : "bg-violet-100 text-violet-700"
        }`}>
          {isNR ? "NR" : "SR"}
        </span>
        <code className="text-xs font-mono font-semibold text-zinc-700">
          {ep.name}
        </code>
      </div>
      <h3 className="text-sm font-medium text-zinc-900 leading-snug">
        {ep.full_name}
      </h3>
      <p className="text-[11px] leading-relaxed text-zinc-500 line-clamp-3">
        {ep.biological_role}
      </p>
      <button
        onClick={onClick}
        className="mt-auto text-left text-xs text-zinc-500 hover:text-zinc-800 underline transition-colors"
      >
        Selengkapnya →
      </button>
    </div>
  );
}

function EndpointFullDetail({ ep }: { ep: EndpointDetail }) {
  const isNR = ep.category_slug === "nr";
  return (
    <div
      id={`detail-${ep.name}`}
      className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b border-zinc-200 ${
        isNR ? "bg-blue-50" : "bg-violet-50"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isNR
              ? "bg-blue-100 text-blue-700"
              : "bg-violet-100 text-violet-700"
          }`}>
            {ep.category}
          </span>
          <code className="text-sm font-mono font-bold text-zinc-800">
            {ep.name}
          </code>
        </div>
        <h2 className="text-base font-semibold text-zinc-900">
          {ep.full_name}
        </h2>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col gap-5">
        {[
          { title: "Apa itu?", content: ep.biological_role },
          { title: "Dampak Kesehatan", content: ep.health_impact },
          { title: "Konteks Regulasi", content: ep.regulatory_context },
          { title: "Bagaimana Diukur (Tox21 Assay)", content: ep.assay_description },
        ].map(({ title, content }) => (
          <div key={title}>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {title}
            </h4>
            <p className="text-sm leading-relaxed text-zinc-700">
              {content}
            </p>
          </div>
        ))}

        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Contoh Disruptor Terkenal
          </h4>
          <div className="flex flex-wrap gap-2">
            {ep.example_disruptors.map((d) => (
              <span
                key={d}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<EndpointDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.endpoints()
      .then(setEndpoints)
      .catch(() => setError("Gagal memuat data endpoint. Pastikan backend berjalan."))
      .finally(() => setLoading(false));
  }, []);

  function toggleDetail(name: string) {
    setExpandedId((prev) => (prev === name ? null : name));
    // Scroll to detail after state update
    setTimeout(() => {
      if (expandedId !== name) {
        document.getElementById(`detail-${name}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }

  const nrEndpoints = endpoints.filter((ep) => ep.category_slug === "nr");
  const srEndpoints = endpoints.filter((ep) => ep.category_slug === "sr");

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              ← Dashboard
            </Link>
            <span className="text-zinc-300">/</span>
            <h1 className="text-base font-semibold text-zinc-900">
              Endpoint Toksikologi Tox21
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Intro */}
        <div className="mb-8 max-w-3xl">
          <p className="text-sm leading-relaxed text-zinc-600">
            Program <strong className="text-zinc-900">Tox21</strong> (Toxicology in the 21st Century)
            adalah kolaborasi antara NIEHS, EPA, FDA, dan NIH yang menguji lebih dari 10.000 bahan kimia
            terhadap 12 endpoint biologis menggunakan uji sel berbasis robotik tinggi. Setiap endpoint
            mengukur respons jalur biologis spesifik yang relevan untuk toksisitas manusia.
            Dataset ini menjadi tolok ukur utama dalam pengembangan model <em>in silico</em> toksikologi.
          </p>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
              <span className="text-zinc-600">Nuclear Receptor (7 endpoint)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-400" />
              <span className="text-zinc-600">Stress Response (5 endpoint)</span>
            </span>
          </div>
        </div>

        {loading && (
          <p className="py-20 text-center text-sm text-zinc-400">Memuat data endpoint...</p>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-12">
            {/* Nuclear Receptors */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-base font-semibold text-zinc-900">
                  Nuclear Receptors
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {nrEndpoints.length} endpoint
                </span>
              </div>
              <p className="mb-5 text-xs leading-relaxed text-zinc-500 max-w-2xl">
                Reseptor nuklir adalah protein intrasel yang bertindak sebagai faktor transkripsi saat
                diaktifkan oleh ligan spesifik (hormon, vitamin, lipid). Gangguan pada jalur ini
                biasanya menyebabkan efek endokrin dan reproduktif.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {nrEndpoints.map((ep) => (
                  <EndpointCard key={ep.name} ep={ep} onClick={() => toggleDetail(ep.name)} />
                ))}
              </div>
              {/* Expanded details */}
              {nrEndpoints.filter((ep) => expandedId === ep.name).map((ep) => (
                <div key={ep.name} className="mt-4">
                  <EndpointFullDetail ep={ep} />
                </div>
              ))}
            </section>

            {/* Stress Response */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-base font-semibold text-zinc-900">
                  Stress Response Pathways
                </h2>
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                  {srEndpoints.length} endpoint
                </span>
              </div>
              <p className="mb-5 text-xs leading-relaxed text-zinc-500 max-w-2xl">
                Jalur respons stres mengukur kemampuan bahan kimia untuk menginduksi kerusakan
                seluler melalui stres oksidatif, kerusakan DNA, stres protein, atau gangguan
                mitokondria — semua mekanisme kunci dalam karsinogenesis dan toksisitas organ.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {srEndpoints.map((ep) => (
                  <EndpointCard key={ep.name} ep={ep} onClick={() => toggleDetail(ep.name)} />
                ))}
              </div>
              {/* Expanded details */}
              {srEndpoints.filter((ep) => expandedId === ep.name).map((ep) => (
                <div key={ep.name} className="mt-4">
                  <EndpointFullDetail ep={ep} />
                </div>
              ))}
            </section>

            {/* Footer reference */}
            <footer className="border-t border-zinc-200 pt-6 text-xs text-zinc-500">
              <p>
                <strong>Referensi:</strong> Huang R et al. (2016) Tox21Challenge to Build Predictive Models of Nuclear
                Receptor and Stress Response Pathways as Mediated by Exposure to Environmental Chemicals and Drugs.{" "}
                <em>Front. Environ. Sci.</em> — NTP Toxicology Reports — EPA EDSP21 Work Plan.
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
