'use client';

import React, { useState } from "react";
import { 
  Sparkles, 
  Crop, 
  Download, 
  FileJson, 
  FileText, 
  AlertCircle, 
  Loader2, 
  Check, 
  RotateCcw,
  Palette,
  Compass,
  Lightbulb,
  Layers,
  Sparkle
} from "lucide-react";

interface AIImagePanelProps {
  selectedImage: string | null;
  setSelectedImage: (img: string | null) => void;
  isCropModeActive: boolean;
  setIsCropModeActive: (active: boolean) => void;
  onActivateCrop: () => void;
  
  // AI State & Callbacks
  analysis: any | null;
  setAnalysis: (val: any | null) => void;
  generatedImage: string | null;
  setGeneratedImage: (img: string | null) => void;
}

export const AIImagePanel: React.FC<AIImagePanelProps> = ({
  selectedImage,
  setSelectedImage,
  isCropModeActive,
  setIsCropModeActive,
  onActivateCrop,
  analysis,
  setAnalysis,
  generatedImage,
  setGeneratedImage,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sandboxTab, setSandboxTab] = useState<'preview' | 'code'>('preview');

  // Analyze Cropped Image
  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysis(null);
    
    try {
      const response = await fetch("/app/../api/gemini/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: selectedImage }),
      });
      
      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Erro do servidor (${response.status}): ${text.substring(0, 160)}`);
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || "Falha ao analisar a imagem.");
      }
      
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro de conexão com o servidor AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate Identical Image
  const handleGenerateImage = async () => {
    if (!selectedImage) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedImage(null);
    
    try {
      // If we don't have analysis yet, we fetch it first to get the optimized prompt
      let activePrompt = analysis?.optimizedPrompt;
      if (!analysis) {
        const analyzeRes = await fetch("/app/../api/gemini/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image: selectedImage }),
        });
        
        let analyzeData: any;
        const analyzeContentType = analyzeRes.headers.get("content-type");
        if (analyzeContentType && analyzeContentType.includes("application/json")) {
          analyzeData = await analyzeRes.json();
        } else {
          const text = await analyzeRes.text();
          throw new Error(`Erro de análise do servidor (${analyzeRes.status}): ${text.substring(0, 160)}`);
        }

        if (analyzeRes.ok && !analyzeData.error) {
          setAnalysis(analyzeData);
          activePrompt = analyzeData.optimizedPrompt;
        } else {
          throw new Error(analyzeData.error || "Falha ao obter análise prévia.");
        }
      }

      const response = await fetch("/app/../api/gemini/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          base64Image: selectedImage, 
          prompt: activePrompt 
        }),
      });
      
      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Erro do servidor de geração (${response.status}): ${text.substring(0, 160)}`);
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || "Falha ao gerar a imagem.");
      }
      
      setGeneratedImage(data.base64Image);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao gerar imagem idêntica.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset Everything
  const handleReset = () => {
    setSelectedImage(null);
    setAnalysis(null);
    setGeneratedImage(null);
    setErrorMsg(null);
    setIsCropModeActive(false);
  };

  // Download Generated PNG
  const downloadPng = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${generatedImage}`;
    link.download = `imagem_gerada_ai.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download TXT Characteristics list
  const downloadCharacteristicsTxt = () => {
    if (!analysis) return;
    const text = `FICHA DE CARACTERÍSTICAS DA IMAGEM ORIGINAL
=============================================================================
Descrição Geral:
${analysis.description}

Estilo Artístico:
${analysis.style}

Composição de Elementos:
${analysis.composition}

Iluminação e Atmosfera:
${analysis.lighting}

Paleta de Cores:
${Array.isArray(analysis.colorPalette) ? analysis.colorPalette.join(", ") : analysis.colorPalette}

Detalhes Específicos:
${analysis.details}

Prompt Otimizado para IA:
${analysis.optimizedPrompt}
=============================================================================
Gerado em: ${new Date().toLocaleString("pt-BR")}
Leitor de PDF Duplo - AI Workspace`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `caracteristicas_imagem.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Download complete JSON metadata
  const downloadMetadataJson = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `caracteristicas_completas.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-4 flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 select-none">
          <Sparkles className="w-3.5 h-3.5 text-slate-600" />
          Gerador de Imagens AI
        </h3>
        {selectedImage && (
          <button
            onClick={handleReset}
            className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer font-semibold"
            title="Limpar seleção e recomeçar"
          >
            <RotateCcw className="w-3 h-3" />
            Reiniciar
          </button>
        )}
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 flex flex-col gap-2 text-rose-800 animate-in fade-in duration-200">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="text-[11px] leading-normal font-medium">
              <span className="font-bold block mb-0.5">Falha no Processamento</span>
              {errorMsg}
            </div>
          </div>
          {(errorMsg.includes("chave de API paga") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("limit: 0")) && (
            <div className="mt-1 bg-white/80 border border-rose-200/50 p-2 rounded text-[10px] text-rose-950 font-medium leading-relaxed">
              💡 <span className="font-bold">Como resolver:</span> Vá no menu superior em <span className="font-bold">Configurações &gt; Secrets</span> (ícone de engrenagem) no canto superior direito do Google AI Studio para configurar seu faturamento ou selecionar uma chave de API paga do Gemini, depois clique em &quot;Reiniciar&quot; e tente novamente!
            </div>
          )}
        </div>
      )}

      {/* STATE 1: NO IMAGE SELECTED */}
      {!selectedImage && (
        <div className="text-center py-10 px-4 bg-slate-50/50 border border-slate-200/60 rounded-md select-none">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Crop className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-xs font-semibold text-slate-700">Nenhuma imagem selecionada</p>
          <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-1 leading-normal mb-4">
            Ative o modo de seleção e clique-arraste sobre qualquer imagem do documento PDF para gerá-la com Inteligência Artificial.
          </p>
          <button
            onClick={onActivateCrop}
            className={`w-full py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              isCropModeActive 
                ? "bg-rose-500 text-white hover:bg-rose-600 animate-pulse" 
                : "bg-slate-950 hover:bg-slate-800 text-white"
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            {isCropModeActive ? "Modo Seleção Ativo..." : "Selecionar Imagem do PDF"}
          </button>
        </div>
      )}

      {/* STATE 2: IMAGE IS SELECTED */}
      {selectedImage && (
        <div className="space-y-4">
          {/* ORIGINAL CROPPED VIEW */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">
              Imagem Selecionada (Original)
            </span>
            <div className="relative aspect-video w-full bg-white border border-slate-200/60 rounded overflow-hidden flex items-center justify-center">
              <img 
                src={selectedImage} 
                alt="Recorte Original" 
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* PROCESS PIPELINE ACTIONS */}
          <div className="space-y-2">
            {!analysis && !isAnalyzing && (
              <button
                onClick={handleAnalyzeImage}
                className="w-full py-2 px-3 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer shadow-3xs"
              >
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                Analisar Características Visuais
              </button>
            )}

            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || isAnalyzing}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gerando Imagem Idêntica...
                </>
              ) : (
                <>
                  <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                  Gerar Imagem Idêntica (AI)
                </>
              )}
            </button>
          </div>

          {/* LOADER FOR ANALYSIS */}
          {isAnalyzing && (
            <div className="text-center py-6 select-none bg-slate-50/50 border border-dashed border-slate-200 rounded-lg">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-[11px] font-semibold text-slate-600">Extraindo características e estilos...</p>
            </div>
          )}

          {/* ANALYSIS RESULTS CARDS */}
          {analysis && (
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3.5 animate-in fade-in duration-200 text-xs">
              <div className="flex items-center gap-1 text-slate-800 font-bold border-b border-slate-100 pb-1.5 select-none">
                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                Características Mapeadas
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                  Estilo Visual
                </span>
                <p className="font-semibold text-slate-700 leading-normal">{analysis.style}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">
                  Paleta de Cores (Hex e Decimal)
                </span>
                <div className="grid grid-cols-1 gap-1.5 mt-1">
                  {Array.isArray(analysis.colorPaletteDecimals) ? (
                    analysis.colorPaletteDecimals.map((color: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200/60 rounded">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-slate-300 shadow-3xs shrink-0" 
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="flex flex-col leading-none">
                            <span className="font-mono text-[9px] font-bold text-slate-700">{color.hex}</span>
                            <span className="text-[8.5px] text-slate-400 mt-0.5 font-medium">RGB: <span className="font-mono text-slate-600">{color.decimal}</span></span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`rgb(${color.decimal})`);
                          }}
                          className="text-[8.5px] px-1.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Copiar cor decimal (RGB)"
                        >
                          Copiar RGB
                        </button>
                      </div>
                    ))
                  ) : Array.isArray(analysis.colorPalette) ? (
                    analysis.colorPalette.map((color: string, i: number) => (
                      <div key={i} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200/60 rounded">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-slate-300 shadow-3xs shrink-0" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-mono text-[9px] font-bold text-slate-700">{color}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="font-semibold text-slate-700">{analysis.colorPalette}</span>
                  )}
                </div>
              </div>

              {/* HTML/CSS Live Sandbox Recreation */}
              {(analysis.recreationHtml || analysis.recreationCss) && (
                <div className="border-t border-slate-100 pt-3.5 space-y-2">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                      Recriação Visual (HTML + CSS)
                    </span>
                    <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                      <button
                        onClick={() => setSandboxTab("preview")}
                        className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded transition-all cursor-pointer ${
                          sandboxTab === "preview" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        Visualização
                      </button>
                      <button
                        onClick={() => setSandboxTab("code")}
                        className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded transition-all cursor-pointer ${
                          sandboxTab === "code" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        Código
                      </button>
                    </div>
                  </div>

                  {sandboxTab === "preview" ? (
                    <div className="space-y-1.5">
                      <div className="relative aspect-video w-full bg-slate-50 border border-slate-200 rounded overflow-hidden shadow-inner flex flex-col justify-between">
                        {/* Live Sandbox Render inside secure iframe */}
                        <iframe
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <style>
                                  html, body {
                                    margin: 0;
                                    padding: 0;
                                    width: 100%;
                                    height: 100%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background: #f8fafc;
                                    font-family: system-ui, -apple-system, sans-serif;
                                    overflow: hidden;
                                  }
                                  ${analysis.recreationCss || ""}
                                </style>
                              </head>
                              <body>
                                ${analysis.recreationHtml || ""}
                              </body>
                            </html>
                          `}
                          className="w-full h-full border-none bg-slate-50"
                          title="HTML/CSS Sandbox Recreation Preview"
                          sandbox="allow-scripts"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 block text-right italic leading-none">
                        ★ Reconstruído com gradientes lineares/radiais, formas e estilos.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 text-left">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded-t border-b border-slate-800 select-none">
                          <span className="text-[9px] font-mono text-slate-400">HTML</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(analysis.recreationHtml || "")}
                            className="text-[9px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Copiar HTML
                          </button>
                        </div>
                        <pre className="p-2 bg-slate-950 text-emerald-400 font-mono text-[9px] rounded-b overflow-x-auto max-h-[80px] leading-tight select-all">
                          {analysis.recreationHtml || "<!-- Sem HTML -->"}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded-t border-b border-slate-800 select-none">
                          <span className="text-[9px] font-mono text-slate-400">CSS</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(analysis.recreationCss || "")}
                            className="text-[9px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Copiar CSS
                          </button>
                        </div>
                        <pre className="p-2 bg-slate-950 text-amber-400 font-mono text-[9px] rounded-b overflow-x-auto max-h-[120px] leading-tight select-all">
                          {analysis.recreationCss || "/* Sem CSS */"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                  Composição
                </span>
                <p className="font-medium text-slate-600 leading-relaxed text-[11px]">{analysis.composition}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                  Iluminação
                </span>
                <p className="font-medium text-slate-600 leading-relaxed text-[11px]">{analysis.lighting}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                  Detalhes Mapeados
                </span>
                <p className="font-medium text-slate-500 leading-relaxed text-[11px]">{analysis.details}</p>
              </div>
            </div>
          )}

          {/* GENERATED IMAGE COMPARISON VIEW */}
          {generatedImage && (
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold select-none text-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Imagem Recriada por IA
              </div>
              <div className="relative aspect-square w-full bg-white border border-emerald-200/60 rounded overflow-hidden flex items-center justify-center shadow-3xs">
                <img 
                  src={`data:image/png;base64,${generatedImage}`} 
                  alt="Recriação Artificial" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* DOWNLOAD BUTTONS */}
              <div className="pt-1.5 space-y-1.5">
                <button
                  onClick={downloadPng}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Imagem PNG
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={downloadCharacteristicsTxt}
                    className="py-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 bg-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer shadow-3xs"
                    title="Baixar ficha de características original em texto"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Ficha (TXT)
                  </button>

                  <button
                    onClick={downloadMetadataJson}
                    className="py-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 bg-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer shadow-3xs"
                    title="Baixar metadados completos em formato JSON"
                  >
                    <FileJson className="w-3.5 h-3.5 text-slate-400" />
                    Metadados (JSON)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
