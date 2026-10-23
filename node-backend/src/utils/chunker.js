// src/utils/chunker.js

function createChunks(text, chunkSize = 500, chunkOverlap = 100) {
    if (!text || typeof text !== 'string') return [];

    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

        if (endIndex < text.length) {
            let breakPoint = text.lastIndexOf('.', endIndex);
            if (breakPoint > startIndex + (chunkSize / 2)) {
                endIndex = breakPoint + 1;
            }
        }

        const chunk = text.slice(startIndex, endIndex).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        startIndex += chunkSize - chunkOverlap;
    }

    return chunks;
}

module.exports = { createChunks };