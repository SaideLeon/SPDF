'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Loader2, 
  BookOpen, 
  ChevronRight, 
  Upload, 
  HelpCircle,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import { PDFCanvas } from '@/components/PDFCanvas';
import { LayoutMode, SidebarTab, DocumentInfo, PDFOutlineItem, PageNote, SearchMatch, HistoryItem } from '@/lib/types';
import { getSamplePdfBytes } from '@/lib/samplePdf';
import { motion, AnimatePresence } from 'motion/react';

// Setup PDF.js worker
const pdfjsVersion = pdfjsLib.version || '6.1.200';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

// Helper date formatting for PDF CreationDate (e.g., D:202607082250+03'00')
const formatPDFDate = (dateStr?: string): string => {
  if (!dateStr) return 'Não especificada';
  try {
    const cleaned = dateStr.replace('D:', '');
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);
    const hours = cleaned.substring(8, 10);
    const minutes = cleaned.substring(10, 12);
    if (!year) return 'Data indefinida';
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr || '';
  }
};

// Human bytes formatter
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function PdfReaderApp() {
  // Document State
  const [pdfDocument, setPdfDocument] = useState<any | null>(null);
  const [pdfPages, setPdfPages] = useState<{ [key: number]: any }>({});
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const prevPageRef = useRef(1);
  const loadedPagesRef = useRef<{ [key: number]: boolean }>({});

  // Track page navigation direction
  useEffect(() => {
    if (currentPage > prevPageRef.current) {
      setDirection('forward');
    } else if (currentPage < prevPageRef.current) {
      setDirection('backward');
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);
  
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentPdfBytes, setCurrentPdfBytes] = useState<Uint8Array | ArrayBuffer | null>(null);
  const [currentPdfId, setCurrentPdfId] = useState<string>('sample');
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  // Layout & Zoom State
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('double');
  const [scale, setScale] = useState(0.85);
  const [zoomMode, setZoomMode] = useState<string>('fit-page'); // 'fit-width' | 'fit-page' | 'custom'

  // Sidebar & Interactivity State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('thumbnails');
  const [docInfo, setDocInfo] = useState<DocumentInfo | null>(null);
  const [outline, setOutline] = useState<PDFOutlineItem[]>([]);
  const [notes, setNotes] = useState<PageNote[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const [isSearchingText, setIsSearchingText] = useState(false);
  
  // App UI State
  const [dragOver, setDragOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);

  // AI Image Selection & Generation State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCropModeActive, setIsCropModeActive] = useState<boolean>(false);
  const [aiImageAnalysis, setAiImageAnalysis] = useState<any | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleImageCropped = (base64Image: string) => {
    setSelectedImage(base64Image);
    setIsCropModeActive(false);
    setSidebarOpen(true);
    setActiveSidebarTab('ai-image');
    setAiImageAnalysis(null);
    setGeneratedImage(null);
  };

  // DOM Refs
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  // PDF loading function
  const loadPdf = useCallback(async (bytes: Uint8Array | ArrayBuffer, pdfId: string) => {
    setLoading(true);
    setLoadProgress(10);
    setErrorMsg(null);
    setPdfPages({});
    loadedPagesRef.current = {};
    setCurrentPage(1);

    try {
      const loadingTask = pdfjsLib.getDocument({
        data: bytes
      });

      loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
        if (progressData.total > 0) {
          const percent = Math.round((progressData.loaded / progressData.total) * 100);
          setLoadProgress(percent);
        } else {
          setLoadProgress((prev) => Math.min(prev + 10, 90));
        }
      };

      const pdf = await loadingTask.promise;
      setLoadProgress(100);
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPdfId(pdfId);
      setCurrentPdfBytes(bytes);

      // Extract metadata
      try {
        const meta: any = await pdf.getMetadata();
        const info = meta?.info;
        const resolvedTitle = info?.Title || (pdfId === 'sample' ? 'Exemplo_Dupla_Pagina.pdf' : 'Documento PDF');
        const formattedSize = formatBytes(bytes.byteLength);

        const formattedInfo: DocumentInfo = {
          title: resolvedTitle,
          author: info?.Author || 'Autor desconhecido',
          creator: info?.Creator || 'Desconhecido',
          producer: info?.Producer || 'Desconhecido',
          creationDate: formatPDFDate(info?.CreationDate),
          pageSize: 'A4 padrão',
          fileSize: formattedSize
        };
        setDocInfo(formattedInfo);

        // Update history
        setHistoryList(prev => {
          const filtered = prev.filter(item => item.id !== pdfId);
          const newItem: HistoryItem = {
            id: pdfId,
            title: resolvedTitle,
            totalPages: pdf.numPages,
            fileSize: formattedSize,
            viewedAt: new Date().toISOString(),
            lastPage: 1,
            isSample: pdfId === 'sample'
          };
          const updated = [newItem, ...filtered].slice(0, 10);
          try {
            localStorage.setItem('dupla_pdf_history_list', JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to save history list:', e);
          }
          return updated;
        });
      } catch (err) {
        console.error('Metadata read error:', err);
      }

      // Extract outline
      try {
        const rawOutline = await pdf.getOutline();
        if (rawOutline && rawOutline.length > 0) {
          const resolveItems = async (items: any[]): Promise<PDFOutlineItem[]> => {
            const resolved: PDFOutlineItem[] = [];
            for (const item of items) {
              let pageIndex: number | undefined = undefined;
              if (item.dest) {
                try {
                  const resolvedDest = typeof item.dest === 'string' ? item.dest : item.dest;
                  pageIndex = await pdf.getPageIndex(resolvedDest);
                } catch (e) {
                  if (Array.isArray(item.dest) && item.dest.length > 0) {
                    try {
                      pageIndex = await pdf.getPageIndex(item.dest[0]);
                    } catch (e2) {}
                  }
                }
              }

              const resolvedChildren = item.items && item.items.length > 0 
                ? await resolveItems(item.items) 
                : [];

              resolved.push({
                title: item.title,
                dest: item.dest,
                pageIndex,
                items: resolvedChildren
              });
            }
            return resolved;
          };

          const res = await resolveItems(rawOutline);
          setOutline(res);
        } else {
          setOutline([]);
        }
      } catch (err) {
        console.error('Outline read error:', err);
        setOutline([]);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('PDF parsing failure:', err);
      setErrorMsg(err?.message || 'Falha ao analisar o arquivo PDF. Verifique se o arquivo não está corrompido.');
      setLoading(false);
    }
  }, []);

  const loadPdfData = useCallback((
    data: ArrayBuffer | Uint8Array,
    pdfId: string = 'sample',
    fallbackTitle: string = 'Documento PDF',
    isSample: boolean = false,
    initialPage: number = 1
  ) => {
    loadPdf(data, pdfId).then(() => {
      if (initialPage > 1) {
        setCurrentPage(initialPage);
      }
    });
  }, [loadPdf]);

  // Auto-adapt to mobile screens on mount and window resize
  useEffect(() => {
    const handleScreenSizeAdaptation = () => {
      const isMobileSize = window.innerWidth < 768;
      if (isMobileSize) {
        setLayoutMode('single');
        setSidebarOpen(false);
      }
    };
    // Run once on load
    handleScreenSizeAdaptation();
    
    // Listen to resize
    window.addEventListener('resize', handleScreenSizeAdaptation);

    // Register Progressive Web App Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('PWA Service Worker registered successfully with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('PWA Service Worker registration failed:', error);
          });
      });
    }

    return () => window.removeEventListener('resize', handleScreenSizeAdaptation);
  }, []);

  // Load notes from Local Storage on mount
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('dupla_pdf_notes');
      if (savedNotes) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotes(JSON.parse(savedNotes));
      }
    } catch (e) {
      console.error('Failed to load notes from local storage:', e);
    }
  }, []);

  // Sync notes to Local Storage
  const saveNotes = (updatedNotes: PageNote[]) => {
    setNotes(updatedNotes);
    try {
      localStorage.setItem('dupla_pdf_notes', JSON.stringify(updatedNotes));
    } catch (e) {
      console.error('Failed to save notes to local storage:', e);
    }
  };

  // Load history list from Local Storage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('dupla_pdf_history_list');
      if (savedHistory) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistoryList(JSON.parse(savedHistory));
      } else {
        const initialList: HistoryItem[] = [{
          id: 'sample',
          title: 'Exemplo_Dupla_Pagina.pdf',
          totalPages: 10,
          fileSize: '1.2 MB',
          viewedAt: new Date().toISOString(),
          lastPage: 1,
          isSample: true
        }];
        setHistoryList(initialList);
        localStorage.setItem('dupla_pdf_history_list', JSON.stringify(initialList));
      }
    } catch (e) {
      console.error('Failed to load history list:', e);
    }
  }, []);

  // Update lastPage in history list when currentPage or currentPdfId changes
  useEffect(() => {
    if (!currentPdfId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistoryList(prev => {
      if (prev.length === 0) return prev;
      const currentItem = prev.find(item => item.id === currentPdfId);
      if (currentItem && currentItem.lastPage === currentPage) {
        return prev;
      }
      const updated = prev.map(item => {
        if (item.id === currentPdfId) {
          return { ...item, lastPage: currentPage, viewedAt: new Date().toISOString() };
        }
        return item;
      });
      try {
        localStorage.setItem('dupla_pdf_history_list', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history list:', e);
      }
      return updated;
    });
  }, [currentPage, currentPdfId]);

  // Load sample on mount
  useEffect(() => {
    const loadSample = async () => {
      try {
        const sampleBytes = getSamplePdfBytes();
        await loadPdf(sampleBytes, 'sample');
      } catch (err: any) {
        console.error('Error loading default sample PDF:', err);
        setErrorMsg('Failed to load sample PDF');
        setLoading(false);
      }
    };
    loadSample();
  }, [loadPdf]);

  const handleAddNote = (pageNumber: number, text: string) => {
    const newNote: PageNote = {
      id: `note-${Date.now()}`,
      pageNumber,
      text,
      createdAt: new Date().toISOString()
    };
    saveNotes([newNote, ...notes]);
  };

  const handleDeleteNote = (id: string) => {
    saveNotes(notes.filter(note => note.id !== id));
  };

  // Navigation handlers
  const handlePageChange = useCallback((pageNumber: number) => {
    const boundedPage = Math.max(1, Math.min(totalPages, pageNumber));

    if (layoutMode === 'double') {
      const adjusted = boundedPage % 2 === 0 ? Math.max(1, boundedPage - 1) : boundedPage;
      setCurrentPage(adjusted);
    } else if (layoutMode === 'book') {
      if (boundedPage === 1) {
        setCurrentPage(1);
      } else {
        const adjusted = boundedPage % 2 !== 0 ? Math.max(2, boundedPage - 1) : boundedPage;
        setCurrentPage(adjusted);
      }
    } else {
      setCurrentPage(boundedPage);
    }

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [totalPages, layoutMode]);

  // File Upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        const buffer = e.target.result as ArrayBuffer;
        const pdfId = `pdf-${Date.now()}`;
        try {
          const { savePdfBytes } = await import('@/lib/pdfHistoryDb');
          await savePdfBytes(pdfId, buffer);
        } catch (err) {
          console.error('Failed to save PDF to offline history store:', err);
        }
        loadPdfData(buffer, pdfId, file.name, false, 1);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // History action handlers
  const handleSelectHistoryItem = async (item: HistoryItem) => {
    if (item.isSample) {
      loadPdfData(getSamplePdfBytes(), 'sample', 'Exemplo_Dupla_Pagina.pdf', true, item.lastPage || 1);
    } else {
      setLoading(true);
      try {
        const { getPdfBytes } = await import('@/lib/pdfHistoryDb');
        const bytes = await getPdfBytes(item.id);
        if (bytes) {
          loadPdfData(bytes, item.id, item.title, false, item.lastPage || 1);
        } else {
          setErrorMsg('Não foi possível encontrar os dados offline deste arquivo PDF. Ele pode ter sido excluído.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to load PDF from IndexedDB:', err);
        setErrorMsg('Erro ao ler o documento do armazenamento offline.');
        setLoading(false);
      }
    }
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (id !== 'sample') {
        const { deletePdfBytes } = await import('@/lib/pdfHistoryDb');
        await deletePdfBytes(id);
      }
      setHistoryList(prev => {
        const updated = prev.filter(item => item.id !== id);
        try {
          localStorage.setItem('dupla_pdf_history_list', JSON.stringify(updated));
        } catch (err) {
          console.error('Failed to save updated history list:', err);
        }
        return updated;
      });

      if (currentPdfId === id) {
        loadPdfData(getSamplePdfBytes(), 'sample', 'Exemplo_Dupla_Pagina.pdf', true, 1);
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const handleClearHistory = async () => {
    try {
      const { clearAllPdfBytes } = await import('@/lib/pdfHistoryDb');
      await clearAllPdfBytes();

      const initialList: HistoryItem[] = [{
        id: 'sample',
        title: 'Exemplo_Dupla_Pagina.pdf',
        totalPages: totalPages || 10,
        fileSize: docInfo?.fileSize || '1.2 MB',
        viewedAt: new Date().toISOString(),
        lastPage: 1,
        isSample: true
      }];
      setHistoryList(initialList);
      localStorage.setItem('dupla_pdf_history_list', JSON.stringify(initialList));

      loadPdfData(getSamplePdfBytes(), 'sample', 'Exemplo_Dupla_Pagina.pdf', true, 1);
    } catch (err) {
      console.error('Failed to clear history database:', err);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        handleFileUpload(file);
      } else {
        alert('Por favor, envie um arquivo PDF válido.');
      }
    }
  };

  // Fullscreen implementation
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Track fullscreen changes from ESC key etc
  useEffect(() => {
    const updateFullscreenStatus = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', updateFullscreenStatus);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenStatus);
  }, []);

  // Keyboard Navigation Bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || 
         activeElement.tagName === 'TEXTAREA' || 
         activeElement.hasAttribute('contenteditable'))
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (layoutMode === 'single') {
          handlePageChange(currentPage + 1);
        } else if (layoutMode === 'double') {
          handlePageChange(currentPage + 2);
        } else {
          if (currentPage === 1) {
            handlePageChange(2);
          } else {
            handlePageChange(currentPage + 2);
          }
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (layoutMode === 'single') {
          handlePageChange(currentPage - 1);
        } else if (layoutMode === 'double') {
          handlePageChange(currentPage - 2);
        } else {
          if (currentPage <= 3) {
            handlePageChange(1);
          } else {
            handlePageChange(currentPage - 2);
          }
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomMode('custom');
        setScale(prev => Math.min(3.0, prev + 0.15));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoomMode('custom');
        setScale(prev => Math.max(0.3, prev - 0.15));
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, layoutMode, handlePageChange]);

  const calculateScale = useCallback(() => {
    if (!pdfDocument || !workspaceRef.current || zoomMode === 'custom') return;

    pdfDocument.getPage(1).then((pageProxy: any) => {
      const viewport = pageProxy.getViewport({ scale: 1.0 });
      const workspaceWidth = workspaceRef.current!.clientWidth - 64; 
      const workspaceHeight = workspaceRef.current!.clientHeight - 64;

      const isDoubleLayout = layoutMode === 'double' || (layoutMode === 'book' && currentPage > 1);
      const multiplier = isDoubleLayout ? 2 : 1;

      let targetScale = 1.0;

      if (zoomMode === 'fit-width') {
        targetScale = workspaceWidth / (viewport.width * multiplier);
      } else if (zoomMode === 'fit-page') {
        targetScale = workspaceHeight / viewport.height;
      }

      const boundedScale = Math.max(0.35, Math.min(2.5, targetScale));
      setScale(boundedScale);
    }).catch((err: any) => {
      console.error('Error calculating scale:', err);
    });
  }, [pdfDocument, zoomMode, layoutMode, currentPage]);

  // Calculate scale on resize
  useEffect(() => {
    const handleResize = () => {
      if (zoomMode !== 'custom') {
        calculateScale();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateScale, zoomMode]);

  useEffect(() => {
    calculateScale();
  }, [calculateScale]);

  // Lazy load/preload PDF pages in a range around currentPage with proximity-based priority
  useEffect(() => {
    if (!pdfDocument || loading) return;

    let active = true;

    // Define preloading range around the current page
    const rangeStart = Math.max(1, currentPage - 4);
    const rangeEnd = Math.min(totalPages, currentPage + 5);

    // Identify which pages in the range are not yet loaded
    const pagesToLoad: number[] = [];
    for (let p = rangeStart; p <= rangeEnd; p++) {
      if (!loadedPagesRef.current[p]) {
        pagesToLoad.push(p);
      }
    }

    if (pagesToLoad.length === 0) return;

    // Sort pagesToLoad by absolute distance to currentPage so closest pages load first
    pagesToLoad.sort((a, b) => {
      const distA = Math.abs(a - currentPage);
      const distB = Math.abs(b - currentPage);
      if (distA !== distB) {
        return distA - distB;
      }
      return a - b; // Prefer forward direction
    });

    // Load page proxies sequentially in small batches (concurrency = 2) to prevent CPU hogging
    const loadSequential = async () => {
      const batchSize = 2;
      for (let i = 0; i < pagesToLoad.length; i += batchSize) {
        if (!active) return;
        const chunk = pagesToLoad.slice(i, i + batchSize);

        const results = await Promise.all(
          chunk.map(async (pageNum) => {
            try {
              const pageProxy = await pdfDocument.getPage(pageNum);
              return { pageNum, pageProxy };
            } catch (err) {
              console.error(`Error loading page proxy for page ${pageNum}:`, err);
              return null;
            }
          })
        );

        if (!active) return;

        const newPages: { [key: number]: any } = {};
        let hasNew = false;
        results.forEach((res) => {
          if (res) {
            newPages[res.pageNum] = res.pageProxy;
            loadedPagesRef.current[res.pageNum] = true;
            hasNew = true;
          }
        });

        if (hasNew) {
          setPdfPages((prev) => ({
            ...prev,
            ...newPages,
          }));
        }
      }
    };

    loadSequential();

    return () => {
      active = false;
    };
  }, [pdfDocument, currentPage, layoutMode, totalPages, loading]);

  // Search logic
  const handleSearch = async (query: string) => {
    if (!query.trim() || !pdfDocument) return;
    setIsSearchingText(true);
    setCurrentMatchIndex(-1);
    
    try {
      const searchPromises = Array.from({ length: totalPages }, async (_, i) => {
        const pageNum = i + 1;
        try {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageMatches: SearchMatch[] = [];
          
          textContent.items.forEach((item: any, itemIndex: number) => {
            if (!item.str) return;
            const strLower = item.str.toLowerCase();
            const queryLower = query.toLowerCase();
            let idx = strLower.indexOf(queryLower);
            
            while (idx !== -1) {
              const charWidth = item.str.length > 0 ? (item.width / item.str.length) : 0;
              const matchX = item.transform[4] + charWidth * idx;
              const matchWidth = charWidth * query.length;
              const matchY = item.transform[5];
              
              const startSnippet = Math.max(0, idx - 20);
              const endSnippet = Math.min(item.str.length, idx + query.length + 20);
              const snippetText = item.str.substring(startSnippet, endSnippet);
              
              pageMatches.push({
                id: `match-${pageNum}-${itemIndex}-${idx}`,
                pageNumber: pageNum,
                text: item.str,
                snippet: (startSnippet > 0 ? '...' : '') + snippetText + (endSnippet < item.str.length ? '...' : ''),
                x: matchX,
                y: matchY,
                width: matchWidth || 50,
                height: item.height || 12,
              });
              
              idx = strLower.indexOf(queryLower, idx + 1);
            }
          });
          return pageMatches;
        } catch (e) {
          console.error(`Erro ao buscar texto na página ${pageNum}`, e);
          return [];
        }
      });
      
      const results = await Promise.all(searchPromises);
      const allMatches = results.flat();
      setSearchResults(allMatches);
      
      if (allMatches.length > 0) {
        setCurrentMatchIndex(0);
        handlePageChange(allMatches[0].pageNumber);
      }
    } catch (err) {
      console.error("Erro geral na busca de texto:", err);
    } finally {
      setIsSearchingText(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentMatchIndex(-1);
  };

  // Print logic
  const isPrintingCancelledRef = useRef(false);

  const handlePrint = async () => {
    if (!pdfDocument) return;
    isPrintingCancelledRef.current = false;
    setIsPreparingPrint(true);
    setPrintProgress(0);
    
    try {
      let printContainer = document.getElementById('print-container');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        document.body.appendChild(printContainer);
      }
      printContainer.innerHTML = '';
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (isPrintingCancelledRef.current) {
          printContainer.innerHTML = '';
          return;
        }
        setPrintProgress(pageNum);
        const page = await pdfDocument.getPage(pageNum);
        
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.className = 'print-page-canvas';
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;
          
          const pageDiv = document.createElement('div');
          pageDiv.className = 'print-page-break';
          pageDiv.appendChild(canvas);
          printContainer.appendChild(pageDiv);
        }
      }
      
      if (isPrintingCancelledRef.current) {
        printContainer.innerHTML = '';
        return;
      }
      
      setTimeout(() => {
        window.print();
        setIsPreparingPrint(false);
        setPrintProgress(0);
      }, 500);
      
    } catch (err) {
      console.error('Erro ao preparar impressão de PDF:', err);
      setIsPreparingPrint(false);
      setPrintProgress(0);
      
      if (currentPdfBytes) {
        const blob = new Blob([currentPdfBytes as any], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      }
    }
  };

  return (
    <div 
      id="pdf-app-root"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden select-none"
    >
      {/* File Drag Over Overlay */}
      {dragOver && (
        <div id="drag-overlay" className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white z-50 pointer-events-none transition-all duration-300">
          <Upload className="w-16 h-16 mb-4 animate-bounce stroke-[1.5]" />
          <h2 className="text-xl font-bold tracking-tight">Solte seu PDF para abrir!</h2>
          <p className="text-slate-400 text-xs mt-1">Carregando e renderizando localmente de forma instantânea.</p>
        </div>
      )}

      {/* Main Toolbar */}
      <Toolbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={currentPage}
        totalPages={totalPages}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        scale={scale}
        setScale={setScale}
        zoomMode={zoomMode}
        setZoomMode={setZoomMode}
        onPageChange={handlePageChange}
        onFileUpload={handleFileUpload}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        docTitle={docInfo?.title}
        onPrint={handlePrint}
        isCropModeActive={isCropModeActive}
        setIsCropModeActive={setIsCropModeActive}
      />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar Backdrop on Mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px] z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Collapsible Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          pdfDocument={pdfDocument}
          currentPage={currentPage}
          onPageSelect={handlePageChange}
          notes={notes}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          docInfo={docInfo}
          outline={outline}
          totalPages={totalPages}
          
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          currentMatchIndex={currentMatchIndex}
          setCurrentMatchIndex={setCurrentMatchIndex}
          isSearchingText={isSearchingText}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}

          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          isCropModeActive={isCropModeActive}
          setIsCropModeActive={setIsCropModeActive}
          onActivateCrop={() => setIsCropModeActive(true)}
          aiImageAnalysis={aiImageAnalysis}
          setAiImageAnalysis={setAiImageAnalysis}
          generatedImage={generatedImage}
          setGeneratedImage={setGeneratedImage}

          historyList={historyList}
          onSelectHistoryItem={handleSelectHistoryItem}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
          currentPdfId={currentPdfId}
        />

        {/* Viewport Canvas Stage Container - Clean Minimalism slate-100 / F2F2F2 workspace */}
        <main
          ref={workspaceRef}
          className="flex-1 overflow-auto bg-[#F2F2F2] p-2 sm:p-6 flex flex-col items-center relative focus:outline-none focus:ring-1 focus:ring-slate-300"
          id="pdf-workspace-area"
        >
          {isCropModeActive && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold z-40 animate-in slide-in-from-top-4 duration-300">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Modo Seleção Ativo: Clique e arraste sobre qualquer página do PDF para recortar</span>
              <button 
                onClick={() => setIsCropModeActive(false)}
                className="ml-2 hover:bg-white/20 bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="relative flex items-center justify-center mb-5">
                {/* Custom Elegant Circular Progress Ring */}
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-slate-200 fill-none"
                    strokeWidth="4"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-slate-800 fill-none transition-all duration-300 ease-out"
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - loadProgress / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-slate-800 font-mono tracking-tighter leading-none">
                    {loadProgress}%
                  </span>
                  <span className="text-[8px] font-mono font-semibold uppercase text-slate-400 mt-0.5 tracking-wider">
                    Lido
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1.5 font-sans">
                Processando Documento PDF
              </h3>
              <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed mb-4">
                Por favor, aguarde enquanto decodificamos as páginas e renderizamos o layout de leitura...
              </p>
              
              {/* Secondary Horizontal Progress Bar */}
              <div className="w-56 h-1 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-slate-800 transition-all duration-300 ease-out" 
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
            </div>
          ) : errorMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
              <div className="bg-rose-50 p-4 rounded-full text-rose-500 mb-4 shadow-3xs border border-rose-100 animate-pulse">
                <AlertCircle className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Houve um problema ao abrir o PDF</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">{errorMsg}</p>
              <button
                onClick={() => loadPdfData(getSamplePdfBytes())}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer"
              >
                Carregar PDF de Exemplo
              </button>
            </div>
          ) : (
            <div 
              className={`flex justify-center select-none ${
                layoutMode === 'single'
                  ? 'flex-col items-center space-y-8'
                  : 'flex-row items-start'
              } transition-all duration-300 py-4`}
              style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
              id="pdf-render-spread"
            >
              {/* PAGE RENDERING LOGIC WITH STATIC INSTANT LOADED PAGES */}
              {layoutMode === 'single' && (
                <div className="origin-center shadow-2xl rounded-md bg-white">
                  <PDFCanvas
                    page={pdfPages[currentPage]}
                    scale={scale}
                    pageNumber={currentPage}
                    matches={searchResults.filter((m) => m.pageNumber === currentPage)}
                    activeMatchId={currentMatchIndex !== -1 ? searchResults[currentMatchIndex].id : undefined}
                    isCropModeActive={isCropModeActive}
                    onImageCropped={handleImageCropped}
                  />
                </div>
              )}

              {layoutMode === 'double' && (
                <div className="flex flex-row items-start gap-4 sm:gap-6 relative">
                  {/* SPINE CREASE SHADOW */}
                  <div 
                    className="absolute left-1/2 top-0 bottom-0 w-[24px] -translate-x-1/2 pointer-events-none z-20 bg-gradient-to-r from-black/0 via-black/15 to-black/0 shadow-[inset_0_0_10px_rgba(0,0,0,0.08)] mix-blend-multiply"
                  />
                  
                  <div className="shadow-[-10px_10px_20px_rgba(0,0,0,0.15),_0_2px_5px_rgba(0,0,0,0.1)] rounded-l-md overflow-hidden bg-white">
                    <PDFCanvas
                      page={pdfPages[currentPage]}
                      scale={scale}
                      pageNumber={currentPage}
                      matches={searchResults.filter((m) => m.pageNumber === currentPage)}
                      activeMatchId={currentMatchIndex !== -1 ? searchResults[currentMatchIndex].id : undefined}
                      isCropModeActive={isCropModeActive}
                      onImageCropped={handleImageCropped}
                    />
                  </div>

                  {currentPage + 1 <= totalPages ? (
                    <div className="shadow-[10px_10px_20px_rgba(0,0,0,0.15),_0_2px_5px_rgba(0,0,0,0.1)] rounded-r-md overflow-hidden bg-white">
                      <PDFCanvas
                        page={pdfPages[currentPage + 1]}
                        scale={scale}
                        pageNumber={currentPage + 1}
                        matches={searchResults.filter((m) => m.pageNumber === currentPage + 1)}
                        activeMatchId={currentMatchIndex !== -1 ? searchResults[currentMatchIndex].id : undefined}
                        isCropModeActive={isCropModeActive}
                        onImageCropped={handleImageCropped}
                      />
                    </div>
                  ) : (
                    <div 
                      className="border border-dashed border-slate-300 rounded-r-md bg-slate-50/50 flex items-center justify-center select-none"
                      style={{
                        width: pdfPages[currentPage] ? `${Math.floor(pdfPages[currentPage].view[2] * scale)}px` : '300px',
                        height: pdfPages[currentPage] ? `${Math.floor(pdfPages[currentPage].view[3] * scale)}px` : '400px'
                      }}
                    >
                      <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">[ Fim ]</span>
                    </div>
                  )}
                </div>
              )}

              {layoutMode === 'book' && (
                currentPage === 1 ? (
                  /* Cover page centered with an elegant opening animation */
                  <div className="flex flex-col items-center">
                    <div className="mb-2.5 text-[10px] font-mono text-slate-400 font-bold tracking-wider uppercase select-none flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      [ Capa ]
                    </div>
                    <div className="shadow-[15px_15px_30px_rgba(0,0,0,0.2),_0_4px_8px_rgba(0,0,0,0.1)] rounded-md border-r-4 border-slate-800 bg-white">
                      <PDFCanvas
                        page={pdfPages[currentPage]}
                        scale={scale}
                        pageNumber={currentPage}
                        matches={searchResults.filter((m) => m.pageNumber === currentPage)}
                        activeMatchId={currentMatchIndex !== -1 ? searchResults[currentMatchIndex].id : undefined}
                        isCropModeActive={isCropModeActive}
                        onImageCropped={handleImageCropped}
                      />
                    </div>
                  </div>
                ) : (
                  /* Other pages in Book Mode */
                  <div className="flex flex-row items-start gap-4 sm:gap-6 relative">
                    {/* SPINE CREASE SHADOW */}
                    <div 
                      className="absolute left-1/2 top-0 bottom-0 w-[24px] -translate-x-1/2 pointer-events-none z-20 bg-gradient-to-r from-black/0 via-black/15 to-black/0 shadow-[inset_0_0_10px_rgba(0,0,0,0.08)] mix-blend-multiply"
                    />

                    <div className="shadow-[-10px_10px_20px_rgba(0,0,0,0.15),_0_2px_5px_rgba(0,0,0,0.1)] rounded-l-md overflow-hidden bg-white">
                      <PDFCanvas
                        page={pdfPages[currentPage]}
                        scale={scale}
                        pageNumber={currentPage}
                        matches={searchResults.filter((m) => m.pageNumber === currentPage)}
                        activeMatchId={currentMatchIndex !== -1 ? searchResults[currentMatchIndex].id : undefined}
                        isCropModeActive={isCropModeActive}
                        onImageCropped={handleImageCropped}
                      />
                    </div>

                    {currentPage + 1 <= totalPages ? (
                      <div className="shadow-[10px_10px_20px_rgba(0,0,0,0.15),_0_2px_5px_rgba(0,0,0,0.1)] rounded-r-md overflow-hidden bg-white">
                        <PDFCanvas
                          page={pdfPages[currentPage + 1]}
                          scale={scale}
                          pageNumber={currentPage + 1}
                          matches={searchResults.filter((m) => m.pageNumber === currentPage + 1)}
                          activeMatchId={currentMatchIndex !== -1 ? searchResults[currentMatchIndex].id : undefined}
                          isCropModeActive={isCropModeActive}
                          onImageCropped={handleImageCropped}
                        />
                      </div>
                    ) : (
                      <div 
                        className="border border-dashed border-slate-300 rounded-r-md bg-slate-50/50 flex items-center justify-center select-none"
                        style={{
                          width: pdfPages[currentPage] ? `${Math.floor(pdfPages[currentPage].view[2] * scale)}px` : '300px',
                          height: pdfPages[currentPage] ? `${Math.floor(pdfPages[currentPage].view[3] * scale)}px` : '400px'
                        }}
                      >
                        <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">[ Fim ]</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Floater controls */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-full shadow-md transition-all duration-150 cursor-pointer flex items-center justify-center group"
              title="Atalhos do Teclado"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      {/* Beautiful Minimalist Full-Width Bottom Status Footer */}
      <footer className="h-9 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 select-none text-[11px] text-slate-500 font-medium z-30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Leitor Ativo</span>
          <span className="text-slate-200">|</span>
          <span>Modo: {layoutMode === 'single' ? 'Página Única' : layoutMode === 'double' ? 'Páginas Duplas' : 'Modo Livro'}</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-slate-400">
          {docInfo && (
            <>
              <span>{docInfo.fileSize}</span>
              <span>•</span>
            </>
          )}
          <span>Zoom: {Math.round(scale * 100)}%</span>
          <span>•</span>
          <span>Pág. {currentPage} de {totalPages || 0}</span>
        </div>
      </footer>

      {/* Keyboard Shortcuts Dialog Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 mb-4 select-none">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Atalhos do Teclado
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Próxima Página</span>
                <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-600 font-bold">
                  → / ↓
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Página Anterior</span>
                <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-600 font-bold">
                  ← / ↑
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Aumentar Zoom</span>
                <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-600 font-bold">
                  + ou =
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Diminuir Zoom</span>
                <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-600 font-bold">
                  -
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Modo Tela Cheia</span>
                <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-600 font-bold">
                  F
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full mt-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors duration-150 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Print Preparation Dialog Modal */}
      {isPreparingPrint && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-6 relative text-center animate-in fade-in zoom-in-95 duration-150">
            <Loader2 className="w-10 h-10 text-slate-800 animate-spin mx-auto mb-4 stroke-[1.5]" />
            <h3 className="text-sm font-bold text-slate-800 mb-1">Preparando Documento</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Renderizando página <span className="font-semibold text-slate-700">{printProgress}</span> de <span className="font-semibold text-slate-700">{totalPages}</span> para qualidade de impressão.
            </p>
            
            {/* Elegant progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-5 overflow-hidden">
              <div 
                className="bg-slate-900 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(printProgress / totalPages) * 100}%` }}
              ></div>
            </div>

            <button
              onClick={() => {
                isPrintingCancelledRef.current = true;
                setIsPreparingPrint(false);
                setPrintProgress(0);
              }}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 font-semibold text-xs rounded transition-all duration-150 cursor-pointer hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
