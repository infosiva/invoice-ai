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
}

const EMPTY_FORM: FormData = {
  service: "", clientType: "", amount: "", tone: "formal",
  details: "", docType: "invoice",
  yourName: "", yourCompany: "", yourEmail: "", yourPhone: "",
  clientName: "", clientCompany: "",
  invoiceNumber: "", dueDate: "",
};

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
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setVoiceSupported(
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startVoice = (field: VoiceField) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (voiceField === field) {
      recognitionRef.current?.stop();
      return;
    }
    recognitionRef.current?.stop();
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
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
        })
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoicemint-${form.docType}-${form.invoiceNumber || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const isQuote = form.docType === "quote";

  const inputClass =
    "w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 shadow-sm";
  const labelClass =
    "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

  const MicButton = ({ field }: { field: VoiceField }) =>
    voiceSupported ? (
      <button
        type="button"
        onClick={() => startVoice(field)}
        title={voiceField === field ? "Stop listening" : "Click to speak"}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200 ${
          voiceField === field
            ? "bg-red-50 text-red-500"
            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
        }`}
      >
        {voiceField === field ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping absolute" />
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </span>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    ) : null;

  // Parse AI output sections for preview
  const parseResult = (text: string) => {
    const clean = text.replace(/\*\*/g, "");
    const s1 = clean.match(/1\.\s*(?:Invoice |Quote )?Line Item Description[^\n]*\n?([\s\S]*?)(?=\n2\.|$)/i);
    const s2 = clean.match(/2\.\s*Payment Terms[^\n]*\n?([\s\S]*?)(?=\n3\.|$)/i);
    const s3 = clean.match(/3\.\s*(?:Thank You Note|Next Steps)[^\n]*\n?([\s\S]*?)$/i);
    const hasNextSteps = /next steps/i.test(text);
    return {
      lineItem: s1?.[1]?.trim() ?? clean,
      paymentTerms: s2?.[1]?.trim() ?? "",
      closing: s3?.[1]?.trim() ?? "",
      closingLabel: hasNextSteps ? "Next Steps" : "Thank You",
    };
  };

  const sections = result ? parseResult(result) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-extrabold text-slate-800 text-base tracking-tight">
              Invoice<span className="text-emerald-500">Mint</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {voiceSupported && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Voice enabled
              </span>
            )}
            <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full border border-emerald-200">
              Free forever
            </span>
          </div>
        </div>
      </header>

      {/* ── Top Ad ── */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <AdBanner slot="1234567890" format="horizontal" className="min-h-[90px] bg-slate-100 rounded-xl" />
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)",
            backgroundSize: "100px 100px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" />
            AI-powered · Voice input · PDF export · Free
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Speak. Generate. Download.
            <br className="hidden md:block" />
            <span className="text-emerald-200">Professional invoices in seconds.</span>
          </h1>
          <p className="text-emerald-50 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Use voice or type to describe your work — InvoiceMint AI writes the invoice,
            you download the PDF. Built for freelancers &amp; small businesses.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {[
              { icon: "🎤", label: "Voice input" },
              { icon: "🤖", label: "AI generated" },
              { icon: "📄", label: "PDF export" },
              { icon: "♾️", label: "Unlimited · Free" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-white/90 text-xs font-medium"
              >
                <span>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* ── Form column ── */}
          <div className="md:col-span-2 space-y-4">

            {/* Doc type toggle */}
            <div className="bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm flex gap-1">
              {(["invoice", "quote"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, docType: type }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    form.docType === type
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {type === "invoice" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  )}
                  {type === "invoice" ? "Invoice" : "Quote / Estimate"}
                </button>
              ))}
            </div>

            {/* Voice tip banner */}
            {voiceSupported && (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <p className="text-xs text-emerald-700">
                  <span className="font-semibold">Voice enabled</span> — tap the mic icon on any field to speak instead of type.
                </p>
              </div>
            )}

            {/* Form card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-slate-800">
                  {isQuote ? "Quote Details" : "Invoice Details"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Service */}
                <div>
                  <label className={labelClass}>
                    Service / Work Done <span className="text-red-400 normal-case font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="service"
                      value={form.service}
                      onChange={handleChange}
                      placeholder="e.g. Website design, Logo creation, Tax consulting"
                      required
                      className={`${inputClass} ${voiceSupported ? "pr-10" : ""}`}
                    />
                    <MicButton field="service" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      Client Type <span className="text-red-400 normal-case font-bold">*</span>
                    </label>
                    <select name="clientType" value={form.clientType} onChange={handleChange} required className={inputClass}>
                      <option value="">Select type</option>
                      <option value="individual">Individual / Freelancer</option>
                      <option value="small business">Small Business</option>
                      <option value="startup">Startup</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="nonprofit">Non-profit</option>
                      <option value="government">Government</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Amount <span className="text-red-400 normal-case font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="e.g. $1,500 or $500/hr"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      Tone <span className="text-red-400 normal-case font-bold">*</span>
                    </label>
                    <select name="tone" value={form.tone} onChange={handleChange} className={inputClass}>
                      <option value="formal">Formal</option>
                      <option value="friendly">Friendly</option>
                      <option value="concise">Concise</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {isQuote ? "Quote #" : "Invoice #"}{" "}
                      <span className="text-slate-400 normal-case font-normal">(opt.)</span>
                    </label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      value={form.invoiceNumber}
                      onChange={handleChange}
                      placeholder="e.g. INV-001"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    {isQuote ? "Valid Until" : "Due Date"}{" "}
                    <span className="text-slate-400 normal-case font-normal">(opt.)</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                {/* Optional toggle */}
                <button
                  type="button"
                  onClick={() => setShowOptional((v) => !v)}
                  className="w-full flex items-center justify-between py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl text-sm text-slate-600 font-medium transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Company &amp; Contact Details
                    <span className="text-xs text-slate-400 font-normal">— appears in PDF</span>
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${showOptional ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showOptional && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <span className="w-4 h-px bg-emerald-300 inline-block" />
                        Your Info (Service Provider)
                        <span className="w-4 h-px bg-emerald-300 inline-block" />
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Your Name</label>
                          <input type="text" name="yourName" value={form.yourName} onChange={handleChange} placeholder="Jane Smith" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Your Company</label>
                          <input type="text" name="yourCompany" value={form.yourCompany} onChange={handleChange} placeholder="Smith Design Co." className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Your Email</label>
                          <input type="email" name="yourEmail" value={form.yourEmail} onChange={handleChange} placeholder="jane@smith.com" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Your Phone</label>
                          <input type="tel" name="yourPhone" value={form.yourPhone} onChange={handleChange} placeholder="+1 (555) 000-0000" className={inputClass} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <span className="w-4 h-px bg-slate-300 inline-block" />
                        Client Info
                        <span className="w-4 h-px bg-slate-300 inline-block" />
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Client Name</label>
                          <input type="text" name="clientName" value={form.clientName} onChange={handleChange} placeholder="John Doe" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Client Company</label>
                          <input type="text" name="clientCompany" value={form.clientCompany} onChange={handleChange} placeholder="Acme Corp" className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={labelClass}>
                    Additional Notes{" "}
                    <span className="text-slate-400 normal-case font-normal">(opt.)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      name="details"
                      value={form.details}
                      onChange={handleChange}
                      rows={2}
                      placeholder="e.g. 3 revisions included, delivered in 5 days, net-30 terms..."
                      className={`${inputClass} resize-none ${voiceSupported ? "pr-10" : ""}`}
                    />
                    <div className="absolute right-2.5 top-3">
                      <MicButton field="details" />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-emerald-300 disabled:to-teal-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-emerald-100 hover:shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating your {isQuote ? "quote" : "invoice"}…
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
                  Your data is used only to generate this document and is never stored.
                </p>
              </form>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm">
                <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* ── Result: Document Preview ── */}
            {result && sections && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Document Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">InvoiceMint</p>
                      <h3 className="text-white text-2xl font-black uppercase tracking-wider">
                        {isQuote ? "Quote" : "Invoice"}
                      </h3>
                      {form.invoiceNumber && (
                        <p className="text-emerald-200 text-sm mt-0.5">#{form.invoiceNumber}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-emerald-100 space-y-0.5">
                      <p>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      {form.dueDate && (
                        <p className="text-emerald-200">
                          {isQuote ? "Valid until" : "Due"}:{" "}
                          {new Date(form.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* From / To */}
                {(form.yourName || form.yourCompany || form.clientName || form.clientCompany) && (
                  <div className="grid grid-cols-2 gap-6 px-6 py-4 bg-slate-50 border-b border-slate-100">
                    {(form.yourName || form.yourCompany) && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">From</p>
                        {form.yourName && <p className="text-sm font-semibold text-slate-800">{form.yourName}</p>}
                        {form.yourCompany && <p className="text-xs text-slate-500">{form.yourCompany}</p>}
                        {form.yourEmail && <p className="text-xs text-slate-500">{form.yourEmail}</p>}
                        {form.yourPhone && <p className="text-xs text-slate-500">{form.yourPhone}</p>}
                      </div>
                    )}
                    {(form.clientName || form.clientCompany) && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
                        {form.clientName && <p className="text-sm font-semibold text-slate-800">{form.clientName}</p>}
                        {form.clientCompany && <p className="text-xs text-slate-500">{form.clientCompany}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Amount */}
                <div className="mx-6 mt-5 mb-1 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-0.5">Service</p>
                    <p className="text-sm font-semibold text-slate-800">{form.service}</p>
                  </div>
                  <p className="text-xl font-black text-emerald-600">{form.amount}</p>
                </div>

                {/* AI Sections */}
                <div className="px-6 pb-2 space-y-1">
                  {sections.lineItem && (
                    <div className="pt-4">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                        {isQuote ? "Quote Description" : "Service Description"}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">{sections.lineItem}</p>
                    </div>
                  )}
                  {sections.paymentTerms && (
                    <>
                      <div className="h-px bg-slate-100 my-3" />
                      <div className="pt-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Payment Terms</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{sections.paymentTerms}</p>
                      </div>
                    </>
                  )}
                  {sections.closing && (
                    <>
                      <div className="h-px bg-slate-100 my-3" />
                      <div className="pt-1 pb-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{sections.closingLabel}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{sections.closing}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                  {/* PDF Download — primary */}
                  <button
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm text-sm"
                  >
                    {pdfLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Building PDF…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </>
                    )}
                  </button>

                  {/* Copy — secondary */}
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-4 py-3 rounded-xl border font-semibold text-sm transition-all duration-200 ${
                      copied
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy text
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar Ad ── */}
          <div className="hidden md:block">
            <AdBanner slot="0987654321" format="vertical" className="sticky top-20 min-h-[600px] bg-slate-100 rounded-2xl" />
          </div>
        </div>

        {/* ── Bottom Ad ── */}
        <div className="mt-8">
          <AdBanner slot="1122334455" format="horizontal" className="min-h-[90px] bg-slate-100 rounded-2xl" />
        </div>

        {/* ── How it works ── */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-800 mb-4">How InvoiceMint Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                icon: (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                ),
                title: "Choose type",
                desc: "Select invoice (post-work) or quote (pre-work estimate).",
              },
              {
                step: "02",
                icon: (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ),
                title: "Speak or type",
                desc: "Tap the mic to describe your service by voice — or type it in.",
              },
              {
                step: "03",
                icon: (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "AI generates",
                desc: "Our AI writes professional line items, payment terms, and a closing note.",
              },
              {
                step: "04",
                icon: (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: "Download PDF",
                desc: "One click — get a professional PDF ready to send to your client.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-emerald-400 tracking-widest">STEP {item.step}</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm mb-1">{item.title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              {
                q: "Is InvoiceMint completely free?",
                a: "Yes, 100% free. No account, no credit card, no limits. Generate as many invoices and quotes as you need and download them as PDFs.",
              },
              {
                q: "How does voice input work?",
                a: "Click the microphone icon on the Service or Notes field and speak naturally — your browser transcribes it in real time. Works in Chrome, Edge, and Safari. No API cost, no data sent to third parties.",
              },
              {
                q: "Can I download the invoice as a PDF?",
                a: "Yes! After generating, click 'Download PDF' to get a professionally formatted PDF with your company details, client info, AI-generated descriptions, and payment terms — ready to send.",
              },
              {
                q: "What's the difference between an invoice and a quote?",
                a: "A quote (estimate) is sent before work begins to outline the expected cost. An invoice is sent after the work is complete, requesting payment.",
              },
              {
                q: "Can I add my company details to the PDF?",
                a: "Yes! Click 'Company & Contact Details' to add your name, company, email, phone, and client info. These appear in the From/Bill To section of the PDF.",
              },
              {
                q: "How does the AI generate the text?",
                a: "InvoiceMint uses advanced language models to write professional, contextually appropriate invoice text based on your service, amount, client type, and tone preference.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{faq.q}</p>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-12 border-t border-slate-100 bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-extrabold text-slate-700 text-sm">
              Invoice<span className="text-emerald-500">Mint</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            Free AI Invoice &amp; Quote Generator with Voice Input &amp; PDF Export
          </p>
          <p className="text-slate-400 text-xs mt-1">
            © {new Date().getFullYear()} InvoiceMint — No sign up required
          </p>
        </div>
      </footer>
    </div>
  );
}
