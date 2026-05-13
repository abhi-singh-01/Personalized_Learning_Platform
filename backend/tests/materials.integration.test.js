/**
 * Integration tests: in-memory MongoDB + real Express app + supertest.
 * JWT without tokenId skips session checks (see auth middleware).
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'integration-test-jwt-secret-minimum-32-characters-long';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');

let MongoMemoryServer;
try {
  ({ MongoMemoryServer } = require('mongodb-memory-server'));
} catch (e) {
  MongoMemoryServer = null;
  // eslint-disable-next-line no-console
  console.warn('Skip materials integration: npm ci in backend (mongodb-memory-server)');
}

let mongod;
let app;
let User;
let Course;
let Material;
let educator;
let course;
let seedMaterial;

function authHeader(userDoc) {
  const token = jwt.sign(
    { id: userDoc._id.toString(), role: userDoc.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `Bearer ${token}`;
}

describe('Materials API (integration)', { skip: !MongoMemoryServer, timeout: 120_000 }, () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Load models after DB is ready (same connection app will use)
    User = require('../src/models/User');
    Course = require('../src/models/Course');
    Material = require('../src/models/Material');

    // Fresh app instance bound to this mongoose connection
    delete require.cache[require.resolve('../src/app')];
    app = require('../src/app');

    educator = await User.create({
      name: 'Integration Educator',
      email: `int-edu-${Date.now()}@test.local`,
      password: 'password123',
      role: 'educator',
      profileComplete: true,
      phone: '9876543210',
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai',
    });

    course = await Course.create({
      title: 'Integration Course',
      description: 'Course for API tests',
      category: 'Testing',
      educator: educator._id,
    });

    seedMaterial = await Material.create({
      title: 'Seed video',
      description: '',
      course: course._id,
      type: 'video',
      fileUrl: '/uploads/nonexistent-test-file.bin',
      order: 0,
    });
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  it('PUT /api/materials/:id updates uploaded video metadata without a new file', async () => {
    const m = await Material.create({
      title: 'Lecture 1',
      description: 'Original',
      course: course._id,
      type: 'video',
      fileUrl: '/uploads/another-fake.bin',
      order: 1,
    });

    const res = await request(app)
      .put(`/api/materials/${m._id}`)
      .set('Authorization', authHeader(educator))
      .field('title', 'Lecture 1 (edited)')
      .field('description', 'Updated summary')
      .field('type', 'video')
      .field('course', course._id.toString());

    assert.equal(res.status, 200, res.text);
    const updated = await Material.findById(m._id);
    assert.equal(updated.title, 'Lecture 1 (edited)');
    assert.equal(updated.description, 'Updated summary');
    assert.equal(updated.fileUrl, '/uploads/another-fake.bin');
  });

  it('DELETE /api/materials/:id removes material for course owner', async () => {
    const res = await request(app)
      .delete(`/api/materials/${seedMaterial._id}`)
      .set('Authorization', authHeader(educator));

    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.success, true);
    const gone = await Material.findById(seedMaterial._id);
    assert.equal(gone, null);
  });
});
