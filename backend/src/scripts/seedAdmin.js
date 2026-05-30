/**
 * Seed / sync the default platform admin in MongoDB.
 *
 * Usage:
 *   npm run seed:admin
 *   node src/scripts/seedAdmin.js
 *
 * Env (optional):
 *   MONGODB_URI     — required
 *   ADMIN_EMAIL     — default admin@plp.com
 *   ADMIN_PASSWORD  — default Admin@123456
 *   ADMIN_NAME      — default Platform Admin
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const ensureDefaultAdmin = require('../services/adminBootstrap');

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@plp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

async function seedAdmin() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set. Add it to backend/.env or Render env vars.');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    const result = await ensureDefaultAdmin({ forceSync: true });

    console.log('\n🎉 Default admin is ready');
    console.log('─'.repeat(40));
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Status:   ${result.action}`);
    console.log('─'.repeat(40));
    console.log('\n🔐 Sign in at: /admin/login\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Admin seed failed:', err.message);
    process.exit(1);
  }
}

seedAdmin();
