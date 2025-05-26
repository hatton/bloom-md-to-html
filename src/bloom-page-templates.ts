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
      case "image-only":
        return this.generateImageOnlyPage(page);
      case "image-top-text-bottom":
        return this.generateImageTopTextBottomPage(page);
      case "text-top-image-bottom":
        return this.generateTextTopImageBottomPage(page);
      case "text-image-text":
        // "V", and "N1" are special placeholders for the first and second languages
        // We normally use these instead of actual language codes
        return this.generateImageInMiddlePage(page, "V", "V");
      case "bilingual-text-image-text":
        return this.generateImageInMiddlePage(page, "V", "N1");
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
            ${this.imageBlock(page.image)}
          </div>
          <div class="split-pane-divider horizontal-divider"></div>
          <div class="split-pane-component position-bottom">
              ${this.textBlock(page.textBlocks, ["V"])}
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
            ${this.textBlock(page.textBlocks, ["V"])}
          </div>
          <div class="split-pane-divider horizontal-divider"></div>
          <div class="split-pane-component position-bottom">
            ${this.imageBlock(page.image)}
          </div>
        </div>
      </div>
    </div>`;
  }

  private generateTextOnlyPage(page: PageContent): string {
    return `<div class="bloom-page customPage">
              <div class="marginBox">
                ${this.textBlock(page.textBlocks, ["V"])}
              </div>
            </div>`;
  }

  private generateImageOnlyPage(page: PageContent): string {
    return `<div class="bloom-page customPage">
              <div class="marginBox">
                  ${this.imageBlock(page.image || "")}
              </div>
            </div>`;
  }
  private generateImageInMiddlePage(
    page: PageContent,
    topLang: string,
    bottomLang: string
  ): string {
    return `<div class="bloom-page customPage">
          <div class="marginBox">
            <div class="split-pane horizontal-percent">
                <div class="split-pane-component position-top" >
                   ${this.textBlock(page.textBlocks, [topLang])}
                </div>
                <div class="split-pane-divider horizontal-divider"></div>

                <div class="split-pane-component position-bottom">
                    <div class="split-pane-component-inner">
                        <div class="split-pane horizontal-percent">
                            <div class="split-pane-component position-top">
                               ${this.imageBlock(page.image)}
                            </div>
                            <div class="split-pane-divider horizontal-divider"></div>

                            <div class="split-pane-component position-bottom">
                               ${this.textBlock(page.textBlocks, [bottomLang])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
  }
  private imageBlock(imagePath?: string): string {
    return `<div class="split-pane-component-inner">
                <div class="bloom-canvas bloom-leadingElement bloom-has-canvas-element">
                    <div class="bloom-canvas-element bloom-backgroundImage">
                        <div class="bloom-leadingElement bloom-imageContainer">
                          <img src="${escapeHtml(imagePath || "")}" />
                        </div>
                    </div>
                </div>
            </div>`;
  }

  private textBlock(
    textBlocks: Record<string, string>,
    langs: string[]
  ): string {
    return `<div class="split-pane-component-inner">
                        <div class="bloom-translationGroup"  data-default-languages="${langs.join(",")}" >
                          ${this.bloomEditables(textBlocks)}
                        </div>
                    </div>`;
  }
  private bloomEditables(textBlocks: Record<string, string>): string {
    return Object.entries(textBlocks)
      .map(
        ([
          lang,
          text,
        ]) => `                <div class="bloom-editable" lang="${lang}">
                  ${text}
                </div>`
      )
      .join("\n");
  }
}

/*
<div class="bloom-page numberedPage customPage bloom-combinedPage A5Portrait bloom-monolingual side-right" data-page="" id="7147f286-0cc5-4645-a6d0-a9ca5f135239" data-pagelineage="adcd48df-e9ab-4a07-afd4-6a24d039838A" data-page-number="1" lang="">
        <div class="pageLabel" lang="en" data-i18n="TemplateBooks.PageLabel.Bilingual &amp; Picture in Middle">
            Bilingual &amp; Picture in Middle
        </div>
        <div class="pageDescription" lang="en"></div>

        <div class="marginBox">
            <div class="split-pane horizontal-percent" style="min-height: 40px;">
                <div class="split-pane-component position-top" style="bottom: 76%">
                    <div class="split-pane-component-inner">
                        <div class="bloom-translationGroup" data-default-languages="V" style="font-size: 16px;">
                            <div class="bloom-editable normal-style bloom-visibility-code-on bloom-content1" lang="mxa" contenteditable="true" data-languagetipcontent="Northwest Oaxaca Mixtec" tabindex="0" spellcheck="false" role="textbox" aria-label="false" style="min-height: 24px;">
                                <p>ONE lang</p>
                            </div>

                            <div class="bloom-editable" lang="z" contenteditable="true" style="">
                                <p></p>
                            </div>
                            <div class="bloom-editable normal-style bloom-contentNational1" lang="es" contenteditable="true" style="" data-languagetipcontent="español" tabindex="0" spellcheck="false" role="textbox" aria-label="false"></div>
                        </div>
                    </div>
                </div>
                <div class="split-pane-divider horizontal-divider" style="bottom: 76%"></div>

                <div class="split-pane-component position-bottom" style="height: 76%">
                    <div class="split-pane-component-inner">
                        <div class="split-pane horizontal-percent" style="min-height: 48px;">
                            <div class="split-pane-component position-top" style="bottom: 30%">
                                <div class="split-pane-component-inner">
                                    <div class="bloom-canvas bloom-leadingElement bloom-has-canvas-element" data-imgsizebasedon="469,374" data-title="For the current paper size: • The image container is 469 x 374 dots. • For print publications, you want between 300-600 DPI (Dots Per Inch). • An image with 1466 x 1169 dots would fill this container at 300 DPI." title="">
                                        <div class="bloom-canvas-element bloom-backgroundImage" data-bubble="{`version`:`1.0`,`style`:`none`,`tails`:[],`level`:1,`backgroundColors`:[`transparent`],`shadowOffset`:0}" style="width: 380.699px; top: 0px; left: 44.1507px; height: 374px;">
                                            <div class="bloom-leadingElement bloom-imageContainer"><img src="placeHolder.png" alt="" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="split-pane-divider horizontal-divider" style="bottom: 30%"></div>

                            <div class="split-pane-component position-bottom" style="height: 30%">
                                <div class="split-pane-component-inner">
                                    <div class="bloom-translationGroup" data-default-languages="N1" style="font-size: 16px;">
                                        <div class="bloom-editable normal-style bloom-content1" lang="mxa" contenteditable="true" style="" data-languagetipcontent="Northwest Oaxaca Mixtec" tabindex="0" spellcheck="false" role="textbox" aria-label="false"></div>

                                        <div class="bloom-editable" lang="z" contenteditable="true" style="">
                                            <p></p>
                                        </div>

                                        <div class="bloom-editable normal-style bloom-visibility-code-on bloom-contentNational1" lang="es" contenteditable="true" data-languagetipcontent="español" tabindex="0" spellcheck="false" role="textbox" aria-label="false" style="min-height: 24px;">
                                            <p>another lang</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bloom-page numberedPage customPage A5Portrait bloom-monolingual side-left" data-page="" id="8970d778-bf52-4d60-88d6-854b7142c9eb" data-pagelineage="adcd48df-e9ab-4a07-afd4-6a24d0398385" data-page-number="2" lang="">
        <div class="pageLabel" lang="en" data-i18n="TemplateBooks.PageLabel.Just a Picture">
            Just a Picture
        </div>
        <div class="pageDescription" lang="en"></div>

        <div class="marginBox">
            <div class="split-pane-component-inner">
                <div class="bloom-canvas bloom-has-canvas-element" data-imgsizebasedon="469,703" data-title="For the current paper size: • The image container is 469 x 703 dots. • For print publications, you want between 300-600 DPI (Dots Per Inch). • An image with 1466 x 2197 dots would fill this container at 300 DPI." title="">
                    <div class="bloom-canvas-element bloom-backgroundImage" data-bubble="{`version`:`1.0`,`style`:`none`,`tails`:[],`level`:1,`backgroundColors`:[`transparent`],`shadowOffset`:0}" style="width: 469px; left: 0px; top: 121.126px; height: 460.748px;">
                        <div class="bloom-imageContainer"><img src="placeHolder.png" alt="" /></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bloom-page numberedPage customPage A5Portrait side-right bloom-monolingual" data-page="" id="e936bffd-5241-472c-a391-9edc7945d7cd" data-pagelineage="5dcd48df-e9ab-4a07-afd4-6a24d0398386" data-page-number="3" lang="">
        <div class="pageLabel" lang="en" data-i18n="TemplateBooks.PageLabel.Custom">
            Custom
        </div>
        <div class="pageDescription" lang="en"></div>

        <div class="marginBox">
            <div class="split-pane-component-inner" min-width="60px 150px 250px" min-height="60px 150px 250px">
                <div class="bloom-translationGroup bloom-trailingElement" data-default-languages="N1" style="font-size: 16px;">
                    <div class="bloom-editable normal-style bloom-content1" contenteditable="true" lang="mxa" style="" data-languagetipcontent="Northwest Oaxaca Mixtec" tabindex="0" spellcheck="false" role="textbox" aria-label="false"></div>

                    <div class="bloom-editable normal-style bloom-visibility-code-on bloom-contentNational1" contenteditable="true" lang="es" data-languagetipcontent="español" tabindex="0" spellcheck="false" role="textbox" aria-label="false" style="min-height: 24px;">
                        <p>L2-only page</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    */
