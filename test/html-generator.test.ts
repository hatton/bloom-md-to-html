import { describe, it, expect } from "bun:test";
import { HtmlGenerator } from "../src/html-generator.js";
import type { BookMetadata, PageContent, Book } from "../src/types.js";

describe("HtmlTemplates", () => {
  const templates = new HtmlGenerator();

  const mockMetadata: BookMetadata = {
    allTitles: { en: "Test Book", es: "Libro de Prueba" },
    languages: { en: "English", es: "Español" },
    l1: "en",
    l2: "es",
    license: "CC-BY",
    copyright: "2025 Test Author",
  };

  it("should generate complete HTML document", () => {
    const mockPage: PageContent = {
      layout: "text-only",
      textBlocks: { en: "Hello world", es: "Hola mundo" },
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [mockPage],
    };

    const html = templates.generateHtmlDocument(book);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Test Book</title>");
    expect(html).toContain('data-book="contentLanguage1"');
    expect(html).toContain('data-book="bookTitle"');
    expect(html).toContain("bloom-page customPage");
  });

  it("should generate Bloom data div with all metadata", () => {
    const mockPage: PageContent = {
      layout: "text-only",
      textBlocks: { en: "Test" },
    };

    const book: Book = {
      metadata: {
        ...mockMetadata,
        isbn: "978-0123456789",
        coverImage: "cover.jpg",
      },
      pages: [mockPage],
    };

    const html = templates.generateHtmlDocument(book);

    expect(html).toContain('data-book="contentLanguage1" lang="*">en');
    expect(html).toContain('data-book="contentLanguage2" lang="*">es');
    expect(html).toContain('data-book="coverImage" lang="*">cover.jpg');
    expect(html).toContain('data-book="ISBN" lang="*">978-0123456789');
    expect(html).toContain('data-book="copyright" lang="*">2025 Test Author');
    expect(html).toContain(
      'data-book="licenseUrl" lang="*">http://creativecommons.org/licenses/by/4.0/'
    );
  });

  it("should generate different page layouts correctly", () => {
    const textOnlyPage: PageContent = {
      layout: "text-only",
      textBlocks: { en: "Text only content" },
    };

    const imageTopPage: PageContent = {
      layout: "image-top-text-bottom",
      image: "test.jpg",
      textBlocks: { en: "Text below image" },
    };

    const textTopPage: PageContent = {
      layout: "text-top-image-bottom",
      image: "test.jpg",
      textBlocks: { en: "Text above image" },
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [textOnlyPage, imageTopPage, textTopPage],
    };

    const html = templates.generateHtmlDocument(book);

    // Check that different layouts are present
    expect(html).toContain("split-pane horizontal-percent"); // Image layouts
    expect(html).toContain("position-top");
    expect(html).toContain("position-bottom");
    expect(html).toContain("bloom-imageContainer");
  });
  it("should escape HTML characters properly in metadata but preserve HTML in content", () => {
    const mockPage: PageContent = {
      layout: "text-only",
      // This text would have already been converted by the parser
      textBlocks: {
        en: "Text with <strong>bold</strong> and <em>italic</em> formatting",
      },
    };

    const metadataWithSpecialChars: BookMetadata = {
      ...mockMetadata,
      allTitles: { en: 'Book & "Special" <chars>' },
    };

    const book: Book = {
      metadata: metadataWithSpecialChars,
      pages: [mockPage],
    };

    const html = templates.generateHtmlDocument(book);

    // Metadata should be escaped
    expect(html).toContain("Book &amp; &quot;Special&quot; &lt;chars&gt;");
    // Content HTML formatting should be preserved
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });
  it("should preserve problematic characters in text blocks", () => {
    const mockPage: PageContent = {
      layout: "text-only",
      textBlocks: {
        en: "Text with & < > \" ' characters and <div>raw html</div>",
      },
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [mockPage],
    };

    const html = templates.generateHtmlDocument(book);

    // Special characters in text blocks should not be escaped
    expect(html).toContain(
      "Text with & < > \" ' characters and <div>raw html</div>"
    );
  });

  it("should not double-wrap text content that already contains paragraph tags", () => {
    const mockPage: PageContent = {
      layout: "text-only",
      textBlocks: {
        en: "<p>First paragraph.</p><p>Second paragraph.</p>",
        es: "<h1>Heading</h1><p>Text after heading.</p>",
      },
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [mockPage],
    };

    const html = templates.generateHtmlDocument(book);

    // Should not have double paragraph tags
    expect(html).not.toContain("<p><p>");
    expect(html).not.toContain("</p></p>");
    expect(html).not.toContain("<p><h1>");

    // Should preserve the original formatting
    expect(html).toContain('<div class="bloom-editable" lang="en">');
    expect(html).toContain("<p>First paragraph.</p><p>Second paragraph.</p>");
    expect(html).toContain('<div class="bloom-editable" lang="es">');
    expect(html).toContain("<h1>Heading</h1><p>Text after heading.</p>");
  });

  it("should generate image-only page layout correctly", () => {
    const imageOnlyPage: PageContent = {
      layout: "image-only",
      image: "standalone-image.jpg",
      textBlocks: {}, // No text blocks for image-only layout
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [imageOnlyPage],
    };

    const html = templates.generateHtmlDocument(book);

    // Should contain image-only layout structure
    expect(html).toContain("bloom-page customPage");
    expect(html).toContain("bloom-imageContainer");
    expect(html).toContain("standalone-image.jpg");

    // Should not contain split-pane structures, and nono text blocks
    expect(html).not.toContain("split-pane horizontal-percent");
    expect(html).not.toContain("bloom-translationGroup");
    expect(html).not.toContain("bloom-editable");
  });

  it("should generate text-image-text page layout correctly", () => {
    const textImageTextPage: PageContent = {
      layout: "text-image-text",
      image: "middle-image.jpg",
      textBlocks: {
        en: "Text above the image",
        es: "Texto arriba de la imagen",
      },
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [textImageTextPage],
    };

    const html = templates.generateHtmlDocument(book);

    // Should contain complex split-pane structure for text-image-text layout
    expect(html).toContain("split-pane horizontal-percent");
    expect(html).toContain("position-top");
    expect(html).toContain("position-bottom");
    expect(html).toContain("split-pane-divider horizontal-divider");

    // Should contain the image
    expect(html).toContain("bloom-imageContainer");
    expect(html).toContain("middle-image.jpg");

    // Should contain text blocks with V language setting (both languages in same section)
    expect(html).toContain('data-default-languages="V"');
    expect(html).toContain("Text above the image");
    expect(html).toContain("Texto arriba de la imagen");

    // Should have nested split-pane structure (image in middle)
    expect(html).toContain("split-pane-component-inner");
  });

  it("should generate bilingual-text-image-text page layout correctly", () => {
    const bilingualTextImageTextPage: PageContent = {
      layout: "bilingual-text-image-text",
      image: "center-image.png",
      textBlocks: {
        en: "English text in top section",
        es: "Spanish text in bottom section",
      },
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [bilingualTextImageTextPage],
    };

    const html = templates.generateHtmlDocument(book);

    // Should contain complex split-pane structure for bilingual layout
    expect(html).toContain("split-pane horizontal-percent");
    expect(html).toContain("position-top");
    expect(html).toContain("position-bottom");
    expect(html).toContain("split-pane-divider horizontal-divider");

    // Should contain the image
    expect(html).toContain("bloom-imageContainer");
    expect(html).toContain("center-image.png");

    // Should contain both V and N1 language settings (different sections)
    expect(html).toContain('data-default-languages="V"');
    expect(html).toContain('data-default-languages="N1"');
    expect(html).toContain("English text in top section");
    expect(html).toContain("Spanish text in bottom section");

    // Should have nested split-pane structure (image in middle, different text sections)
    expect(html).toContain("split-pane-component-inner");
  });

  it("should handle image-only layout with missing image gracefully", () => {
    const imageOnlyPageNoImage: PageContent = {
      layout: "image-only",
      textBlocks: {},
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [imageOnlyPageNoImage],
    };

    const html = templates.generateHtmlDocument(book);

    // Should still contain image container structure
    expect(html).toContain("bloom-imageContainer");
    // Should have empty src attribute
    expect(html).toContain('src=""');
    // Should not contain text blocks
    expect(html).not.toContain("bloom-translationGroup");
  });

  it("should handle text-image-text layout with empty text blocks", () => {
    const textImageTextEmpty: PageContent = {
      layout: "text-image-text",
      image: "test-image.jpg",
      textBlocks: {},
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [textImageTextEmpty],
    };

    const html = templates.generateHtmlDocument(book);

    // Should still contain layout structure
    expect(html).toContain("split-pane horizontal-percent");
    expect(html).toContain("bloom-imageContainer");
    expect(html).toContain("test-image.jpg");

    // Should contain translation groups but no text content
    expect(html).toContain("bloom-translationGroup");
    expect(html).not.toContain("bloom-editable");
  });
  it("should generate identical HTML for text-image-text and bilingual-text-image-text layouts", () => {
    const textImageTextPage: PageContent = {
      layout: "text-image-text",
      image: "test.jpg",
      textBlocks: { en: "Test content", es: "Contenido de prueba" },
    };

    const bilingualPage: PageContent = {
      layout: "bilingual-text-image-text",
      image: "test.jpg",
      textBlocks: { en: "Test content", es: "Contenido de prueba" },
    };

    const book1: Book = {
      metadata: mockMetadata,
      pages: [textImageTextPage],
    };

    const book2: Book = {
      metadata: mockMetadata,
      pages: [bilingualPage],
    };

    const html1 = templates.generateHtmlDocument(book1);
    const html2 = templates.generateHtmlDocument(book2);

    // text-image-text should use V for both text sections
    expect(html1).toContain('data-default-languages="V"');

    // bilingual-text-image-text should use V for top and N1 for bottom
    expect(html2).toContain('data-default-languages="V"');
    expect(html2).toContain('data-default-languages="N1"');

    // Count occurrences to verify the difference
    const v_matches_1 = (html1.match(/data-default-languages="V"/g) || [])
      .length;
    const n1_matches_1 = (html1.match(/data-default-languages="N1"/g) || [])
      .length;
    const v_matches_2 = (html2.match(/data-default-languages="V"/g) || [])
      .length;
    const n1_matches_2 = (html2.match(/data-default-languages="N1"/g) || [])
      .length;

    // text-image-text should have 2 V groups (both text sections) and 0 N1 groups
    expect(v_matches_1).toBe(2);
    expect(n1_matches_1).toBe(0);

    // bilingual-text-image-text should have 1 V group (top) and 1 N1 group (bottom)
    expect(v_matches_2).toBe(1);
    expect(n1_matches_2).toBe(1);
  });
});
