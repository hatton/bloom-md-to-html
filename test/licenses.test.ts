import { describe, it, expect } from 'bun:test';
import { mapLicense, LICENSE_MAPPING } from '../src/licenses.js';

describe('License Mapping', () => {
  it('should map known CC licenses correctly', () => {
    expect(mapLicense('CC-BY')).toBe('http://creativecommons.org/licenses/by/4.0/');
    expect(mapLicense('CC-BY-SA')).toBe('http://creativecommons.org/licenses/by-sa/4.0/');
    expect(mapLicense('CC0')).toBe('http://creativecommons.org/publicdomain/zero/1.0/');
  });

  it('should pass through URLs unchanged', () => {
    const customUrl = 'https://example.com/custom-license';
    expect(mapLicense(customUrl)).toBe(customUrl);
    
    const httpUrl = 'http://example.com/license';
    expect(mapLicense(httpUrl)).toBe(httpUrl);
  });

  it('should return unknown licenses unchanged', () => {
    const unknownLicense = 'CUSTOM-LICENSE';
    expect(mapLicense(unknownLicense)).toBe(unknownLicense);
  });
});
