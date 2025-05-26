import { describe, it, expect } from "bun:test";
import { MarkdownToBloomHtml } from "../src/md-to-bloom.js";

describe("MarkdownParser", () => {
  it("should parse valid frontmatter", () => {
    const content = `---
allTitles:
  en: "Test Book"
  es: "Libro de Prueba"
languages:
  en: "English"
  es: "Español"
l1: en
l2: es
---

<!-- lang=en -->
Hello world

<!-- lang=es -->
Hola mundo`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    expect(result.metadata.allTitles.en).toBe("Test Book");
    expect(result.metadata.l1).toBe("en");
    expect(result.metadata.l2).toBe("es");
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].textBlocks.en).toBe("<p>Hello world</p>");
    expect(result.pages[0].textBlocks.es).toBe("<p>Hola mundo</p>");
  });

  it("should detect page layouts correctly", () => {
    const content = `---
allTitles:
  en: "Test Book"
languages:
  en: "English"
l1: en
---

![Test Image](test-image.png)

<!-- lang=en -->
Text after image

<!-- page-break -->

<!-- lang=en -->
Text before image

![Test Image](test-image.png)

<!-- page-break -->

<!-- lang=en -->
Text only page`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    expect(result.pages).toHaveLength(3);
    expect(result.pages[0].layout).toBe("image-top-text-bottom");
    expect(result.pages[1].layout).toBe("text-top-image-bottom");
    expect(result.pages[2].layout).toBe("text-only");
  });

  it("should convert markdown formatting to HTML", () => {
    const content = `---
allTitles:
  en: "Test Book"
languages:
  en: "English"
l1: en
---

<!-- lang=en -->
This is **bold** text and *italic* text.
Here's a [link](https://example.com).
Line one
Line two`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    const htmlText = result.pages[0].textBlocks.en;
    expect(htmlText).toContain("<strong>bold</strong>");
    expect(htmlText).toContain("<em>italic</em>");
    expect(htmlText).toContain('<a href="https://example.com">link</a>');
    expect(htmlText).toContain("<p>");
  });

  it("should validate required metadata fields", () => {
    const content = `---
allTitles:
  en: "Test Book"
# Missing languages and l1
---

<!-- lang=en -->
Test content`;

    const parser = new MarkdownToBloomHtml();

    expect(() => parser.parse(content)).toThrow("Validation failed");
  });

  it("should handle images without file validation", () => {
    const content = `---
allTitles:
  en: "Test Book"
languages:
  en: "English"
l1: en
---

![Test Image](nonexistent-image.png)

<!-- lang=en -->
Text with image that doesn't exist on disk`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].layout).toBe("image-top-text-bottom");
    expect(result.pages[0].image).toBe("nonexistent-image.png");
    expect(result.pages[0].textBlocks.en).toBe(
      "<p>Text with image that doesn't exist on disk</p>"
    );

    // Should not throw any errors even though image doesn't exist
    expect(result.pages[0]).toBeDefined();
  });

  it("should handle multiple languages correctly", () => {
    const content = `---
allTitles:
  en: "Test Book"
  fr: "Livre de Test"
  es: "Libro de Prueba"
languages:
  en: "English"
  fr: "French"
  es: "Spanish"
l1: en
l2: fr
---

<!-- lang=en -->
English text

<!-- lang=fr -->
French text

<!-- lang=es -->
Spanish text`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].textBlocks.en).toBe("<p>English text</p>");
    expect(result.pages[0].textBlocks.fr).toBe("<p>French text</p>");
    expect(result.pages[0].textBlocks.es).toBe("<p>Spanish text</p>");
    expect(Object.keys(result.pages[0].textBlocks)).toHaveLength(3);
  });

  it("should handle empty pages correctly", () => {
    const content = `---
allTitles:
  en: "Test Book"
languages:
  en: "English"
l1: en
---

<!-- lang=en -->
First page

<!-- page-break -->

<!-- Empty page with no content -->

<!-- page-break -->

<!-- lang=en -->
Third page`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    // Empty pages should be filtered out
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].textBlocks.en).toBe("<p>First page</p>");
    expect(result.pages[1].textBlocks.en).toBe("<p>Third page</p>");
  });
});
