"use client";

import { useState, useRef, useEffect } from "react";
import AdBanner from "./components/AdBanner";

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
  // Branding
  logoUrl: string;
  accentColor: string;
  footerNote: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  service: string;
  amount: string;
  docType: "invoice" | "quote";
  clientName: string;
  form: FormData;
  result: string;
}

const EMPTY_FORM: FormData = {
  service: "", clientType: "", amount: "", tone: "formal",
  details: "", docType: "invoice",
  yourName: "", yourCompany: "", yourEmail: "", yourPhone: "",
  clientName: "", clientCompany: "",
  invoiceNumber: "", dueDate: "",
  logoUrl: "", accentColor: "#10b981", footerNote: "",
};

const HISTORY_KEY = "invoicemint_history";
const MAX_HISTORY = 5;

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

function saveToHistory(entry: HistoryEntry) {
  try {
    const existing = loadHistory();
    const updated = [entry, ...existing.filter(e => e.id !== entry.id)].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

type VoiceField = "service" | "details";

export default function Home() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [voiceField, setVoiceField] = useState<VoiceField | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setVoiceSupported(
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
    setHistory(loadHistory());
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setResult("");
    setError("");
    setPdfDownloaded(false);
    setShowOptional(false);
  };

  const createInvoiceOrQuote = async () => {
    setLoading(true);
    setError("");
    setResult("");
    setPdfDownloaded(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setResult(data.result);
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        service: form.service,
        amount: form.amount,
        docType: form.docType,
        clientName: form.clientName || form.clientCompany || "",
        form,
        result: data.result,
      };
      saveToHistory(entry);
      setHistory(loadHistory());
      // Reset job-specific fields; keep company/contact details for next invoice
      setForm(p => ({ ...p, service: "", amount: "", invoiceNumber: "", dueDate: "", notes: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInvoiceOrQuote();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startVoice = (field: VoiceField) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (voiceField === field) { recognitionRef.current?.stop(); return; }
    recognitionRef.current?.stop();
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onstart = () => setVoiceField(field);
    r.onend = () => setVoiceField(null);
    r.onerror = () => setVoiceField(null);
    r.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript;
      setForm((prev) => ({
        ...prev,
        [field]: prev[field] ? `${prev[field]} ${transcript}` : transcript,
      }));
    };
    r.start();
    recognitionRef.current = r;
  };

  const handleDownloadPDF = async () => {
    if (!result || pdfLoading) return;
    setPdfLoading(true);
    try {
      const [{ pdf }, { default: InvoicePDF }, React] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./components/InvoicePDF"),
        import("react"),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await (pdf as any)(
        React.createElement(InvoicePDF, {
          docType: form.docType,
          invoiceNumber: form.invoiceNumber,
          dueDate: form.dueDate
            ? new Date(form.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : "",
          yourName: form.yourName,
          yourCompany: form.yourCompany,
          yourEmail: form.yourEmail,
          yourPhone: form.yourPhone,
          clientName: form.clientName,
          clientCompany: form.clientCompany,
          service: form.service,
          amount: form.amount,
          generatedText: result,
          issueDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          logoUrl: form.logoUrl,
          accentColor: form.accentColor || "#10b981",
          footerNote: form.footerNote,
        })
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoicemint-${form.docType}-${form.invoiceNumber || Date.now()}.pdf`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
      setPdfDownloaded(true);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const isQuote = form.docType === "quote";

  const inputClass =
    "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";

  const MicButton = ({ field, inTextarea }: { field: VoiceField; inTextarea?: boolean }) =>
    voiceSupported ? (
      <button
        type="button"
        onClick={() => startVoice(field)}
        title={voiceField === field ? "Stop listening" : "Click to speak"}
        className={`absolute right-2 ${inTextarea ? "top-2" : "top-1/2 -translate-y-1/2"} p-1.5 rounded-lg transition-all duration-200 ${
          voiceField === field ? "bg-red-50 text-red-500" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
        }`}
      >
        {voiceField === field ? (
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping absolute" />
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </span>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    ) : null;

  const parseResult = (text: string) => {
    const clean = text.replace(/\*\*/g, "");
    const s1 = clean.match(/1\.\s*(?:Invoice |Quote )?Line Item Description[^\n]*\n?([\s\S]*?)(?=\n2\.|$)/i);
    const s2 = clean.match(/2\.\s*Payment Terms[^\n]*\n?([\s\S]*?)(?=\n3\.|$)/i);
    const s3 = clean.match(/3\.\s*(?:Thank You Note|Next Steps)[^\n]*\n?([\s\S]*?)$/i);
    return {
      lineItem: s1?.[1]?.trim() ?? clean,
      paymentTerms: s2?.[1]?.trim() ?? "",
      closing: s3?.[1]?.trim() ?? "",
      closingLabel: /next steps/i.test(text) ? "Next Steps" : "Thank You",
    };
  };

  const sections = result ? parseResult(result) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-extrabold text-slate-800 text-sm tracking-tight">
              Invoice<span className="text-emerald-500">Mint</span>
            </span>
            <span className="hidden sm:block text-slate-300 mx-1">·</span>
            <span className="hidden sm:block text-xs text-slate-500">AI Invoice &amp; Quote Generator</span>
          </div>
          <div className="flex items-center gap-2">
            {voiceSupported && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Voice on
              </span>
            )}
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-1 text-xs text-slate-600 font-medium bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent
              </button>
            )}
            {result && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-white font-semibold bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-full transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
            )}
            <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full border border-emerald-200">
              Free forever
            </span>
          </div>
        </div>
      </header>

      {/* ── Tool area ── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-4">

        {/* Compact intro strip */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 leading-tight">
              Speak. Generate. Download.
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              AI writes your invoice — you download the PDF. No signup.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { icon: "🎤", label: "Voice input" },
              { icon: "🤖", label: "AI generated" },
              { icon: "📄", label: "PDF export" },
            ].map((b) => (
              <span
                key={b.label}
                className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2.5 py-1 text-xs text-slate-600 font-medium shadow-sm"
              >
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Two-column: form | preview */}
        <div className="grid md:grid-cols-2 gap-4 items-start">

          {/* ── Left: Form ── */}
          <div className="space-y-3">

            {/* Doc type toggle */}
            <div className="bg-white border border-slate-100 rounded-xl p-1 shadow-sm flex gap-1">
              {(["invoice", "quote"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, docType: type }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    form.docType === type
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {type === "invoice" ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  )}
                  {type === "invoice" ? "Invoice" : "Quote / Estimate"}
                </button>
              ))}
            </div>

            {/* Form card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Service */}
                <div>
                  <label className={labelClass}>Service / Work Done <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input
                      type="text" name="service" value={form.service} onChange={handleChange}
                      placeholder="e.g. Website design, Logo creation, Tax consulting"
                      required
                      className={`${inputClass} ${voiceSupported ? "pr-8" : ""}`}
                    />
                    <MicButton field="service" />
                  </div>
                </div>

                {/* Client Type + Amount + Tone — 3 columns */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelClass}>Client Type <span className="text-red-400">*</span></label>
                    <select name="clientType" value={form.clientType} onChange={handleChange} required className={inputClass}>
                      <option value="">Select…</option>
                      <option value="individual">Individual</option>
                      <option value="small business">Small Business</option>
                      <option value="startup">Startup</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="nonprofit">Non-profit</option>
                      <option value="government">Government</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Amount <span className="text-red-400">*</span></label>
                    <input
                      type="text" name="amount" value={form.amount} onChange={handleChange}
                      placeholder="$1,500" required className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tone <span className="text-red-400">*</span></label>
                    <select name="tone" value={form.tone} onChange={handleChange} className={inputClass}>
                      <option value="formal">Formal</option>
                      <option value="friendly">Friendly</option>
                      <option value="concise">Concise</option>
                    </select>
                  </div>
                </div>

                {/* Invoice # + Due Date — 2 columns */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>
                      {isQuote ? "Quote #" : "Invoice #"}{" "}
                      <span className="text-slate-400 normal-case font-normal">(opt.)</span>
                    </label>
                    <input
                      type="text" name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange}
                      placeholder="INV-001" className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {isQuote ? "Valid Until" : "Due Date"}{" "}
                      <span className="text-slate-400 normal-case font-normal">(opt.)</span>
                    </label>
                    <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className={inputClass} />
                  </div>
                </div>

                {/* Optional expand */}
                <button
                  type="button"
                  onClick={() => setShowOptional((v) => !v)}
                  className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-lg text-xs text-slate-600 font-medium transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Company &amp; Contact Details
                    <span className="text-slate-400 font-normal">— appears in PDF</span>
                  </span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showOptional ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showOptional && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Your Info</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" name="yourName" value={form.yourName} onChange={handleChange} placeholder="Your name" className={inputClass} />
                        <input type="text" name="yourCompany" value={form.yourCompany} onChange={handleChange} placeholder="Your company" className={inputClass} />
                        <input type="email" name="yourEmail" value={form.yourEmail} onChange={handleChange} placeholder="Email" className={inputClass} />
                        <input type="tel" name="yourPhone" value={form.yourPhone} onChange={handleChange} placeholder="Phone" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Client Info</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" name="clientName" value={form.clientName} onChange={handleChange} placeholder="Client name" className={inputClass} />
                        <input type="text" name="clientCompany" value={form.clientCompany} onChange={handleChange} placeholder="Client company" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Branding</p>
                      <div className="space-y-2">
                        <input
                          type="url" name="logoUrl" value={form.logoUrl} onChange={handleChange}
                          placeholder="Logo URL (e.g. https://yoursite.com/logo.png)"
                          className={inputClass}
                        />
                        <div className="flex gap-2 items-center">
                          <div className="flex items-center gap-2 flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2">
                            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Accent colour</label>
                            <input
                              type="color" name="accentColor" value={form.accentColor} onChange={handleChange}
                              className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <span className="text-xs font-mono text-slate-400">{form.accentColor}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, accentColor: "#10b981" }))}
                            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 border border-slate-200 rounded-lg bg-white"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          type="text" name="footerNote" value={form.footerNote} onChange={handleChange}
                          placeholder="Footer note (e.g. ABN 12 345 · Bank: BSB 123-456 · Acc: 12345678)"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={labelClass}>
                    Notes <span className="text-slate-400 normal-case font-normal">(opt.)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      name="details" value={form.details} onChange={handleChange}
                      rows={2}
                      placeholder="e.g. 3 revisions, net-30, delivered in 5 days…"
                      className={`${inputClass} resize-none ${voiceSupported ? "pr-8" : ""}`}
                    />
                    <MicButton field="details" inTextarea />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md shadow-emerald-100 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating {isQuote ? "quote" : "invoice"}…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate {isQuote ? "Quote" : "Invoice"}
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Data used only for generation — never stored.
                </p>
              </form>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-xs">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* ── Right: Result / Placeholder ── */}
          <div className="sticky top-16">
            {result && sections ? (
              /* Document Preview */
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Doc header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-white text-xl font-black uppercase tracking-wider">
                        {isQuote ? "Quote" : "Invoice"}
                      </h2>
                      {form.invoiceNumber && <p className="text-emerald-200 text-xs mt-0.5">#{form.invoiceNumber}</p>}
                    </div>
                    <div className="text-right text-xs text-emerald-100 space-y-0.5">
                      <p>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                      {form.dueDate && (
                        <p className="text-emerald-200">
                          {isQuote ? "Valid until" : "Due"}:{" "}
                          {new Date(form.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* From / To */}
                {(form.yourName || form.yourCompany || form.yourEmail || form.yourPhone || form.clientName || form.clientCompany) && (
                  <div className="grid grid-cols-2 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
                    {(form.yourName || form.yourCompany || form.yourEmail || form.yourPhone) && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">From</p>
                        {form.yourName && <p className="text-xs font-semibold text-slate-800">{form.yourName}</p>}
                        {form.yourCompany && <p className="text-xs text-slate-500">{form.yourCompany}</p>}
                        {form.yourEmail && <p className="text-xs text-slate-500">{form.yourEmail}</p>}
                        {form.yourPhone && <p className="text-xs text-slate-500">{form.yourPhone}</p>}
                      </div>
                    )}
                    {(form.clientName || form.clientCompany) && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bill To</p>
                        {form.clientName && <p className="text-xs font-semibold text-slate-800">{form.clientName}</p>}
                        {form.clientCompany && <p className="text-xs text-slate-500">{form.clientCompany}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Amount */}
                <div className="mx-5 mt-4 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-0.5">Service</p>
                    <p className="text-xs font-semibold text-slate-800">{form.service}</p>
                  </div>
                  <p className="text-lg font-black text-emerald-600">{form.amount}</p>
                </div>

                {/* AI Sections */}
                <div className="px-5 pb-1 space-y-1">
                  {sections.lineItem && (
                    <div className="pt-3">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                        {isQuote ? "Quote Description" : "Service Description"}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">{sections.lineItem}</p>
                    </div>
                  )}
                  {sections.paymentTerms && (
                    <>
                      <div className="h-px bg-slate-100 my-2" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Payment Terms</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{sections.paymentTerms}</p>
                      </div>
                    </>
                  )}
                  {sections.closing && (
                    <>
                      <div className="h-px bg-slate-100 my-2" />
                      <div className="pb-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{sections.closingLabel}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{sections.closing}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer note */}
                {form.footerNote && (
                  <div className="mx-5 mb-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400">{form.footerNote}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 text-xs shadow-sm"
                  >
                    {pdfLoading ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Building PDF…
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border font-semibold text-xs transition-all duration-200 ${
                      copied ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {copied ? (
                      <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Placeholder panel */
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-dashed overflow-hidden">
                {/* Fake doc header */}
                <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 px-5 py-5 flex items-start justify-between">
                  <div>
                    <div className="h-2.5 w-20 bg-emerald-200/60 rounded mb-2" />
                    <div className="h-6 w-28 bg-emerald-300/40 rounded" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-2 w-24 bg-slate-200/60 rounded ml-auto" />
                    <div className="h-2 w-16 bg-slate-200/60 rounded ml-auto" />
                  </div>
                </div>

                <div className="px-5 py-6 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Your document appears here</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                      Fill in the form and click Generate — your AI-written invoice preview shows up instantly.
                    </p>
                  </div>

                  {/* Mini steps */}
                  <div className="w-full space-y-2 mt-1">
                    {[
                      { n: "1", t: "Describe your service" },
                      { n: "2", t: "Set amount & tone" },
                      { n: "3", t: "Hit Generate" },
                      { n: "4", t: "Download PDF" },
                    ].map((s) => (
                      <div key={s.n} className="flex items-center gap-2.5 text-left">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {s.n}
                        </span>
                        <span className="text-xs text-slate-500">{s.t}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fake lines */}
                  <div className="w-full space-y-1.5 mt-2 opacity-30">
                    <div className="h-2 bg-slate-200 rounded w-full" />
                    <div className="h-2 bg-slate-200 rounded w-5/6" />
                    <div className="h-2 bg-slate-200 rounded w-4/6" />
                    <div className="h-px bg-slate-100 my-2" />
                    <div className="h-2 bg-slate-200 rounded w-full" />
                    <div className="h-2 bg-slate-200 rounded w-3/4" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent invoices history panel ── */}
      {showHistory && history.length > 0 && (
        <div className="max-w-6xl mx-auto w-full px-4 mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700">Recent Documents</h2>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-emerald-200 cursor-pointer transition-colors group"
                  onClick={() => {
                    setForm(entry.form);
                    setResult(entry.result);
                    setPdfDownloaded(false);
                    setShowHistory(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${entry.docType === "invoice" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {entry.docType}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{entry.service}</p>
                      {entry.clientName && <p className="text-[10px] text-slate-400">{entry.clientName}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs font-bold text-emerald-600">{entry.amount}</p>
                    <p className="text-[10px] text-slate-400">{entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">Stored locally in your browser — never sent to any server</p>
          </div>
        </div>
      )}

      {/* ── Generate Another CTA (shown after PDF download) ── */}
      {pdfDownloaded && (
        <div className="max-w-6xl mx-auto w-full px-4 mt-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-emerald-800">PDF downloaded!</p>
              <p className="text-xs text-emerald-700 mt-0.5">Need another invoice or quote? Start fresh in seconds.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New {isQuote ? "Quote" : "Invoice"}
              </button>
              <button
                onClick={createInvoiceOrQuote}
                className="flex items-center gap-1.5 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Below fold: SEO content ── */}
      <div className="max-w-6xl mx-auto w-full px-4 pb-12 space-y-8 mt-6">

        {/* Ad */}
        <AdBanner slot="1122334455" format="horizontal" className="min-h-[90px] bg-slate-100 rounded-xl" />

        {/* How it works */}
        <section>
          <h2 className="text-base font-bold text-slate-800 mb-3">How InvoiceMint Works</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { step: "01", icon: "🗂️", title: "Choose type", desc: "Invoice (post-work) or quote (estimate)." },
              { step: "02", icon: "🎤", title: "Speak or type", desc: "Use the mic or type your service description." },
              { step: "03", icon: "🤖", title: "AI generates", desc: "Line items, payment terms, closing — all written for you." },
              { step: "04", icon: "📄", title: "Download PDF", desc: "One click for a professional PDF ready to send." },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-bold text-emerald-400 tracking-widest">STEP {item.step}</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm mb-0.5">{item.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-base font-bold text-slate-800 mb-3">Frequently Asked Questions</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { q: "Is InvoiceMint completely free?", a: "Yes, 100% free. No account, no credit card, no limits." },
              { q: "How does voice input work?", a: "Click the mic icon and speak — your browser transcribes it. Works in Chrome, Edge, and Safari." },
              { q: "Can I download as PDF?", a: "Yes! Click 'Download PDF' for a professionally formatted PDF with all your details ready to send." },
              { q: "Invoice vs quote — what's the difference?", a: "A quote is sent before work starts. An invoice is sent after work is complete, requesting payment." },
              { q: "Can I add my company details?", a: "Yes — expand 'Company & Contact Details' to add your name, company, email, and client info." },
              { q: "How does the AI generate text?", a: "InvoiceMint uses advanced language models tuned to your service, amount, client type, and tone." },
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <p className="font-semibold text-slate-800 text-sm mb-1">{faq.q}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-extrabold text-slate-700 text-sm">Invoice<span className="text-emerald-500">Mint</span></span>
          </div>
          <p className="text-slate-400 text-xs">Free AI Invoice &amp; Quote Generator — Voice Input &amp; PDF Export</p>
          <p className="text-slate-400 text-xs mt-1">© {new Date().getFullYear()} InvoiceMint — No sign up required</p>
        </div>
      </footer>
    </div>
  );
}
