#!/usr/bin/env bun

import { Command } from 'commander';
import { BloomConverter } from './src/converter.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const program = new Command();

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

program
  .name('bloom-convert')
  .description('Convert Markdown files to Bloom HTML format')
  .version(packageJson.version)
  .argument('<input>', 'Input markdown file path')
  .option('-v, --validate', 'Validate input without converting')
  .action(async (input, options) => {
    try {
      const converter = new BloomConverter();
      const stats = await converter.convert(input, options.validate);
      
      if (!options.validate) {
        converter.printStats(stats);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();