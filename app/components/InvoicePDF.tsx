import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const DARK = "#1e293b";
const MID = "#475569";
const LIGHT = "#94a3b8";
const BORDER = "#e2e8f0";

// styles that don't depend on accent colour
const base = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: DARK, backgroundColor: "#fff" },

  // Header
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  logoImg: { maxHeight: 48, maxWidth: 140, objectFit: "contain" },
  docRight: { alignItems: "flex-end" },
  docTypeText: { fontSize: 26, fontFamily: "Helvetica-Bold", color: DARK },
  docNumText: { fontSize: 9, color: MID, marginTop: 3 },
  docDateText: { fontSize: 8.5, color: LIGHT, marginTop: 2 },

  // Divider
  thinLine: { height: 1, backgroundColor: BORDER, marginVertical: 12 },

  // Parties
  partiesRow: { flexDirection: "row", gap: 24, marginBottom: 20 },
  partyBlock: { flex: 1 },
  partyLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: LIGHT, marginBottom: 6, letterSpacing: 1.5 },
  partyName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 3 },
  partyDetail: { fontSize: 9, color: MID, marginBottom: 1 },

  // Amount box
  amountLeft: {},
  amountServiceLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 3, letterSpacing: 0.5 },
  amountServiceName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  amountValue: { fontSize: 22, fontFamily: "Helvetica-Bold" },

  // Sections
  sectionText: { fontSize: 9.5, color: MID, lineHeight: 1.7 },

  // Footer
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, borderTop: `1 solid ${BORDER}`, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: LIGHT },
});

// Accent-dependent styles built at render time
function accentStyles(em: string) {
  // Derive a very light tint for backgrounds (~12% opacity approximated as hex blend with white)
  return StyleSheet.create({
    accentLine: { height: 2.5, backgroundColor: em, marginBottom: 20 },
    amountBox: { borderRadius: 6, padding: "12 16", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, border: `1 solid ${em}30`, backgroundColor: `${em}12` },
    sectionLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: em, letterSpacing: 1.5, marginBottom: 5, marginTop: 14 },
    footerAccent: { fontSize: 7.5, color: em, fontFamily: "Helvetica-Bold" },
  });
}

function parseAIOutput(text: string) {
  const clean = text.replace(/\*\*/g, "").trim();
  const s1 = clean.match(/1\.\s*(?:Invoice |Quote )?Line Item Description[^\n]*\n?([\s\S]*?)(?=\n2\.|$)/i);
  const s2 = clean.match(/2\.\s*Payment Terms[^\n]*\n?([\s\S]*?)(?=\n3\.|$)/i);
  const s3 = clean.match(/3\.\s*(?:Thank You Note|Next Steps)[^\n]*\n?([\s\S]*?)$/i);
  return {
    lineItem: s1?.[1]?.trim() ?? clean,
    paymentTerms: s2?.[1]?.trim() ?? "",
    closing: s3?.[1]?.trim() ?? "",
    closingLabel: /next steps/i.test(text) ? "NEXT STEPS" : "THANK YOU NOTE",
  };
}

export interface InvoicePDFProps {
  docType: string;
  invoiceNumber: string;
  dueDate: string;
  yourName: string;
  yourCompany: string;
  yourEmail: string;
  yourPhone: string;
  clientName: string;
  clientCompany: string;
  service: string;
  amount: string;
  generatedText: string;
  issueDate: string;
  logoUrl?: string;
  accentColor?: string;
  footerNote?: string;
}

export default function InvoicePDF({
  docType, invoiceNumber, dueDate,
  yourName, yourCompany, yourEmail, yourPhone,
  clientName, clientCompany,
  service, amount, generatedText, issueDate,
  logoUrl, accentColor = "#10b981", footerNote,
}: InvoicePDFProps) {
  const isQuote = docType === "quote";
  const label = isQuote ? "QUOTE" : "INVOICE";
  const sections = parseAIOutput(generatedText);
  const hasFrom = yourName || yourCompany || yourEmail || yourPhone;
  const hasTo = clientName || clientCompany;
  const a = accentStyles(accentColor);

  return (
    <Document>
      <Page size="A4" style={base.page}>
        {/* Header */}
        <View style={base.headerRow}>
          {logoUrl ? (
            <Image src={logoUrl} style={base.logoImg} />
          ) : (
            <View />
          )}
          <View style={base.docRight}>
            <Text style={base.docTypeText}>{label}</Text>
            {invoiceNumber ? <Text style={base.docNumText}>#{invoiceNumber}</Text> : null}
            <Text style={base.docDateText}>Issued: {issueDate}</Text>
            {dueDate ? (
              <Text style={base.docDateText}>{isQuote ? "Valid Until" : "Due"}: {dueDate}</Text>
            ) : null}
          </View>
        </View>

        <View style={a.accentLine} />

        {/* Parties */}
        {(hasFrom || hasTo) && (
          <View style={base.partiesRow}>
            {hasFrom && (
              <View style={base.partyBlock}>
                <Text style={base.partyLabel}>FROM</Text>
                {yourName ? <Text style={base.partyName}>{yourName}</Text> : null}
                {yourCompany ? <Text style={base.partyDetail}>{yourCompany}</Text> : null}
                {yourEmail ? <Text style={base.partyDetail}>{yourEmail}</Text> : null}
                {yourPhone ? <Text style={base.partyDetail}>{yourPhone}</Text> : null}
              </View>
            )}
            {hasTo && (
              <View style={base.partyBlock}>
                <Text style={base.partyLabel}>BILL TO</Text>
                {clientName ? <Text style={base.partyName}>{clientName}</Text> : null}
                {clientCompany ? <Text style={base.partyDetail}>{clientCompany}</Text> : null}
              </View>
            )}
          </View>
        )}

        {/* Amount Box */}
        <View style={a.amountBox}>
          <View style={base.amountLeft}>
            <Text style={[base.amountServiceLabel, { color: accentColor }]}>SERVICE</Text>
            <Text style={base.amountServiceName}>{service}</Text>
          </View>
          <Text style={[base.amountValue, { color: accentColor }]}>{amount}</Text>
        </View>

        {/* AI Sections */}
        {sections.lineItem ? (
          <>
            <Text style={a.sectionLabel}>{isQuote ? "QUOTE DESCRIPTION" : "SERVICE DESCRIPTION"}</Text>
            <Text style={base.sectionText}>{sections.lineItem}</Text>
          </>
        ) : null}

        {sections.paymentTerms ? (
          <>
            <View style={base.thinLine} />
            <Text style={a.sectionLabel}>PAYMENT TERMS</Text>
            <Text style={base.sectionText}>{sections.paymentTerms}</Text>
          </>
        ) : null}

        {sections.closing ? (
          <>
            <View style={base.thinLine} />
            <Text style={a.sectionLabel}>{sections.closingLabel}</Text>
            <Text style={base.sectionText}>{sections.closing}</Text>
          </>
        ) : null}

        {/* Footer */}
        <View style={base.footer}>
          <Text style={base.footerText}>{footerNote ?? " "}</Text>
          <Text style={a.footerAccent}>{yourName || yourCompany || " "}</Text>
        </View>
      </Page>
    </Document>
  );
}
