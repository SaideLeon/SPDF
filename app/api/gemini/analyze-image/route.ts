import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { base64Image, mimeType } = await req.json();
    if (!base64Image) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    // Format the base64 data by removing any potential prefix
    const cleanedBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this image in detail and extract all of its visual characteristics.
      
Requirements:
1. Extract 4-6 primary colors in the image, providing both their Hex code and their RGB decimal format (e.g., "255, 128, 0").
2. Recreate the visual layout and style of the cropped area using clean HTML and CSS. If the original image contains a gradient (linear or radial), shadows, background patterns, shapes, text layout, or border radii, reproduce them faithfully in the CSS so the rendered result looks identical to the image.
3. Organize the response into a structured JSON matching the provided schema.`;

    const requestParams: any = {
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          inlineData: {
            data: cleanedBase64,
            mimeType: mimeType || "image/png"
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            style: { type: Type.STRING },
            colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
            colorPaletteDecimals: {
              type: Type.ARRAY,
              description: "List of extracted primary colors with their hexadecimal and decimal channel representations",
              items: {
                type: Type.OBJECT,
                properties: {
                  hex: { type: Type.STRING, description: "Hexadecimal color string e.g. #FF8000" },
                  rgb: { type: Type.STRING, description: "Standard rgb CSS string e.g. rgb(255, 128, 0)" },
                  decimal: { type: Type.STRING, description: "Decimal channel values e.g. '255, 128, 0'" }
                },
                required: ["hex", "rgb", "decimal"]
              }
            },
            composition: { type: Type.STRING },
            lighting: { type: Type.STRING },
            details: { type: Type.STRING },
            optimizedPrompt: { type: Type.STRING },
            recreationHtml: { 
              type: Type.STRING, 
              description: "A small piece of HTML structure that represents the image elements (such as container divs, text elements, shape elements, or gradients) without any external dependencies" 
            },
            recreationCss: { 
              type: Type.STRING, 
              description: "CSS styling containing all styling rules, colors, transitions, gradients, shadows, text styles, sizes, and layout to perfectly render the recreationHtml" 
            }
          },
          required: [
            "description", 
            "style", 
            "colorPalette", 
            "colorPaletteDecimals", 
            "composition", 
            "lighting", 
            "details", 
            "optimizedPrompt",
            "recreationHtml",
            "recreationCss"
          ]
        }
      }
    };

    let response;
    const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];
    let lastError: any = null;

    for (const candidateModel of candidateModels) {
      try {
        requestParams.model = candidateModel;
        response = await ai.models.generateContent(requestParams);
        if (response) break; // Succeeded!
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${candidateModel} failed or experienced high demand, trying next model in chain...`, err);
      }
    }

    if (!response) {
      throw new Error(lastError?.message || "All fallback models in the chain failed to process the request.");
    }

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Error analyzing image:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze image" }, { status: 500 });
  }
}
