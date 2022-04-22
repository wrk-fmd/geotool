export namespace Encoding {

  // Mapping for those Unicode codepoints that are different in cp1252
  // See https://en.wikipedia.org/wiki/Windows-1252#Codepage_layout
  const cp1252: { [key: number]: number } = {
    0x20AC: 0x80,
    0x201A: 0x82,
    0x0192: 0x83,
    0x201E: 0x84,
    0x2026: 0x85,
    0x2020: 0x86,
    0x2021: 0x87,
    0x02C6: 0x88,
    0x2030: 0x89,
    0x0160: 0x8A,
    0x2039: 0x8B,
    0x0152: 0x8C,
    0x017D: 0x8E,
    0x2018: 0x91,
    0x2019: 0x92,
    0x201C: 0x93,
    0x201D: 0x94,
    0x2022: 0x95,
    0x2013: 0x96,
    0x2014: 0x97,
    0x02DC: 0x98,
    0x2122: 0x99,
    0x0161: 0x9A,
    0x203A: 0x9B,
    0x0153: 0x9C,
    0x017E: 0x9E,
    0x0178: 0x9F,
  }

  /**
   * Encodes the given string in cp1252
   * @param str The string to encode
   * @return A sequence of bytes with invalid characters and null-bytes removed
   */
  export function asCP1252(str: string): Blob {
    const cp1252 = [];
    for (let i = 0; i < str.length; i++) {
      const mapped = mapToCP1252(str.codePointAt(i));
      if (mapped) {
        cp1252.push(mapped);
      }
    }
    return new Blob([new Uint8Array(cp1252)]);
  }

  function mapToCP1252(val?: number): number | null {
    if (!val) {
      // Invalid position or null byte
      return null;
    }

    if (val in cp1252) {
      // Map Unicode character to cp1252
      return cp1252[val];
    }

    if (val <= 0xFF) {
      // Valid cp1252 codepoint
      return val;
    }

    // Does not exist in cp1252, remove
    return null;
  }
}
