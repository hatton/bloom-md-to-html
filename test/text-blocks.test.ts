import { describe, it, expect } from "bun:test";
import { MarkdownToBloomHtml } from "../src/md-to-bloom.js";

describe("Text Block Handling", () => {
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
    expect(htmlText).toContain("<br>");
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
    expect(result.pages[0].textBlocks.en).toBe("English text");
    expect(result.pages[0].textBlocks.fr).toBe("French text");
    expect(result.pages[0].textBlocks.es).toBe("Spanish text");
    expect(Object.keys(result.pages[0].textBlocks)).toHaveLength(3);
  });
});
