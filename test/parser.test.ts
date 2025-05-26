import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { MarkdownParser } from '../src/parser.js';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('MarkdownParser', () => {
  const testDir = join(process.cwd(), 'test-files');
  
  // Setup test directory
  beforeAll(() => {
    try {
      mkdirSync(testDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }
  });

  // Cleanup test files
  afterAll(() => {
    try {
      unlinkSync(join(testDir, 'test.md'));
      unlinkSync(join(testDir, 'test-image.png'));
    } catch (e) {
      // Files may not exist
    }
  });

  it('should parse valid frontmatter', () => {
    const testPath = join(testDir, 'test.md');
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

    writeFileSync(testPath, content);
    const parser = new MarkdownParser(testPath);
    const result = parser.parse(content);

    expect(result.metadata.allTitles.en).toBe('Test Book');
    expect(result.metadata.l1).toBe('en');
    expect(result.metadata.l2).toBe('es');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].textBlocks.en).toBe('Hello world');
    expect(result.pages[0].textBlocks.es).toBe('Hola mundo');
  });

  it('should detect page layouts correctly', () => {
    const testPath = join(testDir, 'test.md');
    
    // Create test image
    writeFileSync(join(testDir, 'test-image.png'), 'fake-image-data');
    
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

    writeFileSync(testPath, content);
    const parser = new MarkdownParser(testPath);
    const result = parser.parse(content);

    expect(result.pages).toHaveLength(3);
    expect(result.pages[0].layout).toBe('image-top-text-bottom');
    expect(result.pages[1].layout).toBe('text-top-image-bottom');
    expect(result.pages[2].layout).toBe('text-only');
  });

  it('should convert markdown formatting to HTML', () => {
    const testPath = join(testDir, 'test.md');
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

    writeFileSync(testPath, content);
    const parser = new MarkdownParser(testPath);
    const result = parser.parse(content);

    const htmlText = result.pages[0].textBlocks.en;
    expect(htmlText).toContain('<strong>bold</strong>');
    expect(htmlText).toContain('<em>italic</em>');
    expect(htmlText).toContain('<a href="https://example.com">link</a>');
    expect(htmlText).toContain('<br>');
  });

  it('should validate required metadata fields', () => {
    const testPath = join(testDir, 'test.md');
    const content = `---
allTitles:
  en: "Test Book"
# Missing languages and l1
---

<!-- lang=en -->
Test content`;

    writeFileSync(testPath, content);
    const parser = new MarkdownParser(testPath);
    
    expect(() => parser.parse(content)).toThrow('Validation failed');
  });
});
