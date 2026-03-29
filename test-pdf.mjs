import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractTextFromPdf(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument(data).promise;
  
  let fullText = '';
  let urls = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
    
    // Check annotations for links
    const annotations = await page.getAnnotations();
    for (const ann of annotations) {
      if (ann.url) urls.push(ann.url);
    }
  }
  
  return { fullText, urls };
}

extractTextFromPdf('./VM-Twin-Report-170226.pdf').then(res => {
  console.log("--- Extracted Text Preview ---");
  console.log(res.fullText);
  console.log("--- End Text ---");
  console.log("URLs found in annotations:", res.urls);
}).catch(console.error);
