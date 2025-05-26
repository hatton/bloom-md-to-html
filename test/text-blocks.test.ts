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
    expect(htmlText).toContain("<p>");
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

  it("should handle multiple paragraphs correctly", () => {
    const content = `---
allTitles:
  en: "Test Book"
languages:
  en: "English"
l1: en
---

<!-- lang=en -->
This is the first paragraph.

This is the second paragraph.

And this is the third paragraph.`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);
    expect(result.pages[0].textBlocks.en).toBe(
      "<p>This is the first paragraph.</p><p>This is the second paragraph.</p><p>And this is the third paragraph.</p>"
    );
  });

  it("should convert markdown h1 and h2 to HTML", () => {
    const content = `---
allTitles:
  en: "Test Book"
languages:
  en: "English"
l1: en
---

<!-- lang=en -->
# Main Heading

Some text after h1.

## Subheading

Some text after h2.`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    const htmlText = result.pages[0].textBlocks.en;
    expect(htmlText).toContain("<h1>Main Heading</h1>");
    expect(htmlText).toContain("<h2>Subheading</h2>");
  });
});
