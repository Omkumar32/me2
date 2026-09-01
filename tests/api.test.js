import { describe, it, expect } from 'vitest';
import request from 'supertest';
const app = require('../server.js');

describe('🛡️ Security & Authentication Suite', () => {
  it('should reject unauthorized access to protected POST /api/config', async () => {
    const res = await request(app)
      .post('/api/config')
      .send({ test: 'malicious' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/unauthorized/i);
  });

  it('should reject invalid admin credentials on POST /api/login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ id: 'WrongAdmin', pass: 'incorrect_pass_123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid Admin ID or Password');
  });

  it('should authenticate valid admin and return HMAC-signed token', async () => {
    const adminUser = process.env.ADMIN_USER || 'Admintux09';
    const adminPass = process.env.ADMIN_PASS || 'tux@#1234';
    const res = await request(app)
      .post('/api/login')
      .send({ id: adminUser, pass: adminPass });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.token).toContain('.');
  });

  it('should block path traversal requests to sensitive dotfiles', async () => {
    const res = await request(app).get('/.env');
    expect(res.status).toBe(403);
  });
});

describe('🌐 Public API Endpoints Suite', () => {
  it('GET /api/config should return public config with censored SMTP passwords', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    if (res.body.smtp && res.body.smtp.pass) {
      expect(res.body.smtp.pass).toBe('********');
    }
  });

  it('POST /api/send-email should reject empty payloads with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/send-email')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('All fields are required');
  });

  it('POST /api/send-email should validate email format', async () => {
    const res = await request(app)
      .post('/api/send-email')
      .send({
        name: 'Tester',
        email: 'invalid-email-address',
        subject: 'Hello',
        message: 'Test message content here'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid email format');
  });
});
