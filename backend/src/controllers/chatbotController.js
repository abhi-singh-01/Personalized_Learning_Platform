const { getAI, MODEL } = require('../services/aiService');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Transcript = require('../models/Transcript');
const Progress = require('../models/Progress');
const AIInteractionLog = require('../models/AIInteractionLog');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

// ── MCP Context Cache — 5-minute TTL ──
// Avoids re-querying Course + Material + Transcript + Progress on every message
const mcpCache = new Map();
const MCP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (userId, courseId) => `${userId}:${courseId || 'general'}`;

const getCachedMCP = (userId, courseId) => {
  const key = getCacheKey(userId, courseId);
  const entry = mcpCache.get(key);
  if (entry && Date.now() - entry.timestamp < MCP_CACHE_TTL) {
    return entry.context;
  }
  mcpCache.delete(key); // expired
  return null;
};

const setCachedMCP = (userId, courseId, context) => {
  const key = getCacheKey(userId, courseId);
  mcpCache.set(key, { context, timestamp: Date.now() });
  // Prevent unbounded growth — evict oldest if > 500 entries
  if (mcpCache.size > 500) {
    const oldest = mcpCache.keys().next().value;
    mcpCache.delete(oldest);
  }
};

const buildMCPContext = async (userId, courseId) => {
  const contextParts = [];

  if (courseId) {
    // Single course context — deep
    const course = await Course.findById(courseId)
      .populate('educator', 'name')
      .lean();

    if (course) {
      contextParts.push(`📚 Course: "${course.title}" by ${course.educator?.name || 'Educator'}`);
      contextParts.push(`Category: ${course.category || 'General'} | Difficulty: ${course.difficulty || 'Medium'}`);
      if (course.description) contextParts.push(`Description: ${course.description}`);

      // Get all materials for this course
      const materials = await Material.find({ course: courseId })
        .sort({ order: 1 })
        .select('title type description content')
        .lean();

      if (materials.length > 0) {
        contextParts.push(`\n📑 Course Materials (${materials.length} items):`);
        materials.forEach((m, i) => {
          let entry = `${i + 1}. [${m.type}] ${m.title}`;
          if (m.description) entry += ` — ${m.description.substring(0, 150)}`;
          contextParts.push(entry);
        });
      }

      // Get transcripts/notes for this course (the richest context)
      const transcripts = await Transcript.find({ course: courseId, status: 'completed' })
        .select('notes syllabus translatedText')
        .lean();

      if (transcripts.length > 0) {
        contextParts.push(`\n📝 Course Notes & Transcriptions:`);
        transcripts.forEach(t => {
          if (t.notes?.summary) contextParts.push(`Summary: ${t.notes.summary.substring(0, 500)}`);
          if (t.notes?.keyPoints?.length) contextParts.push(`Key Points: ${t.notes.keyPoints.join('; ')}`);
          if (t.notes?.importantTerms?.length) {
            const terms = t.notes.importantTerms.map(x => `${x.term}: ${x.definition}`).join('; ');
            contextParts.push(`Key Terms: ${terms}`);
          }
          if (t.syllabus?.topics?.length) {
            contextParts.push(`Syllabus Topics: ${t.syllabus.topics.map(x => x.title).join(', ')}`);
          }
          // Include a chunk of transcript text (trimmed for token efficiency)
          if (t.translatedText) {
            contextParts.push(`Lecture Content: ${t.translatedText.substring(0, 2000)}`);
          }
        });
      }

      // Learner progress in this course
      const progress = await Progress.find({ learner: userId, course: courseId })
        .sort({ completedAt: -1 })
        .limit(5)
        .lean();

      if (progress.length > 0) {
        const avgScore = Math.round(progress.reduce((s, p) => s + (p.score || 0), 0) / progress.length);
        contextParts.push(`\n📊 Learner Performance: Average score ${avgScore}%, ${progress.length} recent attempts`);
      }
    }
  } else {
    // General context — list enrolled courses
    const courses = await Course.find({ learners: userId })
      .select('title category difficulty')
      .lean();

    if (courses.length > 0) {
      contextParts.push(`📚 Enrolled Courses:`);
      courses.forEach(c => contextParts.push(`- ${c.title} (${c.category}, ${c.difficulty})`));
    }
  }

  return contextParts.join('\n');
};

// ── Chat Endpoint — Streaming-Ready ──
exports.chat = async (req, res, next) => {
  try {
    const { message, courseId, history = [] } = req.body;
    if (!message?.trim()) throw new AppError('Message is required', 400);

    const userId = req.user._id;
    const learnerLevel = req.user.aiLevel || 'Beginner';

    // Build MCP context (with cache for low latency)
    let mcpContext = getCachedMCP(userId, courseId);
    if (!mcpContext) {
      mcpContext = await buildMCPContext(userId, courseId);
      if (mcpContext) setCachedMCP(userId, courseId, mcpContext);
    }

    // Build conversation history (last 10 messages for token efficiency)
    const recentHistory = history.slice(-10).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }));

    // System instruction — the core of good MCP
    const systemInstruction = `You are a friendly, patient AI study buddy on a learning platform.

ROLE & PERSONALITY:
- You are a helpful tutor who explains concepts in SIMPLE, everyday language
- Use short sentences. Avoid jargon. If you must use a technical term, explain it immediately
- Use analogies, real-life examples, and relatable comparisons to make concepts click
- Think of yourself as a brilliant friend who makes hard things easy to understand
- Be encouraging but honest — praise effort, gently correct mistakes
- Use emojis sparingly to be friendly (1-2 per response max)

RESPONSE FORMAT:
- Keep answers concise (3-8 sentences for simple questions, more for complex ones)
- Use bullet points for lists
- Use bold **text** for key terms
- If explaining code, describe the logic in plain English first, then show simple code
- End with a follow-up question or encouragement to keep the learner engaged

LEARNER CONTEXT:
- Learner Level: ${learnerLevel}
- Adjust complexity accordingly — ${learnerLevel === 'Beginner' ? 'use the simplest possible language' : learnerLevel === 'Advanced' ? 'you can be more technical but still clear' : 'balance simplicity with depth'}

${mcpContext ? `\nCOURSE CONTEXT (use this to give specific, relevant answers):\n${mcpContext}` : ''}

IMPORTANT RULES:
1. If the learner asks about something in their course materials, reference the specific content
2. If you don't know something specific to their course, say so honestly
3. Never make up facts or citations
4. If a question is off-topic, gently redirect to their studies
5. For math/science questions, show step-by-step solutions in plain language`;

    // Call Gemini with streaming for faster first-byte response
    const ai = await getAI();

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [
        ...recentHistory,
        { role: 'user', parts: [{ text: message }] },
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });

    const reply = result.text;

    // Log interaction asynchronously (don't block response)
    AIInteractionLog.create({
      user: userId,
      type: 'chat',
      input: { message, courseId, historyLength: history.length },
      output: { reply: reply.substring(0, 500) },
    }).catch(() => {}); // Silent fail for logging

    sendResponse(res, 200, 'Chat response', {
      reply,
      courseId: courseId || null,
    });
  } catch (err) { next(err); }
};

// ── Streaming Chat (SSE) for near-zero latency feel ──
exports.chatStream = async (req, res, next) => {
  try {
    const { message, courseId, history = [] } = req.body;
    if (!message?.trim()) throw new AppError('Message is required', 400);

    const userId = req.user._id;
    const learnerLevel = req.user.aiLevel || 'Beginner';

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Build MCP context (with cache for low latency)
    let mcpContext = getCachedMCP(userId, courseId);
    if (!mcpContext) {
      mcpContext = await buildMCPContext(userId, courseId);
      if (mcpContext) setCachedMCP(userId, courseId, mcpContext);
    }

    const recentHistory = history.slice(-10).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }));

    const systemInstruction = `You are a friendly, patient AI study buddy.
Explain in SIMPLE everyday language. Use short sentences. Avoid jargon.
Use real-life examples and analogies. Be encouraging.
Learner Level: ${learnerLevel}
${mcpContext ? `\nCOURSE CONTEXT:\n${mcpContext}` : ''}`;

    const ai = await getAI();

    const response = await ai.models.generateContentStream({
      model: MODEL,
      contents: [
        ...recentHistory,
        { role: 'user', parts: [{ text: message }] },
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });

    let fullReply = '';

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullReply += text;
        res.write(`data: ${JSON.stringify({ text, done: false })}\n\n`);
      }
    }

    // Send done signal
    res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
    res.end();

    // Log asynchronously
    AIInteractionLog.create({
      user: userId,
      type: 'chat-stream',
      input: { message, courseId },
      output: { reply: fullReply.substring(0, 500) },
    }).catch(() => {});
  } catch (err) {
    // If headers already sent, close stream with error
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
};

// ── Quick Explain — Single-purpose, ultra-fast ──
// Learner selects text → "Explain this" → Instant simple explanation
exports.quickExplain = async (req, res, next) => {
  try {
    const { text, courseId } = req.body;
    if (!text?.trim()) throw new AppError('Text to explain is required', 400);

    const ai = await getAI();
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: `Explain this in the simplest possible language a learner would understand. Use an analogy or real-world example. Keep it to 2-4 sentences:\n\n"${text.substring(0, 500)}"`,
      config: {
        temperature: 0.5,
        maxOutputTokens: 256,
      },
    });

    sendResponse(res, 200, 'Quick explanation', { explanation: result.text });
  } catch (err) { next(err); }
};

// ── Suggest Questions — Help learners know what to ask ──
exports.suggestQuestions = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    let context = '';

    if (courseId) {
      const course = await Course.findById(courseId).select('title category').lean();
      if (course) context = `for the course "${course.title}" (${course.category})`;
    }

    const ai = await getAI();
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: `Generate 5 smart study questions a learner might want to ask ${context || 'about their studies'}. Return ONLY a JSON array of strings. Example: ["What is...?", "How does...work?"]`,
      config: { temperature: 0.8, maxOutputTokens: 256 },
    });

    const text = result.text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    sendResponse(res, 200, 'Suggested questions', { questions });
  } catch (err) { next(err); }
};
