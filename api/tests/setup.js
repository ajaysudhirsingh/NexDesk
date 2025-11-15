const { MongoMemoryServer } = require('mongodb-memory-server');
const database = require('../config/database');

let mongoServer;

// Setup test database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Override environment for testing
  process.env.MONGO_URL = mongoUri;
  process.env.DB_NAME = 'nexdesk_test';
  process.env.NODE_ENV = 'test';
  
  await database.connect();
});

// Cleanup after tests
afterAll(async () => {
  await database.disconnect();
  await mongoServer.stop();
});

// Clear collections before each test
beforeEach(async () => {
  const collections = await database.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});