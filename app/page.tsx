'use client';

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the main Leitor de PDF application to disable SSR
const PdfReaderApp = dynamic(() => import("@/components/PdfReaderApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 text-slate-800">
      <Loader2 className="h-10 w-10 animate-spin text-slate-800" />
      <h3 className="mt-4 text-sm font-bold">Carregando Leitor de PDF Duplo...</h3>
    </div>
  ),
});

export default function Home() {
  return <PdfReaderApp />;
}
