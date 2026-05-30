import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import { CheckCircle, XCircle, Trophy, Sparkles, BookOpenCheck, Clock } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import useQuizSecureSession from '../../hooks/useQuizSecureSession';
import { readDraftJson, writeDraft, clearDraft, QUIZ_DRAFT_TTL_HOURS } from '../../utils/quizDraftStorage';
import { unwrapApiData } from '../../utils/apiData';

const quizAttemptDraftKey = (quizId) => `plp_quiz_attempt:${quizId}`;
const quizTimerKey = (quizId) => `plp_quiz_timer_start:${quizId}`;

function mainDraftMatchesServer(draft, qz) {
  if (!draft || draft.v !== 1 || draft.phase !== 'main') return false;
  if (!draft.quizSnapshot?.questions?.length || !qz?.questions?.length) return false;
  if (draft.quizSnapshot.questions.length !== qz.questions.length) return false;
  const serverUpd = qz.updatedAt != null ? String(qz.updatedAt) : '';
  if ((draft.quizUpdatedAt || '') !== serverUpd) return false;
  return true;
}

export default function QuizAttempt() {
  usePageTitle('Quiz');
  const { id } = useParams();
  const api = useApi();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ADAPTIVE STATE
  const [isAdaptiveMode, setIsAdaptiveMode] = useState(false);
  const [adaptiveLoading, setAdaptiveLoading] = useState(false);
  const [adaptiveResult, setAdaptiveResult] = useState(null);
  const [showSolutions, setShowSolutions] = useState(false);

  const [attemptStatus, setAttemptStatus] = useState(null);
  const [accessBlock, setAccessBlock] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const timerStartRef = useRef(null);

  useEffect(() => {
    const randomizeOptions = (questions) => {
      return questions.map((q) => {
        const shuffled = (q.options || [])
          .map((text, originalIndex) => ({ text, originalIndex }))
          .sort(() => Math.random() - 0.5);
        const displayCorrectIndex =
          typeof q.correctAnswer === 'number'
            ? shuffled.findIndex((opt) => opt.originalIndex === q.correctAnswer)
            : undefined;
        return {
          ...q,
          options: shuffled.map((opt) => opt.text),
          optionOrder: shuffled.map((opt) => opt.originalIndex),
          correctAnswer: displayCorrectIndex,
        };
      });
    };

    const key = quizAttemptDraftKey(id);

    api.get('/quizzes/' + id).then(async (res) => {
      const qz = unwrapApiData(res);
      if (!qz) {
        setQuiz(null);
        setAccessBlock(null);
        setAttemptStatus(null);
        return;
      }

      const status = qz.attemptStatus || {
        canStart: true,
        reason: '',
        attemptsUsed: 0,
        totalAttemptsAllowed: 1,
        timeLimitMinutes: qz.timeLimit ?? 15,
      };
      setAttemptStatus(status);

      const draft = readDraftJson(key);

      if (draft?.v === 1 && draft.phase === 'adaptive' && draft.quizSnapshot?.questions?.length) {
        setAccessBlock(null);
        setQuiz({
          ...qz,
          title: draft.quizSnapshot.title || qz.title,
          questions: draft.quizSnapshot.questions,
        });
        setAnswers(typeof draft.answers === 'object' && draft.answers ? draft.answers : {});
        setIsAdaptiveMode(true);
        return;
      }

      if (mainDraftMatchesServer(draft, qz)) {
        if (!status.canStart) {
          clearDraft(key);
          setAccessBlock({ title: qz.title, reason: status.reason || 'You cannot continue this quiz.' });
          setQuiz(null);
          setIsAdaptiveMode(false);
          setAnswers({});
          return;
        }
        setAccessBlock(null);
        setQuiz({
          ...qz,
          questions: draft.quizSnapshot.questions,
        });
        setAnswers(typeof draft.answers === 'object' && draft.answers ? draft.answers : {});
        setIsAdaptiveMode(false);
        return;
      }

      if (draft) clearDraft(key);

      if (!status.canStart) {
        if (status.lastResult && status.attemptsUsed >= status.totalAttemptsAllowed) {
          setAccessBlock(null);
          setQuiz({ ...qz, questions: [] });
          setIsAdaptiveMode(false);
          setAnswers({});
          try {
            const resultRes = await api.get('/progress/quiz/' + id + '/result');
            setResult(unwrapApiData(resultRes));
          } catch {
            setResult({
              score: status.lastResult.score,
              correctCount: status.lastResult.correctCount,
              totalQuestions: status.lastResult.totalQuestions,
            });
          }
          return;
        }
        setAccessBlock({ title: qz.title, reason: status.reason || 'You cannot take this quiz right now.' });
        setQuiz(null);
        setIsAdaptiveMode(false);
        setAnswers({});
        return;
      }

      setAccessBlock(null);
      const copy = { ...qz };
      if (copy.questions) {
        copy.questions = randomizeOptions(copy.questions);
      }
      setQuiz(copy);
      setIsAdaptiveMode(false);
      setAnswers({});
    });
  }, [id]);

  useEffect(() => {
    if (!id || !quiz?.questions?.length || isAdaptiveMode || result || accessBlock) return;
    const limitMin = attemptStatus?.timeLimitMinutes ?? quiz?.timeLimit ?? 15;
    const limitSec = Math.max(60, Math.floor(limitMin * 60));

    const key = quizTimerKey(id);
    let stored = Number(sessionStorage.getItem(key));
    if (!stored || Number.isNaN(stored)) {
      stored = Date.now();
      sessionStorage.setItem(key, String(stored));
    }
    timerStartRef.current = stored;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - stored) / 1000);
      setElapsedSec(elapsed);
      if (elapsed >= limitSec) setTimeUp(true);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [id, quiz, isAdaptiveMode, result, accessBlock, attemptStatus]);

  useEffect(() => {
    if (!id || !quiz?.questions?.length) return;
    const finished = Boolean(adaptiveResult) || (Boolean(result) && !isAdaptiveMode);
    if (finished) return;

    writeDraft(quizAttemptDraftKey(id), {
      v: 1,
      phase: isAdaptiveMode ? 'adaptive' : 'main',
      quizUpdatedAt: quiz.updatedAt != null ? String(quiz.updatedAt) : '',
      quizSnapshot: { title: quiz.title, questions: quiz.questions },
      answers,
    });
  }, [id, quiz, answers, isAdaptiveMode, result, adaptiveResult]);

  const quizAttemptFinished =
    Boolean(adaptiveResult) || (Boolean(result) && !isAdaptiveMode);
  const secureQuizActive =
    Boolean(quiz?.questions?.length) && !adaptiveLoading && !quizAttemptFinished;
  useQuizSecureSession(secureQuizActive);

  const select = (qIndex, optIndex) => {
    if (result && !isAdaptiveMode) return;
    if (adaptiveResult && isAdaptiveMode) return;
    if (!isAdaptiveMode && timeUp) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const submit = async () => {
    const activeQuiz = isAdaptiveMode ? quiz : quiz;
    // In adaptive mode, 'quiz' gets overwritten with the new questions

    const answered = Object.keys(answers).length;
    if (answered < activeQuiz.questions.length && !(timeUp && !isAdaptiveMode)) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      if (isAdaptiveMode) {
        // Evaluate locally since the adaptive quiz isn't saved in the DB
        let correctCount = 0;
        const explanations = activeQuiz.questions.map((q, i) => {
          const isCorrect = answers[i] === q.correctAnswer;
          if (isCorrect) correctCount++;
          return {
            question: q.question,
            options: q.options,
            selectedIndex: answers[i],
            correctIndex: q.correctAnswer,
            explanation: q.explanation,
            isCorrect,
          };
        });
        const score = Math.round((correctCount / activeQuiz.questions.length) * 100);
        setAdaptiveResult({ score, correctCount, totalQuestions: activeQuiz.questions.length, explanations });
        setShowSolutions(false);
        clearDraft(quizAttemptDraftKey(id));
      } else {
        // Standard Database Submit
        const orderedAnswers = activeQuiz.questions.map((q, i) => {
          const selectedDisplayIndex = answers[i];
          if (typeof selectedDisplayIndex !== 'number') return -1;
          return Array.isArray(q.optionOrder)
            ? q.optionOrder[selectedDisplayIndex] ?? -1
            : selectedDisplayIndex;
        });
        const res = await api.post('/progress/submit', {
          quizId: id,
          answers: orderedAnswers,
          timeTaken: elapsedSec,
        });
        setResult(unwrapApiData(res));
        setShowSolutions(false);
        clearDraft(quizAttemptDraftKey(id));
        sessionStorage.removeItem(quizTimerKey(id));
      }
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e.message || 'Submit failed';
      alert(msg);
    }
    setSubmitting(false);
  };

  const startAdaptiveTest = (adaptivePayload) => {
    setAdaptiveLoading(true);

    setTimeout(() => {
      clearDraft(quizAttemptDraftKey(id));
      setQuiz(adaptivePayload);
      setAnswers({});
      setIsAdaptiveMode(true);
      setShowSolutions(false);
      setAdaptiveLoading(false);
    }, 1500); // Small dramatic pause
  };

  if (accessBlock) {
    return (
      <div className="max-w-lg mx-auto card text-center space-y-4">
        <h1 className="text-xl font-bold">{accessBlock.title}</h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{accessBlock.reason}</p>
        <p className="text-xs text-gray-500">
          If you think this is a mistake, contact your educator. They can extend the window, add attempts, or clear a block on your account.
        </p>
        <Link to={-1} className="btn-secondary inline-block">
          Back
        </Link>
      </div>
    );
  }

  if (api.loading && !quiz && !accessBlock) return <Loading />;
  if (!quiz && !accessBlock && !api.loading) {
    return (
      <div className="max-w-lg mx-auto card text-center">
        <p className="text-gray-600">This quiz could not be loaded.</p>
        <Link to={-1} className="btn-secondary inline-block mt-4">Back</Link>
      </div>
    );
  }
  if (!quiz && !accessBlock) return <Loading text="Loading quiz..." />;

  if (adaptiveLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
        <Sparkles className="w-16 h-16 text-indigo-500 animate-bounce mb-6" />
        <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
          Generating Harder AI Challenge...
        </h2>
        <p className="text-gray-500">Adapting to your high performance score!</p>
      </div>
    );
  }

  // Final Results View (Native or Adaptive)
  const activeResult = isAdaptiveMode ? adaptiveResult : result;

  if (activeResult) {
    const isLevelUpReady = !isAdaptiveMode && result?.nextAdaptiveQuiz && result.score >= 80;

    const solutionRows = (() => {
      if (isAdaptiveMode && adaptiveResult?.explanations?.length) {
        return adaptiveResult.explanations.map((e) => ({
          question: e.question,
          options: e.options,
          selectedIndex: e.selectedIndex,
          correctIndex: e.correctIndex,
          explanation: e.explanation,
          isCorrect: e.isCorrect,
        }));
      }
      if (!isAdaptiveMode && result && quiz?.questions?.length) {
        return quiz.questions.map((q, i) => {
          const explanation = result.explanations?.[i] || {};
          const submitted = result.answers?.[i] || {};
          const selectedOriginalIndex =
            typeof submitted.selectedAnswer === 'number' ? submitted.selectedAnswer : undefined;
          const correctOriginalIndex =
            typeof explanation.correctAnswer === 'number' ? explanation.correctAnswer : undefined;
          const selectedDisplayIndex = Array.isArray(q.optionOrder)
            ? q.optionOrder.indexOf(selectedOriginalIndex)
            : selectedOriginalIndex;
          const correctDisplayIndex = Array.isArray(q.optionOrder)
            ? q.optionOrder.indexOf(correctOriginalIndex)
            : correctOriginalIndex;

          return {
            question: q.question,
            options: q.options,
            selectedIndex: selectedDisplayIndex >= 0 ? selectedDisplayIndex : undefined,
            correctIndex: correctDisplayIndex >= 0 ? correctDisplayIndex : undefined,
            explanation: explanation.explanation || q.explanation,
            isCorrect: Boolean(submitted.isCorrect),
          };
        });
      }
      if (!isAdaptiveMode && result?.explanations?.length) {
        return result.explanations.map((explanation, i) => {
          const submitted = result.answers?.[i] || {};
          const selectedOriginalIndex =
            typeof submitted.selectedAnswer === 'number' ? submitted.selectedAnswer : undefined;
          const correctOriginalIndex =
            typeof explanation.correctAnswer === 'number' ? explanation.correctAnswer : undefined;
          const options = explanation.options || [];
          return {
            question: explanation.question,
            options,
            selectedIndex: selectedOriginalIndex,
            correctIndex: correctOriginalIndex,
            explanation: explanation.explanation,
            isCorrect: Boolean(submitted.isCorrect),
          };
        });
      }
      return [];
    })();

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card text-center relative overflow-hidden">
          {isAdaptiveMode && (
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
          )}
          <h1 className="text-2xl font-bold mb-2">
            {isAdaptiveMode ? 'Adaptive Challenge Complete!' : (quiz?.title ? `${quiz.title} — Complete!` : 'Quiz Complete!')}
          </h1>
          <div className="my-6">
            <p className="text-6xl font-bold text-primary-600">{activeResult.score}%</p>
            <p className="text-gray-500 mt-2">
              {activeResult.correctCount} out of {activeResult.totalQuestions} correct
            </p>
            {activeResult.completedAt && (
              <p className="text-xs text-gray-400 mt-2">
                Submitted {new Date(activeResult.completedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to={-1} className="btn-secondary">Back to Course</Link>
            {solutionRows.length > 0 && (
              showSolutions ? (
                <button type="button" onClick={() => setShowSolutions(false)} className="btn-secondary">
                  Hide solutions
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSolutions(true)}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  <BookOpenCheck size={18} aria-hidden />
                  View solutions
                </button>
              )
            )}
          </div>
        </div>

        {/* Level Up Banner interceptor */}
        {isLevelUpReady && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-10">
              <Trophy size={180} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                  <Sparkles className="text-yellow-300" /> Great Job!
                </h2>
                <p className="text-indigo-100 max-w-sm">
                  You crushed this quiz. Our AI has generated an adaptive hard-mode challenge exclusively for you. Are you ready?
                </p>
              </div>
              <button
                onClick={() => startAdaptiveTest(result.nextAdaptiveQuiz)}
                className="bg-white text-indigo-600 hover:bg-gray-50 font-bold px-6 py-3 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                Accept Challenge
              </button>
            </div>
          </div>
        )}

        {showSolutions && solutionRows.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Question review</h2>
            {solutionRows.map((row, i) => (
              <div key={i} className={'card border-l-4 ' + (row.isCorrect ? 'border-l-green-500' : 'border-l-red-500')}>
                <div className="flex items-start gap-2 mb-2">
                  {row.isCorrect ? (
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium text-sm">{row.question}</p>
                </div>
                <div className="ml-7 space-y-1.5 text-sm">
                  <p className={row.isCorrect ? 'text-gray-700 dark:text-gray-300' : 'text-gray-800 dark:text-gray-200'}>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Your answer: </span>
                    {typeof row.selectedIndex === 'number' && row.options
                      ? `${String.fromCharCode(65 + row.selectedIndex)}. ${row.options[row.selectedIndex]}`
                      : '—'}
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Correct: </span>
                    {typeof row.correctIndex === 'number' && row.options
                      ? `${String.fromCharCode(65 + row.correctIndex)}. ${row.options[row.correctIndex]}`
                      : '—'}
                  </p>
                  {row.explanation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700 mt-2">
                      {row.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="max-w-2xl mx-auto space-y-6 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {quiz.title}
            {isAdaptiveMode && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full border border-purple-200 uppercase tracking-widest font-black flex items-center gap-1"><Sparkles size={12} /> AI EXTENSION</span>}
          </h1>
          <p className="text-sm text-gray-500">{quiz.questions.length} questions {isAdaptiveMode ? '• Adaptive Difficulty' : ''}</p>
          {!isAdaptiveMode && attemptStatus && (
            <p className="text-xs text-gray-500 mt-1">
              Attempts used: {attemptStatus.attemptsUsed} / {attemptStatus.totalAttemptsAllowed}
              {attemptStatus.lastResult && attemptStatus.canStart && (
                <span className="ml-2 text-primary-600 font-medium">
                  · Last score: {attemptStatus.lastResult.score}%
                </span>
              )}
            </p>
          )}
        </div>
        {!isAdaptiveMode && attemptStatus && (
          <div
            className={
              'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ' +
              (timeUp
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
                : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200')
            }
          >
            <Clock size={16} className="shrink-0" aria-hidden />
            <span>
              {timeUp
                ? 'Time limit reached — submit now.'
                : (() => {
                    const limitMin = attemptStatus.timeLimitMinutes ?? quiz.timeLimit ?? 15;
                    const limitSec = Math.max(60, Math.floor(Number(limitMin) * 60));
                    const remain = Math.max(0, limitSec - elapsedSec);
                    const m = Math.floor(remain / 60);
                    const s = remain % 60;
                    return `Time left: ${m}:${String(s).padStart(2, '0')}`;
                  })()}
            </span>
          </div>
        )}
      </div>

      {quiz.questions.map((q, qi) => (
        <div key={qi} className={`card ${isAdaptiveMode ? 'border-purple-100 shadow-sm shadow-purple-900/5' : ''}`}>
          <p className="font-medium mb-4">
            <span className={isAdaptiveMode ? 'text-purple-600 mr-2' : 'text-primary-600 mr-2'}>Q{qi + 1}.</span>
            {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => select(qi, oi)}
                className={
                  'w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ' +
                  (answers[qi] === oi
                    ? (isAdaptiveMode ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300')
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500')
                }
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + oi)}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {Object.keys(answers).length} / {quiz.questions.length} answered
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-md">
            Progress is saved on this device for {QUIZ_DRAFT_TTL_HOURS} hours; you can close the tab and resume later.
          </p>
        </div>
        <button
          onClick={submit}
          disabled={
            submitting ||
            (isAdaptiveMode && Object.keys(answers).length < quiz.questions.length) ||
            (!isAdaptiveMode && !timeUp && Object.keys(answers).length < quiz.questions.length)
          }
          className={isAdaptiveMode ? "btn-primary bg-purple-600 hover:bg-purple-700 border-purple-700" : "btn-primary"}
        >
          {submitting ? 'Submitting...' : (isAdaptiveMode ? 'Submit Challenge' : 'Submit Quiz')}
        </button>
      </div>
    </div>
  );
}