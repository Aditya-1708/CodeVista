import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export const reviewCodeWithAI = async (
  code: string,
  language: string,
  stderr: string,
  stdout: string,
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
If you return any code, your response is invalid.

You are an expert ${language} debugging assistant.

Analyze the provided code and identify all issues.

STRICT RULES:
- Do NOT return code
- Do NOT rewrite or annotate code
- Do NOT include code snippets/examples
- Return ONLY point-wise bullet summaries of what is wrong
- Keep each point short and beginner friendly
- Explain the issue, why it happens, and general fix idea
- No markdown
- No headings
- No extra text

CODE:
${code}

STDOUT:
${stdout || "No stdout provided"}

STDERR:
${stderr || "No stderr provided"}
`,
    });

    return response.text;
  } catch (error) {
    console.error("AI Review Error:", error);
    throw error;
  }
};

export const correctCodeWithAI = async (code: string, language: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are an expert ${language} compiler and debugger.

Fix the given ${language} code.

Analyze and correct ALL possible issues including:
- Syntax / compilation errors
- Runtime errors
- Logical errors
- Division by zero
- Null / undefined reference errors
- Out of bounds / invalid index access
- Infinite loops / recursion issues
- Invalid variable usage
- Type mismatch / casting issues
- Missing imports / declarations
- Incorrect condition / loop logic
- Any unsafe or crash-prone code patterns

STRICT RULES:
- Output ONLY the corrected code
- Do NOT add explanation
- Do NOT add comments
- Do NOT add markdown
- Do NOT add extra text
- Preserve original intent/logic as much as possible
- Return fully runnable production-ready code
- Return plain code only

CODE:
${code}
`,
    });

    return response.text;
  } catch (error) {
    console.error("AI Correction Error:", error);
    throw error;
  }
};
