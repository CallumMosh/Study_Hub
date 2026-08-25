// Client-side PDF parsing using pdfjs-dist.
// Extracts text from every page automatically. For pages with very little
// extractable text (likely image-heavy slides — diagrams, photos of a
// whiteboard, etc.) it also renders that page to an image, so the model
// can "see" it rather than just reading text.

const MAX_RENDERED_IMAGES = 15; // keep payload size reasonable
const SPARSE_TEXT_THRESHOLD = 40; // chars; below this, treat page as image-heavy

let pdfjsLibPromise = null;

async function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist/build/pdf").then((mod) => {
      const pdfjsLib = mod.default || mod;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      return pdfjsLib;
    });
  }
  return pdfjsLibPromise;
}

async function renderPageToImage(page, scale = 1.5) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return dataUrl.split(",")[1]; // strip the data: prefix
}

/**
 * @param {File} file
 * @param {(status: string) => void} onProgress
 * @returns {Promise<{ text: string, images: {mediaType: string, data: string, name: string}[], pageCount: number }>}
 */
export async function parsePdf(file, onProgress) {
  const pdfjsLib = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let fullText = "";
  const images = [];
  let renderedCount = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`Reading page ${pageNum} of ${pdf.numPages}…`);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ").trim();

    if (pageText.length > 0) {
      fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
    }

    if (pageText.length < SPARSE_TEXT_THRESHOLD && renderedCount < MAX_RENDERED_IMAGES) {
      try {
        const data = await renderPageToImage(page);
        images.push({ mediaType: "image/jpeg", data, name: `${file.name} — page ${pageNum}` });
        renderedCount++;
      } catch {
        // if rendering fails, just skip — text extraction already captured what it could
      }
    }
  }

  return { text: fullText.trim(), images, pageCount: pdf.numPages };
}
