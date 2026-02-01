import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("Gemini API key not found. Set EXPO_PUBLIC_GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export type RoundType =
  | "multiple_choice"
  | "true_false"
  | "complete_phrase"
  | "lightning_round"
  | "estimation";

export interface Player {
  id: string;
  name: string;
  age: number;
  interests: string;
  is_host: boolean;
  score: number;
  calibrationScore?: number;
}

export interface Question {
  type: RoundType;
  question: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  explanation?: string;
  topic?: string;
}

const SYSTEM_PROMPT = `You are a trivia engine for "TriviAll".
Generate exactly ONE trivia question in JSON format.
The JSON must follow this EXACT schema:
{
  "type": "multiple_choice" | "true_false" | "complete_phrase" | "lightning_round" | "estimation",
  "question": "string",
  "options": ["string", "..."], 
  "correctAnswer": "string",
  "explanation": "string",
  "topic": "string"
}

CRITICAL RULES:
1. "options" is REQUIRED for multiple_choice (must have 4 options) AND true_false (must be exactly ["True", "False"]).
2. "correctAnswer" must be one of the strings in "options" for multiple_choice and true_false.
3. For complete_phrase, "options" can be empty.
4. For estimation, the answer should be a number (as a string).`;

async function tryGenerateWithModel(modelName: string, prompt: string, player: Player): Promise<Question> {
  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: prompt }
  ]);

  const responseText = result.response.text();
  const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
  const question: Question = JSON.parse(jsonStr);

  if (!question.question || !question.correctAnswer) {
    throw new Error("AI returned invalid question format");
  }

  return question;
}

const getDifficultyGuide = (level: number): string => {
  if (level <= 1) return "Very easy. Use widely known, basic facts. Suitable for beginners or young children. Think 'what color is the sky' level simplicity.";
  if (level <= 2) return "Easy. Use simple, well-known facts that most people would know. Straightforward questions with obvious answers.";
  if (level <= 3) return "Below average difficulty. Use common knowledge with a slight twist. Most people could answer with a bit of thought.";
  if (level <= 4) return "Moderate. Use mostly common facts but include some that require specific recall. An average person gets most right.";
  if (level <= 5) return "Medium difficulty. Mix well-known and lesser-known facts. Should challenge an average trivia player.";
  if (level <= 6) return "Above average. Include specific details or lesser-known facts. Requires genuine interest in the topic.";
  if (level <= 7) return "Challenging. Use specific knowledge, dates, or details that require real expertise.";
  if (level <= 8) return "Hard. Detailed, specific knowledge required. Nuanced details and lesser-known facts. Challenges even knowledgeable players.";
  if (level <= 9) return "Very hard. Expert-level knowledge. Obscure facts, precise details, and deep subject mastery needed.";
  return "Extreme difficulty. Only a true specialist would know this. Highly obscure, deeply specific trivia.";
};

export async function generateQuestion(
  player: Player,
  roundType: RoundType,
  previousQuestions: string[] = [],
  difficulty: number = 5,
  chosenSubject?: string,
): Promise<Question> {
  if (!API_KEY) {
    throw new Error("Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.");
  }

  const requestId = Math.random().toString(36).substring(7) + Date.now();

  const subjectLine = chosenSubject
    ? `- Subject: ${chosenSubject}. Generate the question specifically about this topic.`
    : `- Interests: ${player.interests}. Generate based on these interests.`;

  const prompt = `Generate a 100% UNIQUE ${roundType} question for a trivia game.
Subject & Context:
${subjectLine}
- Difficulty Level: ${difficulty}/10
- Player is ${player.age} years old. Tailor vocabulary, complexity, and topic suitability to this age. A 4-year-old needs very simple language and concepts; a 10-year-old can handle more; an adult can handle complex topics.
- Random Seed: ${requestId}

Guidelines:
1. Focus on the specified subject or interests. Be creative within that domain.
2. If the subject is broad (e.g., "Science"), pick a specific angle within it.
3. If the subject is specific (e.g., "Ancient Rome"), stay focused on that niche.
4. The subject may be a custom user-entered topic (e.g., "Harry Potter", "Korean Cooking", "Formula 1"). Generate trivia about that topic.
5. If the topic is too obscure or you lack enough knowledge to create a factually accurate question, generate a fun general knowledge question and set the "topic" field to "General Knowledge".
6. Write the question as a NORMAL trivia question. NEVER mention the player's name, age, or any personal details in the question text. Just ask a straightforward trivia question.
7. VARIETY IS KEY: Do not repeat topics. Use the random seed to ensure uniqueness.
8. Ensure the ${roundType} format is strictly followed.
9. For true_false, options MUST be exactly ["True", "False"].
10. DIFFICULTY (${difficulty}/10): ${getDifficultyGuide(difficulty)}

CONTENT SAFETY:
- NEVER generate questions about violence, weapons, drugs, sexual content, self-harm, hate speech, or any inappropriate material.
- NEVER generate questions that are offensive, discriminatory, or harmful.
- Keep all content family-friendly and educational.
- If the requested subject seems inappropriate, default to a fun General Knowledge question instead.

Return JSON only.`;

  // Use the current stable Gemini model
  const modelName = "gemini-2.0-flash";

  try {
    // Add 10-second timeout to prevent infinite hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("AI request timed out after 10 seconds")), 10000);
    });

    const questionPromise = tryGenerateWithModel(modelName, prompt, player);
    const question = await Promise.race([questionPromise, timeoutPromise]);

    return question;
  } catch (error: any) {
    throw new Error(`Failed to generate question: ${error?.message || 'Unknown error'}. Check your internet connection and try again.`);
  }
}

export async function generateQuestions(
  players: Player[],
  roundType: RoundType,
  count: number = 1,
  playerDifficulties?: Record<string, number>,
  playerSubjects?: Record<string, string>,
): Promise<Map<string, Question[]>> {
  const questionMap = new Map<string, Question[]>();
  for (const player of players) {
    const difficulty = playerDifficulties?.[player.id] || 5;
    const subject = playerSubjects?.[player.id];
    const playerQuestions: Question[] = [];
    for (let i = 0; i < count; i++) {
      // Space out calls to avoid race condition on free quota
      if (i > 0) await new Promise(r => setTimeout(r, 300));
      const question = await generateQuestion(player, roundType, [], difficulty, subject);
      playerQuestions.push(question);
    }
    questionMap.set(player.id, playerQuestions);
  }
  return questionMap;
}

