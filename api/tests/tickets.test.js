const request = require('supertest');
const { app } = require('../server');
const database = require('../config/database');
const { hashPassword, generateUUID, createAccessToken } = require('../utils/auth');

describe('Tickets API Tests', () => {
  let testClient, testUser, authToken, adminUser, adminToken;

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

    // Create admin user
    adminUser = {
      id: generateUUID(),
      username: 'admin',
      email: 'admin@example.com',
      password_hash: hashPassword('adminpass123'),
      role: 'admin',
      client_id: testClient.id,
      created_at: new Date()
    };
    
    await database.getCollection('users').insertOne(adminUser);

    // Generate tokens
    authToken = createAccessToken({
      sub: testUser.username,
      client_id: testClient.id,
      role: testUser.role
    });

    adminToken = createAccessToken({
      sub: adminUser.username,
      client_id: testClient.id,
      role: adminUser.role
    });
  });

  describe('POST /api/tickets', () => {
    it('should create ticket with valid data', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'Test ticket description',
        priority: 'medium',
        category: 'technical'
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ticketData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(ticketData.title);
      expect(response.body.status).toBe('open');
      expect(response.body.created_by).toBe(testUser.id);
    });

    it('should reject ticket without title', async () => {
      const ticketData = {
        description: 'Test ticket description',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ticketData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tickets', () => {
    beforeEach(async () => {
      // Create test tickets
      const tickets = [
        {
          id: generateUUID(),
          title: 'Open Ticket',
          description: 'Open ticket description',
          status: 'open',
          priority: 'high',
          created_by: testUser.id,
          client_id: testClient.id,
          created_at: new Date()
        },
        {
          id: generateUUID(),
          title: 'Closed Ticket',
          description: 'Closed ticket description',
          status: 'closed',
          priority: 'low',
          created_by: testUser.id,
          client_id: testClient.id,
          created_at: new Date(),
          closed_at: new Date()
        }
      ];

      await database.getCollection('tickets').insertMany(tickets);
    });

    it('should return user tickets', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should filter tickets by status', async () => {
      const response = await request(app)
        .get('/api/tickets?status=open')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('open');
    });
  });

  describe('PUT /api/tickets/:id', () => {
    let testTicket;

    beforeEach(async () => {
      testTicket = {
        id: generateUUID(),
        title: 'Test Ticket',
        description: 'Test description',
        status: 'open',
        priority: 'medium',
        created_by: testUser.id,
        client_id: testClient.id,
        created_at: new Date()
      };

      await database.getCollection('tickets').insertOne(testTicket);
    });

    it('should update ticket by owner', async () => {
      const updateData = {
        title: 'Updated Ticket',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.priority).toBe(updateData.priority);
    });

    it('should allow admin to update any ticket', async () => {
      const updateData = {
        status: 'in_progress',
        assigned_to: adminUser.id
      };

      const response = await request(app)
        .put(`/api/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.assigned_to).toBe(updateData.assigned_to);
    });
  });
});