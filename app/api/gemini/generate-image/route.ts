import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { base64Image, mimeType, prompt } = await req.json();
    if (!base64Image) {
      return NextResponse.json({ error: "Missing input image" }, { status: 400 });
    }

    // Format the base64 data by removing any potential prefix
    const cleanedBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    // We use gemini-3.1-flash-lite-image as the image generator model, which supports image-to-image conditioning
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanedBase64,
              mimeType: mimeType || "image/png",
            },
          },
          {
            text: prompt || "Generate an identical image matching the composition, style, color palette, lighting, details, and context of this image as closely as possible.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      } as any,
    });

    let generatedBase64 = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedBase64 = part.inlineData.data || "";
          break;
        }
      }
    }

    if (!generatedBase64) {
      throw new Error("No image data returned from image generation model");
    }

    return NextResponse.json({ base64Image: generatedBase64, mimeType: "image/png" });
  } catch (err: any) {
    console.error("Error generating image:", err);
    
    const errMsg = err.message || "";
    if (err.status === 429 || errMsg.includes("quota") || errMsg.includes("Quota exceeded") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({
        error: "A geração de imagens com IA (modelo gemini-3.1-flash-lite-image) requer o uso de uma chave de API paga no Google AI Studio (plano de faturamento ativo). No plano gratuito, essa cota é zero. Por favor, peça no chat para o assistente abrir o painel de chave paga para você ativar o faturamento, ou tente novamente mais tarde.",
        isQuotaError: true
      }, { status: 429 });
    }

    return NextResponse.json({ error: err.message || "Failed to generate image" }, { status: 500 });
  }
}
