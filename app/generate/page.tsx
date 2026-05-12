"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamically import PDF viewer to avoid SSR issues
const PDFPreview = dynamic(() => import("../components/PDFPreview"), { ssr: false });

interface FormData {
  service: string;
  clientType: string;
  amount: string;
  tone: string;
  details: string;
  docType: "invoice" | "quote";
  yourName: string;
  yourCompany: string;
  yourEmail: string;
  yourPhone: string;
  clientName: string;
  clientCompany: string;
  invoiceNumber: string;
  dueDate: string;
  logoUrl: string;
  accentColor: string;
  footerNote: string;
}

const EMPTY_FORM: FormData = {
  service: "", clientType: "", amount: "", tone: "formal",
  details: "", docType: "invoice",
  yourName: "", yourCompany: "", yourEmail: "", yourPhone: "",
  clientName: "", clientCompany: "",
  invoiceNumber: "", dueDate: "",
  logoUrl: "", accentColor: "#8b5cf6", footerNote: "",
};

const TABS = [
  { id: "job", label: "Job" },
  { id: "you", label: "You" },
  { id: "client", label: "Client" },
  { id: "style", label: "Style" },
] as const;

type Tab = typeof TABS[number]["id"];

const ACCENT_PRESETS = [
  "#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4",
];

export default function GeneratePage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [tab, setTab] = useState<Tab>("job");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [smartFillUrl, setSmartFillUrl] = useState("");
  const [smartFillLoading, setSmartFillLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const set = useCallback((key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerate = async () => {
    if (!form.service || !form.amount) {
      setError("Service and amount are required.");
      return;
    }
    setError("");
    setLoading(true);
    setGeneratedText("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setGeneratedText(data.result || "");
    } catch {
      setError("Generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSmartFill = async () => {
    if (!smartFillUrl.trim()) return;
    setSmartFillLoading(true);
    try {
      const res = await fetch("/api/smart-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [smartFillUrl] }),
      });
      if (!res.ok) throw new Error("Smart fill failed");
      const data = await res.json();
      if (data.fields) {
        setForm(prev => ({ ...prev, ...data.fields }));
      }
    } catch {
      setError("Smart fill failed.");
    } finally {
      setSmartFillLoading(false);
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { setError("Voice not supported in this browser."); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setForm(prev => ({ ...prev, details: prev.details ? prev.details + " " + transcript : transcript }));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const handleDownload = async () => {
    if (!generatedText) return;
    const [{ pdf }, { default: InvoicePDF }, React] = await Promise.all([
      import("@react-pdf/renderer"),
      import("../components/InvoicePDF"),
      import("react"),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderer = pdf as any;
    const instance = renderer(
      React.createElement(InvoicePDF, {
        docType: form.docType,
        invoiceNumber: form.invoiceNumber,
        dueDate: form.dueDate,
        yourName: form.yourName,
        yourCompany: form.yourCompany,
        yourEmail: form.yourEmail,
        yourPhone: form.yourPhone,
        clientName: form.clientName,
        clientCompany: form.clientCompany,
        service: form.service,
        amount: form.amount,
        generatedText,
        issueDate: new Date().toLocaleDateString(),
        logoUrl: form.logoUrl,
        accentColor: form.accentColor,
        footerNote: form.footerNote,
      })
    );
    const blob: Blob = await instance.toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.docType}-${form.invoiceNumber || Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const issueDate = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← DealFlow</Link>
          <span className="text-slate-700">|</span>
          <h1 className="font-black text-white">InvoiceMint</h1>
          <span className="text-slate-600 text-xs">Quick PDF generator</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Doc type toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {(["invoice", "quote"] as const).map(t => (
              <button
                key={t}
                onClick={() => set("docType", t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                  form.docType === t ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !form.service || !form.amount}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating…
              </>
            ) : "Generate ✦"}
          </button>
          {generatedText && (
            <button
              onClick={handleDownload}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              ↓ PDF
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-red-900/30 border-b border-red-800 px-6 py-2 text-red-300 text-sm">{error}</div>
      )}

      {/* Main 2-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — form */}
        <div className="w-[420px] flex-shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
          {/* Smart fill bar */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex gap-2">
            <input
              type="url"
              placeholder="Paste your website URL for Smart Fill…"
              value={smartFillUrl}
              onChange={e => setSmartFillUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSmartFill()}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button
              onClick={handleSmartFill}
              disabled={smartFillLoading || !smartFillUrl.trim()}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              {smartFillLoading ? "…" : "AI Fill"}
            </button>
          </div>

          {/* Section tabs */}
          <div className="flex border-b border-slate-800">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? "text-white border-b-2 border-violet-500 -mb-px"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tab === "job" && (
              <>
                <Field label="Service / Job" required>
                  <input
                    value={form.service}
                    onChange={e => set("service", e.target.value)}
                    placeholder="e.g. Website redesign"
                    className={inputCls}
                  />
                </Field>
                <Field label="Amount" required>
                  <input
                    value={form.amount}
                    onChange={e => set("amount", e.target.value)}
                    placeholder="e.g. $2,500 or £1,200"
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Client type">
                    <input
                      value={form.clientType}
                      onChange={e => set("clientType", e.target.value)}
                      placeholder="e.g. Startup"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Tone">
                    <select value={form.tone} onChange={e => set("tone", e.target.value)} className={inputCls}>
                      <option value="formal">Formal</option>
                      <option value="friendly">Friendly</option>
                      <option value="concise">Concise</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Invoice #">
                    <input
                      value={form.invoiceNumber}
                      onChange={e => set("invoiceNumber", e.target.value)}
                      placeholder="INV-001"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Due date">
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => set("dueDate", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="Extra details">
                  <div className="relative">
                    <textarea
                      value={form.details}
                      onChange={e => set("details", e.target.value)}
                      placeholder="Any extra context for the AI…"
                      rows={3}
                      className={`${inputCls} resize-none pr-10`}
                    />
                    <button
                      onClick={toggleVoice}
                      title={listening ? "Stop listening" : "Voice input"}
                      className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${
                        listening ? "bg-red-600 text-white" : "text-slate-500 hover:text-white hover:bg-slate-700"
                      }`}
                    >
                      {listening ? "■" : "🎤"}
                    </button>
                  </div>
                </Field>
              </>
            )}

            {tab === "you" && (
              <>
                <Field label="Your name">
                  <input value={form.yourName} onChange={e => set("yourName", e.target.value)} placeholder="Jane Smith" className={inputCls} />
                </Field>
                <Field label="Company">
                  <input value={form.yourCompany} onChange={e => set("yourCompany", e.target.value)} placeholder="Acme Studio" className={inputCls} />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.yourEmail} onChange={e => set("yourEmail", e.target.value)} placeholder="jane@acme.com" className={inputCls} />
                </Field>
                <Field label="Phone">
                  <input value={form.yourPhone} onChange={e => set("yourPhone", e.target.value)} placeholder="+1 555 000 0000" className={inputCls} />
                </Field>
                <Field label="Footer note">
                  <input value={form.footerNote} onChange={e => set("footerNote", e.target.value)} placeholder="Thank you for your business!" className={inputCls} />
                </Field>
              </>
            )}

            {tab === "client" && (
              <>
                <Field label="Client name">
                  <input value={form.clientName} onChange={e => set("clientName", e.target.value)} placeholder="John Doe" className={inputCls} />
                </Field>
                <Field label="Client company">
                  <input value={form.clientCompany} onChange={e => set("clientCompany", e.target.value)} placeholder="Client Corp" className={inputCls} />
                </Field>
              </>
            )}

            {tab === "style" && (
              <>
                <Field label="Accent colour">
                  <div className="flex gap-2 flex-wrap">
                    {ACCENT_PRESETS.map(c => (
                      <button
                        key={c}
                        onClick={() => set("accentColor", c)}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                          form.accentColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : ""
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={e => set("accentColor", e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
                      title="Custom colour"
                    />
                  </div>
                </Field>
                <Field label="Logo URL">
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={e => set("logoUrl", e.target.value)}
                    placeholder="https://yoursite.com/logo.png"
                    className={inputCls}
                  />
                </Field>
                {form.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="Logo preview" className="h-10 object-contain rounded" />
                )}
              </>
            )}
          </div>
        </div>

        {/* Right panel — preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/30">
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Preview</span>
            {!generatedText && (
              <span className="text-slate-600 text-xs">Fill form → Generate to see preview</span>
            )}
            {generatedText && (
              <span className="text-green-400 text-xs font-semibold">✓ Ready to download</span>
            )}
          </div>

          {generatedText ? (
            <div className="flex-1 overflow-hidden">
              <PDFPreview
                docType={form.docType}
                invoiceNumber={form.invoiceNumber}
                dueDate={form.dueDate}
                yourName={form.yourName}
                yourCompany={form.yourCompany}
                yourEmail={form.yourEmail}
                yourPhone={form.yourPhone}
                clientName={form.clientName}
                clientCompany={form.clientCompany}
                service={form.service}
                amount={form.amount}
                generatedText={generatedText}
                issueDate={issueDate}
                logoUrl={form.logoUrl}
                accentColor={form.accentColor}
                footerNote={form.footerNote}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-xs">
                {/* Mock invoice skeleton */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6 text-left opacity-40">
                  <div className="flex justify-between mb-4">
                    <div className="w-16 h-6 bg-slate-700 rounded" />
                    <div>
                      <div className="w-20 h-5 bg-slate-700 rounded mb-1" />
                      <div className="w-14 h-3 bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-0.5 bg-violet-800 mb-4" />
                  <div className="flex gap-8 mb-4">
                    <div className="space-y-1.5">
                      <div className="w-8 h-2 bg-slate-700 rounded" />
                      <div className="w-24 h-4 bg-slate-600 rounded" />
                      <div className="w-20 h-3 bg-slate-700 rounded" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-10 h-2 bg-slate-700 rounded" />
                      <div className="w-20 h-4 bg-slate-600 rounded" />
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 flex justify-between mb-3">
                    <div className="space-y-1">
                      <div className="w-12 h-2 bg-slate-700 rounded" />
                      <div className="w-28 h-3 bg-slate-600 rounded" />
                    </div>
                    <div className="w-16 h-5 bg-violet-900 rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-2 bg-slate-800 rounded" />
                    <div className="w-4/5 h-2 bg-slate-800 rounded" />
                    <div className="w-3/5 h-2 bg-slate-800 rounded" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm">Fill in job details and hit <span className="text-violet-400 font-semibold">Generate</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
