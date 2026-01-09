
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizResult } from "../types";

const API_KEY = process.env.API_KEY || "";

export const generateQuizFromPDF = async (
  pdfBase64: string,
  minAge: number,
  maxAge: number,
  count: number
): Promise<QuizResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `أنت خبير في إعداد الاختبارات التعليمية لمشروع "رواد القراءة" في مؤسسة الرواد للتعليم والتوعية.
مهمتك هي تحليل الكتاب المرفوع بدقة وصياغة اختبار اختيار من متعدد (MCQ) يتناسب مع الفئة العمرية المستهدفة (من ${minAge} إلى ${maxAge} سنوات).

القواعد الصارمة:
1. الأسئلة يجب أن تكون مستخرجة حرفياً ونصياً من الكتاب. لا تضع أسئلة استنتاجية من خارج النص.
2. لكل سؤال 4 خيارات (أ، ب، ج، د) تتضمن إجابة واحدة صحيحة فقط.
3. يجب تنويع توزيع الإجابات الصحيحة بشكل عشوائي بين الخيارات (أ، ب، ج، د) وعدم تركيز الإجابات الصحيحة في خيار واحد (مثلاً لا تجعل كل الإجابات 'أ').
4. يجب تحديد رقم الصفحة (أو الصفحات) التي تحتوي على الإجابة لكل سؤال بدقة.
5. تنويع مستويات الصعوبة بين (سهل، متوسط، صعب).
6. اللغة المستخدمة يجب أن تناسب الفئة العمرية المحددة (من ${minAge} إلى ${maxAge} سنة).
7. عدد الأسئلة المطلوب هو: ${count} سؤالاً.
8. الرد يجب أن يكون بتنسيق JSON حصراً.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "عنوان الكتاب أو الاختبار" },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.NUMBER },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.STRING },
            pageNumber: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['سهل', 'متوسط', 'صعب'] }
          },
          required: ["id", "question", "options", "correctAnswer", "pageNumber", "difficulty"]
        }
      }
    },
    required: ["title", "questions"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64
            }
          },
          {
            text: `قم بإنشاء اختبار من ${count} أسئلة لطلاب في الفئة العمرية من ${minAge} إلى ${maxAge} سنة بناءً على هذا الكتاب.`
          }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const result = JSON.parse(response.text || "{}") as QuizResult;
    return { ...result, targetAgeRange: { min: minAge, max: maxAge } };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("فشل في توليد الاختبار. يرجى التأكد من حجم الملف وصلاحية المفتاح.");
  }
};
