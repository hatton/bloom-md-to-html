export interface BookMetadata {
  allTitles: Record<string, string>;
  languages: Record<string, string>;
  l1: string; // primary language
  l2?: string; // secondary language
  coverImage?: string;
  isbn?: string;
  license?: string;
  copyright?: string;
}

export interface PageContent {
  layout: "image-top-text-bottom" | "text-top-image-bottom" | "text-only";
  image?: string;
  textBlocks: Record<string, string>; // lang -> text
}

export interface ParsedBook {
  metadata: BookMetadata;
  pages: PageContent[];
}

export interface ConversionStats {
  pages: number;
  languages: string[];
  images: number;
  layouts: Record<string, number>;
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  line?: number;
}
