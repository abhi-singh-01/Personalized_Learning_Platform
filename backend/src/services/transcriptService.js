const fs = require('fs');
const path = require('path');
const { getAI, MODEL } = require('./aiService');
const { createPartFromUri } = require('@google/genai');

/**
 * Upload a video file to Gemini Files API and wait until it's processed.
 */
const uploadVideoToGemini = async (filePath, mimeType) => {
  const ai = await getAI();
  const uploadedFile = await ai.files.upload({
    file: filePath,
    config: { mimeType: mimeType || 'video/mp4' },
  });

  // Poll until video is processed (state becomes ACTIVE)
  let file = uploadedFile;
  while (file.state === 'PROCESSING') {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    file = await ai.files.get({ name: file.name });
  }

  if (file.state === 'FAILED') {
    throw new Error('Gemini failed to process the video file.');
  }

  return file;
};

/**
 * Transcribe a video file to English using Gemini multimodal.
 */
const transcribeVideo = async (filePath, mimeType) => {
  const file = await uploadVideoToGemini(filePath, mimeType);
  const ai = await getAI();

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { fileData: { fileUri: file.uri, mimeType: file.mimeType } },
          { text: `You are an expert transcription and translation assistant.

Transcribe ALL spoken content in this video into English. If the spoken language is not English, translate it to English while preserving meaning.

Return ONLY valid JSON:
{
  "language": "detected source language (e.g., 'Hindi', 'English', 'Spanish')",
  "transcript": "full English transcript of the entire video, paragraph by paragraph"
}

Be thorough — capture every spoken word. Do NOT summarize. Provide the complete word-for-word transcript in English.` },
        ],
      },
    ],
  });

  const text = result.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid transcript format');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Generate structured study notes from a transcript.
 */
const generateNotesFromTranscript = async (transcript, materialTitle) => {
  const ai = await getAI();

  const prompt = `You are an expert academic note-taker. Create comprehensive, well-structured study notes from this lecture transcript.

Lecture Title: ${materialTitle || 'Untitled Lecture'}

Transcript:
${transcript}

Return ONLY valid JSON:
{
  "title": "string - concise title for these notes",
  "summary": "string - 2-3 paragraph executive summary of the lecture",
  "keyPoints": ["string - key takeaway 1", "string - key takeaway 2", ...],
  "sections": [
    {
      "heading": "string - section topic heading",
      "content": "string - detailed notes for this section with examples"
    }
  ],
  "importantTerms": [
    {
      "term": "string - technical term or concept",
      "definition": "string - clear definition/explanation"
    }
  ]
}

Create detailed, learner-friendly notes. Include at least 5 key points, 3+ sections, and all important terms.`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = result.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid notes format');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Extract syllabus / topic structure from a transcript.
 */
const extractSyllabusFromTranscript = async (transcript, materialTitle) => {
  const ai = await getAI();

  const prompt = `You are an expert curriculum designer. Analyze this lecture transcript and extract a structured syllabus/topic breakdown.

Lecture Title: ${materialTitle || 'Untitled Lecture'}

Transcript:
${transcript}

Return ONLY valid JSON:
{
  "topics": [
    {
      "title": "string - main topic covered",
      "subtopics": ["string - subtopic 1", "string - subtopic 2"],
      "estimatedMinutes": number
    }
  ],
  "prerequisites": ["string - prerequisite knowledge needed"],
  "learningObjectives": ["string - what learners will learn from this lecture"]
}

Be thorough. Identify ALL distinct topics covered in the lecture.`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = result.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid syllabus format');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Get MIME type from file extension.
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.mp4': 'video/mp4',
    '.mpeg': 'video/mpeg',
    '.mov': 'video/mov',
    '.avi': 'video/avi',
    '.webm': 'video/webm',
    '.wmv': 'video/wmv',
    '.flv': 'video/x-flv',
    '.3gp': 'video/3gpp',
  };
  return mimeMap[ext] || 'video/mp4';
};

/**
 * Generate a step-by-step learning roadmap from a transcript.
 */
const generateRoadmapFromTranscript = async (transcript, materialTitle) => {
  const ai = await getAI();

  const prompt = `You are an expert learning coach and curriculum designer. Based on this lecture transcript, create a detailed step-by-step LEARNING ROADMAP that guides a learner from beginner to mastery of the content.

Lecture Title: ${materialTitle || 'Untitled Lecture'}

Transcript:
${transcript}

Return ONLY valid JSON:
{
  "title": "string - roadmap title e.g. 'Mastering [Topic]: Complete Learning Path'",
  "description": "string - overview of what this roadmap covers and who it's for",
  "totalEstimatedHours": number,
  "steps": [
    {
      "step": 1,
      "title": "string - step title e.g. 'Foundation: Understanding Core Concepts'",
      "description": "string - what the learner will learn in this step",
      "tasks": ["string - specific actionable task to complete"],
      "resources": ["string - suggested resource, book, website, or practice exercise"],
      "estimatedHours": number,
      "milestone": "string - what success looks like after completing this step"
    }
  ],
  "finalGoal": "string - what the learner will be able to do after completing the entire roadmap"
}

Create 5-10 progressive steps. Each step should build on the previous one. Include practical tasks, not just 'read about X'. Make milestones measurable.`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = result.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned invalid roadmap format');
  return JSON.parse(jsonMatch[0]);
};

module.exports = {
  transcribeVideo,
  generateNotesFromTranscript,
  extractSyllabusFromTranscript,
  generateRoadmapFromTranscript,
  getMimeType,
};
