import { describe, it, expect } from "bun:test";
import { MarkdownToBloomHtml } from "../src/md-to-bloom.js";

describe("Page Creation", () => {
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
      "Text with image that doesn't exist on disk"
    );

    // Should not throw any errors even though image doesn't exist
    expect(result.pages[0]).toBeDefined();
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
    expect(result.pages[0].textBlocks.en).toBe("First page");
    expect(result.pages[1].textBlocks.en).toBe("Third page");
  });
});
