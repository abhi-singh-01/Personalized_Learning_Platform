process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'integration-test-jwt-secret-minimum-32-characters-long';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.DUMMY_PAYMENT = 'true';

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
  console.warn('Skip access-control integration: npm ci in backend (mongodb-memory-server)');
}

let mongod;
let app;
let User;
let Course;
let Material;
let Quiz;
let Payment;
let educator;
let otherEducator;
let learner;
let otherLearner;
let course;
let material;
let quiz;

function authHeader(userDoc) {
  const token = jwt.sign(
    { id: userDoc._id.toString(), role: userDoc.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `Bearer ${token}`;
}

describe('Course access control (integration)', { skip: !MongoMemoryServer, timeout: 120_000 }, () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    User = require('../src/models/User');
    Course = require('../src/models/Course');
    Material = require('../src/models/Material');
    Quiz = require('../src/models/Quiz');
    Payment = require('../src/models/Payment');

    delete require.cache[require.resolve('../src/app')];
    app = require('../src/app');

    educator = await User.create({
      name: 'Owner Educator',
      email: `owner-${Date.now()}@test.local`,
      password: 'password123',
      role: 'educator',
    });
    otherEducator = await User.create({
      name: 'Other Educator',
      email: `other-edu-${Date.now()}@test.local`,
      password: 'password123',
      role: 'educator',
    });
    learner = await User.create({
      name: 'Learner',
      email: `learner-${Date.now()}@test.local`,
      password: 'password123',
      role: 'learner',
    });
    otherLearner = await User.create({
      name: 'Other Learner',
      email: `other-learner-${Date.now()}@test.local`,
      password: 'password123',
      role: 'learner',
    });

    course = await Course.create({
      title: 'Protected Course',
      description: 'Access-controlled course',
      category: 'Security',
      educator: educator._id,
      isPublished: true,
      status: 'published',
      price: 0,
    });
    material = await Material.create({
      title: 'Protected Material',
      course: course._id,
      type: 'article',
      content: '<p>Secret</p>',
    });
    quiz = await Quiz.create({
      title: 'Protected Quiz',
      course: course._id,
      educator: educator._id,
      questions: [{ question: '2+2?', options: ['3', '4'], correctAnswer: 1 }],
    });
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  it('denies course materials to a learner who is not enrolled', async () => {
    const res = await request(app)
      .get(`/api/materials/course/${course._id}`)
      .set('Authorization', authHeader(learner));

    assert.equal(res.status, 403, res.text);
  });

  it('allows enrolled learners to view materials and sanitized quizzes', async () => {
    await request(app)
      .post(`/api/courses/${course._id}/enroll`)
      .set('Authorization', authHeader(learner))
      .expect(200);

    const materialsRes = await request(app)
      .get(`/api/materials/course/${course._id}`)
      .set('Authorization', authHeader(learner));
    assert.equal(materialsRes.status, 200, materialsRes.text);
    assert.equal(materialsRes.body.data[0]._id, material._id.toString());

    const quizRes = await request(app)
      .get(`/api/quizzes/${quiz._id}`)
      .set('Authorization', authHeader(learner));
    assert.equal(quizRes.status, 200, quizRes.text);
    assert.equal(quizRes.body.data.questions[0].correctAnswer, undefined);
  });

  it('denies unrelated educators access to another educator course content', async () => {
    const res = await request(app)
      .get(`/api/quizzes/course/${course._id}`)
      .set('Authorization', authHeader(otherEducator));

    assert.equal(res.status, 403, res.text);
  });

  it('rejects dummy payment verification for another learner order', async () => {
    const payment = await Payment.create({
      user: otherLearner._id,
      course: course._id,
      educator: educator._id,
      razorpayOrderId: `dummy_order_${course._id}_${otherLearner._id}_${Date.now()}`,
      coursePrice: 100,
      platformFee: 2,
      gst: 0.36,
      totalAmount: 102.36,
      status: 'created',
      metadata: { isDummy: true },
    });

    const res = await request(app)
      .post('/api/payments/dummy-verify')
      .set('Authorization', authHeader(learner))
      .send({ orderId: payment.razorpayOrderId });

    assert.equal(res.status, 404, res.text);
  });
});
