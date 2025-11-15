const request = require('supertest');
const { app } = require('../server');
const database = require('../config/database');
const { hashPassword, generateUUID } = require('../utils/auth');

describe('Authentication Tests', () => {
  let testClient, testUser;

  beforeEach(async () => {
    // Create test client
    testClient = {
      id: generateUUID(),
      name: 'Test Organization',
      code: 'TEST001',
      contact_email: 'test@example.com',
      is_active: true,
      created_at: new Date()
    };
    
    await database.getCollection('clients').insertOne(testClient);

    // Create test user
    testUser = {
      id: generateUUID(),
      username: 'testuser',
      email: 'test@example.com',
      password_hash: hashPassword('testpass123'),
      role: 'user',
      client_id: testClient.id,
      created_at: new Date()
    };
    
    await database.getCollection('users').insertOne(testUser);
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
          client_code: 'TEST001'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
          client_code: 'TEST001'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('detail');
    });

    it('should reject invalid client code', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
          client_code: 'INVALID'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
          client_code: 'TEST001'
        });
      
      authToken = loginResponse.body.access_token;
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('testuser');
      expect(response.body.role).toBe('user');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});