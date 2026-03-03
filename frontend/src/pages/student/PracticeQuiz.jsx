import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import { CheckCircle, XCircle, Sparkles } from 'lucide-react';

export default function PracticeQuiz() {
    const { courseId } = useParams();
    const api = useApi();

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [previousQuestions, setPreviousQuestions] = useState([]);

    const generateNextQuiz = () => {
        setQuiz(null);
        setAnswers({});
        setResult(null);

        // Collect newly seen questions to historical array
        const updatedHistory = [...previousQuestions];
        if (quiz?.questions) {
            quiz.questions.forEach(q => updatedHistory.push(q.question));
        }
        setPreviousQuestions(updatedHistory);

        // Generate AI Quiz for practice
        api.post('/ai/generate-quiz', {
            courseId,
            numQuestions: 5,
            previousQuestions: updatedHistory
        }).then((res) => {
            const qz = res.data;
            if (qz && qz.questions) {
                // Randomize options
                qz.questions = qz.questions.map(q => {
                    const optionsCopy = [...q.options];
                    const correctText = optionsCopy[q.correctAnswer];
                    optionsCopy.sort(() => Math.random() - 0.5);
                    const newCorrectIndex = optionsCopy.indexOf(correctText);
                    return { ...q, options: optionsCopy, correctAnswer: newCorrectIndex };
                });
            }
            setQuiz(qz);
        }).catch(err => {
            console.error(err);
            alert('Failed to generate practice quiz.');
        });
    };

    useEffect(() => {
        generateNextQuiz();
    }, [courseId]);

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
                explanation: q.explanation,
                isCorrect
            };
        });

        const score = Math.round((correctCount / quiz.questions.length) * 100);
        setResult({ score, correctCount, totalQuestions: quiz.questions.length, explanations });
        setSubmitting(false);
    };

    if (api.loading && !quiz) {
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
                    <div className="flex justify-center gap-3">
                        <Link to={`/student/courses/${courseId}`} className="btn-secondary">Back to Course</Link>
                        <button onClick={generateNextQuiz} className="btn-primary">Generate Another</button>
                    </div>
                </div>

                <div className="space-y-4">
                    {result.explanations?.map((exp, i) => (
                        <div key={i} className={'card border-l-4 ' + (exp.isCorrect ? 'border-l-green-500' : 'border-l-red-500')}>
                            <div className="flex items-start gap-2 mb-2">
                                {exp.isCorrect ? (
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
                    ))}
                </div>
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

            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    {Object.keys(answers).length} / {quiz.questions.length} answered
                </p>
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
