// AI Provider Abstraction Layer
// This is the ONLY file that calls the AI gateway. All edge functions import from here.

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJSON(text: string): any {
  // Try to extract JSON from markdown code blocks or raw text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(raw);
}

export async function generateQuestions(
  sessionNumber: number,
  language: string,
  coupleId: string,
  previousQuestionIds: string[],
  apiKey: string
): Promise<{ question_text: string; perspective: string; category: string; difficulty: number; order_index: number }[]> {
  const langMap: Record<string, string> = {
    en: "English",
    es: "Spanish (Español)",
    fr: "French (Français)",
  };
  const targetLanguage = langMap[language] || "English";

  const systemPrompt = `You are a compassionate couples counselor specializing in endometriosis education. Generate questions that help couples understand each other better around the topic of living with endometriosis. Questions should be warm, non-judgmental, and encourage honest reflection.

Session ${sessionNumber} focus:
- Session 1: Basic understanding and daily impact
- Session 2: Emotional depth and communication patterns
- Session 3: Future planning and relationship growth

Return a JSON array of 5 questions with fields: question_text, perspective ("both"), category (string), difficulty (1-3), order_index (0-4).

CRITICAL LANGUAGE RULE: Every question_text AND every category MUST be written entirely in ${targetLanguage}. Do not mix languages. Do not translate field names — only the values. Order from least to most emotionally challenging.`;

  const userPrompt = `Generate 5 questions for Session ${sessionNumber} for couple ${coupleId}. ${
    previousQuestionIds.length > 0
      ? `Avoid repeating themes from previous question IDs: ${previousQuestionIds.join(", ")}`
      : ""
  }`;

  try {
    const result = await callAI(systemPrompt, userPrompt, apiKey);
    return parseJSON(result);
  } catch (e) {
    // Static fallback
    return getStaticQuestions(sessionNumber);
  }
}

export async function personaliseQuestions(
  questions: any[],
  coupleProfileSignals: any,
  apiKey: string
): Promise<any[]> {
  const systemPrompt = `You are a couples counselor. Reorder and slightly adapt these questions based on the couple's profile signals. Return the questions as a JSON array, ordered from least to most emotionally challenging.`;

  const userPrompt = `Questions: ${JSON.stringify(questions)}
Profile signals: ${JSON.stringify(coupleProfileSignals)}`;

  try {
    const result = await callAI(systemPrompt, userPrompt, apiKey);
    return parseJSON(result);
  } catch {
    return questions;
  }
}

export async function analyseSentiment(
  questionText: string,
  answerA: string,
  answerB: string,
  apiKey: string
): Promise<{ sentimentA: number; sentimentB: number; alignment: number }> {
  const systemPrompt = `You are a sentiment analysis expert for couples therapy. Analyze two anonymised answers to the same question. Return JSON with: sentimentA (0-100), sentimentB (0-100), alignment (0-100 where 100 = perfectly aligned perspectives).`;

  const userPrompt = `Question: "${questionText}"
User A: "${answerA}"
User B: "${answerB}"`;

  try {
    const result = await callAI(systemPrompt, userPrompt, apiKey);
    return parseJSON(result);
  } catch {
    return { sentimentA: 50, sentimentB: 50, alignment: 50 };
  }
}

export async function getCommitmentSuggestions(
  userRole: string,
  answerThemes: string[],
  alignmentScore: number,
  apiKey: string
): Promise<string[]> {
  const systemPrompt = `You are a compassionate couples counselor specializing in endometriosis. Suggest 3 specific, actionable commitments this person can make based on their session answers. Be warm and practical. Return a JSON array of exactly 3 strings.`;

  const userPrompt = `Role: ${userRole}
Key themes from answers: ${answerThemes.join(", ")}
Alignment score with partner: ${alignmentScore}/100`;

  try {
    const result = await callAI(systemPrompt, userPrompt, apiKey);
    return parseJSON(result);
  } catch {
    return [
      "Schedule a weekly check-in about how we're both feeling",
      "Research one new thing about endometriosis together",
      "Practice active listening without offering solutions",
    ];
  }
}

export async function moderateMessages(
  messages: { user_token: string; message_text: string }[],
  topic: string,
  guidelines: string,
  apiKey: string
): Promise<{
  risk_level: string;
  flagged_message_ids: number[];
  suggested_moderator_action: string;
  discussion_health_score: number;
}> {
  const systemPrompt = `You are a community moderator for a sensitive health support community about endometriosis. Analyze messages for safety. Return JSON with: risk_level ("low"|"medium"|"high"), flagged_message_ids (indices), suggested_moderator_action (string), discussion_health_score (0-100).`;

  const userPrompt = `Topic: "${topic}"
Guidelines: ${guidelines}
Messages: ${JSON.stringify(messages)}`;

  try {
    const result = await callAI(systemPrompt, userPrompt, apiKey);
    return parseJSON(result);
  } catch {
    return {
      risk_level: "low",
      flagged_message_ids: [],
      suggested_moderator_action: "No action needed",
      discussion_health_score: 80,
    };
  }
}

function getStaticQuestions(sessionNumber: number) {
  const questions: Record<number, any[]> = {
    1: [
      { question_text: "What does a typical day look like for you when endometriosis symptoms are at their worst?", perspective: "both", category: "Daily Life", difficulty: 1, order_index: 0 },
      { question_text: "How do you currently communicate about pain or discomfort with each other?", perspective: "both", category: "Communication", difficulty: 1, order_index: 1 },
      { question_text: "What's one thing you wish your partner understood better about your experience?", perspective: "both", category: "Understanding", difficulty: 2, order_index: 2 },
      { question_text: "When symptoms flare up, what kind of support feels most helpful to you?", perspective: "both", category: "Support", difficulty: 2, order_index: 3 },
      { question_text: "How has endometriosis changed the way you think about your relationship?", perspective: "both", category: "Reflection", difficulty: 3, order_index: 4 },
    ],
    2: [
      { question_text: "What emotions come up most often when dealing with endometriosis as a couple?", perspective: "both", category: "Emotions", difficulty: 1, order_index: 0 },
      { question_text: "How do you handle the frustration when plans need to change due to symptoms?", perspective: "both", category: "Adaptability", difficulty: 2, order_index: 1 },
      { question_text: "Is there something you've been afraid to say about how endo affects your relationship?", perspective: "both", category: "Vulnerability", difficulty: 2, order_index: 2 },
      { question_text: "What's a moment where you felt truly seen and supported by your partner during a flare?", perspective: "both", category: "Connection", difficulty: 2, order_index: 3 },
      { question_text: "How has endometriosis affected intimacy, and what would you like to change?", perspective: "both", category: "Intimacy", difficulty: 3, order_index: 4 },
    ],
    3: [
      { question_text: "What are your hopes for your relationship in the next year, considering endo?", perspective: "both", category: "Future", difficulty: 1, order_index: 0 },
      { question_text: "What boundaries do you need your partner to respect around your health?", perspective: "both", category: "Boundaries", difficulty: 2, order_index: 1 },
      { question_text: "How can you both build a support system beyond just each other?", perspective: "both", category: "Community", difficulty: 2, order_index: 2 },
      { question_text: "What's one thing you'd like to commit to doing differently as a couple?", perspective: "both", category: "Growth", difficulty: 2, order_index: 3 },
      { question_text: "If you could write a letter to your future selves about this journey, what would it say?", perspective: "both", category: "Reflection", difficulty: 3, order_index: 4 },
    ],
  };
  return questions[sessionNumber] || questions[1];
}
