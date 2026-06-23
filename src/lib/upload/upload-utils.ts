export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;

export const PDF_TOO_LARGE_ERROR = 'PDF must be 25 MB or smaller';
export const PDF_TYPE_ERROR = 'Only PDF files are supported';

function isPdfFilename(filename: string): boolean {
  return filename.toLowerCase().endsWith('.pdf');
}

/**
 * Check whether a buffer starts with the PDF magic bytes (`%PDF`).
 */
export function hasPdfHeader(buffer: Uint8Array): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

/**
 * Accept PDF uploads by MIME type, `.pdf` filename, and `%PDF` header sniffing.
 */
export function isAcceptedPdfUpload(file: File, buffer: Uint8Array): boolean {
  const hasPdfMime = file.type === 'application/pdf' || file.type === 'application/x-pdf';
  const hasPdfName = isPdfFilename(file.name);
  const genericType = !file.type || file.type === 'application/octet-stream';

  if (!hasPdfMime && !(hasPdfName && genericType)) {
    return false;
  }

  return hasPdfHeader(buffer);
}
