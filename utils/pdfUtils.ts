
import * as pdfjsLib from 'pdfjs-dist';

// Configure the workerSrc for pdfjs-dist. 
// This path should correspond to how pdf.worker.min.js is served.
// For esm.sh, we import it directly via the import map.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs';


export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Concatenate text items on the page
      // item.str is the text, item.hasEOL indicates if it's the end of a line (useful for layout preservation if needed)
      const pageText = textContent.items.map(item => item.str).join(' '); 
      fullText += pageText + '\n\n'; // Add double newline between pages for better separation of content
      
      // Clean up page resources to free memory
      page.cleanup();
    }
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    let errorMessage = 'Failed to extract text from PDF.';
    if (error instanceof Error) {
        if (error.name === 'PasswordException') {
            errorMessage = 'PDF is password-protected. Text extraction failed.';
        } else if (error.name === 'InvalidPDFException') {
            errorMessage = 'Invalid or corrupted PDF file.';
        } else {
            errorMessage = `Failed to extract text: ${error.message}. The file might be corrupted, an image-based PDF, or an unsupported format.`;
        }
    }
    throw new Error(errorMessage);
  }
};