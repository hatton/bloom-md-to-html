import * as yaml from "js-yaml";
import type {
  BookMetadata,
  PageContent,
  ParsedBook,
  ValidationError,
} from "./types.js";
import { existsSync } from "fs";
import { dirname, join } from "path";

export class MarkdownToBloomHtml {
  private inputPath?: string;
  private validateImages: boolean;
  private errors: ValidationError[] = [];

  constructor(inputPath?: string, options: { validateImages?: boolean } = {}) {
    this.inputPath = inputPath;
    this.validateImages = options.validateImages ?? true;
  }

  parse(content: string): ParsedBook {
    this.errors = [];

    const { frontmatter, body } = this.extractFrontmatter(content);
    const metadata = this.parseMetadata(frontmatter);
    const pages = this.parsePages(body, metadata);

    if (this.errors.some((e) => e.type === "error")) {
      throw new Error(
        `Validation failed:\n${this.errors.map((e) => `${e.type.toUpperCase()}: ${e.message}`).join("\n")}`
      );
    }

    return { metadata, pages };
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }
  private extractFrontmatter(content: string): {
    frontmatter: string;
    body: string;
  } {
    const frontmatterMatch = content.match(/^---\r?\n(.*?)\r?\n---\r?\n(.*)$/s);
    if (!frontmatterMatch) {
      this.addError("No YAML frontmatter found");
      return { frontmatter: "", body: content };
    }
    return {
      frontmatter: frontmatterMatch[1],
      body: frontmatterMatch[2],
    };
  }

  private parseMetadata(frontmatterText: string): BookMetadata {
    try {
      const metadata = yaml.load(frontmatterText) as BookMetadata;
      this.validateMetadata(metadata);
      return metadata;
    } catch (error) {
      this.addError(`Failed to parse YAML frontmatter: ${error}`);
      return {} as BookMetadata;
    }
  }

  private validateMetadata(metadata: BookMetadata): void {
    if (!metadata.allTitles) {
      this.addError("Missing required field: allTitles");
    }
    if (!metadata.languages) {
      this.addError("Missing required field: languages");
    }
    if (!metadata.l1) {
      this.addError("Missing required field: l1");
    }

    // Validate l1 exists in languages
    if (metadata.l1 && metadata.languages && !metadata.languages[metadata.l1]) {
      this.addError(`Primary language '${metadata.l1}' not found in languages`);
    }

    // Validate l2 exists in languages if specified
    if (metadata.l2 && metadata.languages && !metadata.languages[metadata.l2]) {
      this.addError(
        `Secondary language '${metadata.l2}' not found in languages`
      );
    }
  }

  private parsePages(body: string, metadata: BookMetadata): PageContent[] {
    const pageBreaks = body.split("<!-- page-break -->");
    const pages: PageContent[] = [];

    for (let i = 0; i < pageBreaks.length; i++) {
      const pageContent = pageBreaks[i].trim();
      if (!pageContent) continue;

      const page = this.parsePage(pageContent, metadata, i + 1);
      if (page) {
        pages.push(page);
      }
    }

    return pages;
  }

  private parsePage(
    content: string,
    metadata: BookMetadata,
    pageNumber: number
  ): PageContent | null {
    const lines = content.split("\n");
    const page: PageContent = {
      layout: "text-only",
      textBlocks: {},
    };

    let currentLang = "";
    let currentText = "";
    let imageFound = false;
    let imagePosition: "before" | "after" | "none" = "none";
    let langBlocksStarted = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for images
      const imageMatch = trimmedLine.match(/!\[.*?\]\(([^)]+)\)/);
      if (imageMatch) {
        const imagePath = imageMatch[1];
        page.image = imagePath;
        imageFound = true;
        imagePosition = langBlocksStarted ? "after" : "before";
        // Validate image exists (only if validateImages is true and inputPath is provided)
        if (this.validateImages && this.inputPath) {
          const fullImagePath = join(dirname(this.inputPath), imagePath);
          if (!existsSync(fullImagePath)) {
            this.addWarning(
              `Image not found: ${imagePath} (page ${pageNumber})`
            );
          }
        }
        continue;
      }

      // Check for language blocks
      const langMatch = trimmedLine.match(/<!-- lang=([a-z]{2,3}) -->/);
      if (langMatch) {
        // Save previous language block
        if (currentLang && currentText.trim()) {
          page.textBlocks[currentLang] = this.convertMarkdownToHtml(
            currentText.trim()
          );
        }

        currentLang = langMatch[1];
        currentText = "";
        langBlocksStarted = true;

        // Validate language exists in metadata
        if (!metadata.languages || !metadata.languages[currentLang]) {
          this.addWarning(
            `Language '${currentLang}' not found in metadata languages (page ${pageNumber})`
          );
        }
        continue;
      }

      // Collect text content
      if (currentLang) {
        currentText += line + "\n";
      }
    }

    // Save final language block
    if (currentLang && currentText.trim()) {
      page.textBlocks[currentLang] = this.convertMarkdownToHtml(
        currentText.trim()
      );
    }

    // Determine layout
    if (imageFound) {
      page.layout =
        imagePosition === "before"
          ? "image-top-text-bottom"
          : "text-top-image-bottom";
    }

    // Validate page has content
    if (Object.keys(page.textBlocks).length === 0) {
      this.addWarning(`Page ${pageNumber} has no text content`);
      return null;
    }

    return page;
  }

  private convertMarkdownToHtml(text: string): string {
    return (
      text
        // Bold text: **text** -> <strong>text</strong>
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italic text: *text* -> <em>text</em>
        .replace(/\*([^*]+?)\*/g, "<em>$1</em>")
        // Links: [text](url) -> <a href="url">text</a>
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Line breaks: preserve line breaks as <br>
        .replace(/\n/g, "<br>")
    );
  }

  private addError(message: string): void {
    this.errors.push({ type: "error", message });
  }

  private addWarning(message: string): void {
    this.errors.push({ type: "warning", message });
  }
}
