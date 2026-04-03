import { useState } from 'react';
import { FileText, BookOpen, List, Loader2, Copy, Check, Download, ArrowRight, AlertCircle, Map, Clock, CheckCircle2, BookMarked } from 'lucide-react';
import useApi from '../../hooks/useApi';
import jsPDF from 'jspdf';

export default function AIVideoPanel({ materialId, materialTitle }) {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('transcript');
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState({ transcribe: false, notes: false, syllabus: false, roadmap: false });
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchExisting = async () => {
    try {
      const res = await api.get('/ai/transcript/' + materialId);
      if (res.data) setTranscript(res.data);
      return res.data;
    } catch { return null; }
  };

  const handleTranscribe = async () => {
    setLoading(l => ({ ...l, transcribe: true }));
    setError('');
    try {
      const res = await api.post('/ai/transcribe/' + materialId);
      setTranscript(res.data);
      setActiveTab('transcript');
    } catch (err) {
      setError(err.response?.data?.message || 'Transcription failed. Please try again.');
    }
    setLoading(l => ({ ...l, transcribe: false }));
  };

  const handleGenerateNotes = async () => {
    const existing = transcript || await fetchExisting();
    if (!existing?.translatedText) {
      setError('Please transcribe the video first.');
      return;
    }
    setLoading(l => ({ ...l, notes: true }));
    setError('');
    try {
      const res = await api.post('/ai/generate-notes/' + materialId);
      setTranscript(res.data);
      setActiveTab('notes');
    } catch (err) {
      setError(err.response?.data?.message || 'Notes generation failed.');
    }
    setLoading(l => ({ ...l, notes: false }));
  };

  const handleExtractSyllabus = async () => {
    const existing = transcript || await fetchExisting();
    if (!existing?.translatedText) {
      setError('Please transcribe the video first.');
      return;
    }
    setLoading(l => ({ ...l, syllabus: true }));
    setError('');
    try {
      const res = await api.post('/ai/extract-syllabus/' + materialId);
      setTranscript(res.data);
      setActiveTab('syllabus');
    } catch (err) {
      setError(err.response?.data?.message || 'Syllabus extraction failed.');
    }
    setLoading(l => ({ ...l, syllabus: false }));
  };

  const handleGenerateRoadmap = async () => {
    const existing = transcript || await fetchExisting();
    if (!existing?.translatedText) {
      setError('Please transcribe the video first.');
      return;
    }
    setLoading(l => ({ ...l, roadmap: true }));
    setError('');
    try {
      const res = await api.post('/ai/generate-roadmap/' + materialId);
      setTranscript(res.data);
      setActiveTab('roadmap');
    } catch (err) {
      setError(err.response?.data?.message || 'Roadmap generation failed.');
    }
    setLoading(l => ({ ...l, roadmap: false }));
  };

  const copyTranscript = () => {
    if (transcript?.translatedText) {
      navigator.clipboard.writeText(transcript.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadNotesPDF = () => {
    if (!transcript?.notes?.title) return;
    const doc = new jsPDF();
    const n = transcript.notes;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 20;

    const addText = (text, size = 10, isBold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, pageWidth);
      lines.forEach(line => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.5;
      });
      y += 4;
    };

    addText(n.title, 18, true);
    addText('Summary', 14, true);
    addText(n.summary);

    if (n.keyPoints?.length) {
      addText('Key Points', 14, true);
      n.keyPoints.forEach((p, i) => addText(`${i + 1}. ${p}`));
    }

    if (n.sections?.length) {
      n.sections.forEach(s => {
        addText(s.heading, 13, true);
        addText(s.content);
      });
    }

    if (n.importantTerms?.length) {
      addText('Important Terms', 14, true);
      n.importantTerms.forEach(t => addText(`${t.term}: ${t.definition}`));
    }

    doc.save(`${materialTitle || 'notes'}-study-notes.pdf`);
  };

  // Load existing transcript on first render
  useState(() => { fetchExisting(); });

  const isAnyLoading = loading.transcribe || loading.notes || loading.syllabus || loading.roadmap;

  const tabs = [
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'syllabus', label: 'Syllabus', icon: List },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
  ];

  return (
    <div className="card mt-4">
      {/* AI Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleTranscribe}
          disabled={isAnyLoading}
          className="btn-primary text-sm flex items-center gap-1.5 px-4 py-2"
        >
          {loading.transcribe ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          {loading.transcribe ? 'Transcribing...' : '📝 Transcribe'}
        </button>
        <button
          onClick={handleGenerateNotes}
          disabled={isAnyLoading}
          className="btn-secondary text-sm flex items-center gap-1.5 px-4 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-800"
        >
          {loading.notes ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
          {loading.notes ? 'Generating...' : '📋 Generate Notes'}
        </button>
        <button
          onClick={handleExtractSyllabus}
          disabled={isAnyLoading}
          className="btn-secondary text-sm flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20 bg-white dark:bg-gray-800"
        >
          {loading.syllabus ? <Loader2 size={16} className="animate-spin" /> : <List size={16} />}
          {loading.syllabus ? 'Extracting...' : '📚 Extract Syllabus'}
        </button>
        <button
          onClick={handleGenerateRoadmap}
          disabled={isAnyLoading}
          className="btn-secondary text-sm flex items-center gap-1.5 px-4 py-2 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20 bg-white dark:bg-gray-800"
        >
          {loading.roadmap ? <Loader2 size={16} className="animate-spin" /> : <Map size={16} />}
          {loading.roadmap ? 'Building...' : '🗺️ Build Roadmap'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isAnyLoading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <p className="text-sm text-gray-500 text-center pt-2">
            {loading.transcribe && '🎙️ AI is watching your video and transcribing to English...'}
            {loading.notes && '📋 AI is generating structured study notes...'}
            {loading.syllabus && '📚 AI is extracting the syllabus structure...'}
            {loading.roadmap && '🗺️ AI is building your personalized learning roadmap...'}
            <br /><span className="text-xs text-gray-400">This may take 1-3 minutes for longer videos</span>
          </p>
        </div>
      )}

      {/* Tab Content (only show when not loading and data exists) */}
      {!isAnyLoading && transcript && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Transcript Tab */}
          {activeTab === 'transcript' && (
            <div>
              {transcript.translatedText ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">
                      Detected language: <strong className="text-gray-600 dark:text-gray-300">{transcript.language}</strong>
                    </span>
                    <button
                      onClick={copyTranscript}
                      className="text-sm flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {transcript.translatedText}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  Click "📝 Transcribe" to generate the transcript from this video.
                </p>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              {transcript.notes?.title ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{transcript.notes.title}</h3>
                    <button
                      onClick={downloadNotesPDF}
                      className="text-sm flex items-center gap-1 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-1">Summary</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{transcript.notes.summary}</p>
                  </div>

                  {/* Key Points */}
                  {transcript.notes.keyPoints?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm mb-2">🎯 Key Points</h4>
                      <ul className="space-y-1.5">
                        {transcript.notes.keyPoints.map((p, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-primary-500 font-bold mt-0.5">•</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sections */}
                  {transcript.notes.sections?.map((s, i) => (
                    <div key={i} className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-sm mb-1">{s.heading}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.content}</p>
                    </div>
                  ))}

                  {/* Important Terms */}
                  {transcript.notes.importantTerms?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">📖 Important Terms</h4>
                      <div className="grid gap-2">
                        {transcript.notes.importantTerms.map((t, i) => (
                          <div key={i} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <span className="font-semibold text-sm text-yellow-700 dark:text-yellow-400">{t.term}:</span>{' '}
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  Click "📋 Generate Notes" to create study notes from the transcript.
                </p>
              )}
            </div>
          )}

          {/* Syllabus Tab */}
          {activeTab === 'syllabus' && (
            <div>
              {transcript.syllabus?.topics?.length > 0 ? (
                <>
                  {/* Learning Objectives */}
                  {transcript.syllabus.learningObjectives?.length > 0 && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-2">🎯 Learning Objectives</h4>
                      <ul className="space-y-1">
                        {transcript.syllabus.learningObjectives.map((o, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" /> {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prerequisites */}
                  {transcript.syllabus.prerequisites?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm mb-2">📋 Prerequisites</h4>
                      <div className="flex flex-wrap gap-2">
                        {transcript.syllabus.prerequisites.map((p, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  <h4 className="font-semibold text-sm mb-3">📚 Topics Covered</h4>
                  <div className="space-y-3">
                    {transcript.syllabus.topics.map((topic, i) => (
                      <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-semibold text-sm">{i + 1}. {topic.title}</h5>
                          {topic.estimatedMinutes > 0 && (
                            <span className="text-xs text-gray-400">~{topic.estimatedMinutes} min</span>
                          )}
                        </div>
                        {topic.subtopics?.length > 0 && (
                          <ul className="ml-4 space-y-0.5">
                            {topic.subtopics.map((st, j) => (
                              <li key={j} className="text-sm text-gray-500 flex items-center gap-1.5">
                                <ArrowRight size={12} className="text-gray-400" /> {st}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Generate Study Plan Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <a
                      href={`/learner/study-plan?syllabusFrom=${materialId}`}
                      className="btn-primary text-sm inline-flex items-center gap-2"
                    >
                      🧠 Generate Study Plan from This Syllabus <ArrowRight size={16} />
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  Click "📚 Extract Syllabus" to see the topic breakdown from this video.
                </p>
              )}
            </div>
          )}

          {/* Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div>
              {transcript.roadmap?.steps?.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">{transcript.roadmap.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{transcript.roadmap.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={14} /> ~{transcript.roadmap.totalEstimatedHours} hours total</span>
                      <span className="flex items-center gap-1"><Map size={14} /> {transcript.roadmap.steps.length} steps</span>
                    </div>
                  </div>

                  {/* Visual Roadmap Steps */}
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 via-blue-400 to-purple-400" />

                    <div className="space-y-4">
                      {transcript.roadmap.steps.map((s, i) => (
                        <div key={i} className="relative pl-12">
                          {/* Step number circle */}
                          <div className="absolute left-2.5 top-3 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                            {s.step}
                          </div>

                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-sm">{s.title}</h5>
                              <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0 ml-2">
                                <Clock size={12} /> {s.estimatedHours}h
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{s.description}</p>

                            {/* Tasks */}
                            {s.tasks?.length > 0 && (
                              <div className="mb-3">
                                <h6 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Tasks to Complete</h6>
                                <ul className="space-y-1">
                                  {s.tasks.map((task, ti) => (
                                    <li key={ti} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                      <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /> {task}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Resources */}
                            {s.resources?.length > 0 && (
                              <div className="mb-3">
                                <h6 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Resources</h6>
                                <div className="flex flex-wrap gap-1.5">
                                  {s.resources.map((r, ri) => (
                                    <span key={ri} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center gap-1">
                                      <BookMarked size={10} /> {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Milestone */}
                            {s.milestone && (
                              <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">✅ Milestone: </span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">{s.milestone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Final Goal */}
                      {transcript.roadmap.finalGoal && (
                        <div className="relative pl-12">
                          <div className="absolute left-2 top-3 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                            🏆
                          </div>
                          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                            <h5 className="font-bold text-sm text-yellow-700 dark:text-yellow-400">Final Goal</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{transcript.roadmap.finalGoal}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  Click "🗺️ Build Roadmap" to create a step-by-step learning path from this video.
                </p>
              )}
            </div>
          )}        </>
      )}

      {/* Empty state when no data and not loading */}
      {!isAnyLoading && !transcript && (
        <p className="text-sm text-gray-400 text-center py-6">
          Use the AI buttons above to transcribe this video, generate notes, or extract the syllabus.
        </p>
      )}
    </div>
  );
}
