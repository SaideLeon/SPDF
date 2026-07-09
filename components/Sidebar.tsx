'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Image as ImageIcon, 
  Info, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  FolderTree,
  FileQuestion,
  Calendar,
  Layers,
  Cpu,
  Search,
  X,
  Loader2,
  Sparkles,
  Clock
} from 'lucide-react';
import { SidebarTab, DocumentInfo, PDFOutlineItem, PageNote, SearchMatch, HistoryItem } from '@/lib/types';
import { AIImagePanel } from '@/components/AIImagePanel';

interface SidebarProps {
  isOpen: boolean;
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  pdfDocument: any; // PDFDocumentProxy
  currentPage: number; // 1-indexed
  onPageSelect: (pageNumber: number) => void;
  notes: PageNote[];
  onAddNote: (pageNumber: number, text: string) => void;
  onDeleteNote: (id: string) => void;
  docInfo: DocumentInfo | null;
  outline: PDFOutlineItem[];
  totalPages: number;
  onClose?: () => void;
  
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchMatch[];
  currentMatchIndex: number;
  setCurrentMatchIndex: (index: number) => void;
  isSearchingText: boolean;
  onSearch: (query: string) => void;
  onClearSearch: () => void;

  // AI State & Callbacks
  selectedImage: string | null;
  setSelectedImage: (img: string | null) => void;
  isCropModeActive: boolean;
  setIsCropModeActive: (active: boolean) => void;
  onActivateCrop: () => void;
  aiImageAnalysis: any | null;
  setAiImageAnalysis: (val: any | null) => void;
  generatedImage: string | null;
  setGeneratedImage: (img: string | null) => void;

  // History State & Callbacks
  historyList?: HistoryItem[];
  onSelectHistoryItem?: (item: HistoryItem) => void;
  onDeleteHistoryItem?: (id: string, e: React.MouseEvent) => void;
  onClearHistory?: () => void;
  currentPdfId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeTab,
  setActiveTab,
  pdfDocument,
  currentPage,
  onPageSelect,
  notes,
  onAddNote,
  onDeleteNote,
  docInfo,
  outline,
  totalPages,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  currentMatchIndex,
  setCurrentMatchIndex,
  isSearchingText,
  onSearch,
  onClearSearch,
  selectedImage,
  setSelectedImage,
  isCropModeActive,
  setIsCropModeActive,
  onActivateCrop,
  aiImageAnalysis,
  setAiImageAnalysis,
  generatedImage,
  setGeneratedImage,
  historyList = [],
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  currentPdfId
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [notePageInput, setNotePageInput] = useState<number>(currentPage);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotePageInput(currentPage);
  }, [currentPage]);

  if (!isOpen) return null;

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    
    // Ensure page number is valid
    const targetPage = Math.max(1, Math.min(totalPages, notePageInput));
    onAddNote(targetPage, newNoteText);
    setNewNoteText('');
  };

  return (
    <aside className="fixed md:static top-14 bottom-9 md:bottom-auto left-0 h-[calc(100vh-92px)] md:h-[calc(100vh-56px)] w-85 md:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0 select-none overflow-hidden z-45 shadow-xl md:shadow-none transition-all duration-200 ease-in-out">
      
      {/* Mobile Header with Close Button */}
      {onClose && (
        <div className="flex md:hidden items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-150 select-none shrink-0">
          <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-500" />
            Navegação & Ferramentas
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200/60 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Switchers */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1 shrink-0 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('thumbnails')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-md transition-all duration-150 text-[9px] md:text-[11px] font-semibold border px-0.5 md:px-1 min-w-[54px] ${
            activeTab === 'thumbnails'
              ? 'bg-white border-slate-200 text-slate-800 shadow-3xs'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/40'
          }`}
          title="Miniaturas"
        >
          <ImageIcon className="w-3.5 h-3.5 mb-0.5 md:mb-1" />
          Miniaturas
        </button>

        <button
          onClick={() => setActiveTab('outline')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-md transition-all duration-150 text-[9px] md:text-[11px] font-semibold border px-0.5 md:px-1 min-w-[45px] ${
            activeTab === 'outline'
              ? 'bg-white border-slate-200 text-slate-800 shadow-3xs'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/40'
          }`}
          title="Índice"
        >
          <FolderTree className="w-3.5 h-3.5 mb-0.5 md:mb-1" />
          Índice
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-md transition-all duration-150 text-[9px] md:text-[11px] font-semibold border px-0.5 md:px-1 min-w-[40px] ${
            activeTab === 'info'
              ? 'bg-white border-slate-200 text-slate-800 shadow-3xs'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/40'
          }`}
          title="Informações"
        >
          <Info className="w-3.5 h-3.5 mb-0.5 md:mb-1" />
          Info
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-md transition-all duration-150 text-[9px] md:text-[11px] font-semibold border px-0.5 md:px-1 min-w-[54px] ${
            activeTab === 'notes'
              ? 'bg-white border-slate-200 text-slate-800 shadow-3xs'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/40'
          }`}
          title="Anotações"
        >
          <FileText className="w-3.5 h-3.5 mb-0.5 md:mb-1" />
          Anotações
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-md transition-all duration-150 text-[9px] md:text-[11px] font-semibold border px-0.5 md:px-1 min-w-[45px] ${
            activeTab === 'search'
              ? 'bg-white border-slate-200 text-slate-800 shadow-3xs'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/40'
          }`}
          title="Buscar Texto"
        >
          <Search className="w-3.5 h-3.5 mb-0.5 md:mb-1" />
          Buscar
        </button>

        <button
          onClick={() => setActiveTab('ai-image')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-md transition-all duration-150 text-[9px] md:text-[11px] font-semibold border px-0.5 md:px-1 min-w-[54px] ${
            activeTab === 'ai-image'
              ? 'bg-white border-slate-200 text-slate-800 shadow-3xs'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/40'
          }`}
          title="Gerador de Imagem AI"
        >
          <Sparkles className="w-3.5 h-3.5 mb-0.5 md:mb-1 text-slate-500" />
          Imagem AI
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-md transition-all duration-150 text-[9px] md:text-[11px] font-semibold border px-0.5 md:px-1 min-w-[54px] ${
            activeTab === 'history'
              ? 'bg-white border-slate-200 text-slate-800 shadow-3xs'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/40'
          }`}
          title="Histórico de Arquivos"
        >
          <Clock className="w-3.5 h-3.5 mb-0.5 md:mb-1 text-slate-500" />
          Histórico
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {/* THUMBNAILS TAB */}
        {activeTab === 'thumbnails' && (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isSelected = pageNum === currentPage;
              return (
                <div
                  key={pageNum}
                  onClick={() => onPageSelect(pageNum)}
                  className={`flex flex-col items-center cursor-pointer group p-1.5 rounded-md border transition-all duration-150 ${
                    isSelected
                      ? 'border-slate-800 bg-slate-50/60 shadow-xs ring-1 ring-slate-800/10'
                      : 'border-slate-200 hover:border-slate-400 bg-white hover:shadow-3xs'
                  }`}
                >
                  {/* Thumbnail canvas or placeholder */}
                  <ThumbnailItem
                    pdfDocument={pdfDocument}
                    pageNumber={pageNum}
                    isSelected={isSelected}
                  />
                  <span className={`mt-1 text-[11px] font-mono ${
                    isSelected ? 'text-slate-800 font-bold' : 'text-slate-500'
                  }`}>
                    {pageNum}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* OUTLINE TAB */}
        {activeTab === 'outline' && (
          <div className="space-y-1">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3 select-none">
              Índice do Documento
            </h3>
            {outline && outline.length > 0 ? (
              <div className="space-y-1 bg-white border border-slate-200/80 rounded-lg p-2 max-h-full overflow-y-auto">
                {outline.map((item, index) => (
                  <OutlineNode 
                    key={index} 
                    item={item} 
                    onPageSelect={onPageSelect} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-slate-50/50 border border-slate-200/60 rounded-md">
                <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-700 mb-0.5">
                  Nenhum índice encontrado
                </p>
                <p className="text-[10px] text-slate-400 leading-normal max-w-[180px] mx-auto">
                  Este PDF não possui um índice de tópicos integrado.
                </p>
              </div>
            )}
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider select-none">
              Metadados do Arquivo
            </h3>
            {docInfo ? (
              <div className="bg-white border border-slate-150 rounded-lg p-4 space-y-4 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                    Título
                  </label>
                  <p className="font-semibold text-slate-800 break-words leading-relaxed">
                    {docInfo.title || 'Sem título'}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                    Autor
                  </label>
                  <p className="font-medium text-slate-600 break-words">
                    {docInfo.author || 'Desconhecido'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                      Páginas
                    </label>
                    <div className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {totalPages}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                      Tamanho
                    </label>
                    <p className="font-semibold text-slate-700">
                      {docInfo.fileSize}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                      Data de Criação
                    </label>
                    <div className="flex items-center gap-1 text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {docInfo.creationDate || 'Não disponível'}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                      Acelerador
                    </label>
                    <div className="flex items-center gap-1 text-slate-600 font-medium">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" />
                      PDF.js Canvas
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                    Ferramenta de Criação
                  </label>
                  <p className="text-slate-500 font-mono text-[10px] break-all leading-relaxed">
                    {docInfo.creator || 'Não identificada'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-slate-50/50 border border-slate-200/60 rounded-md">
                <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Carregando metadados...
                </p>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider select-none">
                Anotações do Leitor
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full border border-slate-200/55 font-mono">
                {notes.length}
              </span>
            </div>

            {/* Note creation form */}
            <form onSubmit={handleAddNoteSubmit} className="bg-slate-50/60 border border-slate-200 rounded-lg p-3.5 space-y-3 shadow-3xs">
              <div className="flex items-center gap-2 justify-between">
                <span className="text-[11px] font-semibold text-slate-600">
                  Página da anotação:
                </span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={notePageInput}
                  onChange={(e) => setNotePageInput(parseInt(e.target.value) || 1)}
                  className="w-14 px-1.5 py-0.5 border border-slate-200 rounded text-xs text-center font-mono font-semibold focus:border-slate-400 outline-none bg-white"
                />
              </div>

              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Escreva sua anotação aqui..."
                rows={3}
                className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-slate-400 bg-white leading-relaxed resize-none text-slate-700"
              />

              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Anotação
              </button>
            </form>

            {/* Notes list */}
            <div className="space-y-3">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all duration-150 shadow-3xs relative group/note"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => onPageSelect(note.pageNumber)}
                        className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors cursor-pointer border border-slate-200/30"
                      >
                        Pág. {note.pageNumber}
                      </button>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(note.createdAt).toLocaleDateString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pr-6 font-medium">
                      {note.text}
                    </p>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover/note:opacity-100 transition-all duration-150 cursor-pointer"
                      title="Excluir anotação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 px-4 bg-slate-50/50 border border-slate-200/60 rounded-md">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-700">
                    Nenhuma anotação criada
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto mt-0.5 leading-normal">
                    Faça anotações vinculadas às páginas para estudar ou marcar pontos importantes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div className="space-y-4 flex flex-col h-full overflow-hidden">
            <div className="space-y-2 select-none">
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Buscar no PDF
              </h3>
              
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSearch(searchQuery);
                    }
                  }}
                  placeholder="Buscar termo ou palavra..."
                  className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-slate-400 bg-slate-50/40 text-slate-700 font-medium"
                />
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={onClearSearch}
                    className="absolute right-2.5 p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Limpar busca"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <button
                onClick={() => onSearch(searchQuery)}
                disabled={isSearchingText || !searchQuery.trim()}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSearchingText ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Buscar
                  </>
                )}
              </button>
            </div>

            {/* Results section */}
            <div className="flex-1 overflow-y-auto min-h-0 pt-2 space-y-3">
              {isSearchingText ? (
                <div className="text-center py-12 select-none">
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-500">Varrendo páginas do documento...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-slate-500 font-medium pb-1.5 border-b border-slate-100 select-none">
                    <span className="text-[11px] text-slate-400 font-semibold font-mono">
                      {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={currentMatchIndex <= 0}
                        onClick={() => {
                          const newIdx = currentMatchIndex - 1;
                          setCurrentMatchIndex(newIdx);
                          onPageSelect(searchResults[newIdx].pageNumber);
                          // Scroll into view
                          setTimeout(() => {
                            const matchEl = document.getElementById(`match-item-${searchResults[newIdx].id}`);
                            matchEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }, 50);
                        }}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 cursor-pointer transition-colors"
                        title="Resultado Anterior"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-slate-600 px-1">
                        {currentMatchIndex + 1} de {searchResults.length}
                      </span>
                      <button
                        disabled={currentMatchIndex >= searchResults.length - 1}
                        onClick={() => {
                          const newIdx = currentMatchIndex + 1;
                          setCurrentMatchIndex(newIdx);
                          onPageSelect(searchResults[newIdx].pageNumber);
                          // Scroll into view
                          setTimeout(() => {
                            const matchEl = document.getElementById(`match-item-${searchResults[newIdx].id}`);
                            matchEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }, 50);
                        }}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 cursor-pointer transition-colors"
                        title="Próximo Resultado"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pr-1">
                    {searchResults.map((match, idx) => {
                      const isActive = idx === currentMatchIndex;
                      // Highlight matching query inside the snippet helper
                      const parts = match.snippet.split(new RegExp(`(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
                      return (
                        <div
                          key={match.id}
                          id={`match-item-${match.id}`}
                          onClick={() => {
                            setCurrentMatchIndex(idx);
                            onPageSelect(match.pageNumber);
                          }}
                          className={`p-2.5 rounded-lg border transition-all duration-150 cursor-pointer text-left ${
                            isActive
                              ? 'border-orange-500 bg-orange-50/30 ring-1 ring-orange-500/20 shadow-3xs'
                              : 'border-slate-100 hover:border-slate-200 bg-slate-50/20 hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5 select-none">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              isActive
                                ? 'bg-orange-50 text-orange-700 border-orange-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200/50'
                            }`}>
                              Pág. {match.pageNumber}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider">
                                Ativo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {parts.map((part, i) => 
                              part.toLowerCase() === searchQuery.toLowerCase() ? (
                                <mark key={i} className="bg-amber-100 text-slate-900 font-bold px-0.5 rounded-[2px] border border-amber-200/50">
                                  {part}
                                </mark>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : searchQuery ? (
                <div className="text-center py-10 px-4 bg-slate-50/50 border border-slate-200/60 rounded-md select-none">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-700">Nenhum resultado encontrado</p>
                  <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto mt-0.5 leading-normal">
                    Não encontramos ocorrências de &quot;{searchQuery}&quot; no documento. Tente outra palavra-chave.
                  </p>
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-slate-50/50 border border-slate-200/60 rounded-md select-none">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-700">Buscar no Documento</p>
                  <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto mt-0.5 leading-normal">
                    Digite um termo ou palavra-chave acima para escanear todo o texto do arquivo PDF.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI IMAGE TAB */}
        {activeTab === 'ai-image' && (
          <AIImagePanel
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            isCropModeActive={isCropModeActive}
            setIsCropModeActive={setIsCropModeActive}
            onActivateCrop={onActivateCrop}
            analysis={aiImageAnalysis}
            setAnalysis={setAiImageAnalysis}
            generatedImage={generatedImage}
            setGeneratedImage={setGeneratedImage}
          />
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 shrink-0">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Arquivos Recentes
              </span>
              {historyList.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline transition-colors cursor-pointer"
                  title="Limpar todo o histórico"
                >
                  Limpar Tudo
                </button>
              )}
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50/50 border border-slate-200/60 rounded-md select-none">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-700">Nenhum PDF no histórico</p>
                <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto mt-0.5 leading-normal">
                  Seus documentos abertos recentemente aparecerão aqui para fácil acesso.
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto pr-1">
                {historyList.map((item) => {
                  const isActive = item.id === currentPdfId;
                  let dateStr = '';
                  try {
                    dateStr = new Date(item.viewedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  } catch (e) {
                    dateStr = 'Recente';
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectHistoryItem && onSelectHistoryItem(item)}
                      className={`flex items-start justify-between p-3 rounded-lg border transition-all duration-150 cursor-pointer text-left group ${
                        isActive
                          ? 'border-slate-800 bg-slate-50/60 shadow-xs ring-1 ring-slate-800/10'
                          : 'border-slate-200 hover:border-slate-450 bg-white hover:shadow-3xs'
                      }`}
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className={`text-xs font-bold truncate ${isActive ? 'text-slate-900' : 'text-slate-800'}`} title={item.title}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                          <span>{item.totalPages} pág.</span>
                          <span>•</span>
                          <span>{item.fileSize}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
                          <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                            Visto: {dateStr}
                          </span>
                          {item.lastPage > 1 && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">
                              Pág. {item.lastPage}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteHistoryItem) {
                            onDeleteHistoryItem(item.id, e);
                          }
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-500 rounded transition-colors self-center cursor-pointer shrink-0"
                        title="Remover do histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

/* Renders nested PDF Outlines recursively */
interface OutlineNodeProps {
  item: PDFOutlineItem;
  onPageSelect: (pageNumber: number) => void;
}

const OutlineNode: React.FC<OutlineNodeProps> = ({ item, onPageSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.items && item.items.length > 0;

  const handleClick = () => {
    if (item.pageIndex !== undefined) {
      onPageSelect(item.pageIndex + 1);
    }
  };

  return (
    <div className="text-xs font-sans">
      <div className="flex items-center hover:bg-slate-50 rounded-md py-1 px-1 transition-colors duration-150">
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-slate-200 rounded text-slate-500 cursor-pointer shrink-0 mr-0.5"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        ) : (
          <div className="w-4.5 h-4.5 shrink-0" />
        )}
        <button
          onClick={handleClick}
          className={`flex-1 text-left truncate cursor-pointer font-medium text-slate-700 hover:text-slate-900 ${
            item.pageIndex !== undefined ? 'active:text-black font-semibold' : 'pointer-events-none'
          }`}
          title={item.title}
        >
          {item.title}
        </button>
        {item.pageIndex !== undefined && (
          <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2 mr-1">
            {item.pageIndex + 1}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="pl-4 ml-2 border-l border-slate-200 mt-0.5 space-y-0.5">
          {item.items!.map((child, index) => (
            <OutlineNode 
              key={index} 
              item={child} 
              onPageSelect={onPageSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* Heavy helper component: Renders a miniature page preview as a thumbnail */
interface ThumbnailItemProps {
  pdfDocument: any;
  pageNumber: number;
  isSelected: boolean;
}

const ThumbnailItem: React.FC<ThumbnailItemProps> = ({ pdfDocument, pageNumber, isSelected }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    if (!pdfDocument) return;

    pdfDocument.getPage(pageNumber).then((p: any) => {
      if (active) setPage(p);
    }).catch(console.error);

    return () => {
      active = false;
    };
  }, [pdfDocument, pageNumber]);

  useEffect(() => {
    let active = true;
    if (!page) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    // Render scale for small thumbnail
    const scale = 0.16;
    const viewport = page.getViewport({ scale });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Clear background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // Safe to ignore
      }
    }

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      background: 'rgb(255, 255, 255)'
    };

    const renderTask = page.render(renderContext);
    renderTaskRef.current = renderTask;

    renderTask.promise
      .then(() => {
        if (active) setLoading(false);
      })
      .catch((err: any) => {
        if (err && err.name !== 'RenderingCancelledException') {
          console.error('Thumbnail render error:', err);
        }
      });

    return () => {
      active = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [page]);

  return (
    <div className="w-24 h-32 flex items-center justify-center bg-white border border-slate-100 rounded relative overflow-hidden shadow-xs shrink-0 select-none">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-5">
          <span className="text-[10px] text-slate-400 font-mono animate-pulse">
            Carregando...
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full block object-contain transition-transform duration-200 ${
          isSelected ? 'scale-[1.03]' : 'group-hover:scale-[1.02]'
        }`}
      />
    </div>
  );
};
