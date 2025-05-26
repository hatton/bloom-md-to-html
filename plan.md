# Detailed Conversion Plan for Markdown to Bloom HTML CLI

## 1. **Project Structure**

```
bloom-converter/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── parser.ts             # Markdown parser
│   ├── converter.ts          # Main conversion logic
│   ├── templates.ts          # HTML template generators
│   ├── licenses.ts           # License mapping
│   └── types.ts              # TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md
```

## 2. **Data Structures & Types**

```typescript
interface BookMetadata {
  allTitles: Record<string, string>;
  languages: Record<string, string>;
  l1: string; // primary language
  l2?: string; // secondary language
  coverImage?: string;
  isbn?: string;
  license?: string;
  copyright?: string;
}

interface PageContent {
  layout: "image-top-text-bottom" | "text-top-image-bottom" | "text-only";
  image?: string;
  textBlocks: Record<string, string>; // lang -> text
}

interface ParsedBook {
  metadata: BookMetadata;
  pages: PageContent[];
}
```

## 3. **Parsing Algorithm**

### 3.1 YAML Frontmatter Parsing

- Extract YAML frontmatter using a YAML parser
- Validate required fields (allTitles, languages, l1)
- Store metadata in BookMetadata structure

### 3.2 Content Parsing Logic

1. **Split content by `<!-- page-break -->`** to identify pages
2. **For each page section:**
   - Parse images: Extract `![](filename)` markdown images
   - Parse language blocks: Find `<!-- lang=xx -->` comments
   - Group text content by language
   - Determine layout based on content order:

**Layout Detection Rules:**

- **Image-top-text-bottom**: Image appears before any `<!-- lang=xx -->` comments
- **Text-top-image-bottom**: Image appears after `<!-- lang=xx -->` comments and text
- **Text-only**: No images present

### 3.3 Content Extraction

- Extract text between `<!-- lang=xx -->` and next comment/page-break
- Trim whitespace and empty lines
- Convert markdown formatting to HTML (bold, italic, links, etc.)
- Store in language-keyed object

## 4. **License Mapping System**

```typescript
const LICENSE_MAPPING = {
  "CC-BY": "http://creativecommons.org/licenses/by/4.0/",
  "CC-BY-SA": "http://creativecommons.org/licenses/by-sa/4.0/",
  "CC-BY-ND": "http://creativecommons.org/licenses/by-nd/4.0/",
  "CC-BY-NC": "http://creativecommons.org/licenses/by-nc/4.0/",
  "CC-BY-NC-SA": "http://creativecommons.org/licenses/by-nc-sa/4.0/",
  "CC-BY-NC-ND": "http://creativecommons.org/licenses/by-nc-nd/4.0/",
  CC0: "http://creativecommons.org/publicdomain/zero/1.0/",
  // Custom licenses pass through as-is if they start with http:// or https://
};
```

## 5. **HTML Generation Templates**

### 5.1 Document Structure Template

```typescript
function generateHtmlDocument(book: ParsedBook): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="Generator" content="Bloom Markdown Converter" />
    <meta name="BloomFormatVersion" content="2.1" />
    <title>${book.metadata.allTitles[book.metadata.l1]}</title>
  </head>
  <body>
    ${generateBloomDataDiv(book.metadata)}
    ${book.pages.map((page) => generatePage(page, book.metadata)).join("\n")}
  </body>
</html>`;
}
```

### 5.2 Bloom Data Div Template

- Generate `contentLanguage1` with l1 value
- Generate `contentLanguage2` with l2 value (if present)
- Generate `coverImage` if specified
- Generate `bookTitle` elements for each language in allTitles
- Generate `ISBN`, `copyright`, and `licenseUrl` if present
- Apply license mapping for licenseUrl

### 5.3 Page Templates

**Image-Top-Text-Bottom Layout:**

```html
<div class="bloom-page customPage">
  <div class="marginBox">
    <div class="split-pane horizontal-percent">
      <div class="split-pane-component position-top">
        <div class="split-pane-component-inner">
          <div
            class="bloom-canvas bloom-leadingElement bloom-has-canvas-element"
          >
            <div class="bloom-canvas-element bloom-backgroundImage">
              <div class="bloom-imageContainer">
                <img src="{imageSrc}" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="split-pane-divider horizontal-divider"></div>
      <div class="split-pane-component position-bottom">
        <div class="split-pane-component-inner">
          <div class="bloom-translationGroup">{languageTextBlocks}</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Text-Top-Image-Bottom Layout:**

- Swap position-top and position-bottom content
- Text goes in position-top, image in position-bottom

**Text-Only Layout:**

```html
<div class="bloom-page customPage">
  <div class="marginBox">
    <div class="split-pane-component-inner">
      <div class="bloom-translationGroup">{languageTextBlocks}</div>
    </div>
  </div>
</div>
```

### 5.4 Language Text Block Template

```html
<div class="bloom-editable" lang="{langCode}">
  <p>{textContent}</p>
</div>
```

## 6. **CLI Interface**

### 6.1 Command Structure

```bash
bun bloom-convert [input.md] [options]
```

### 6.2 Options

- `--validate, -v`: Validate input without converting
- `--help, -h`: Show help
- `--version`: Show version

**Note:** Output file is automatically generated in the same directory as input with `.htm` extension. Existing output files are deleted before conversion.

### 6.3 Error Handling

- Validate input file exists and is readable
- Validate YAML frontmatter structure
- Check for required metadata fields
- Warn about missing language content
- Validate image file references exist

## 7. **Processing Flow**

1. **Parse CLI arguments** and validate input file
2. **Read and parse markdown file:**
   - Extract YAML frontmatter
   - Parse content sections
   - Identify pages and layouts
3. **Validate parsed data:**
   - Check required metadata
   - Validate language codes
   - Check image file existence
4. **Convert to HTML:**
   - Apply license mapping
   - Generate bloom data div
   - Generate page HTML for each page
   - Assemble complete document
5. **Write output file** (same directory, `.htm` extension, overwrite existing)
6. **Report conversion statistics** (pages, languages, images)
7. **Report success/errors**

## 8. **Validation Rules**

- **Required frontmatter:** allTitles, languages, l1
- **Language consistency:** All lang codes in content must exist in languages metadata
- **Image validation:** Referenced images should exist in same directory
- **Layout validation:** Each page must have at least one language text block

## 9. **Future Extensibility**

- **Layout system:** Designed to easily add new page layouts
- **License system:** Easy to extend license mappings
- **Language support:** No hard limits on number of languages
- **Template system:** Modular templates for easy modification

## 10. **Implementation Details**

### 10.1 Technology Stack
- **Runtime**: Bun
- **CLI Framework**: Commander.js
- **YAML Parser**: js-yaml
- **Markdown Processing**: Custom parser with HTML conversion
- **Testing**: Bun's built-in test runner

### 10.2 Dependencies
- `commander`: CLI argument parsing
- `js-yaml`: YAML frontmatter parsing
- `@types/js-yaml`: TypeScript types for yaml

### 10.3 File Output Behavior
- Output files are generated in the same directory as input
- Extension is automatically changed to `.htm`
- Existing output files are deleted before conversion
- No user input required for output path

### 10.4 Markdown Processing
- Convert basic markdown formatting to HTML:
  - **Bold** (`**text**`) → `<strong>text</strong>`
  - *Italic* (`*text*`) → `<em>text</em>`
  - Links (`[text](url)`) → `<a href="url">text</a>`
  - Line breaks preserved as `<br>` tags

### 10.5 Statistics Reporting
After successful conversion, display:
- Number of pages processed
- Languages detected and used
- Number of images referenced
- Layout types used

### 10.6 Testing Strategy
- Unit tests for each module using Bun test
- Integration tests with sample markdown files
- Validation tests for error conditions
- Template generation tests
