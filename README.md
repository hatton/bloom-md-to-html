# Bloom Markdown Converter

A command-line tool to convert specially formatted Markdown files into Bloom HTML format for creating digital books.

## Features

- Converts Markdown with YAML frontmatter to Bloom HTML
- Supports multiple languages per page
- Handles three page layouts: image-top-text-bottom, text-top-image-bottom, and text-only
- Converts basic Markdown formatting (bold, italic, links) to HTML
- Maps Creative Commons licenses automatically
- Validates content and provides helpful error messages
- Shows conversion statistics

## Installation

```bash
cd bloom-converter
bun install
```

## Usage

### Basic conversion
```bash
bun run index.ts input.md
```

### Validate without converting
```bash
bun run index.ts input.md --validate
```

### Help
```bash
bun run index.ts --help
```

## Input Format

Your Markdown file should have this structure:

```markdown
---
allTitles:
  en: "Book Title"
  es: "Título del Libro"
languages:
  en: "English"
  es: "Español"
l1: en
l2: es
license: CC-BY
copyright: "2025 Author Name"
coverImage: cover.jpg
isbn: "978-0123456789"
---

<!-- lang=en -->
English text for page 1

<!-- lang=es -->
Spanish text for page 1

<!-- page-break -->

![Image](image.jpg)

<!-- lang=en -->
English text for page 2 (image above)

<!-- lang=es -->
Spanish text for page 2 (image above)

<!-- page-break -->

<!-- lang=en -->
English text for page 3

<!-- lang=es -->
Spanish text for page 3

![Image](image2.jpg)
```

## Page Layouts

- **Image-top-text-bottom**: Image appears before language blocks
- **Text-top-image-bottom**: Image appears after language blocks
- **Text-only**: No image on the page

## Supported Markdown

- **Bold**: `**text**` → `<strong>text</strong>`
- **Italic**: `*text*` → `<em>text</em>`
- **Links**: `[text](url)` → `<a href="url">text</a>`
- Line breaks are preserved

## License Mapping

The following licenses are automatically mapped to URLs:
- CC-BY, CC-BY-SA, CC-BY-ND, CC-BY-NC, CC-BY-NC-SA, CC-BY-NC-ND, CC0

Custom licenses starting with `http://` or `https://` are used as-is.

## Output

- Output file is created in the same directory as input
- Uses `.htm` extension
- Existing output files are automatically overwritten

## Testing

```bash
bun test
```

## Example Output

After conversion, you'll see statistics like:

```
✅ Conversion complete: example.htm

📊 Conversion Statistics:
   Pages: 3
   Languages: en, es (2 total)
   Images: 2
   Layouts:
     Image Top Text Bottom: 1
     Text Top Image Bottom: 1
     Text Only: 1
```
