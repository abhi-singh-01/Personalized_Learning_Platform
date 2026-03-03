import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import { CheckCircle, XCircle, ArrowLeft, Trophy, Star, Sparkles } from 'lucide-react';

export default function QuizAttempt() {
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

  useEffect(() => {
    // Basic randomization logic for options and questions
    const randomizeOptions = (questions) => {
      return questions.map(q => {
        const optionsCopy = [...q.options];
        const correctText = optionsCopy[q.correctAnswer];
        optionsCopy.sort(() => Math.random() - 0.5);
        const newCorrectIndex = optionsCopy.indexOf(correctText);
        return { ...q, options: optionsCopy, correctAnswer: newCorrectIndex };
      });
    };

    api.get('/quizzes/' + id).then((res) => {
      const qz = res.data;
      if (qz && qz.questions) {
        qz.questions = randomizeOptions(qz.questions);
      }
      setQuiz(qz);
    });
  }, [id]);

  const select = (qIndex, optIndex) => {
    if (result && !isAdaptiveMode) return;
    if (adaptiveResult && isAdaptiveMode) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const submit = async () => {
    const activeQuiz = isAdaptiveMode ? quiz : quiz;
    // In adaptive mode, 'quiz' gets overwritten with the new questions

    if (Object.keys(answers).length < activeQuiz.questions.length) {
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
            explanation: q.explanation,
            isCorrect
          };
        });
        const score = Math.round((correctCount / activeQuiz.questions.length) * 100);
        setAdaptiveResult({ score, correctCount, totalQuestions: activeQuiz.questions.length, explanations });
      } else {
        // Standard Database Submit
        const orderedAnswers = activeQuiz.questions.map((_, i) => answers[i] ?? -1);
        const res = await api.post('/progress/submit', {
          quizId: id,
          answers: orderedAnswers,
          timeTaken: 0,
        });
        setResult(res.data);
      }
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const startAdaptiveTest = (adaptivePayload) => {
    setAdaptiveLoading(true);

    setTimeout(() => {
      // Overwrite the rendering state with the new AI payload
      setQuiz(adaptivePayload);
      setAnswers({});
      setIsAdaptiveMode(true);
      setAdaptiveLoading(false);
    }, 1500); // Small dramatic pause
  };

  if (api.loading && !quiz) return <Loading />;
  if (!quiz) return <Loading text="Loading quiz..." />;

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
    const isLevelUpReady = !isAdaptiveMode && result.nextAdaptiveQuiz && result.score >= 80;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card text-center relative overflow-hidden">
          {isAdaptiveMode && (
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
          )}
          <h1 className="text-2xl font-bold mb-2">
            {isAdaptiveMode ? 'Adaptive Challenge Complete!' : 'Quiz Complete!'}
          </h1>
          <div className="my-6">
            <p className="text-6xl font-bold text-primary-600">{activeResult.score}%</p>
            <p className="text-gray-500 mt-2">
              {activeResult.correctCount} out of {activeResult.totalQuestions} correct
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <Link to={-1} className="btn-secondary">Back to Course</Link>
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

        <div className="space-y-4">
          {activeResult.explanations?.map((exp, i) => {
            const isCorrect = isAdaptiveMode ? exp.isCorrect : result.answers?.[i]?.isCorrect;
            return (
              <div key={i} className={'card border-l-4 ' + (isCorrect ? 'border-l-green-500' : 'border-l-red-500')}>
                <div className="flex items-start gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium text-sm">{exp.question}</p>
                </div>
                {exp.explanation && (
                  <p className="text-xs text-gray-500 ml-7">{exp.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {quiz.title}
            {isAdaptiveMode && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full border border-purple-200 uppercase tracking-widest font-black flex items-center gap-1"><Sparkles size={12} /> AI EXTENSION</span>}
          </h1>
          <p className="text-sm text-gray-500">{quiz.questions.length} questions {isAdaptiveMode ? '• Adaptive Difficulty' : ''}</p>
        </div>
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

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {Object.keys(answers).length} / {quiz.questions.length} answered
        </p>
        <button
          onClick={submit}
          disabled={submitting || Object.keys(answers).length < quiz.questions.length}
          className={isAdaptiveMode ? "btn-primary bg-purple-600 hover:bg-purple-700 border-purple-700" : "btn-primary"}
        >
          {submitting ? 'Submitting...' : (isAdaptiveMode ? 'Submit Challenge' : 'Submit Quiz')}
        </button>
      </div>
    </div>
  );
}