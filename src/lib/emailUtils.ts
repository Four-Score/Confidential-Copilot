export function chunkEmailText(text: string, options: { fileName: string; documentId: string }) {
  const maxChunkLength = 1000;
  const chunks = [];

  for (let i = 0, chunkNumber = 0; i < text.length; i += maxChunkLength, chunkNumber++) {
    const chunk = text.slice(i, i + maxChunkLength);
    chunks.push({
      content: chunk,
      metadata: {
        chunkNumber,
        pageNumber: 1, // Emails typically don't have pages
        chunkIndex: chunkNumber,
        fileName: options.fileName,
        documentId: options.documentId,
      },
    });
  }

  return chunks;
}
