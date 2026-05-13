import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import { CheckCircle, XCircle, Sparkles, BookOpenCheck } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { readDraftJson, writeDraft, clearDraft, QUIZ_DRAFT_TTL_HOURS } from '../../utils/quizDraftStorage';

const practiceDraftKey = (courseId) => `plp_practice_attempt:${courseId}`;

function randomizePracticeQuestions(questions) {
  return questions.map((q) => {
    const optionsCopy = [...q.options];
    const correctText = optionsCopy[q.correctAnswer];
    optionsCopy.sort(() => Math.random() - 0.5);
    const newCorrectIndex = optionsCopy.indexOf(correctText);
    return { ...q, options: optionsCopy, correctAnswer: newCorrectIndex };
  });
}

export default function PracticeQuiz() {
  usePageTitle('Practice Quiz');
    const { courseId } = useParams();
    const api = useApi();

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showSolutions, setShowSolutions] = useState(false);
    const [previousQuestions, setPreviousQuestions] = useState([]);
    const [loadingQuiz, setLoadingQuiz] = useState(true);

    const fetchPracticeQuiz = (historyArr) => {
        api.post('/ai/generate-quiz', {
            courseId,
            numQuestions: 5,
            previousQuestions: historyArr,
        }).then((res) => {
            const qz = res.data;
            if (qz?.questions) {
                qz.questions = randomizePracticeQuestions(qz.questions);
            }
            setQuiz(qz);
        }).catch((err) => {
            console.error(err);
            alert('Failed to generate practice quiz.');
        }).finally(() => setLoadingQuiz(false));
    };

    useEffect(() => {
        setLoadingQuiz(true);
        const key = practiceDraftKey(courseId);
        const draft = readDraftJson(key);
        if (draft?.v === 1 && draft.quizSnapshot?.questions?.length) {
            setQuiz(draft.quizSnapshot);
            setAnswers(typeof draft.answers === 'object' && draft.answers ? draft.answers : {});
            setPreviousQuestions(Array.isArray(draft.previousQuestions) ? draft.previousQuestions : []);
            setResult(null);
            setShowSolutions(false);
            setLoadingQuiz(false);
            return;
        }
        setQuiz(null);
        setAnswers({});
        setPreviousQuestions([]);
        setResult(null);
        setShowSolutions(false);
        fetchPracticeQuiz([]);
    }, [courseId]);

    useEffect(() => {
        if (!courseId || !quiz?.questions?.length || result) return;
        writeDraft(practiceDraftKey(courseId), {
            v: 1,
            quizSnapshot: quiz,
            answers,
            previousQuestions,
        });
    }, [courseId, quiz, answers, previousQuestions, result]);

    const generateNextQuiz = () => {
        clearDraft(practiceDraftKey(courseId));
        setQuiz(null);
        setAnswers({});
        setResult(null);
        setShowSolutions(false);
        setLoadingQuiz(true);

        const updatedHistory = [...previousQuestions];
        if (quiz?.questions) {
            quiz.questions.forEach((q) => updatedHistory.push(q.question));
        }
        setPreviousQuestions(updatedHistory);
        fetchPracticeQuiz(updatedHistory);
    };

    const select = (qIndex, optIndex) => {
        if (result) return;
        setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
    };

    const submit = () => {
        if (Object.keys(answers).length < quiz.questions.length) {
            alert('Please answer all questions before submitting.');
            return;
        }
        setSubmitting(true);

        // Evaluate locally
        let correctCount = 0;
        const explanations = quiz.questions.map((q, i) => {
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

        const score = Math.round((correctCount / quiz.questions.length) * 100);
        setResult({ score, correctCount, totalQuestions: quiz.questions.length, explanations });
        setShowSolutions(false);
        clearDraft(practiceDraftKey(courseId));
        setSubmitting(false);
    };

    if (loadingQuiz) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <Sparkles className="w-16 h-16 text-indigo-500 animate-bounce mb-6" />
                <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                    Generating Practice Questions...
                </h2>
                <p className="text-gray-500">Our AI is analyzing your course to create targeted practice.</p>
            </div>
        );
    }
    if (!quiz) return <Loading text="Loading..." />;

    if (result) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="card text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
                    <h1 className="text-2xl font-bold mb-2">Practice Complete!</h1>
                    <div className="my-6">
                        <p className="text-6xl font-bold text-primary-600">{result.score}%</p>
                        <p className="text-gray-500 mt-2">
                            {result.correctCount} out of {result.totalQuestions} correct
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Link to={`/learner/courses/${courseId}`} className="btn-secondary">Back to Course</Link>
                        <button type="button" onClick={generateNextQuiz} className="btn-primary">Generate Another</button>
                        {result.explanations?.length > 0 && (
                            showSolutions ? (
                                <button type="button" onClick={() => setShowSolutions(false)} className="btn-secondary">
                                    Hide solutions
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowSolutions(true)}
                                    className="btn-primary bg-purple-600 hover:bg-purple-700 border-purple-700 inline-flex items-center justify-center gap-2"
                                >
                                    <BookOpenCheck size={18} aria-hidden />
                                    View solutions
                                </button>
                            )
                        )}
                    </div>
                </div>

                {showSolutions && result.explanations?.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Question review</h2>
                        {result.explanations.map((row, i) => (
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
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Practice: {quiz.title || 'AI Generated Quiz'}
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full uppercase font-black"><Sparkles size={12} className="inline mr-1" /> AI Generated</span>
                    </h1>
                    <p className="text-sm text-gray-500">{quiz.questions.length} questions • Not graded</p>
                </div>
            </div>

            {quiz.questions.map((q, qi) => (
                <div key={qi} className="card border-purple-100 dark:border-purple-900/30">
                    <p className="font-medium mb-4">
                        <span className="text-purple-600 mr-2">Q{qi + 1}.</span>
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
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500')
                                }
                            >
                                <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
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
                    disabled={submitting || Object.keys(answers).length < quiz.questions.length}
                    className="btn-primary bg-purple-600 hover:bg-purple-700 border-purple-700"
                >
                    {submitting ? 'Submitting...' : 'Submit Practice Quiz'}
                </button>
            </div>
        </div>
    );
}
