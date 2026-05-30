const User = require('../models/User');

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'admin@plp.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Platform Admin';

async function ensureDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (!existingAdmin) {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        authProvider: 'local',
        profileComplete: true,
        emailVerified: true,
      });
      console.log(`[admin-bootstrap] Created default admin (${ADMIN_EMAIL})`);
      return;
    }

    if (process.env.ADMIN_RESET_PASSWORD === 'true') {
      const admin = await User.findOne({ email: ADMIN_EMAIL, role: 'admin' }).select('+password');
      if (admin) {
        admin.password = ADMIN_PASSWORD;
        await admin.save();
        console.log(`[admin-bootstrap] Password synced for ${ADMIN_EMAIL}`);
      } else {
        console.warn(
          `[admin-bootstrap] ADMIN_RESET_PASSWORD is set but no admin found at ${ADMIN_EMAIL}`
        );
      }
    }
  } catch (err) {
    console.error('[admin-bootstrap] Failed:', err.message);
  }
}

module.exports = ensureDefaultAdmin;
