import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { basename, dirname, extname, resolve } from "path";
import { HtmlGenerator } from "./html-generator.js";
import { MarkdownToBloomHtml } from "./md-to-bloom.js";
import type { Book, ConversionStats } from "./types.js";

export class BloomConverter {
  private templates: HtmlGenerator;

  constructor() {
    this.templates = new HtmlGenerator();
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
    const parser = new MarkdownToBloomHtml(resolvedInputPath, {
      validateImages: true,
    });

    // Read and parse markdown
    const content = readFileSync(resolvedInputPath, "utf-8");
    const book = parser.parseMarkdownIntoABookObject(content);

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
    const name = basename(inputPath, extname(inputPath)).replace(
      "-enriched",
      ""
    );
    return resolve(dir, `${name}.htm`);
  }

  private generateStats(book: Book): ConversionStats {
    const languages = new Set<string>();
    let imageCount = 0;
    const layouts: Record<string, number> = {};

    // Count languages, images, and layouts
    book.pages.forEach((page) => {
      // Count images and languages
      page.elements.forEach((element) => {
        if (element.type === "image") {
          imageCount++;
        } else if (element.type === "text") {
          Object.keys(element.content).forEach((lang) => {
            languages.add(lang);
          });
        }
      });

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
