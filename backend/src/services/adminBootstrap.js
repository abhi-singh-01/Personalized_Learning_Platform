const User = require('../models/User');

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'admin@plp.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Platform Admin';

function shouldSyncAdminCredentials(options = {}) {
  if (options.forceSync) return true;
  if (process.env.ADMIN_BOOTSTRAP_SYNC === 'false') return false;
  if (process.env.ADMIN_RESET_PASSWORD === 'true') return true;
  if (process.env.RENDER) return true;
  return process.env.ADMIN_BOOTSTRAP_SYNC === 'true';
}

async function ensureDefaultAdmin(options = {}) {
  const syncCredentials = shouldSyncAdminCredentials(options);

  let user = await User.findOne({ email: ADMIN_EMAIL });

  if (!user) {
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
    return { action: 'created', email: ADMIN_EMAIL };
  }

  let changed = false;

  if (user.role !== 'admin') {
    const previousRole = user.role;
    user.role = 'admin';
    user.emailVerified = true;
    user.profileComplete = true;
    changed = true;
    console.warn(`[admin-bootstrap] Promoted ${ADMIN_EMAIL} from "${previousRole}" to admin`);
  }

  if (options.forceSync) {
    user.password = ADMIN_PASSWORD;
    user.authProvider = 'local';
    changed = true;
    console.log(`[admin-bootstrap] Set password for ${ADMIN_EMAIL} (force seed)`);
  } else if (syncCredentials) {
    const passwordOk = user.password
      ? await user.comparePassword(ADMIN_PASSWORD)
      : false;
    if (!passwordOk) {
      user.password = ADMIN_PASSWORD;
      user.authProvider = 'local';
      changed = true;
      console.log(`[admin-bootstrap] Synced password for ${ADMIN_EMAIL}`);
    }
  }

  if (changed) {
    await user.save();
    return { action: 'updated', email: ADMIN_EMAIL };
  }

  console.log(`[admin-bootstrap] Default admin ready (${ADMIN_EMAIL})`);
  return { action: 'ready', email: ADMIN_EMAIL };
}

module.exports = ensureDefaultAdmin;
module.exports.ADMIN_EMAIL = ADMIN_EMAIL;
