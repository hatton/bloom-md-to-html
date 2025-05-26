import { describe, it, expect } from "bun:test";
import { MarkdownToBloomHtml } from "../src/md-to-bloom.js";

describe("Metadata Parsing", () => {
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
    const result = parser.parseMarkdownIntoABookObject(content);

    expect(result.metadata.allTitles.en).toBe("Test Book");
    expect(result.metadata.allTitles.es).toBe("Libro de Prueba");
    expect(result.metadata.languages.en).toBe("English");
    expect(result.metadata.languages.es).toBe("Español");
    expect(result.metadata.l1).toBe("en");
    expect(result.metadata.l2).toBe("es");
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

    expect(() => parser.parseMarkdownIntoABookObject(content)).toThrow(
      "Validation failed"
    );
  });
});
