
// Type definitions
type u32 = number;
type byte = number;

interface MD5Context {
    A: u32;
    B: u32;
    C: u32;
    D: u32;
    nblocks: u32;
    count: number;
    buf: Uint8Array;
}

export class MD5 {

  private context: MD5Context | null = null;

  constructor() {
    this.context = null;
  }

  /**
   * MD5 auxiliary functions (RFC 1321)
   */
  private static FF(b: u32, c: u32, d: u32): u32 {
    return (d ^ (b & (c ^ d))) >>> 0;
  }

  private static FG(b: u32, c: u32, d: u32): u32 {
    return MD5.FF(d, b, c);
  }

  private static FH(b: u32, c: u32, d: u32): u32 {
    return (b ^ c ^ d) >>> 0;
  }

  private static FI(b: u32, c: u32, d: u32): u32 {
    return (c ^ (b | ~d)) >>> 0;
  }

  /**
   * Left rotation (same as Blowfish)
   */
  private static rol(x: u32, n: number): u32 {
    return ((x << n) | (x >>> (32 - n))) >>> 0;
  }

  /**
   * MD5 transform function - processes 64-byte block
   */
  private static md5Transform(ctx: MD5Context, data: Uint8Array): void {
    const correctWords = new Array(16);
    let A = ctx.A;
    let B = ctx.B;
    let C = ctx.C;
    let D = ctx.D;

    // Convert bytes to words (little-endian, same as original C++)
    for (let i = 0; i < 16; i++) {
      const p = i * 4;
      correctWords[i] = (data[p + 3] << 24 | data[p + 2] << 16 | data[p + 1] << 8 | data[p]) >>> 0;
    }

    let cwp = 0;

    // Round 1 operations
    const OP1 = (a: u32, b: u32, c: u32, d: u32, s: number, T: u32): u32 => {
      a = (a + this.FF(b, c, d) + correctWords[cwp++] + T) >>> 0;
      a = this.rol(a, s);
      return (a + b) >>> 0;
    };

    A = OP1(A, B, C, D, 7, 0xd76aa478); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 12, 0xe8c7b756); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 17, 0x242070db); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 22, 0xc1bdceee); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 7, 0xf57c0faf); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 12, 0x4787c62a); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 17, 0xa8304613); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 22, 0xfd469501); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 7, 0x698098d8); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 12, 0x8b44f7af); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 17, 0xffff5bb1); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 22, 0x895cd7be); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 7, 0x6b901122); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 12, 0xfd987193); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 17, 0xa679438e); [A, B, C, D] = [D, A, B, C];
    A = OP1(A, B, C, D, 22, 0x49b40821); [A, B, C, D] = [D, A, B, C];

    // Round 2-4 operations
    const OP2 = (f: (b: u32, c: u32, d: u32) => u32, a: u32, b: u32, c: u32, d: u32, k: number, s: number, T: u32): u32 => {
      a = (a + f(b, c, d) + correctWords[k] + T) >>> 0;
      a = this.rol(a, s);
      return (a + b) >>> 0;
    };

    // Round 2
    A = OP2(this.FG, A, B, C, D, 1, 5, 0xf61e2562); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 6, 9, 0xc040b340); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 11, 14, 0x265e5a51); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 0, 20, 0xe9b6c7aa); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 5, 5, 0xd62f105d); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 10, 9, 0x02441453); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 15, 14, 0xd8a1e681); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 4, 20, 0xe7d3fbc8); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 9, 5, 0x21e1cde6); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 14, 9, 0xc33707d6); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 3, 14, 0xf4d50d87); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 8, 20, 0x455a14ed); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 13, 5, 0xa9e3e905); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 2, 9, 0xfcefa3f8); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 7, 14, 0x676f02d9); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FG, A, B, C, D, 12, 20, 0x8d2a4c8a); [A, B, C, D] = [D, A, B, C];

    // Round 3
    A = OP2(this.FH, A, B, C, D, 5, 4, 0xfffa3942); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 8, 11, 0x8771f681); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 11, 16, 0x6d9d6122); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 14, 23, 0xfde5380c); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 1, 4, 0xa4beea44); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 4, 11, 0x4bdecfa9); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 7, 16, 0xf6bb4b60); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 10, 23, 0xbebfbc70); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 13, 4, 0x289b7ec6); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 0, 11, 0xeaa127fa); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 3, 16, 0xd4ef3085); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 6, 23, 0x04881d05); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 9, 4, 0xd9d4d039); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 12, 11, 0xe6db99e5); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 15, 16, 0x1fa27cf8); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FH, A, B, C, D, 2, 23, 0xc4ac5665); [A, B, C, D] = [D, A, B, C];

    // Round 4
    A = OP2(this.FI, A, B, C, D, 0, 6, 0xf4292244); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 7, 10, 0x432aff97); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 14, 15, 0xab9423a7); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 5, 21, 0xfc93a039); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 12, 6, 0x655b59c3); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 3, 10, 0x8f0ccc92); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 10, 15, 0xffeff47d); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 1, 21, 0x85845dd1); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 8, 6, 0x6fa87e4f); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 15, 10, 0xfe2ce6e0); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 6, 15, 0xa3014314); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 13, 21, 0x4e0811a1); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 4, 6, 0xf7537e82); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 11, 10, 0xbd3af235); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 2, 15, 0x2ad7d2bb); [A, B, C, D] = [D, A, B, C];
    A = OP2(this.FI, A, B, C, D, 9, 21, 0xeb86d391); [A, B, C, D] = [D, A, B, C];

    // Add results to context
    ctx.A = (ctx.A + A) >>> 0;
    ctx.B = (ctx.B + B) >>> 0;
    ctx.C = (ctx.C + C) >>> 0;
    ctx.D = (ctx.D + D) >>> 0;
  }

  /**
   * MD5 write function - processes input data
   */
  private static md5Write(ctx: MD5Context, inbuf: Uint8Array | null, inlen: number): void {
    if (ctx.count === 64) {
      this.md5Transform(ctx, ctx.buf);
      ctx.count = 0;
      ctx.nblocks++;
    }
    
    if (!inbuf) return;
    
    let pos = 0;
    
    if (ctx.count > 0) {
      while (inlen > 0 && ctx.count < 64) {
        ctx.buf[ctx.count++] = inbuf[pos++];
        inlen--;
      }
      this.md5Write(ctx, null, 0);
      if (inlen === 0) return;
    }

    while (inlen >= 64) {
      const block = inbuf.slice(pos, pos + 64);
      this.md5Transform(ctx, block);
      ctx.count = 0;
      ctx.nblocks++;
      inlen -= 64;
      pos += 64;
    }

    while (inlen > 0 && ctx.count < 64) {
      ctx.buf[ctx.count++] = inbuf[pos++];
      inlen--;
    }
  }

  /**
   * MD5 final function - adds padding and produces final hash
   */
  private static md5Final(ctx: MD5Context): void {
    this.md5Write(ctx, null, 0); // flush

    let msb = 0;
    let t = ctx.nblocks;
    let lsb = (t << 6) >>> 0;
    if (lsb < t) msb++;
    msb = (msb + (t >>> 26)) >>> 0;
    
    t = lsb;
    lsb = (t + ctx.count) >>> 0;
    if (lsb < t) msb++;
    
    t = lsb;
    lsb = (t << 3) >>> 0;
    if (lsb < t) msb++;
    msb = (msb + (t >>> 29)) >>> 0;

    if (ctx.count < 56) {
      ctx.buf[ctx.count++] = 0x80;
      while (ctx.count < 56) {
        ctx.buf[ctx.count++] = 0;
      }
    } else {
      ctx.buf[ctx.count++] = 0x80;
      while (ctx.count < 64) {
        ctx.buf[ctx.count++] = 0;
      }
      this.md5Write(ctx, null, 0);
      ctx.buf.fill(0, 0, 56);
    }

    // Append 64-bit length in bits (little-endian)
    ctx.buf[56] = lsb & 0xff;
    ctx.buf[57] = (lsb >>> 8) & 0xff;
    ctx.buf[58] = (lsb >>> 16) & 0xff;
    ctx.buf[59] = (lsb >>> 24) & 0xff;
    ctx.buf[60] = msb & 0xff;
    ctx.buf[61] = (msb >>> 8) & 0xff;
    ctx.buf[62] = (msb >>> 16) & 0xff;
    ctx.buf[63] = (msb >>> 24) & 0xff;
    
    this.md5Transform(ctx, ctx.buf);

    // Convert hash values to bytes (little-endian)
    let p = 0;
    const writeU32LE = (value: u32) => {
      ctx.buf[p++] = value & 0xff;
      ctx.buf[p++] = (value >>> 8) & 0xff;
      ctx.buf[p++] = (value >>> 16) & 0xff;
      ctx.buf[p++] = (value >>> 24) & 0xff;
    };

    writeU32LE(ctx.A);
    writeU32LE(ctx.B);
    writeU32LE(ctx.C);
    writeU32LE(ctx.D);
  }

  /**
   * Main MD5 function - equivalent to getMD5Sum from C++
   */
  public static getMD5Sum(input: Uint8Array): Uint8Array {

    const ctx: MD5Context = {
        A: 0x67452301,
        B: 0xefcdab89,
        C: 0x98badcfe,
        D: 0x10325476,
        nblocks: 0,
        count: 0,
        buf: new Uint8Array(64)
    };

    this.md5Write(ctx, input, input.length);
    this.md5Final(ctx);

    const result = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      result[i] = ctx.buf[i];
    }
    
    return result;
  }
}
