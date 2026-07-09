'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileUp,
  Layout,
  BookOpen,
  Rows,
  Maximize,
  Printer,
  Crop
} from 'lucide-react';
import { LayoutMode } from '@/lib/types';

interface ToolbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentPage: number;
  totalPages: number;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  scale: number;
  setScale: (scale: number) => void;
  zoomMode: string;
  setZoomMode: (mode: string) => void;
  onPageChange: (pageNumber: number) => void;
  onFileUpload: (file: File) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  docTitle?: string;
  onPrint?: () => void;
  isCropModeActive: boolean;
  setIsCropModeActive: (active: boolean) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  currentPage,
  totalPages,
  layoutMode,
  setLayoutMode,
  scale,
  setScale,
  zoomMode,
  setZoomMode,
  onPageChange,
  onFileUpload,
  isFullscreen,
  onToggleFullscreen,
  docTitle,
  onPrint,
  isCropModeActive,
  setIsCropModeActive
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setScale(Math.max(0.3, scale - 0.15));
  };

  const handleZoomIn = () => {
    setZoomMode('custom');
    setScale(Math.min(3.0, scale + 0.15));
  };

  const handleZoomPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'fit-width' || value === 'fit-page') {
      setZoomMode(value);
    } else {
      setZoomMode('custom');
      setScale(parseFloat(value));
    }
  };

  // Determine what page indicator text to show
  const getPageIndicatorText = () => {
    if (totalPages === 0) return '0 / 0';
    if (layoutMode === 'single') {
      return `${currentPage} / ${totalPages}`;
    } else if (layoutMode === 'double') {
      const secondPage = currentPage + 1;
      if (secondPage <= totalPages) {
        return `${currentPage}-${secondPage} / ${totalPages}`;
      }
      return `${currentPage} / ${totalPages}`;
    } else {
      // Book mode
      if (currentPage === 1) {
        return `Capa (1) / ${totalPages}`;
      }
      const secondPage = currentPage + 1;
      if (secondPage <= totalPages) {
        return `${currentPage}-${secondPage} / ${totalPages}`;
      }
      return `${currentPage} / ${totalPages}`;
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between select-none shrink-0 z-30 shadow-xs">
      
      {/* Left section: Brand, Toggle Sidebar, Upload */}
      <div className="flex items-center gap-2 sm:gap-6">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 sm:p-2 rounded-md cursor-pointer transition-colors duration-150 ${
              sidebarOpen 
                ? 'bg-slate-100 text-slate-800' 
                : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
            }`}
            title="Alternar Barra Lateral"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-[4px] text-[9px] sm:text-[10px] font-bold tracking-wider select-none">
              PDF
            </span>
            <span className="font-medium text-slate-700 text-xs sm:text-sm hidden sm:block max-w-[100px] md:max-w-[200px] truncate" title={docTitle || 'Documento PDF'}>
              {docTitle || 'Exemplo_Dupla_Pagina.pdf'}
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />

        {/* Upload local PDF */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 border border-slate-200 hover:border-slate-300 rounded-md hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-[10px] sm:text-xs font-semibold cursor-pointer transition-all duration-150"
            title="Carregar arquivo PDF"
          >
            <FileUp className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Upload PDF</span>
          </button>

          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 border border-slate-200 hover:border-slate-300 rounded-md hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-[10px] sm:text-xs font-semibold cursor-pointer transition-all duration-150"
              title="Imprimir Documento"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Imprimir</span>
            </button>
          )}

          <button
            onClick={() => setIsCropModeActive(!isCropModeActive)}
            className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 border rounded-md text-[10px] sm:text-xs font-semibold cursor-pointer transition-all duration-150 ${
              isCropModeActive
                ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600 shadow-sm animate-pulse'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-800'
            }`}
            title="Selecionar e Recortar Imagem do PDF"
          >
            <Crop className={`w-3.5 h-3.5 ${isCropModeActive ? 'text-white' : 'text-slate-400'}`} />
            <span className="hidden md:inline">Recortar</span>
          </button>
        </div>
      </div>

      {/* Middle section: Navigation */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors hidden sm:inline-flex"
          title="Primeira Página"
        >
          <ChevronsLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={() => {
            if (layoutMode === 'single') {
              onPageChange(currentPage - 1);
            } else if (layoutMode === 'double') {
              onPageChange(currentPage - 2);
            } else {
              // Book Mode: cover is 1, pages are 2-3, 4-5
              if (currentPage <= 3) {
                onPageChange(1);
              } else {
                onPageChange(currentPage - 2);
              }
            }
          }}
          disabled={currentPage <= 1}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Página Anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Page input box */}
        <div className="flex items-center px-1.5 py-0.5 sm:px-3 sm:py-1 bg-slate-50 border border-slate-200/60 rounded-md mx-0.5 sm:mx-1">
          <input
            type="text"
            value={getPageIndicatorText()}
            readOnly
            className="w-12 sm:w-20 bg-transparent text-center font-mono text-[10px] sm:text-xs font-semibold text-slate-600 focus:outline-none"
          />
        </div>

        <button
          onClick={() => {
            if (layoutMode === 'single') {
              onPageChange(currentPage + 1);
            } else if (layoutMode === 'double') {
              onPageChange(currentPage + 2);
            } else {
              // Book mode
              if (currentPage === 1) {
                onPageChange(2);
              } else {
                onPageChange(currentPage + 2);
              }
            }
          }}
          disabled={
            layoutMode === 'single'
              ? currentPage >= totalPages
              : layoutMode === 'double'
              ? currentPage + 1 >= totalPages
              : currentPage + 1 >= totalPages // Book mode
          }
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Próxima Página"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors hidden sm:inline-flex"
          title="Última Página"
        >
          <ChevronsRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Right section: Layout Switch, Zoom & Fullscreen */}
      <div className="flex items-center gap-1 sm:gap-4">
        {/* Layout Modes */}
        <div className="hidden lg:flex items-center bg-slate-100 rounded-md p-0.5 sm:p-1 border border-slate-200/40">
          <button
            onClick={() => setLayoutMode('single')}
            className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded text-[10px] sm:text-xs font-semibold cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
              layoutMode === 'single'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Página Única"
          >
            <Rows className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Única</span>
          </button>

          <button
            onClick={() => setLayoutMode('double')}
            className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded text-[10px] sm:text-xs font-semibold cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
              layoutMode === 'double'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Páginas Duplas (Lado a lado)"
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dupla</span>
          </button>

          <button
            onClick={() => setLayoutMode('book')}
            className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded text-[10px] sm:text-xs font-semibold cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
              layoutMode === 'book'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Modo Livro (Capa isolada, páginas emparelhadas)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Livro</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 hidden lg:block" />

        {/* Zoom Section: Beautiful Rounded-Full Zoom Pill */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-full">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.3}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer text-base leading-none select-none font-bold transition-colors px-1"
              title="Diminuir Zoom"
            >
              −
            </button>
            <span className="text-xs font-semibold w-9 text-center text-slate-600 font-mono">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer text-base leading-none select-none font-bold transition-colors px-1"
              title="Aumentar Zoom"
            >
              +
            </button>
          </div>

          {/* Preset Zoom Selector Dropdown */}
          <select
            value={zoomMode === 'custom' ? scale.toString() : zoomMode}
            onChange={handleZoomPresetChange}
            className="bg-transparent text-slate-500 hover:text-slate-800 text-[10px] sm:text-xs font-semibold px-1 py-1 sm:px-2 sm:py-1.5 rounded-md border border-transparent hover:border-slate-200 focus:border-slate-300 outline-none cursor-pointer text-center focus:ring-0 transition-all duration-150"
          >
            <option value="fit-width">Largura</option>
            <option value="fit-page">Página</option>
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1.0">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
            <option value="2.0">200%</option>
          </select>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

        {/* Presentation Mode Toggle */}
        <button
          onClick={onToggleFullscreen}
          className={`p-1.5 sm:p-2 rounded-md cursor-pointer transition-colors duration-150 ${
            isFullscreen
              ? 'bg-slate-100 text-slate-800'
              : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
          }`}
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>

      </div>
    </header>
  );
};
