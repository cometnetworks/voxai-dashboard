import * as pdfjsLib from 'pdfjs-dist';

// Setting worker path to resolve properly with Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const extractTextFromPdf = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Loop through all pages to extract text
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('No se pudo leer el archivo PDF');
  }
};

const SYSTEM_PROMPT = `Eres un asistente experto en extracción de datos de ventas B2B. Tu objetivo es leer reportes en texto extraído de PDFs generados por IA, e identificar TODOS los prospectos que cumplan con la estructura requerida. 
Devuelve EXCLUSIVAMENTE un bloque de JSON válido, que sea un arreglo de objetos. No incluyas explicaciones, saludos ni formato Markdown adicional (como \`\`\`json). SOLO la respuesta JSON pura.

Cada prospecto debe tener esta estructura exacta:
{
  "id": "Texto único (e.g., p1, p2, o timestamp)",
  "company": "Nombre de la empresa",
  "industry": "Industria a la que pertenece",
  "score": Número entero entre 0 y 100,
  "priority": "Urgente, Alta, Media o Baja",
  "status": "Prospecto, Oportunidad, Propuesta o Cerrado",
  "decisionMaker": "Nombre del decisor principal",
  "role": "Cargo del decisor",
  "email": "Correo electrónico del decisor",
  "linkedinSearch": "Términos de búsqueda en LinkedIn para el decisor",
  "trigger": "Motivo/Evento que dispara la necesidad o contacto",
  "painPoints": ["Array de strings con los puntos de dolor detectados"],
  "techStack": "Tecnologías que usan",
  "useCase": "Caso de uso que justifica contactarlos",
  "draftSubject": "Asunto de correo para el primer acercamiento",
  "draftEmail": "Cuerpo del correo sugerido"
}

Si falta algún dato numérico o array, invéntalo lógicamente o déjalo vacío/nulo si no tiene sentido inventarlo. Para arrays como painPoints, extrae o deduce hasta 3 dolores principales. Para score y priority, genéralo basándote en que tan buen prospecto parece.
`;

export const analyzeProspectsWithAI = async (text) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("API Key de Groq no encontrada en .env");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Extrae la información de prospectos del siguiente reporte:\n\n${text}` }
      ],
      temperature: 0.1, // Low to ensure reliable JSON
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    console.error('API Error:', await response.text());
    throw new Error("Fallo en la conexión con la IA de extracción");
  }

  const data = await response.json();
  const rawContent = data.choices[0].message.content;
  
  try {
    let parsed = JSON.parse(rawContent);
    // Groq might return inside a wrapper object depending on JSON schema, or an array directly.
    // If response format is json_object, we need to handle it.
    if (parsed.prospectos) return parsed.prospectos;
    if (parsed.prospects) return parsed.prospects;
    if (Array.isArray(parsed)) return parsed;
    
    // Fallback if it wrapped it inside some key
    const keys = Object.keys(parsed);
    if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
      return parsed[keys[0]];
    }

    return [parsed]; // If it's a single object
  } catch (err) {
    console.error('JSON parsing failed:', err, rawContent);
    throw new Error("La IA no estructuró la respuesta correctamente.");
  }
};
