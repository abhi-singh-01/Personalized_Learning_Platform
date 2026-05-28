const Transcript = require('../models/Transcript');
const Material = require('../models/Material');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { assertCanViewMaterial } = require('../services/courseAccessService');
const {
  transcribeVideo,
  generateNotesFromTranscript,
  extractSyllabusFromTranscript,
  generateRoadmapFromTranscript,
  generateNotesFromVideo,
  extractSyllabusFromVideo,
  generateRoadmapFromVideo,
  getMimeType,
  resolveLocalVideoPathForTranscription,
} = require('../services/transcriptService');

function transcriptionUserMessage() {
  return 'We could not process this video with AI right now. Please try again in a moment.';
}

async function loadVideoMaterial(req) {
  const material = await Material.findById(req.params.materialId);
  if (!material) throw new AppError('Material not found', 404);
  if (material.type !== 'video') throw new AppError('Only video lectures support AI features', 400);
  if (!material.fileUrl) throw new AppError('No video file found for this lecture', 400);
  await assertCanViewMaterial(req.user, material);
  return material;
}

async function getOrCreateTranscriptDoc(material) {
  let transcript = await Transcript.findOne({ material: material._id });
  if (!transcript) {
    transcript = new Transcript({
      material: material._id,
      course: material.course,
      status: 'pending',
    });
    await transcript.save();
  }
  return transcript;
}

async function withLocalVideo(fileUrl, handler) {
  const { localPath, cleanup } = await resolveLocalVideoPathForTranscription(fileUrl);
  try {
    return await handler(localPath, getMimeType(localPath));
  } finally {
    await cleanup();
  }
}

/**
 * POST /api/ai/transcribe/:materialId
 */
exports.transcribe = async (req, res, next) => {
  try {
    const material = await loadVideoMaterial(req);

    let transcript = await Transcript.findOne({ material: material._id });
    if (transcript?.translatedText && transcript.status === 'completed') {
      return sendResponse(res, 200, 'Transcript already exists', transcript);
    }

    transcript = transcript || (await getOrCreateTranscriptDoc(material));
    transcript.status = 'processing';
    transcript.error = '';
    await transcript.save();

    try {
      const result = await withLocalVideo(material.fileUrl, (localPath, mimeType) =>
        transcribeVideo(localPath, mimeType)
      );
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
    }
  } catch (err) { next(err); }
};

/**
 * POST /api/ai/generate-notes/:materialId
 * Reads the full lecture video when no transcript exists yet.
 */
exports.generateNotes = async (req, res, next) => {
  try {
    const material = await loadVideoMaterial(req);
    let transcript = await getOrCreateTranscriptDoc(material);

    if (transcript.notes?.title) {
      return sendResponse(res, 200, 'Notes already exist', transcript);
    }

    transcript.status = 'processing';
    transcript.error = '';
    await transcript.save();

    try {
      if (transcript.translatedText) {
        transcript.notes = await generateNotesFromTranscript(
          transcript.translatedText,
          material.title
        );
      } else {
        const result = await withLocalVideo(material.fileUrl, (localPath, mimeType) =>
          generateNotesFromVideo(localPath, mimeType, material.title)
        );
        transcript.notes = result.notes;
        if (result.lectureOverview && !transcript.translatedText) {
          transcript.translatedText = result.lectureOverview;
          transcript.language = 'en';
        }
      }
      transcript.status = 'completed';
      await transcript.save();
      sendResponse(res, 200, 'Notes generated from lecture', transcript);
    } catch (aiError) {
      console.error('[generate-notes]', material._id, aiError.message);
      transcript.status = 'failed';
      transcript.error = aiError.message;
      await transcript.save();
      throw new AppError('Could not generate notes from this lecture. Please try again.', 500);
    }
  } catch (err) { next(err); }
};

/**
 * POST /api/ai/extract-syllabus/:materialId
 */
exports.extractSyllabus = async (req, res, next) => {
  try {
    const material = await loadVideoMaterial(req);
    let transcript = await getOrCreateTranscriptDoc(material);

    transcript.status = 'processing';
    transcript.error = '';
    await transcript.save();

    try {
      if (transcript.translatedText) {
        transcript.syllabus = await extractSyllabusFromTranscript(
          transcript.translatedText,
          material.title
        );
      } else {
        transcript.syllabus = await withLocalVideo(material.fileUrl, (localPath, mimeType) =>
          extractSyllabusFromVideo(localPath, mimeType, material.title)
        );
      }
      transcript.status = 'completed';
      await transcript.save();
      sendResponse(res, 200, 'Syllabus extracted from lecture', transcript);
    } catch (aiError) {
      console.error('[extract-syllabus]', material._id, aiError.message);
      transcript.status = 'failed';
      transcript.error = aiError.message;
      await transcript.save();
      throw new AppError('Could not extract syllabus from this lecture. Please try again.', 500);
    }
  } catch (err) { next(err); }
};

/**
 * POST /api/ai/generate-roadmap/:materialId
 */
exports.generateRoadmap = async (req, res, next) => {
  try {
    const material = await loadVideoMaterial(req);
    let transcript = await getOrCreateTranscriptDoc(material);

    transcript.status = 'processing';
    transcript.error = '';
    await transcript.save();

    try {
      if (transcript.translatedText) {
        transcript.roadmap = await generateRoadmapFromTranscript(
          transcript.translatedText,
          material.title
        );
      } else {
        transcript.roadmap = await withLocalVideo(material.fileUrl, (localPath, mimeType) =>
          generateRoadmapFromVideo(localPath, mimeType, material.title)
        );
      }
      transcript.status = 'completed';
      await transcript.save();
      sendResponse(res, 200, 'Learning roadmap generated from lecture', transcript);
    } catch (aiError) {
      console.error('[generate-roadmap]', material._id, aiError.message);
      transcript.status = 'failed';
      transcript.error = aiError.message;
      await transcript.save();
      throw new AppError('Could not build roadmap from this lecture. Please try again.', 500);
    }
  } catch (err) { next(err); }
};

/**
 * GET /api/ai/transcript/:materialId
 */
exports.getTranscript = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.materialId);
    if (!material) throw new AppError('Material not found', 404);
    await assertCanViewMaterial(req.user, material);

    const transcript = await Transcript.findOne({ material: material._id });
    if (!transcript) {
      return sendResponse(res, 200, 'No transcript yet', null);
    }
    sendResponse(res, 200, 'Transcript fetched', transcript);
  } catch (err) { next(err); }
};
