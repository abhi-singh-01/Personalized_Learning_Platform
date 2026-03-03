require('dotenv').config();
const mongoose = require('mongoose');

async function fixUniqueIndex() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    try {
        const Progress = require('./src/models/Progress');
        const indexes = await Progress.collection.indexes();
        console.log('Progress Indexes:', indexes);

        for (let idx of indexes) {
            if (idx.unique && idx.name !== '_id_') {
                console.log('Dropping unique index:', idx.name);
                await Progress.collection.dropIndex(idx.name);
            }
        }
        console.log('Done fixing unique indexes');
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

fixUniqueIndex();
