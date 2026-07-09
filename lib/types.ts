export type LayoutMode = 'single' | 'double' | 'book';

export type SidebarTab = 'thumbnails' | 'outline' | 'info' | 'notes' | 'search' | 'ai-image' | 'history';

export interface SearchMatch {
  id: string;
  pageNumber: number;
  text: string;
  snippet: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentInfo {
  title: string;
  author: string;
  creator: string;
  producer: string;
  creationDate: string;
  pageSize: string;
  fileSize: string;
}

export interface PDFOutlineItem {
  title: string;
  dest: any;
  pageIndex?: number;
  items?: PDFOutlineItem[];
}

export interface PageNote {
  id: string;
  pageNumber: number;
  text: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  totalPages: number;
  fileSize: string;
  viewedAt: string;
  lastPage: number;
  isSample?: boolean;
}
