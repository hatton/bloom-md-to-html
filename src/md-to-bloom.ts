import * as yaml from "js-yaml";
import type {
  BookMetadata,
  PageContent,
  Book,
  ValidationError,
} from "./types.js";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { determinePageLayout } from "./layout-determiner.js";

export class MarkdownToBloomHtml {
  private inputPath?: string;
  private validateImages: boolean;
  private errors: ValidationError[] = [];

  constructor(inputPath?: string, options: { validateImages?: boolean } = {}) {
    this.inputPath = inputPath;
    this.validateImages = options.validateImages ?? true;
  }

  parseMarkdownIntoABookObject(content: string): Book {
    this.errors = [];

    const { frontmatter, body } = this.extractFrontmatter(content);
    const metadata = this.parseMetadata(frontmatter);
    const pages = this.createPageObjects(body, metadata);

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

  private createPageObjects(
    body: string,
    metadata: BookMetadata
  ): PageContent[] {
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
      layout: "text-only", // Default layout
      textBlocks: {},
    };

    let currentLang = "";
    let currentText = "";
    const sequence: Array<string | "image"> = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for images
      const imageMatch = trimmedLine.match(/!\[.*?\]\(([^)]+)\)/);
      if (imageMatch) {
        const imagePath = imageMatch[1];
        page.image = imagePath; // Still store the primary image for the page
        sequence.push("image");

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
        if (currentLang && currentText.trim()) {
          page.textBlocks[currentLang] = this.convertMarkdownToHtml(
            currentText.trim()
          );
        }

        currentLang = langMatch[1];
        currentText = "";
        sequence.push(currentLang); // Add lang to sequence when it's declared

        if (!metadata.languages || !metadata.languages[currentLang]) {
          this.addWarning(
            `Language '${currentLang}' not found in metadata languages (page ${pageNumber})`
          );
        }
        continue;
      }

      if (currentLang) {
        currentText += line + "\n";
      }
    }

    if (currentLang && currentText.trim()) {
      page.textBlocks[currentLang] = this.convertMarkdownToHtml(
        currentText.trim()
      );
    }

    const hasText = Object.keys(page.textBlocks).length > 0;
    const hasImage = sequence.some((item) => item === "image");

    page.layout = determinePageLayout(sequence, metadata.l1, metadata.l2);

    if (!hasText && !hasImage) {
      this.addWarning(`Page ${pageNumber} has no text or image content`);
      return null;
    }

    return page;
  }
  private convertMarkdownToHtml(text: string): string {
    // Apply block transformations first (headings)
    let html = text
      .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
      .replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    // Add other heading levels if needed H3-H6: .replace(/^### (.*?)$/gm, "<h3>$1</h3>") etc.

    // Then apply inline transformations to the whole result
    html = html
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Now, split into paragraphs and wrap appropriately
    return html
      .split(/\n\s*\n/)
      .map((paraBlock) => {
        const trimmedParaBlock = paraBlock.replace(/\n/g, " ").trim();

        if (!trimmedParaBlock) {
          return ""; // Skip empty blocks
        }

        // If the block is already an h-tag or p-tag (or other block tags), don't wrap it in another <p>
        // Regex checks if the string STARTS with a common block tag.
        if (
          /^<(h[1-6]|p|div|ul|ol|li|blockquote|hr|table|figure|figcaption)/i.test(
            trimmedParaBlock
          )
        ) {
          return trimmedParaBlock;
        }

        // Otherwise, it's content that needs to be wrapped in a <p> tag
        return `<p>${trimmedParaBlock}</p>`;
      })
      .filter((block) => block !== "") // Remove empty strings
      .join("");
  }

  private addError(message: string): void {
    this.errors.push({ type: "error", message });
  }

  private addWarning(message: string): void {
    this.errors.push({ type: "warning", message });
  }
}
