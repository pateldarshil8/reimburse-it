// Sniffs a file's real type from its magic bytes, independent of the
// filename extension or the client-supplied Content-Type. A request's
// declared MIME type (File.type) comes from the browser/client and can be
// spoofed by anyone crafting the multipart request directly (e.g. curl),
// so backend validation must not stop at trusting it (problem_statement.md
// §15/§18: "Validate the actual file type on the backend rather than
// trusting only the filename extension").
export type SniffedType = "image/jpeg" | "image/png" | "application/pdf";

export function sniffFileType(bytes: Uint8Array): SniffedType | null {
  if (bytes.length < 4) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }

  // PDF: 25 50 44 46 ("%PDF")
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }

  return null;
}
