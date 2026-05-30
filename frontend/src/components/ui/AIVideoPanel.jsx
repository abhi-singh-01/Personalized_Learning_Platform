import { useEffect, useState } from 'react';
import { BookOpen, List, Loader2, Download } from 'lucide-react';
import useApi from '../../hooks/useApi';
import API from '../../api/axios';
import { friendlyAiMessage } from '../../utils/aiErrors';

/** Long-running AI video analysis (full lecture can take several minutes). */
const AI_REQUEST_TIMEOUT_MS = 600_000;

function postAi(path) {
  return API.post(path, {}, { timeout: AI_REQUEST_TIMEOUT_MS });
}

export default function AIVideoPanel({ materialId, materialTitle }) {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('notes');
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState({ notes: false, syllabus: false });
  const [userNotice, setUserNotice] = useState('');

  const unwrap = (res) => res?.data ?? res;

  const fetchExisting = async () => {
    try {
      const res = await api.get('/ai/transcript/' + materialId);
      const data = unwrap(res);
      if (data) {
        setTranscript(data);
        if (data.notes?.title) setActiveTab('notes');
        else if (data.syllabus?.topics?.length) setActiveTab('syllabus');
      }
      return data;
    } catch {
      return null;
    }
  };

  const handleGenerateNotes = async () => {
    setLoading((l) => ({ ...l, notes: true }));
    setUserNotice('');
    setActiveTab('notes');
    try {
      const existing = transcript || await fetchExisting();
      if (existing?.notes?.title) {
        setTranscript(existing);
        return;
      }
      const res = await postAi('/ai/generate-notes/' + materialId);
      setTranscript(unwrap(res));
    } catch (err) {
      setUserNotice(
        friendlyAiMessage(err.response?.data?.message) ||
        'Notes could not be generated. Check GEMINI_API_KEY on the server and try again.'
      );
    } finally {
      setLoading((l) => ({ ...l, notes: false }));
    }
  };

  const handleExtractSyllabus = async () => {
    setLoading((l) => ({ ...l, syllabus: true }));
    setUserNotice('');
    setActiveTab('syllabus');
    try {
      const existing = transcript || await fetchExisting();
      if (existing?.syllabus?.topics?.length) {
        setTranscript(existing);
        return;
      }
      const res = await postAi('/ai/extract-syllabus/' + materialId);
      setTranscript(unwrap(res));
    } catch (err) {
      setUserNotice(
        friendlyAiMessage(err.response?.data?.message) ||
        'Syllabus could not be extracted from this lecture.'
      );
    } finally {
      setLoading((l) => ({ ...l, syllabus: false }));
    }
  };

  const downloadNotesPDF = async () => {
    if (!transcript?.notes?.title) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const n = transcript.notes;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 20;

    const addText = (text, size = 10, isBold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, pageWidth);
      lines.forEach((line) => {
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
      n.sections.forEach((s) => {
        addText(s.heading, 13, true);
        addText(s.content);
      });
    }
    if (n.importantTerms?.length) {
      addText('Important Terms', 14, true);
      n.importantTerms.forEach((t) => addText(`${t.term}: ${t.definition}`));
    }
    doc.save(`${materialTitle || 'notes'}-study-notes.pdf`);
  };

  useEffect(() => {
    setTranscript(null);
    setUserNotice('');
  }, [materialId]);

  const isAnyLoading = loading.notes || loading.syllabus;

  const tabs = [
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'syllabus', label: 'Syllabus', icon: List },
  ];

  return (
    <div className="card mt-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        AI reads your lecture video directly. Tap <strong>Generate Notes</strong> for study notes.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleGenerateNotes}
          disabled={isAnyLoading}
          className="btn-primary text-sm flex items-center gap-1.5 px-4 py-2"
        >
          {loading.notes ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
          {loading.notes ? 'Generating notes...' : '📋 Generate Notes'}
        </button>
        <button
          onClick={handleExtractSyllabus}
          disabled={isAnyLoading}
          className="btn-secondary text-sm flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20 bg-white dark:bg-gray-800"
        >
          {loading.syllabus ? <Loader2 size={16} className="animate-spin" /> : <List size={16} />}
          {loading.syllabus ? 'Extracting...' : '📚 Extract Syllabus'}
        </button>
      </div>

      {userNotice && (
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          {userNotice}
        </p>
      )}

      {isAnyLoading && (
        <div className="space-y-3 animate-pulse mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <p className="text-sm text-gray-500 text-center pt-2">
            {loading.notes && '📋 AI is watching your lecture and writing study notes...'}
            {loading.syllabus && '📚 AI is analyzing topics in your lecture...'}
            <br />
            <span className="text-xs text-gray-400">Long videos may take 2–5 minutes. Keep this page open.</span>
          </p>
        </div>
      )}

      {transcript && !isAnyLoading && (
        <>
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {transcript.notes?.title ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold">{transcript.notes.title}</h3>
                    <button onClick={downloadNotesPDF} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{transcript.notes.summary}</p>
                  {transcript.notes.keyPoints?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Key points</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {transcript.notes.keyPoints.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {transcript.notes.sections?.map((s, i) => (
                    <div key={i}>
                      <h4 className="font-semibold mb-1">{s.heading}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{s.content}</p>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500">Tap <strong>Generate Notes</strong> to create notes from this lecture.</p>
              )}
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div>
              {transcript.syllabus?.topics?.length > 0 ? (
                <div className="space-y-4">
                  {transcript.syllabus.topics.map((topic, i) => (
                    <div key={i} className="border-l-4 border-purple-400 pl-4">
                      <h4 className="font-semibold">{topic.title}</h4>
                      {topic.subtopics?.length > 0 && (
                        <ul className="list-disc pl-5 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {topic.subtopics.map((st, j) => (
                            <li key={j}>{st}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Tap Extract Syllabus to analyze this lecture.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
