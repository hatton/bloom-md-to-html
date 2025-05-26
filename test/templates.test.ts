import { describe, it, expect } from 'bun:test';
import { HtmlTemplates } from '../src/templates.js';
import { BookMetadata, PageContent, ParsedBook } from '../src/types.js';

describe('HtmlTemplates', () => {
  const templates = new HtmlTemplates();

  const mockMetadata: BookMetadata = {
    allTitles: { en: 'Test Book', es: 'Libro de Prueba' },
    languages: { en: 'English', es: 'Español' },
    l1: 'en',
    l2: 'es',
    license: 'CC-BY',
    copyright: '2025 Test Author'
  };

  it('should generate complete HTML document', () => {
    const mockPage: PageContent = {
      layout: 'text-only',
      textBlocks: { en: 'Hello world', es: 'Hola mundo' }
    };

    const book: ParsedBook = {
      metadata: mockMetadata,
      pages: [mockPage]
    };

    const html = templates.generateHtmlDocument(book);

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<title>Test Book</title>');
    expect(html).toContain('data-book="contentLanguage1"');
    expect(html).toContain('data-book="bookTitle"');
    expect(html).toContain('bloom-page customPage');
  });

  it('should generate Bloom data div with all metadata', () => {
    const mockPage: PageContent = {
      layout: 'text-only',
      textBlocks: { en: 'Test' }
    };

    const book: ParsedBook = {
      metadata: {
        ...mockMetadata,
        isbn: '978-0123456789',
        coverImage: 'cover.jpg'
      },
      pages: [mockPage]
    };

    const html = templates.generateHtmlDocument(book);

    expect(html).toContain('data-book="contentLanguage1" lang="*">en');
    expect(html).toContain('data-book="contentLanguage2" lang="*">es');
    expect(html).toContain('data-book="coverImage" lang="*">cover.jpg');
    expect(html).toContain('data-book="ISBN" lang="*">978-0123456789');
    expect(html).toContain('data-book="copyright" lang="*">2025 Test Author');
    expect(html).toContain('data-book="licenseUrl" lang="*">http://creativecommons.org/licenses/by/4.0/');
  });

  it('should generate different page layouts correctly', () => {
    const textOnlyPage: PageContent = {
      layout: 'text-only',
      textBlocks: { en: 'Text only content' }
    };

    const imageTopPage: PageContent = {
      layout: 'image-top-text-bottom',
      image: 'test.jpg',
      textBlocks: { en: 'Text below image' }
    };

    const textTopPage: PageContent = {
      layout: 'text-top-image-bottom',
      image: 'test.jpg',
      textBlocks: { en: 'Text above image' }
    };

    const book: ParsedBook = {
      metadata: mockMetadata,
      pages: [textOnlyPage, imageTopPage, textTopPage]
    };

    const html = templates.generateHtmlDocument(book);

    // Check that different layouts are present
    expect(html).toContain('split-pane horizontal-percent'); // Image layouts
    expect(html).toContain('position-top');
    expect(html).toContain('position-bottom');
    expect(html).toContain('bloom-imageContainer');
  });  it('should escape HTML characters properly in metadata but preserve HTML in content', () => {
    const mockPage: PageContent = {
      layout: 'text-only',
      // This text would have already been converted by the parser
      textBlocks: { en: 'Text with <strong>bold</strong> and <em>italic</em> formatting' }
    };

    const metadataWithSpecialChars: BookMetadata = {
      ...mockMetadata,
      allTitles: { en: 'Book & "Special" <chars>' }
    };

    const book: ParsedBook = {
      metadata: metadataWithSpecialChars,
      pages: [mockPage]
    };

    const html = templates.generateHtmlDocument(book);

    // Metadata should be escaped
    expect(html).toContain('Book &amp; &quot;Special&quot; &lt;chars&gt;');
    // Content HTML formatting should be preserved
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });
});
