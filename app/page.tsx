"use client";

import { useState } from "react";
import AdBanner from "./components/AdBanner";

interface FormData {
  service: string;
  clientType: string;
  amount: string;
  tone: string;
  details: string;
}

export default function Home() {
  const [form, setForm] = useState<FormData>({
    service: "",
    clientType: "",
    amount: "",
    tone: "formal",
    details: "",
  });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <span className="font-bold text-gray-800 text-lg">
              InvoiceAI.tools
            </span>
          </div>
        </div>
      </header>

      {/* Top Ad */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <AdBanner slot="1234567890" format="horizontal" className="min-h-[90px] bg-gray-100 rounded" />
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-8 pb-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Free AI Invoice Description Generator
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Generate professional invoice line items, payment terms, and
          thank-you notes in seconds. Free for freelancers and small businesses.
        </p>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5">
                Enter Invoice Details
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service / Work Done <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                    placeholder="e.g. Website design, Logo creation, Tax consulting"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="clientType"
                    value={form.clientType}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select client type</option>
                    <option value="individual">Individual / Freelancer</option>
                    <option value="small business">Small Business</option>
                    <option value="startup">Startup</option>
                    <option value="enterprise">Enterprise / Corporation</option>
                    <option value="nonprofit">Non-profit</option>
                    <option value="government">Government</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="e.g. $1,500 or $500/hr"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tone <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tone"
                      value={form.tone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="formal">Formal</option>
                      <option value="friendly">Friendly</option>
                      <option value="concise">Concise</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Details{" "}
                    <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <textarea
                    name="details"
                    value={form.details}
                    onChange={handleChange}
                    rows={3}
                    placeholder="e.g. Project included 3 revisions, delivered in 5 days, net-30 payment terms..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin text-lg">⟳</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Generate Invoice Text
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Result */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Generated Invoice Text
                  </h3>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <span>✓</span> Copied!
                      </>
                    ) : (
                      <>
                        <span>📋</span> Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {result}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Ad */}
          <div className="hidden md:block">
            <AdBanner
              slot="0987654321"
              format="vertical"
              className="sticky top-4 min-h-[600px] bg-gray-100 rounded"
            />
          </div>
        </div>

        {/* Bottom Ad */}
        <div className="mt-8">
          <AdBanner slot="1122334455" format="horizontal" className="min-h-[90px] bg-gray-100 rounded" />
        </div>

        {/* SEO Content */}
        <section className="mt-10 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            How to Use the AI Invoice Description Generator
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-medium text-gray-800 mb-1">
                  Enter your service
                </p>
                <p>Describe the work you did for your client in a few words.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-medium text-gray-800 mb-1">
                  Fill in the details
                </p>
                <p>Add client type, amount, and preferred tone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-medium text-gray-800 mb-1">
                  Copy and use instantly
                </p>
                <p>
                  Copy the generated text directly into your invoice software.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ for SEO */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {[
              {
                q: "Is this invoice description generator free?",
                a: "Yes, completely free. No account required. Generate unlimited invoice descriptions.",
              },
              {
                q: "What is an invoice description?",
                a: "An invoice description is the text that explains the services rendered, payment terms, and professional communication included in your invoice.",
              },
              {
                q: "Can I use this for freelance invoices?",
                a: "Absolutely. This tool is designed for freelancers, consultants, and small businesses who need professional invoice language quickly.",
              },
              {
                q: "How does the AI generate invoice text?",
                a: "Our AI uses advanced language models to generate professional, contextually appropriate invoice descriptions based on your service details.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <p className="font-medium text-gray-800 text-sm">{faq.q}</p>
                <p className="text-gray-600 text-sm mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Free AI Invoice Description Generator — Built for freelancers &
            small businesses
          </p>
          <p className="mt-1">
            © {new Date().getFullYear()} InvoiceAI.tools — No sign up required
          </p>
        </div>
      </footer>
    </div>
  );
}
