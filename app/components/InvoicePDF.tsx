import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const EM = "#10b981";
const DARK = "#1e293b";
const MID = "#475569";
const LIGHT = "#94a3b8";
const BORDER = "#e2e8f0";
const BG_GREEN = "#ecfdf5";

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: DARK, backgroundColor: "#fff" },

  // Header
  headerRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-start", marginBottom: 16 },
  docRight: { alignItems: "flex-end" },
  docTypeText: { fontSize: 26, fontFamily: "Helvetica-Bold", color: DARK },
  docNumText: { fontSize: 9, color: MID, marginTop: 3 },
  docDateText: { fontSize: 8.5, color: LIGHT, marginTop: 2 },

  // Divider
  greenLine: { height: 2.5, backgroundColor: EM, marginBottom: 20 },
  thinLine: { height: 1, backgroundColor: BORDER, marginVertical: 12 },

  // Parties
  partiesRow: { flexDirection: "row", gap: 24, marginBottom: 20 },
  partyBlock: { flex: 1 },
  partyLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: LIGHT, marginBottom: 6, letterSpacing: 1.5 },
  partyName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 3 },
  partyDetail: { fontSize: 9, color: MID, marginBottom: 1 },

  // Amount box
  amountBox: { backgroundColor: BG_GREEN, borderRadius: 6, padding: "12 16", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  amountLeft: {},
  amountServiceLabel: { fontSize: 8, color: "#065f46", fontFamily: "Helvetica-Bold", marginBottom: 3, letterSpacing: 0.5 },
  amountServiceName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#064e3b" },
  amountValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: EM },

  // Sections
  sectionLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: EM, letterSpacing: 1.5, marginBottom: 5, marginTop: 14 },
  sectionText: { fontSize: 9.5, color: MID, lineHeight: 1.7 },

  // Footer
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, borderTop: `1 solid ${BORDER}`, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerLeft: { fontSize: 7.5, color: LIGHT },
  footerRight: { fontSize: 7.5, color: EM, fontFamily: "Helvetica-Bold" },
});

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
}

export default function InvoicePDF({
  docType, invoiceNumber, dueDate,
  yourName, yourCompany, yourEmail, yourPhone,
  clientName, clientCompany,
  service, amount, generatedText, issueDate,
}: InvoicePDFProps) {
  const isQuote = docType === "quote";
  const label = isQuote ? "QUOTE" : "INVOICE";
  const sections = parseAIOutput(generatedText);
  const hasFrom = yourName || yourCompany || yourEmail || yourPhone;
  const hasTo = clientName || clientCompany;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.docRight}>
            <Text style={s.docTypeText}>{label}</Text>
            {invoiceNumber ? <Text style={s.docNumText}>#{invoiceNumber}</Text> : null}
            <Text style={s.docDateText}>Issued: {issueDate}</Text>
            {dueDate ? (
              <Text style={s.docDateText}>{isQuote ? "Valid Until" : "Due"}: {dueDate}</Text>
            ) : null}
          </View>
        </View>

        <View style={s.greenLine} />

        {/* Parties */}
        {(hasFrom || hasTo) && (
          <View style={s.partiesRow}>
            {hasFrom && (
              <View style={s.partyBlock}>
                <Text style={s.partyLabel}>FROM</Text>
                {yourName ? <Text style={s.partyName}>{yourName}</Text> : null}
                {yourCompany ? <Text style={s.partyDetail}>{yourCompany}</Text> : null}
                {yourEmail ? <Text style={s.partyDetail}>{yourEmail}</Text> : null}
                {yourPhone ? <Text style={s.partyDetail}>{yourPhone}</Text> : null}
              </View>
            )}
            {hasTo && (
              <View style={s.partyBlock}>
                <Text style={s.partyLabel}>BILL TO</Text>
                {clientName ? <Text style={s.partyName}>{clientName}</Text> : null}
                {clientCompany ? <Text style={s.partyDetail}>{clientCompany}</Text> : null}
              </View>
            )}
          </View>
        )}

        {/* Amount Box */}
        <View style={s.amountBox}>
          <View style={s.amountLeft}>
            <Text style={s.amountServiceLabel}>SERVICE</Text>
            <Text style={s.amountServiceName}>{service}</Text>
          </View>
          <Text style={s.amountValue}>{amount}</Text>
        </View>

        {/* AI Sections */}
        {sections.lineItem ? (
          <>
            <Text style={s.sectionLabel}>{isQuote ? "QUOTE DESCRIPTION" : "SERVICE DESCRIPTION"}</Text>
            <Text style={s.sectionText}>{sections.lineItem}</Text>
          </>
        ) : null}

        {sections.paymentTerms ? (
          <>
            <View style={s.thinLine} />
            <Text style={s.sectionLabel}>PAYMENT TERMS</Text>
            <Text style={s.sectionText}>{sections.paymentTerms}</Text>
          </>
        ) : null}

        {sections.closing ? (
          <>
            <View style={s.thinLine} />
            <Text style={s.sectionLabel}>{sections.closingLabel}</Text>
            <Text style={s.sectionText}>{sections.closing}</Text>
          </>
        ) : null}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerLeft}> </Text>
          <Text style={s.footerRight}> </Text>
        </View>
      </Page>
    </Document>
  );
}
