/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const APPLY = process.argv.includes('--apply');

if (!uri) {
  console.error('Missing Mongo URI. Set MONGODB_URI (or MONGO_URI) in environment.');
  process.exit(1);
}

async function connect() {
  await mongoose.connect(uri);
  console.log('MongoDB connected for migration');
}

async function report(db) {
  const counts = {
    usersRoleStudent: await db.collection('users').countDocuments({ role: 'student' }),
    usersRoleTeacher: await db.collection('users').countDocuments({ role: 'teacher' }),
    usersAssignedStudentsField: await db.collection('users').countDocuments({ assignedStudents: { $exists: true } }),
    coursesTeacherField: await db.collection('courses').countDocuments({ teacher: { $exists: true } }),
    coursesStudentsField: await db.collection('courses').countDocuments({ students: { $exists: true } }),
    progressStudentField: await db.collection('progresses').countDocuments({ student: { $exists: true } }),
    reviewsStudentField: await db.collection('reviews').countDocuments({ student: { $exists: true } }),
    schedulesTeacherField: await db.collection('schedules').countDocuments({ teacher: { $exists: true } }),
    quizzesTeacherField: await db.collection('quizzes').countDocuments({ teacher: { $exists: true } }),
  };

  console.log('Pre-migration counts:', counts);
  return counts;
}

async function applyMigration(db) {
  const results = [];

  results.push({
    name: 'users role student->learner',
    res: await db.collection('users').updateMany({ role: 'student' }, { $set: { role: 'learner' } }),
  });
  results.push({
    name: 'users role teacher->educator',
    res: await db.collection('users').updateMany({ role: 'teacher' }, { $set: { role: 'educator' } }),
  });

  // Rename fields where they still exist
  results.push({
    name: 'users assignedStudents->assignedLearners',
    res: await db.collection('users').updateMany(
      { assignedStudents: { $exists: true } },
      { $rename: { assignedStudents: 'assignedLearners' } }
    ),
  });
  results.push({
    name: 'courses teacher->educator, students->learners',
    res: await db.collection('courses').updateMany(
      { $or: [{ teacher: { $exists: true } }, { students: { $exists: true } }] },
      { $rename: { teacher: 'educator', students: 'learners' } }
    ),
  });
  results.push({
    name: 'progresses student->learner',
    res: await db.collection('progresses').updateMany(
      { student: { $exists: true } },
      { $rename: { student: 'learner' } }
    ),
  });
  results.push({
    name: 'reviews student->learner',
    res: await db.collection('reviews').updateMany(
      { student: { $exists: true } },
      { $rename: { student: 'learner' } }
    ),
  });
  results.push({
    name: 'schedules teacher->educator',
    res: await db.collection('schedules').updateMany(
      { teacher: { $exists: true } },
      { $rename: { teacher: 'educator' } }
    ),
  });
  results.push({
    name: 'quizzes teacher->educator',
    res: await db.collection('quizzes').updateMany(
      { teacher: { $exists: true } },
      { $rename: { teacher: 'educator' } }
    ),
  });

  // Optional role arrays in feature flags / UI config
  results.push({
    name: 'featureflags enabledForRoles student->learner',
    res: await db.collection('featureflags').updateMany(
      { enabledForRoles: 'student' },
      [{ $set: { enabledForRoles: { $map: { input: '$enabledForRoles', as: 'r', in: { $cond: [{ $eq: ['$$r', 'student'] }, 'learner', '$$r'] } } } } }]
    ),
  });
  results.push({
    name: 'uiconfigs targetRoles student->learner',
    res: await db.collection('uiconfigs').updateMany(
      { targetRoles: 'student' },
      [{ $set: { targetRoles: { $map: { input: '$targetRoles', as: 'r', in: { $cond: [{ $eq: ['$$r', 'student'] }, 'learner', '$$r'] } } } } }]
    ),
  });

  for (const item of results) {
    console.log(`${item.name}: matched=${item.res.matchedCount} modified=${item.res.modifiedCount}`);
  }
}

async function main() {
  try {
    await connect();
    const db = mongoose.connection.db;

    await report(db);

    if (!APPLY) {
      console.log('\nDry-run mode. No changes applied.');
      console.log('Run with --apply to execute migration:');
      console.log('  node src/scripts/migrateNamingToLearnerEducator.js --apply');
      return;
    }

    console.log('\nApplying migration...');
    await applyMigration(db);
    console.log('\nMigration complete.');
    await report(db);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
