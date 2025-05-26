import { describe, it, expect } from "bun:test";
import { MarkdownToBloomHtml } from "../src/md-to-bloom.js";

const basicFrontmatter = `---
allTitles:
  en: "Test Book"
languages:
  en: "English"
l1: en
---`;

describe("Page Creation from Markdown Comments", () => {
  it("should create a single page with no pagebreak", () => {
    const content = `${basicFrontmatter}

<!-- lang=en -->
This is the first and only page.`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].textBlocks.en).toBe(
      "This is the first and only page."
    );
  });

  it("should create two pages with one pagebreak in between", () => {
    const content = `${basicFrontmatter}

<!-- lang=en -->
This is the first page.

<!-- page-break -->

<!-- lang=en -->
This is the second page.`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].textBlocks.en).toBe("This is the first page.");
    expect(result.pages[1].textBlocks.en).toBe("This is the second page.");
  });

  it("should create a single page when a pagebreak is at the beginning", () => {
    const content = `${basicFrontmatter}

<!-- page-break -->

<!-- lang=en -->
This is a single page despite the leading pagebreak.`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].textBlocks.en).toBe(
      "This is a single page despite the leading pagebreak."
    );
  });

  it("should create a single page when a pagebreak is at the end", () => {
    const content = `${basicFrontmatter}

<!-- lang=en -->
This is a single page despite the trailing pagebreak.

<!-- page-break -->`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].textBlocks.en).toBe(
      "This is a single page despite the trailing pagebreak."
    );
  });

  it("should create two pages even with multiple redundant pagebreaks", () => {
    const content = `${basicFrontmatter}

<!-- page-break -->
<!-- page-break -->

<!-- lang=en -->
Content for the first actual page.

<!-- page-break -->
<!-- page-break -->
<!-- page-break -->

<!-- lang=en -->
Content for the second actual page.

<!-- page-break -->
<!-- page-break -->`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);

    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].textBlocks.en).toBe(
      "Content for the first actual page."
    );
    expect(result.pages[1].textBlocks.en).toBe(
      "Content for the second actual page."
    );
  });

  it("should handle a pagebreak with no content following it before another pagebreak", () => {
    const content = `${basicFrontmatter}

<!-- lang=en -->
Page 1

<!-- page-break -->

<!-- page-break -->

<!-- lang=en -->
Page 2`;

    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);
    // This behavior is based on the "empty pages should be filtered out" test in md-to-bloom.test.ts
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].textBlocks.en).toBe("Page 1");
    expect(result.pages[1].textBlocks.en).toBe("Page 2");
  });

  it("should handle content only before the first pagebreak", () => {
    const content = `${basicFrontmatter}

<!-- lang=en -->
Only content is here.

<!-- page-break -->`;
    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].textBlocks.en).toBe("Only content is here.");
  });

  it("should handle content only after the last pagebreak", () => {
    const content = `${basicFrontmatter}

<!-- page-break -->

<!-- lang=en -->
Only content is here.`;
    const parser = new MarkdownToBloomHtml();
    const result = parser.parse(content);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].textBlocks.en).toBe("Only content is here.");
  });
});
