import type { BookMetadata, PageContent, ParsedBook } from "./types.js";
import { mapLicense } from "./licenses.js";
import escapeHtml from "escape-html";

export class BloomHtmlTemplates {
  generateHtmlDocument(book: ParsedBook): string {
    return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="Generator" content="Bloom Markdown Converter" />
    <meta name="BloomFormatVersion" content="2.1" />
    <title>${escapeHtml(book.metadata.allTitles[book.metadata.l1] || "Untitled")}</title>
  </head>
  <body>
    ${this.generateBloomDataDiv(book.metadata)}
    ${book.pages.map((page) => this.generatePage(page)).join("\n")}
  </body>
</html>`;
  }

  private generateBloomDataDiv(metadata: BookMetadata): string {
    const elements: string[] = [];

    // Content languages
    elements.push(`<div id="bloomDataDiv">
      <div data-book="contentLanguage1" lang="*">${metadata.l1}</div>`);

    if (metadata.l2) {
      elements.push(
        `      <div data-book="contentLanguage2" lang="*">${metadata.l2}</div>`
      );
    }

    // Cover image
    if (metadata.coverImage) {
      elements.push(
        `      <div data-book="coverImage" lang="*">${escapeHtml(metadata.coverImage)}</div>`
      );
    }

    // Book titles
    for (const [lang, title] of Object.entries(metadata.allTitles)) {
      elements.push(
        `      <div data-book="bookTitle" lang="${lang}">${escapeHtml(title)}</div>`
      );
    }

    // ISBN
    if (metadata.isbn) {
      elements.push(
        `      <div data-book="ISBN" lang="*">${escapeHtml(metadata.isbn)}</div>`
      );
    }

    // Copyright
    if (metadata.copyright) {
      elements.push(
        `      <div data-book="copyright" lang="*">${escapeHtml(metadata.copyright)}</div>`
      );
    }

    // License URL
    if (metadata.license) {
      const licenseUrl = mapLicense(metadata.license);
      elements.push(
        `      <div data-book="licenseUrl" lang="*">${escapeHtml(licenseUrl)}</div>`
      );
    }

    elements.push("    </div>");
    return elements.join("\n");
  }

  private generatePage(page: PageContent): string {
    switch (page.layout) {
      case "image-top-text-bottom":
        return this.generateImageTopTextBottomPage(page);
      case "text-top-image-bottom":
        return this.generateTextTopImageBottomPage(page);
      case "text-only":
      default:
        return this.generateTextOnlyPage(page);
    }
  }

  private generateImageTopTextBottomPage(page: PageContent): string {
    return `    <div class="bloom-page customPage">
      <div class="marginBox">
        <div class="split-pane horizontal-percent">
          <div class="split-pane-component position-top">
            <div class="split-pane-component-inner">
              <div class="bloom-canvas bloom-leadingElement bloom-has-canvas-element">
                <div class="bloom-canvas-element bloom-backgroundImage">
                  <div class="bloom-imageContainer">
                    <img src="${escapeHtml(page.image || "")}" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="split-pane-divider horizontal-divider"></div>
          <div class="split-pane-component position-bottom">
            <div class="split-pane-component-inner">
              <div class="bloom-translationGroup">
${this.generateLanguageTextBlocks(page.textBlocks)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  private generateTextTopImageBottomPage(page: PageContent): string {
    return `    <div class="bloom-page customPage">
      <div class="marginBox">
        <div class="split-pane horizontal-percent">
          <div class="split-pane-component position-top">
            <div class="split-pane-component-inner">
              <div class="bloom-translationGroup">
${this.generateLanguageTextBlocks(page.textBlocks)}
              </div>
            </div>
          </div>
          <div class="split-pane-divider horizontal-divider"></div>
          <div class="split-pane-component position-bottom">
            <div class="split-pane-component-inner">
              <div class="bloom-canvas bloom-leadingElement bloom-has-canvas-element">
                <div class="bloom-canvas-element bloom-backgroundImage">
                  <div class="bloom-imageContainer">
                    <img src="${escapeHtml(page.image || "")}" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  private generateTextOnlyPage(page: PageContent): string {
    return `    <div class="bloom-page customPage">
      <div class="marginBox">
        <div class="split-pane-component-inner">
          <div class="bloom-translationGroup">
${this.generateLanguageTextBlocks(page.textBlocks)}
          </div>
        </div>
      </div>
    </div>`;
  }
  private generateLanguageTextBlocks(
    textBlocks: Record<string, string>
  ): string {
    return Object.entries(textBlocks)
      .map(
        ([
          lang,
          text,
        ]) => `                <div class="bloom-editable" lang="${lang}">
                  <p>${text}</p>
                </div>`
      )
      .join("\n");
  }
}
