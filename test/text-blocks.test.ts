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
    // Check that the overall structure is paragraphs, but not necessarily that every single line is a new p
    expect(htmlText).toMatch(/^<p>.*<\/p>$/);
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
    // Headings should not be wrapped in <p> tags
    expect(htmlText).toContain("<h1>Main Heading</h1>");
    expect(htmlText).toContain("<p>Some text after h1.</p>");
    expect(htmlText).toContain("<h2>Subheading</h2>");
    expect(htmlText).toContain("<p>Some text after h2.</p>");
    // Ensure no <p><h1>... or <p><h2>...
    expect(htmlText).not.toContain("<p><h1>");
    expect(htmlText).not.toContain("<p><h2>");
  });

  it("should not wrap existing p tags or headings in more p tags", () => {
    const content = `---
allTitles:
  en: "Test Book"
languages:
  en: "English"
l1: en
---

<!-- lang=en -->
<p>This is already a paragraph.</p>

<h1>This is a heading.</h1>

Normal text that should be a paragraph.`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);
    const htmlText = result.pages[0].textBlocks.en;

    expect(htmlText).toBe(
      "<p>This is already a paragraph.</p><h1>This is a heading.</h1><p>Normal text that should be a paragraph.</p>"
    );
  });

  it("should handle text after a lang comment and a blank line correctly", () => {
    const content = `---
allTitles:
  en: "Test Book"
languages:
  mxa: "Mixtec"
l1: mxa
---

<!-- lang=mxa -->

¿Naja jati'íni ndichaun chi'ín? -katí maa ndika'a'.`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);
    // Text is on the second page (index 1) after the page break
    expect(result.pages[0].textBlocks.mxa).toBe(
      "<p>¿Naja jati'íni ndichaun chi'ín? -katí maa ndika'a'.</p>"
    );
  });
});
