"use client";

import { PDFViewer } from "@react-pdf/renderer";
import InvoicePDF, { type InvoicePDFProps } from "./InvoicePDF";

export default function PDFPreview(props: InvoicePDFProps) {
  return (
    <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: "none" }}>
      <InvoicePDF {...props} />
    </PDFViewer>
  );
}
