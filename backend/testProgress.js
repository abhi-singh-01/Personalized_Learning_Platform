require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Quiz = require('./src/models/Quiz');
const Progress = require('./src/models/Progress');
const { updateStudentMetrics, updateStreak } = require('./src/services/analyticsService');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    try {
        const student = await User.findOne({ role: 'student' });
        const quiz = await Quiz.findOne();
        if (!student || !quiz) throw new Error('Need a student and a quiz in DB');

        console.log(`Student: ${student.name}, Quiz: ${quiz.title}`);

        const answers = quiz.questions.map((q, i) => i === 0 ? q.correctAnswer : -1);

        const graded = answers.map((a, i) => ({
            questionIndex: i,
            selectedAnswer: a,
            isCorrect: quiz.questions[i] && a === quiz.questions[i].correctAnswer,
        }));

        const correctCount = graded.filter((a) => a.isCorrect).length;
        const score = Math.round((correctCount / quiz.questions.length) * 100);

        const progress = await Progress.create({
            student: student._id,
            quiz: quiz._id,
            course: quiz.course,
            answers: graded,
            score,
            timeTaken: 120,
        });
        console.log('Progress created successfully!', progress._id);

        console.log('Testing Analytics...');
        await updateStreak(student._id);
        await updateStudentMetrics(student._id);
        console.log('Analytics updated successfully!');

    } catch (err) {
        if (err.name === 'ValidationError') {
            console.error('ValidationError:', Object.values(err.errors).map(e => e.message).join(', '));
            console.error('Validation Details:', err.errors);
        } else {
            console.error('Error:', err.message, err.stack);
        }
    } finally {
        await mongoose.disconnect();
    }
}

run();
