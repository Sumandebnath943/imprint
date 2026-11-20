import { gzipSync } from "node:zlib";

const blockSize = 512;
export const archiveLimit = 24 * 1024 * 1024;
export class ExportLimitError extends Error {}

export class ExportArchive {
  private readonly parts: Buffer[] = [];
  private size = 0;

  add(name: string, bytes: Buffer) {
    const padding = (blockSize - bytes.length % blockSize) % blockSize;
    const size = this.size + blockSize + bytes.length + padding;
    if (size + blockSize * 2 > archiveLimit) throw new ExportLimitError();
    if (name.length > 100 || !/^[a-zA-Z0-9_./-]+$/.test(name)) throw new Error("Invalid archive path");

    const header = Buffer.alloc(blockSize);
    const octal = (value: number, offset: number, width: number) => header.write(value.toString(8).padStart(width - 1, "0"), offset, "ascii");
    header.write(name, 0, "ascii");
    octal(0o600, 100, 8);
    octal(0, 108, 8);
    octal(0, 116, 8);
    octal(bytes.length, 124, 12);
    octal(Math.floor(Date.now() / 1000), 136, 12);
    header.fill(0x20, 148, 156);
    header.write("0", 156, "ascii");
    header.write("ustar\0" + "00", 257, "ascii");
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, "ascii");
    this.parts.push(header, bytes, Buffer.alloc(padding));
    this.size = size;
  }

  gzip() {
    return gzipSync(Buffer.concat([...this.parts, Buffer.alloc(blockSize * 2)]));
  }
}
