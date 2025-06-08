// components/pdf-preview-panel.tsx

"use client";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Point to the correct worker file for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFPreviewPanelProps {
  pdfUrl: string | null;
}

export default function PDFPreviewPanel({ pdfUrl }: PDFPreviewPanelProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
  }

  function onDocumentLoadStart() {
    setLoading(true);
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center min-h-60 bg-muted rounded-2xl text-muted-foreground border border-dashed border-gray-300">
        <span className="text-center">No PDF selected</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-xl mx-auto min-h-80 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 transition"
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 transition"
            onClick={() => setPageNumber(p => Math.min((numPages || 1), p + 1))}
            disabled={!!numPages && pageNumber >= numPages}
          >
            Next
          </button>
        </div>
        <span className="text-sm text-gray-600">
          Page <b>{pageNumber}</b> of <b>{numPages || "-"}</b>
        </span>
      </div>

      {/* PDF Preview */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto">
        {loading && (
          <div className="w-full flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600" />
          </div>
        )}
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadStart={onDocumentLoadStart}
          loading=""
        >
          <Page
            pageNumber={pageNumber}
            width={400}
            className="mx-auto my-2 rounded-lg border border-gray-100 shadow"
          />
        </Document>
      </div>
    </div>
  );
}
