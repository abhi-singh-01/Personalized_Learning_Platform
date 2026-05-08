const { getAI, MODEL, wrapGeminiError } = require('../services/aiService');
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

// ── Shared system instruction builder — clear teacher-assistant persona ──
const buildSystemInstruction = (learnerLevel, mcpContext) => {
  return `You are a Teacher Assistant — a warm, patient, and knowledgeable tutor helping a student learn.

YOUR CORE IDENTITY:
- You are like a friendly senior student or a teaching assistant who explains things the way a real person would.
- Your job is ONLY to clear the student's doubt — nothing extra.
- Talk like a human teacher, not a textbook or encyclopedia.

HOW YOU MUST ANSWER:
1. DIRECTLY answer the question first. No filler, no "Great question!" — just get to the point.
2. Use SIMPLE, everyday language. If a 15-year-old can't understand it, rewrite it.
3. Keep it SHORT — 2 to 5 sentences for simple questions. For complex topics, use a few more but break into small paragraphs.
4. Use ONE real-life analogy or example to make the concept click.
5. If a technical term is unavoidable, explain it in parentheses right away.
6. End with ONE short line that either summarizes or encourages — nothing more.

WHAT YOU MUST NEVER DO:
- Never dump a wall of text. Keep responses focused and concise.
- Never list 10 bullet points when 3 will do.
- Never repeat the student's question back to them.
- Never say "As an AI" or "I don't have feelings" — just be natural.
- Never add unnecessary sections, headers, or formatting for simple questions.
- Never give information the student didn't ask for.
- Never use academic/textbook language when a simpler word exists.

FORMATTING RULES:
- NEVER use markdown formatting. No asterisks for bold, no hash symbols for headers, no fenced code blocks, no bullet symbols.
- No emojis ever.
- Write in plain text only. Use simple line breaks for separation.
- If you need to emphasize a word, just use CAPS or put it in quotes.
- For lists, use numbered items (1, 2, 3) or simple dashes with spaces.
- For code, just write it inline or on a new line without any backtick formatting.

WRITING STYLE:
- Write like a real person having a conversation, not like a textbook or an AI chatbot.
- Vary your sentence length and structure naturally. Mix short and long sentences.
- Avoid repetitive patterns like starting every sentence with the same word.
- Never use phrases like "Great question!", "Absolutely!", "I'd be happy to help", "Let me explain", "In essence", "It's worth noting".
- Be direct and genuine. Just answer the question.

STUDENT LEVEL: ${learnerLevel}
${learnerLevel === 'Beginner' ? '→ Use the simplest words possible. Explain like they are brand new to this.' : ''}
${learnerLevel === 'Intermediate' ? '→ They know basics. Be clear but you can use standard terms.' : ''}
${learnerLevel === 'Advanced' ? '→ They know the subject well. Be precise and go deeper when relevant.' : ''}

${mcpContext ? `\nCOURSE CONTEXT (reference this to give course-specific answers):\n${mcpContext}` : ''}

IMPORTANT:
- If the student asks about something in their course materials, reference the specific content.
- If you genuinely don't know, say "I'm not sure about that" — don't make things up.
- If they ask something off-topic, gently say "That's outside what I can help with — try asking about your course topics!"
- For math/science: show step-by-step in plain language, not just formulas.

Remember: You are a TEACHER, not a search engine. Clear the doubt, then stop.`;
};

// ── Chat Endpoint — Non-Streaming ──
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

    const systemInstruction = buildSystemInstruction(learnerLevel, mcpContext);

    // Call Gemini
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
  } catch (err) {
    // Catch Gemini region errors and provide a clear message
    try { wrapGeminiError(err); } catch (wrapped) { return next(wrapped); }
    next(err);
  }
};

// ── Streaming Chat (SSE) for near-zero latency feel ──
exports.chatStream = async (req, res, next) => {
  try {
    const { message, courseId, history = [] } = req.body;
    if (!message?.trim()) throw new AppError('Message is required', 400);

    const userId = req.user._id;
    const learnerLevel = req.user.aiLevel || 'Beginner';

    // Set SSE headers — must include CORS headers for cross-origin streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Credentials': 'true',
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

    const systemInstruction = buildSystemInstruction(learnerLevel, mcpContext);

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
      const msg = err.message?.includes('User location is not supported')
        ? 'Gemini AI is not available in this server region. Please ask your admin to change the backend hosting region.'
        : err.message;
      res.write(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`);
      res.end();
    } else {
      try { wrapGeminiError(err); } catch (wrapped) { return next(wrapped); }
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
      contents: `You are a patient teacher assistant. A student doesn't understand something and needs your help.

Explain this in the simplest possible words as if talking to a friend. Use one real-life analogy. Keep it to 2-3 sentences max:

"${text.substring(0, 500)}"`,
      config: {
        temperature: 0.5,
        maxOutputTokens: 256,
      },
    });

    sendResponse(res, 200, 'Quick explanation', { explanation: result.text });
  } catch (err) {
    try { wrapGeminiError(err); } catch (wrapped) { return next(wrapped); }
    next(err);
  }
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
      contents: `Generate 5 simple study questions a student might want to ask their teacher ${context || 'about their studies'}. Keep each question short (under 10 words) and in plain everyday language. Return ONLY a JSON array of strings. Example: ["What is...?", "How does...work?"]`,
      config: { temperature: 0.8, maxOutputTokens: 256 },
    });

    const text = result.text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    sendResponse(res, 200, 'Suggested questions', { questions });
  } catch (err) {
    try { wrapGeminiError(err); } catch (wrapped) { return next(wrapped); }
    next(err);
  }
};
