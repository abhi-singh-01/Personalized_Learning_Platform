const { GoogleGenAI } = require('@google/genai');
const { GEMINI_API_KEY } = require('../config/env');
const Setting = require('../models/Setting');

let _ai = null;

const getAI = async () => {
  let settings = await Setting.findOne();
  if (settings && !settings.aiEnabled) {
    throw new Error('AI features are currently disabled by the Administrator.');
  }

  const apiKey = (settings && settings.geminiApiKey) ? settings.geminiApiKey : GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please configure it in Settings.');
  }

  _ai = new GoogleGenAI({ apiKey });
  return _ai;
};

const MODEL = 'gemini-2.5-flash';

/**
 * Helper to detect and re-throw Gemini geographic restriction errors
 * with a clear, actionable message. Use this in try/catch blocks around
 * any direct Gemini API call.
 */
const wrapGeminiError = (err) => {
  if (
    err.message?.includes('User location is not supported') ||
    (err.status === 400 && err.message?.includes('FAILED_PRECONDITION'))
  ) {
    throw new Error(
      'Gemini AI is not available in the server\'s current region. ' +
      'Please change your backend hosting region to US (Oregon) or EU (Frankfurt), ' +
      'or use a VPN/proxy. This is a Google API geographic restriction.'
    );
  }
  throw err;
};

/**
 * Wrapper that calls Gemini, parses JSON from the response, and catches
 * region-specific errors with a user-friendly message.
 */
const callGemini = async (prompt) => {
  const ai = await getAI();
  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const text = result.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI returned invalid format');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    wrapGeminiError(err);
  }
};

const generateStudyPlan = async ({ goal, hoursPerWeek, weeks, level, weakTopics, courseTitle, syllabusContext }) => {
  const syllabusSection = syllabusContext
    ? `\n\nCourse Syllabus (extracted from video lectures):\n${JSON.stringify(syllabusContext, null, 2)}\nUse this syllabus to create a highly specific study plan aligned with the actual course content.`
    : '';

  const prompt = `You are an expert academic tutor. Generate a personalized weekly study plan in JSON format for exactly ${weeks} weeks.

Learner Details:
- Current Level: ${level}
- Course: ${courseTitle || 'General'}
- Learning Goal: ${goal}
- Available Hours/Week: ${hoursPerWeek}
- Total Duration: ${weeks} Weeks
- Weak Topics: ${weakTopics?.join(', ') || 'None identified'}${syllabusSection}

Return ONLY valid JSON with this structure:
{
  "planTitle": "string",
  "totalWeeks": number,
  "weeklyPlan": [
    {
      "week": number,
      "theme": "string",
      "days": [
        {
          "day": "string",
          "tasks": ["string"],
          "duration": "string",
          "focus": "string"
        }
      ],
      "goals": ["string"]
    }
  ],
  "tips": ["string"],
  "expectedOutcome": "string"
}`;

  return callGemini(prompt);
};

const generateQuiz = async ({ topic, difficulty, numQuestions = 5, courseTitle, previousQuestions = [] }) => {
  const previousString = previousQuestions.length > 0
    ? `\n\nCRITICAL: Do NOT generate any questions that match or are extremely similar to the following previously asked questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const prompt = `You are a friendly educator creating a quiz for learners. Generate a ${difficulty} difficulty quiz about "${topic}" for the course "${courseTitle}".

IMPORTANT RULES FOR QUESTION QUALITY:
1. Write every question in simple, clear, everyday English that any learner can understand.
2. Keep each question SHORT — 1 to 2 sentences maximum. Get straight to the point.
3. DO NOT include code snippets, code blocks, or raw code in questions or options. If a concept involves code, describe it in plain words (e.g., "What happens when a child class defines the same method as its parent class?" instead of embedding a 20-line code block).
4. Keep each option SHORT — one brief phrase or sentence. Make options clearly different from each other.
5. For scenario-based questions, use simple, relatable examples (e.g., "a learner registration system" not "a large-scale enterprise microservices architecture").
6. Write explanations in 1-2 simple sentences that a beginner would understand.
7. Avoid jargon-heavy, academic, or overly technical language. Prefer plain terms.
8. Each option should be labeled naturally (no "A.", "B." prefixes — just the text).${previousString}

Return ONLY valid JSON with this structure:
{
  "title": "Quiz: ${topic}",
  "description": "string",
  "questions": [
    {
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "explanation": "string"
    }
  ]
}

Generate exactly ${numQuestions} questions. correctAnswer is a 0-based index.`;

  return callGemini(prompt);
};

const generateFeedback = async ({ learnerName, level, averageScore, recentScores, weakTopics }) => {
  const prompt = `You are a supportive academic advisor. Provide personalized learning feedback.

Learner: ${learnerName}
Level: ${level}
Average Score: ${averageScore}%
Recent Scores: ${recentScores?.join(', ') || 'N/A'}
Weak Areas: ${weakTopics?.join(', ') || 'None identified'}

Return ONLY valid JSON:
{
  "overallAssessment": "string",
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "recommendations": ["string"],
  "motivationalMessage": "string"
}`;

  return callGemini(prompt);
};

module.exports = { getAI, MODEL, callGemini, wrapGeminiError, generateStudyPlan, generateQuiz, generateFeedback };