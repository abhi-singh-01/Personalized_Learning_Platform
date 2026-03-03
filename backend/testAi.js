require('dotenv').config();
const { generateStudyPlan, generateQuiz, generateFeedback } = require('./src/services/aiService');

async function test() {
    console.log('Testing Gemini API integration...');
    try {
        console.log('\n1. Testing Study Plan Generation...');
        const plan = await generateStudyPlan({
            goal: 'Learn React',
            hoursPerWeek: 10,
            level: 'Beginner',
            weakTopics: ['Hooks', 'State'],
            courseTitle: 'React 101'
        });
        console.log('✅ Study Plan generated successfully! Plan Title:', plan.planTitle);

        console.log('\n2. Testing Quiz Generation...');
        const quiz = await generateQuiz({
            topic: 'React Hooks',
            difficulty: 'medium',
            numQuestions: 2,
            courseTitle: 'React 101'
        });
        console.log('✅ Quiz generated successfully! Number of questions:', quiz.questions?.length);

        console.log('\n3. Testing Feedback Generation...');
        const feedback = await generateFeedback({
            studentName: 'Test Student',
            level: 'Beginner',
            averageScore: 60,
            recentScores: [50, 70],
            weakTopics: ['State Management']
        });
        console.log('✅ Feedback generated successfully! Overall Assessment:', feedback.overallAssessment.substring(0, 50) + '...');

        console.log('\n🎉 All Gemini API features are working correctly!');
    } catch (e) {
        console.error('\n❌ Error during Gemini API tests:', e);
    }
}

test();
