const Transcript = require('../models/Transcript');
const Material = require('../models/Material');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const {
  transcribeVideo,
  generateNotesFromTranscript,
  extractSyllabusFromTranscript,
  generateRoadmapFromTranscript,
  getMimeType,
  resolveLocalVideoPathForTranscription,
} = require('../services/transcriptService');

/** User-safe message — technical details stay in logs / transcript.error only. */
function transcriptionUserMessage() {
  return 'We could not prepare a transcript for this video right now. Please try again later.';
}

/**
 * POST /api/ai/transcribe/:materialId
 * Transcribe a video material to English using Gemini.
 */
exports.transcribe = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.materialId);
    if (!material) throw new AppError('Material not found', 404);
    if (material.type !== 'video') throw new AppError('Only video materials can be transcribed', 400);
    if (!material.fileUrl) throw new AppError('No video file found for this material', 400);

    // Check if transcript already exists
    let transcript = await Transcript.findOne({ material: material._id });
    if (transcript && transcript.translatedText && transcript.status === 'completed') {
      return sendResponse(res, 200, 'Transcript already exists', transcript);
    }

    // Create or update transcript record
    if (!transcript) {
      transcript = new Transcript({
        material: material._id,
        course: material.course,
        status: 'processing',
      });
    } else {
      transcript.status = 'processing';
      transcript.error = '';
    }
    await transcript.save();

    let cleanup = async () => {};
    try {
      const { localPath, cleanup: doCleanup } = await resolveLocalVideoPathForTranscription(material.fileUrl);
      cleanup = doCleanup;
      const mimeType = getMimeType(localPath);
      const result = await transcribeVideo(localPath, mimeType);
      transcript.translatedText = result.transcript;
      transcript.language = result.language || 'en';
      transcript.status = 'completed';
      await transcript.save();

      sendResponse(res, 200, 'Video transcribed successfully', transcript);
    } catch (aiError) {
      console.error('[transcribe]', material._id, aiError.message);
      transcript.status = 'failed';
      transcript.error = aiError.message;
      await transcript.save();
      throw new AppError(transcriptionUserMessage(), 500);
    } finally {
      await cleanup();
    }
  } catch (err) { next(err); }
};

/**
 * POST /api/ai/generate-notes/:materialId
 * Generate structured notes from an existing transcript.
 */
exports.generateNotes = async (req, res, next) => {
  try {
    const transcript = await Transcript.findOne({ material: req.params.materialId });
    if (!transcript || !transcript.translatedText) {
      throw new AppError('Please transcribe the video first', 400);
    }

    const material = await Material.findById(req.params.materialId);
    const notes = await generateNotesFromTranscript(
      transcript.translatedText,
      material?.title || 'Untitled'
    );

    transcript.notes = notes;
    await transcript.save();

    sendResponse(res, 200, 'Notes generated successfully', transcript);
  } catch (err) { next(err); }
};

/**
 * POST /api/ai/extract-syllabus/:materialId
 * Extract syllabus/topics from an existing transcript.
 */
exports.extractSyllabus = async (req, res, next) => {
  try {
    const transcript = await Transcript.findOne({ material: req.params.materialId });
    if (!transcript || !transcript.translatedText) {
      throw new AppError('Please transcribe the video first', 400);
    }

    const material = await Material.findById(req.params.materialId);
    const syllabus = await extractSyllabusFromTranscript(
      transcript.translatedText,
      material?.title || 'Untitled'
    );

    transcript.syllabus = syllabus;
    await transcript.save();

    sendResponse(res, 200, 'Syllabus extracted successfully', transcript);
  } catch (err) { next(err); }
};

/**
 * GET /api/ai/transcript/:materialId
 * Get stored transcript, notes, and syllabus.
 */
exports.getTranscript = async (req, res, next) => {
  try {
    const transcript = await Transcript.findOne({ material: req.params.materialId });
    if (!transcript) {
      return sendResponse(res, 200, 'No transcript yet', null);
    }
    sendResponse(res, 200, 'Transcript fetched', transcript);
  } catch (err) { next(err); }
};

/**
 * POST /api/ai/generate-roadmap/:materialId
 * Generate a learning roadmap from an existing transcript.
 */
exports.generateRoadmap = async (req, res, next) => {
  try {
    const transcript = await Transcript.findOne({ material: req.params.materialId });
    if (!transcript || !transcript.translatedText) {
      throw new AppError('Please transcribe the video first', 400);
    }

    const material = await Material.findById(req.params.materialId);
    const roadmap = await generateRoadmapFromTranscript(
      transcript.translatedText,
      material?.title || 'Untitled'
    );

    transcript.roadmap = roadmap;
    await transcript.save();

    sendResponse(res, 200, 'Learning roadmap generated successfully', transcript);
  } catch (err) { next(err); }
};
