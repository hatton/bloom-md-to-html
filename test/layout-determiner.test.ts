import { describe, expect, it } from "bun:test";
import { determinePageLayout } from "../src/layout-determiner.js";

describe("determinePageLayout", () => {
  const l1 = "en";
  const l2 = "es";

  it("should return 'image-only' when only an image is present", () => {
    expect(determinePageLayout(["image"])).toEqual("image-only");
  });

  it("should return 'text-only' when only text is present (l1)", () => {
    expect(determinePageLayout(["l1-only"])).toEqual("text-only");
  });
  it("should return 'text-only' when only l2 text is present", () => {
    expect(determinePageLayout(["l2-only"])).toEqual("text-only");
  });

  it("should return bilingual-text-image-text if we see l1,image,l2", () => {
    expect(determinePageLayout(["l1-only", "image", "l2-only"])).toEqual(
      "bilingual-text-image-text"
    );
  });

  it("should return 'text-only' for an empty sequence", () => {
    expect(determinePageLayout([])).toEqual("text-only");
  });

  it("should return 'image-top-text-bottom' for image then text", () => {
    expect(determinePageLayout(["image", "l1-only"])).toEqual(
      "image-top-text-bottom"
    );
    // review: this would get the data in, but would you see the l2 on the page without tweaking settings?
    expect(determinePageLayout(["image", "multiple-languages"])).toEqual(
      "image-top-text-bottom"
    );
  });

  it("should return 'text-top-image-bottom' for text then image", () => {
    expect(determinePageLayout(["l1-only", "image"])).toEqual(
      "text-top-image-bottom"
    );
    expect(determinePageLayout(["multiple-languages", "image"])).toEqual(
      "text-top-image-bottom"
    );
  });

  it("should return 'text-image-text' for text, image, then text (monolingual)", () => {
    expect(determinePageLayout(["l1-only", "image", "l1-only"])).toEqual(
      "text-image-text"
    );
  });
});
