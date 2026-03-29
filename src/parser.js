import * as pdfjsLib from 'pdfjs-dist';

// Setting worker path to resolve properly
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

export const extractTextFromPdf = async (file) => {
  let pdf = null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
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
  } finally {
    if (pdf) {
      await pdf.destroy();
    }
  }
};

const SYSTEM_PROMPT = `Eres un asistente experto en extracción de datos de ventas B2B. Tu objetivo es leer reportes en texto extraído de PDFs generados por IA, e identificar TODOS los prospectos que cumplan con la estructura requerida. 
Devuelve EXCLUSIVAMENTE un objeto JSON válido. El JSON debe contener una única clave raíz llamada "prospectos" que sea un arreglo de los prospectos encontrados. No incluyas explicaciones, saludos ni formato Markdown adicional (como \`\`\`json). SOLO la respuesta JSON pura.

Ejemplo de salida esperada:
{
  "prospectos": [
    {
      "company": "Empresa X",
      ...
    }
  ]
}

Cada prospecto dentro del arreglo "prospectos" debe tener esta estructura exacta:
{
  "company": "Nombre de la empresa",
  "industry": "Industria a la que pertenece",
  "score": Número entero entre 0 y 100,
  "priority": "Urgente, Alta, Media o Baja",
  "status": "Prospecto, Oportunidad, Propuesta o Cerrado",
  "decisionMaker": "Nombre del decisor principal",
  "role": "Cargo del decisor",
  "email": "SOLO incluye si el email aparece EXPLÍCITAMENTE en el texto. Si no está disponible, devuelve null. NUNCA construyas ni inventes emails.",
  "phone": "Teléfono del decisor o de la empresa (si está disponible)",
  "linkedin": "URL completa del perfil LinkedIn del decisor (si está disponible)",
  "companyLinkedin": "URL completa del perfil LinkedIn de la empresa (si está disponible)",
  "profileImage": "URL de la foto del decisor desde LinkedIn u otra fuente (si está disponible)",
  "trigger": "Motivo/Evento que dispara la necesidad o contacto",
  "painPoints": ["Array de strings con los puntos de dolor detectados"],
  "techStack": "Tecnologías que usan",
  "useCase": "Caso de uso que justifica contactarlos",
  "draftSubject": "Asunto de correo para el primer acercamiento explícito en el reporte (si no está explícito, devuelve null)",
  "draftEmail": "Cuerpo del correo especificado en el reporte (si no está explícito, devuelve null)"
}

Si falta algún dato numérico o array, invéntalo lógicamente o déjalo vacío/nulo. Para arrays como painPoints, extrae o deduce hasta 3 dolores principales. Para score y priority, genéralo basándose en qué tan buen prospecto parece. Para URLs de LinkedIn y profileImage, solo inclúyelas si están explícitamente en el reporte; si no, devuelve null. CRÍTICO: los campos email, draftSubject y draftEmail SOLO deben incluirse si aparecen escritos explícitamente en el reporte. Si no están explícitos, devuelve null — nunca los inventes, construyas ni generes automáticamente.
`;

export const analyzeProspectsWithAI = async (text) => {
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!groqKey && !openRouterKey) throw new Error("No se encontraron API Keys en .env");

  const makeRequest = async (url, key, model) => {
    return fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(url.includes('openrouter') && {
           "HTTP-Referer": window.location.href, // Recommended by OpenRouter
           "X-Title": "VoxAI Dashboard"
        })
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Extrae la información de prospectos del siguiente reporte:\n\n${text}` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
  };

  let response = null;
  
  if (groqKey) {
    response = await makeRequest("https://api.groq.com/openai/v1/chat/completions", groqKey, "llama-3.3-70b-versatile");
    
    // Si Groq nos da 429 (Rate Limit), y tenemos llave de OpenRouter, hacemos fallback
    if (response.status === 429 && openRouterKey) {
       console.warn("Groq Rate Limit alcanzado (429), usando respaldo de OpenRouter...");
       response = await makeRequest("https://openrouter.ai/api/v1/chat/completions", openRouterKey, "meta-llama/llama-3.3-70b-instruct");
    } else if (response.status === 429) {
       throw new Error("Límite de Tokens (429) de Groq alcanzado. Debes esperar o agregar OpenRouter.");
    }
  } else if (openRouterKey) {
    response = await makeRequest("https://openrouter.ai/api/v1/chat/completions", openRouterKey, "meta-llama/llama-3.3-70b-instruct");
  }

  if (!response || !response.ok) {
    const errorText = await (response?.text?.() || Promise.resolve("No response"));
    console.error('API Error:', errorText);
    throw new Error(`Fallo en la conexión con la IA (${response?.status || 'Desconocido'})`);
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
