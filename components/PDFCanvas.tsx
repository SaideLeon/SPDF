'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { SearchMatch } from '@/lib/types';

interface PDFCanvasProps {
  page: any; // PDFPageProxy from pdfjs-dist
  scale: number;
  pageNumber: number;
  onRenderSuccess?: () => void;
  id?: string;
  matches?: SearchMatch[];
  activeMatchId?: string;
  isCropModeActive?: boolean;
  onImageCropped?: (base64Image: string) => void;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  page,
  scale,
  pageNumber,
  onRenderSuccess,
  id,
  matches,
  activeMatchId,
  isCropModeActive = false,
  onImageCropped
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!isRendering) {
      const timer = setTimeout(() => {
        setShowSpinner(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, 180);
    return () => clearTimeout(timer);
  }, [isRendering]);

  // States for Image Cropping/Selection
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPos({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const left = Math.min(startPos.x, currentPos.x);
    const top = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width > 10 && height > 10 && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const sourceX = left * scaleX;
      const sourceY = top * scaleY;
      const sourceW = width * scaleX;
      const sourceH = height * scaleY;

      // Downscale to max 512px for faster, highly reliable AI processing
      const maxDim = 512;
      let targetW = sourceW;
      let targetH = sourceH;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = (targetH * maxDim) / targetW;
          targetW = maxDim;
        } else {
          targetW = (targetW * maxDim) / targetH;
          targetH = maxDim;
        }
      }

      const offscreen = document.createElement('canvas');
      offscreen.width = targetW;
      offscreen.height = targetH;
      const oCtx = offscreen.getContext('2d');
      if (oCtx) {
        oCtx.drawImage(
          canvas,
          sourceX, sourceY, sourceW, sourceH,
          0, 0, targetW, targetH
        );
        // Export as JPEG with 0.85 quality to drastically reduce payload size and prevent timeout errors
        const dataUrl = offscreen.toDataURL('image/jpeg', 0.85);
        if (onImageCropped) {
          onImageCropped(dataUrl);
        }
      }
    }
  };

  useEffect(() => {
    let active = true;

    if (!page) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRendering(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      setRenderError('Não foi possível obter o contexto 2D do Canvas.');
      setIsRendering(false);
      return;
    }

    setIsRendering(true);
    setRenderError(null);

    // Cancel previous render task if any is currently active
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // Safe to ignore cancellation errors
      }
    }

    if (!active) return;

    try {
      const viewport = page.getViewport({ scale });
      const pixelRatio = window.devicePixelRatio || 1;

      // Set dimensions for high-density screens
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);

      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      // Clear and prepare context
      context.restore();
      context.save();
      context.scale(pixelRatio, pixelRatio);

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        background: 'rgb(255, 255, 255)'
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      renderTask.promise
        .then(() => {
          if (!active) return;
          setIsRendering(false);
          if (onRenderSuccess) onRenderSuccess();
        })
        .catch((err: any) => {
          if (!active) return;
          if (err && err.name !== 'RenderingCancelledException') {
            console.error('Error rendering page:', err);
            setRenderError('Falha ao renderizar página.');
            setIsRendering(false);
          }
        });
    } catch (err: any) {
      if (!active) return;
      console.error('Render configuration error:', err);
      setRenderError('Erro ao preparar renderização.');
      setIsRendering(false);
    }

    return () => {
      active = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [page, scale, onRenderSuccess]);

  // Determine standard page dimensions as placeholder ratio
  const tempWidth = page ? page.view[2] * scale : 595 * scale;
  const tempHeight = page ? page.view[3] * scale : 842 * scale;

  return (
    <div
      id={id || `page-container-${pageNumber}`}
      ref={containerRef}
      className="relative flex flex-col items-center bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-200/60 rounded-md overflow-hidden select-none group"
      style={{
        width: `${Math.floor(tempWidth)}px`,
        height: `${Math.floor(tempHeight)}px`,
      }}
    >
      {/* Absolute Loading overlay */}
      {showSpinner && (
        <div className="absolute inset-0 bg-slate-50/60 flex flex-col items-center justify-center z-10 transition-opacity duration-200">
          <Loader2 className="w-8 h-8 text-slate-500 animate-spin mb-2 stroke-[1.5]" />
          <span className="text-[11px] font-semibold text-slate-600 font-mono">
            Carregando...
          </span>
        </div>
      )}

      {/* Render error overlay */}
      {renderError && (
        <div className="absolute inset-0 bg-rose-50/90 flex flex-col items-center justify-center p-6 text-center z-10">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
          <h4 className="text-sm font-semibold text-rose-900 mb-1">
            Erro de Renderização
          </h4>
          <p className="text-xs text-rose-600 max-w-[200px]">
            {renderError}
          </p>
        </div>
      )}

      {/* The HTML Canvas */}
      <canvas
        ref={canvasRef}
        className="block bg-white transition-all duration-300"
        style={{
          width: `${Math.floor(tempWidth)}px`,
          height: `${Math.floor(tempHeight)}px`
        }}
      />

      {/* Search Highlights Overlay */}
      {page && matches && matches.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-10 select-none">
          {matches.map((match) => {
            const viewport = page.getViewport({ scale });
            const rect = viewport.convertToViewportRectangle([
              match.x,
              match.y,
              match.x + match.width,
              match.y + match.height
            ]);
            
            const left = Math.min(rect[0], rect[2]);
            const top = Math.min(rect[1], rect[3]);
            const width = Math.abs(rect[2] - rect[0]);
            const height = Math.abs(rect[3] - rect[1]);

            const isActive = match.id === activeMatchId;

            return (
              <div
                key={match.id}
                className={`absolute transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-500/35 border-2 border-orange-600 rounded-[2px] shadow-sm animate-pulse z-20'
                    : 'bg-yellow-300/40 border border-yellow-400/50 rounded-[1px] z-10'
                }`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                }}
                title={isActive ? "Foco da busca" : "Correspondência encontrada"}
              />
            );
          })}
        </div>
      )}

      {/* Cropping Selection Overlay */}
      {isCropModeActive && (
        <div
          className="absolute inset-0 cursor-crosshair bg-slate-900/10 z-30 select-none animate-in fade-in duration-200"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {isDrawing && (
            <div
              className="absolute border-2 border-dashed border-rose-500 bg-rose-500/20 shadow-lg pointer-events-none"
              style={{
                left: `${Math.min(startPos.x, currentPos.x)}px`,
                top: `${Math.min(startPos.y, currentPos.y)}px`,
                width: `${Math.abs(currentPos.x - startPos.x)}px`,
                height: `${Math.abs(currentPos.y - startPos.y)}px`,
              }}
            />
          )}
        </div>
      )}

      {/* Elegant page label tag on hover */}
      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-[10px] font-mono text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-md z-20">
        Pág. {pageNumber}
      </div>
    </div>
  );
};
