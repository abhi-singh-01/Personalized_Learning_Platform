require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test(modelName) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("hello");
        console.log(`Success with ${modelName}:`, result.response.text());
    } catch (e) {
        console.error(`Failed ${modelName}:`, e.message);
    }
}

test('gemini-2.5-flash');
test('gemini-2.0-flash');
