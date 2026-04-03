const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  content: { type: String, required: true },
}, { _id: false });

const termSchema = new mongoose.Schema({
  term: { type: String, required: true },
  definition: { type: String, required: true },
}, { _id: false });

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtopics: [String],
  estimatedMinutes: { type: Number, default: 0 },
}, { _id: false });

const roadmapStepSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  tasks: [String],
  resources: [String],
  estimatedHours: { type: Number, default: 1 },
  milestone: { type: String, default: '' },
}, { _id: false });

const transcriptSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  translatedText: { type: String, default: '' },
  language: { type: String, default: 'en' },
  notes: {
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    keyPoints: [String],
    sections: [sectionSchema],
    importantTerms: [termSchema],
  },
  syllabus: {
    topics: [topicSchema],
    prerequisites: [String],
    learningObjectives: [String],
  },
  roadmap: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    totalEstimatedHours: { type: Number, default: 0 },
    steps: [roadmapStepSchema],
    finalGoal: { type: String, default: '' },
  },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  error: { type: String, default: '' },
}, { timestamps: true });

transcriptSchema.index({ material: 1 }, { unique: true });
transcriptSchema.index({ course: 1 });

module.exports = mongoose.model('Transcript', transcriptSchema);
