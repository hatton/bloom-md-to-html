import { BookMetadata, PageContent, ParsedBook } from './types.js';
import { mapLicense } from './licenses.js';

export class HtmlTemplates {
  
  generateHtmlDocument(book: ParsedBook): string {
    return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="Generator" content="Bloom Markdown Converter" />
    <meta name="BloomFormatVersion" content="2.1" />
    <title>${this.escapeHtml(book.metadata.allTitles[book.metadata.l1] || 'Untitled')}</title>
  </head>
  <body>
    ${this.generateBloomDataDiv(book.metadata)}
    ${book.pages.map(page => this.generatePage(page, book.metadata)).join('\n')}
  </body>
</html>`;
  }

  private generateBloomDataDiv(metadata: BookMetadata): string {
    const elements: string[] = [];
    
    // Content languages
    elements.push(`<div id="bloomDataDiv">
      <div data-book="contentLanguage1" lang="*">${metadata.l1}</div>`);
    
    if (metadata.l2) {
      elements.push(`      <div data-book="contentLanguage2" lang="*">${metadata.l2}</div>`);
    }

    // Cover image
    if (metadata.coverImage) {
      elements.push(`      <div data-book="coverImage" lang="*">${this.escapeHtml(metadata.coverImage)}</div>`);
    }

    // Book titles
    for (const [lang, title] of Object.entries(metadata.allTitles)) {
      elements.push(`      <div data-book="bookTitle" lang="${lang}">${this.escapeHtml(title)}</div>`);
    }

    // ISBN
    if (metadata.isbn) {
      elements.push(`      <div data-book="ISBN" lang="*">${this.escapeHtml(metadata.isbn)}</div>`);
    }

    // Copyright
    if (metadata.copyright) {
      elements.push(`      <div data-book="copyright" lang="*">${this.escapeHtml(metadata.copyright)}</div>`);
    }

    // License URL
    if (metadata.license) {
      const licenseUrl = mapLicense(metadata.license);
      elements.push(`      <div data-book="licenseUrl" lang="*">${this.escapeHtml(licenseUrl)}</div>`);
    }

    elements.push('    </div>');
    return elements.join('\n');
  }

  private generatePage(page: PageContent, metadata: BookMetadata): string {
    switch (page.layout) {
      case 'image-top-text-bottom':
        return this.generateImageTopTextBottomPage(page, metadata);
      case 'text-top-image-bottom':
        return this.generateTextTopImageBottomPage(page, metadata);
      case 'text-only':
      default:
        return this.generateTextOnlyPage(page, metadata);
    }
  }

  private generateImageTopTextBottomPage(page: PageContent, metadata: BookMetadata): string {
    return `    <div class="bloom-page customPage">
      <div class="marginBox">
        <div class="split-pane horizontal-percent">
          <div class="split-pane-component position-top">
            <div class="split-pane-component-inner">
              <div class="bloom-canvas bloom-leadingElement bloom-has-canvas-element">
                <div class="bloom-canvas-element bloom-backgroundImage">
                  <div class="bloom-imageContainer">
                    <img src="${this.escapeHtml(page.image || '')}" />
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

  private generateTextTopImageBottomPage(page: PageContent, metadata: BookMetadata): string {
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
                    <img src="${this.escapeHtml(page.image || '')}" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  private generateTextOnlyPage(page: PageContent, metadata: BookMetadata): string {
    return `    <div class="bloom-page customPage">
      <div class="marginBox">
        <div class="split-pane-component-inner">
          <div class="bloom-translationGroup">
${this.generateLanguageTextBlocks(page.textBlocks)}
          </div>
        </div>
      </div>
    </div>`;
  }  private generateLanguageTextBlocks(textBlocks: Record<string, string>): string {
    return Object.entries(textBlocks)
      .map(([lang, text]) => `                <div class="bloom-editable" lang="${lang}">
                  <p>${text}</p>
                </div>`)
      .join('\n');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
