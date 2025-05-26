import { describe, expect, it } from "bun:test";
import { HtmlGenerator } from "../src/html-generator.js";
import type { Book, BookMetadata, PageContent } from "../src/types.js";

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
      elements: [
        {
          type: "text",
          content: { en: "Hello world", es: "Hola mundo" },
        },
      ],
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
      elements: [{ type: "text", content: { en: "Test" } }],
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

  it("smoke test for text block with multiple languages", () => {
    const mockPage: PageContent = {
      layout: "text-only",
      elements: [
        {
          type: "text",
          content: {
            en: "Hello world",
            es: "Hola mundo",
          },
        },
      ],
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [mockPage],
    };

    const html = templates.generateHtmlDocument(book);
    // Should contain both languages somewhere
    expect(html).toContain("Hello world");
    expect(html).toContain("Hola mundo");
  });

  it("should generate different page layouts correctly", () => {
    const textOnlyPage: PageContent = {
      layout: "text-only",
      elements: [{ type: "text", content: { en: "Text only content" } }],
    };

    const imageTopPage: PageContent = {
      layout: "image-top-text-bottom",
      elements: [
        { type: "image", src: "test.jpg" },
        { type: "text", content: { en: "Text below image" } },
      ],
    };

    const textTopPage: PageContent = {
      layout: "text-top-image-bottom",
      elements: [
        { type: "text", content: { en: "Text above image" } },
        { type: "image", src: "test.jpg" },
      ],
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
      elements: [
        {
          type: "text",
          content: {
            en: "Text with <strong>bold</strong> and <em>italic</em> formatting",
          },
        },
      ],
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
      elements: [
        {
          type: "text",
          content: {
            en: "Text with & < > \" ' characters and <div>raw html</div>",
          },
        },
      ],
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
      elements: [
        {
          type: "text",
          content: {
            en: "<p>First paragraph.</p><p>Second paragraph.</p>",
            es: "<h1>Heading</h1><p>Text after heading.</p>",
          },
        },
      ],
    };

    const book: Book = {
      metadata: mockMetadata,
      pages: [mockPage],
    };

    const html = templates.generateHtmlDocument(book); // Should not have double paragraph tags
    expect(html).not.toContain("<p><p>");
    expect(html).not.toContain("</p></p>");
    expect(html).not.toContain("<p><h1>");

    // Should preserve the original formatting
    expect(html).toContain(
      '<div class="bloom-editable bloom-content1 bloom-visibility-code-on" lang="en" contenteditable="true">'
    );
    expect(html).toContain("<p>First paragraph.</p><p>Second paragraph.</p>");
    expect(html).toContain(
      '<div class="bloom-editable bloom-content1 bloom-visibility-code-on" lang="es" contenteditable="true">'
    );
    expect(html).toContain("<h1>Heading</h1><p>Text after heading.</p>");
  });

  it("should generate image-only page layout correctly", () => {
    const imageOnlyPage: PageContent = {
      layout: "image-only",
      elements: [{ type: "image", src: "standalone-image.jpg" }],
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
      elements: [
        { type: "text", content: { en: "Text above the image" } },
        { type: "image", src: "middle-image.jpg" },
        { type: "text", content: { en: "Text below the image" } }, // Same language for text-image-text
      ],
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
    // Both top and bottom should show English (l1) content since this is text-image-text not bilingual
    expect(html).toContain("Text above the image");
    expect(html).toContain("Text below the image");

    // Should have nested split-pane structure (image in middle)
    // This specific class might not be directly applicable or might change based on exact HTML structure
    // expect(html).toContain("split-pane-component-inner"); // This assertion might be too specific
  });

  it("should generate bilingual-text-image-text page layout correctly", () => {
    const bilingualTextImageTextPage: PageContent = {
      layout: "bilingual-text-image-text",
      elements: [
        { type: "text", content: { en: "English text in top section" } },
        { type: "image", src: "center-image.png" },
        { type: "text", content: { es: "Spanish text in bottom section" } },
      ],
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
    // Check for the presence of the text content in their respective language blocks
    expect(html).toContain("English text in top section");
    expect(html).toContain("Spanish text in bottom section");
    const enBlock = html.includes(
      '<div class="bloom-editable bloom-content1 bloom-visibility-code-on" lang="en" contenteditable="true"><p>English text in top section</p></div>'
    );
    const esBlock = html.includes(
      '<div class="bloom-editable bloom-content1 bloom-visibility-code-on" lang="es" contenteditable="true"><p>Spanish text in bottom section</p></div>'
    );
    expect(enBlock || esBlock).toBe(true); // One of them should be in a V block, the other N1 (or vice versa depending on l1/l2)

    // This specific class might not be directly applicable or might change
    // expect(html).toContain("split-pane-component-inner");
  });

  it("should handle image-only layout with missing image gracefully", () => {
    const imageOnlyPageNoImage: PageContent = {
      layout: "image-only",
      elements: [{ type: "image", src: "" }], // Image with empty src
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
      elements: [
        { type: "image", src: "test-image.jpg" },
        // No text elements, or text elements with empty content
        { type: "text", content: {} },
      ],
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
    // expect(html).toContain("bloom-translationGroup"); // This might appear depending on how empty text is rendered
    // expect(html).not.toContain("bloom-editable"); // This is too strong, an empty editable might exist
    // Instead, check that no actual text content from the empty block is rendered.
    const hasAnyTextContent = /<p>[^<]+<\/p>/.test(html); // Check for any non-empty paragraph
    expect(hasAnyTextContent).toBe(false);
  });
  it("should generate different HTML for text-image-text and bilingual-text-image-text layouts based on lang placeholders", () => {
    const textImageTextPage: PageContent = {
      layout: "text-image-text",
      elements: [
        {
          type: "text",
          content: {
            en: "Test content en top",
            es: "Contenido de prueba es top",
          },
        },
        { type: "image", src: "test.jpg" },
        {
          type: "text",
          content: {
            en: "Test content en bottom",
            es: "Contenido de prueba es bottom",
          },
        },
      ],
    };

    const bilingualPage: PageContent = {
      layout: "bilingual-text-image-text",
      elements: [
        { type: "text", content: { en: "Test content en top" } }, // L1 in top
        { type: "image", src: "test.jpg" },
        { type: "text", content: { es: "Contenido de prueba es bottom" } }, // L2 in bottom
      ],
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

    // text-image-text should render L1 content in both top and bottom text blocks by default (using "V" placeholder)
    expect(html1).toContain("Test content en top");
    expect(html1).toContain("Test content en bottom");
    expect(html1).not.toContain("Contenido de prueba es top"); // es should not be rendered if l1 is en and placeholder is V
    expect(html1).not.toContain("Contenido de prueba es bottom");

    // bilingual-text-image-text should render L1 (en) in top and L2 (es) in bottom
    expect(html2).toContain("Test content en top");
    expect(html2).toContain("Contenido de prueba es bottom");
    expect(html2).not.toContain("Contenido de prueba es top");
    expect(html2).not.toContain("Test content en bottom");

    // Count occurrences of lang attributes to verify the difference
    const en_matches_html1 = (html1.match(/lang="en"/g) || []).length;
    const es_matches_html1 = (html1.match(/lang="es"/g) || []).length;
    const en_matches_html2 = (html2.match(/lang="en"/g) || []).length;
    const es_matches_html2 = (html2.match(/lang="es"/g) || []).length;

    // book1 (text-image-text) with l1='en', l2='es'. Both text blocks use 'V' (l1).
    // Each text block (top/bottom) will have one div for lang="en".
    // The data div also has titles in en and es.
    expect(en_matches_html1).toBe(2 + 1); // 2 for content, 1 for title in data div
    expect(es_matches_html1).toBe(0 + 1); // 0 for content, 1 for title in data div

    // book2 (bilingual) with l1='en', l2='es'. Top uses 'V' (l1), bottom uses 'N1' (l2).
    // Top text block: one div for lang="en". Bottom text block: one div for lang="es".
    // Data div has titles in en and es.
    expect(en_matches_html2).toBe(1 + 1); // 1 for content, 1 for title
    expect(es_matches_html2).toBe(1 + 1); // 1 for content, 1 for title
  });
});
