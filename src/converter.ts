import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { MarkdownParser } from "./parser.js";
import { HtmlTemplates } from "./templates.js";
import type { ConversionStats, ParsedBook } from "./types.js";

export class BloomConverter {
  private templates: HtmlTemplates;

  constructor() {
    this.templates = new HtmlTemplates();
  }

  async convert(
    inputPath: string,
    validateOnly: boolean = false
  ): Promise<ConversionStats> {
    const resolvedInputPath = resolve(inputPath);

    // Validate input file exists
    if (!existsSync(resolvedInputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    } // Initialize parser with input path and image validation enabled
    const parser = new MarkdownParser(resolvedInputPath, {
      validateImages: true,
    });

    // Read and parse markdown
    const content = readFileSync(resolvedInputPath, "utf-8");
    const book = parser.parse(content);

    // Show warnings
    const warnings = parser
      .getErrors()
      .filter((e: any) => e.type === "warning");
    if (warnings.length > 0) {
      console.warn("Warnings:");
      warnings.forEach((w: any) => console.warn(`  ${w.message}`));
    }

    // Generate statistics
    const stats = this.generateStats(book);

    if (validateOnly) {
      console.log("✅ Validation passed");
      return stats;
    }

    // Generate output path
    const outputPath = this.getOutputPath(resolvedInputPath);

    // Delete existing output file if it exists
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
    }

    // Generate HTML
    const html = this.templates.generateHtmlDocument(book);

    // Write output file
    writeFileSync(outputPath, html, "utf-8");

    console.log(`✅ Conversion complete: ${outputPath}`);
    return stats;
  }

  private getOutputPath(inputPath: string): string {
    const dir = dirname(inputPath);
    const name = basename(inputPath, extname(inputPath));
    return resolve(dir, `${name}.htm`);
  }

  private generateStats(book: ParsedBook): ConversionStats {
    const languages = new Set<string>();
    let imageCount = 0;
    const layouts: Record<string, number> = {};

    // Count languages, images, and layouts
    book.pages.forEach((page) => {
      // Count languages
      Object.keys(page.textBlocks).forEach((lang) => languages.add(lang));

      // Count images
      if (page.image) {
        imageCount++;
      }

      // Count layouts
      layouts[page.layout] = (layouts[page.layout] || 0) + 1;
    });

    return {
      pages: book.pages.length,
      languages: Array.from(languages).sort(),
      images: imageCount,
      layouts,
    };
  }

  printStats(stats: ConversionStats): void {
    console.log("\n📊 Conversion Statistics:");
    console.log(`   Pages: ${stats.pages}`);
    console.log(
      `   Languages: ${stats.languages.join(", ")} (${stats.languages.length} total)`
    );
    console.log(`   Images: ${stats.images}`);
    console.log("   Layouts:");
    Object.entries(stats.layouts).forEach(([layout, count]) => {
      const layoutName = layout
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      console.log(`     ${layoutName}: ${count}`);
    });
  }
}
