const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');
const Setting = require('../models/Setting');

const getModel = async () => {
  let settings = await Setting.findOne();
  if (settings && !settings.aiEnabled) {
    throw new Error('AI features are currently disabled by the Administrator.');
  }

  // Use DB key if it exists, otherwise fallback to ENV
  const apiKey = (settings && settings.geminiApiKey) ? settings.geminiApiKey : GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please configure it in Settings.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

const generateStudyPlan = async ({ goal, hoursPerWeek, weeks, level, weakTopics, courseTitle }) => {
  const prompt = `You are an expert academic tutor. Generate a personalized weekly study plan in JSON format for exactly ${weeks} weeks.

Student Details:
- Current Level: ${level}
- Course: ${courseTitle || 'General'}
- Learning Goal: ${goal}
- Available Hours/Week: ${hoursPerWeek}
- Total Duration: ${weeks} Weeks
- Weak Topics: ${weakTopics?.join(', ') || 'None identified'}

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

  const model = await getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid format');
  return JSON.parse(jsonMatch[0]);
};

const generateQuiz = async ({ topic, difficulty, numQuestions = 5, courseTitle, previousQuestions = [] }) => {
  const previousString = previousQuestions.length > 0
    ? `\n\nCRITICAL: Do NOT generate any questions that match or are extremely similar to the following previously asked questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const prompt = `Generate a ${difficulty} difficulty quiz about "${topic}" for the course "${courseTitle}".${previousString}

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

  const model = await getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid format');
  return JSON.parse(jsonMatch[0]);
};

const generateFeedback = async ({ studentName, level, averageScore, recentScores, weakTopics }) => {
  const prompt = `You are a supportive academic advisor. Provide personalized learning feedback.

Student: ${studentName}
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

  const model = await getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid format');
  return JSON.parse(jsonMatch[0]);
};

module.exports = { generateStudyPlan, generateQuiz, generateFeedback };