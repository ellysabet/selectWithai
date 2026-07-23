// api/generate.js
// Vercel 서버리스 함수 (Node.js 런타임)
// GEMINI_API_KEY는 Vercel 프로젝트 환경변수에서 읽어옵니다. 코드에 절대 직접 쓰지 않습니다.

const MODEL_NAME = "Gemini 3.1 Flash Lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

module.exports = async function handler(req, res) {
  // POST만 허용
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "서버에 GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다." });
    return;
  }

  try {
    const { choiceA, choiceB, emotion, emotionDetail } = req.body || {};

    if (!choiceA || !choiceB || typeof choiceA !== "string" || typeof choiceB !== "string") {
      res.status(400).json({ error: "선택지 두 개(choiceA, choiceB)를 모두 문자열로 보내주세요." });
      return;
    }

    const a = choiceA.trim().slice(0, 100);
    const b = choiceB.trim().slice(0, 100);
    const emo = (emotion || "").toString().trim().slice(0, 50);
    const emoDetail = (emotionDetail || "").toString().trim().slice(0, 300);

    const emotionText = [emo, emoDetail].filter(Boolean).join(" / ") || "특별히 언급 없음";

    const prompt = `너는 친근하고 공감 능력이 뛰어난 선택 도우미야.
사용자가 두 가지 선택지 중 하나를 고민하고 있어. 사용자의 현재 감정 상태를 고려해서
둘 중 하나를 골라주고, 그 이유를 설명하고, 사용자에게 도움이 될 만한 따뜻한 한마디를 건네줘.

[선택지 1] ${a}
[선택지 2] ${b}
[사용자의 현재 감정] ${emotionText}

다음 JSON 형식으로만 답해. 다른 설명, 마크다운, 코드블록 없이 순수 JSON 객체만 출력해:
{
  "pick": "선택지 1 또는 선택지 2의 원문 그대로",
  "reason": "왜 이걸 골랐는지, 사용자의 감정 상태를 고려한 2~3문장 설명",
  "message": "사용자에게 건네는 따뜻하고 짧은 한마디 (1~2문장)"
}

주의: pick 값은 [선택지 1]이나 [선택지 2]에 적힌 텍스트 원문과 정확히 같아야 해.`;

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          responseMimeType: "application/json"
        }
      })
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errBody);
      res.status(502).json({ error: `Gemini API 호출 실패 (${geminiRes.status})` });
      return;
    }

    const geminiData = await geminiRes.json();

    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

    if (!rawText) {
      console.error("Unexpected Gemini response:", JSON.stringify(geminiData));
      res.status(502).json({ error: "AI 응답을 해석할 수 없습니다." });
      return;
    }

    let parsed;
    try {
      // 혹시 코드블록(```json ... ```)이 섞여 오는 경우를 대비해 정리
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, rawText);
      res.status(502).json({ error: "AI 응답 형식이 올바르지 않습니다." });
      return;
    }

    if (!parsed.pick || !parsed.reason || !parsed.message) {
      res.status(502).json({ error: "AI 응답에 필요한 값이 누락되었습니다." });
      return;
    }

    res.status(200).json({
      pick: parsed.pick,
      reason: parsed.reason,
      message: parsed.message
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "서버 처리 중 오류가 발생했습니다." });
  }
};
