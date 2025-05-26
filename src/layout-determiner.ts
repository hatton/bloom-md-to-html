import type { PageContent } from "./types.js";

/**
 * Determines the page layout based on the sequence of image and text content.
 * @param sequence An array representing the order of content on the page.
 *                 Each element is either the string "image" or a language code string for a text block.
 * @param l1Code The primary language code (e.g., "en").
 * @param l2Code The optional secondary language code (e.g., "es").
 * @returns The determined page layout.
 */
export function determinePageLayout(
  sequence: Array<string | "image">,
  l1Code: string,
  l2Code: string | undefined
): PageContent["layout"] {
  if (!sequence || sequence.length === 0) {
    return "text-only"; // Default for empty or invalid sequence
  }

  // Filter out any potential undefined/null items if the input array is not clean,
  // though the type signature suggests it should be.
  const items = sequence.filter(
    (item): item is string | "image" =>
      item === "image" || typeof item === "string"
  );

  if (items.length === 0) {
    return "text-only";
  }

  const isActualTextItem = (item: string | "image"): item is string =>
    typeof item === "string" && item !== "image";

  const hasImage = items.some((item) => item === "image");
  const hasActualText = items.some(isActualTextItem);

  if (hasImage && !hasActualText) {
    return "image-only";
  }
  if (!hasImage && hasActualText) {
    return "text-only";
  }
  // This case covers when items might have been empty after filtering,
  // or contained only items that are neither "image" nor actual text (e.g. empty strings if they were not filtered earlier and not desired).
  // Given the current items filter, this primarily means items was empty.
  if (!hasImage && !hasActualText) {
    return "text-only";
  }

  // At this point, both image and actual text are present in the 'items' array.
  const firstImageIdx = items.indexOf("image");
  const lastImageIdx = items.lastIndexOf("image");
  const firstActualTextIdx = items.findIndex(isActualTextItem);
  const lastActualTextIdx = items.findLastIndex(isActualTextItem);

  // the bilingual pattern we are looking for is the l1 only on top, and the l2 language on the bottom
  const isBilingualContent =
    l2Code &&
    firstActualTextIdx !== -1 && // Should be guaranteed if hasActualText is true
    lastActualTextIdx !== -1 && // Should be guaranteed if hasActualText is true
    firstActualTextIdx < lastActualTextIdx && // Ensures there are at least two distinct text blocks for this pattern
    items[firstActualTextIdx] === l1Code && // items[firstActualTextIdx] is a true lang code
    items[lastActualTextIdx] === l2Code; // items[lastActualTextIdx] is a true lang code

  // 1. Pattern: Text - Image - Text
  //    True if actual text exists before the first image AND actual text exists after the last image.
  //    Indices firstActualTextIdx and lastActualTextIdx are valid here because hasActualText is true.
  if (firstActualTextIdx < firstImageIdx && lastActualTextIdx > lastImageIdx) {
    if (isBilingualContent) {
      return "bilingual-text-image-text";
    }
    return "text-image-text";
  }

  // 2. Pattern: Image - Text or Text - Image
  //    If not T-I-T, determine if image or actual text comes first overall.
  //    Indices firstImageIdx and firstActualTextIdx are valid here.
  if (firstImageIdx < firstActualTextIdx) {
    return "image-top-text-bottom";
  } else {
    // This implies firstActualTextIdx <= firstImageIdx (text is before or at the same effective start as image).
    return "text-top-image-bottom";
  }
}
