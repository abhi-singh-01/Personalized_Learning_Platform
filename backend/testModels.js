require('dotenv').config();

async function getModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(data.models.map(m => m.name));
    } catch (e) {
        console.error(e);
    }
}

getModels();
