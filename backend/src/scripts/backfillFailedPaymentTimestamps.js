const connectDB = require('../config/db');
const Payment = require('../models/Payment');

async function run() {
  await connectDB();

  const staleFailed = await Payment.find({
    status: 'failed',
    $or: [{ failedAt: { $exists: false } }, { failedAt: null }],
  }).select('_id updatedAt createdAt');

  if (!staleFailed.length) {
    console.log('[BackfillFailedAt] No failed payments need backfill.');
    process.exit(0);
  }

  const ops = staleFailed.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: {
          failedAt: doc.updatedAt || doc.createdAt || new Date(),
        },
      },
    },
  }));

  const result = await Payment.bulkWrite(ops, { ordered: false });
  console.log(`[BackfillFailedAt] Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[BackfillFailedAt] Failed:', err.message);
  process.exit(1);
});
