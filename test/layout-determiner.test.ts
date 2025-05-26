import { determinePageLayout } from "../src/layout-determiner.js";
import { describe, it, expect } from "bun:test";

describe("determinePageLayout", () => {
  const l1 = "en";
  const l2 = "es";

  it("should return 'image-only' when only an image is present", () => {
    expect(determinePageLayout(["image"], l1, l2)).toEqual("image-only");
  });

  it("should return 'text-only' when only text is present (l1)", () => {
    expect(determinePageLayout([l1], l1, l2)).toEqual("text-only");
  });

  it("should return 'text-only' when only text is present (l1, l2)", () => {
    expect(determinePageLayout([l1, l2], l1, l2)).toEqual("text-only");
  });

  it("should return 'text-only' for an empty sequence", () => {
    expect(determinePageLayout([], l1, l2)).toEqual("text-only");
  });

  it("should return 'image-top-text-bottom' for image then text", () => {
    expect(determinePageLayout(["image", l1], l1, l2)).toEqual(
      "image-top-text-bottom"
    );
    expect(determinePageLayout(["image", l1, l2], l1, l2)).toEqual(
      "image-top-text-bottom"
    );
  });

  it("should return 'text-top-image-bottom' for text then image", () => {
    expect(determinePageLayout([l1, "image"], l1, l2)).toEqual(
      "text-top-image-bottom"
    );
    expect(determinePageLayout([l1, l2, "image"], l1, l2)).toEqual(
      "text-top-image-bottom"
    );
  });

  it("should return 'text-image-text' for text, image, then text (monolingual)", () => {
    expect(determinePageLayout([l1, "image", l1], l1, undefined)).toEqual(
      "text-image-text"
    );
  });

  it("should return 'text-image-text' for text, image, then text (bilingual, but not matching pattern)", () => {
    // e.g. L1, image, L1 again
    expect(determinePageLayout([l1, "image", l1], l1, l2)).toEqual(
      "text-image-text"
    );
    // e.g. L2, image, L2
    expect(determinePageLayout([l2, "image", l2], l1, l2)).toEqual(
      "text-image-text"
    );
    // e.g. L1, image, L2 (but L2 is not the *last* text block overall if more text follows)
    expect(determinePageLayout([l1, "image", l2, l1], l1, l2)).toEqual(
      "text-image-text"
    );
  });

  it("should return 'bilingual-text-image-text' for L1, image, L2", () => {
    expect(determinePageLayout([l1, "image", l2], l1, l2)).toEqual(
      "bilingual-text-image-text"
    );
  });

  it("should return 'bilingual-text-image-text' for L1, L1, image, L2, L2", () => {
    expect(determinePageLayout([l1, l1, "image", l2, l2], l1, l2)).toEqual(
      "bilingual-text-image-text"
    );
  });

  it("should return 'text-image-text' if l2 is undefined for T-I-T pattern", () => {
    expect(determinePageLayout([l1, "image", l1], l1, undefined)).toEqual(
      "text-image-text"
    );
  });

  it("should handle multiple images correctly in T-I-T like patterns", () => {
    expect(determinePageLayout([l1, "image", "image", l2], l1, l2)).toEqual(
      "bilingual-text-image-text"
    );
    expect(determinePageLayout([l1, "image", l1, "image", l2], l1, l2)).toEqual(
      "bilingual-text-image-text" // This assumes the critical pattern is L1...image...L2
    );
  });

  it("should prioritize T-I-T over simple I-T or T-I if applicable", () => {
    // Sequence: L1 (text), image, L2 (text) -> bilingual-text-image-text
    expect(determinePageLayout([l1, "image", l2], l1, l2)).toEqual(
      "bilingual-text-image-text"
    );
  });

  it("should handle more complex sequences for T-I-T", () => {
    // Sequence: L1, L1 (text), image, L2 (text)
    expect(determinePageLayout([l1, l1, "image", l2], l1, l2)).toEqual(
      "bilingual-text-image-text"
    );
    // Sequence: L1 (text), image, L2, L2 (text)
    expect(determinePageLayout([l1, "image", l2, l2], l1, l2)).toEqual(
      "bilingual-text-image-text"
    );
    // Sequence: L1, L1 (text), image, L2, L2 (text)
    expect(determinePageLayout([l1, l1, "image", l2, l2], l1, l2)).toEqual(
      "bilingual-text-image-text"
    );
  });

  it("should correctly identify non-bilingual T-I-T when l2 is present but not in the T-I-L2 pattern", () => {
    // L1, image, L1 (l2 is defined for book, but this page isn't using the L1-img-L2 pattern)
    expect(determinePageLayout([l1, "image", l1], l1, l2)).toEqual(
      "text-image-text"
    );
  });
});
