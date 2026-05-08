/**
 * Seed Admin Script
 * 
 * Creates the first admin user if none exists.
 * 
 * Usage:
 *   node src/scripts/seedAdmin.js
 * 
 * Environment variables (optional — uses defaults otherwise):
 *   ADMIN_EMAIL    — admin email (default: admin@plp.com)
 *   ADMIN_PASSWORD — admin password (default: Admin@123456)
 *   ADMIN_NAME     — admin display name (default: Platform Admin)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@plp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Platform Admin';

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`\n⚠️  An admin already exists:`);
      console.log(`   Name:  ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   ID:    ${existingAdmin._id}`);
      console.log('\n💡 No new admin created. Use the existing account or update it via the admin dashboard.');
      process.exit(0);
    }

    // Create new admin
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      authProvider: 'local',
      profileComplete: true,
    });

    console.log('\n🎉 Admin account created successfully!');
    console.log('─'.repeat(40));
    console.log(`   Name:     ${admin.name}`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role:     admin`);
    console.log('─'.repeat(40));
    console.log('\n🔐 Login at: /admin/login');
    console.log('⚠️  IMPORTANT: Change the password after first login!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();
