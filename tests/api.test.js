import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
const app = require('../server.js');

describe('🛡️ Security & Authentication Suite', () => {
  let validToken = '';
  const adminUser = process.env.ADMIN_USER || 'Admintux09';
  const adminPass = process.env.ADMIN_PASS || 'tux@#1234';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ id: adminUser, pass: adminPass });
    if (res.body && res.body.token) {
      validToken = res.body.token;
    }
  });

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
    const res = await request(app)
      .post('/api/login')
      .send({ id: adminUser, pass: adminPass });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.token).toContain('.');
  });

  it('should reject fake forged token on protected endpoints', async () => {
    const res = await request(app)
      .post('/api/config')
      .set('Authorization', 'Bearer forged.token_signature_here')
      .send({ smtp: {}, socials: {} });
    expect(res.status).toBe(401);
  });

  it('should allow logout successfully', async () => {
    const res = await request(app).post('/api/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should block path traversal requests to sensitive dotfiles', async () => {
    const sensitiveFiles = ['/.env', '/config.json', '/server.js', '/package.json', '/.gitignore'];
    for (const file of sensitiveFiles) {
      const res = await request(app).get(file);
      expect(res.status).toBe(403);
    }
  });
});

describe('🌐 Public API Endpoints Suite', () => {
  it('GET /api/config should return public config with censored SMTP passwords', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.projects).toBeInstanceOf(Array);
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

  it('GET /robots.txt should serve standard robots directive for SEO crawlers', async () => {
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('User-agent: *');
    expect(res.text).toContain('Sitemap:');
  });

  it('GET /sitemap.xml should serve XML sitemap for search engine indexing', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<?xml');
    expect(res.text).toContain('https://omkumar.dev/');
  });
});

describe('⚡ CMS Projects & File Upload Suite', () => {
  let validToken = '';
  const adminUser = process.env.ADMIN_USER || 'Admintux09';
  const adminPass = process.env.ADMIN_PASS || 'tux@#1234';

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ id: adminUser, pass: adminPass });
    validToken = res.body.token;
  });

  it('should require valid title when adding a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title is required/i);
  });

  it('should successfully add and delete a project with authorized token', async () => {
    const configBefore = await request(app).get('/api/config');
    const initialCount = (configBefore.body.projects || []).length;

    // Add project
    const addRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: 'Vitest Automated Suite Test Project',
        category: 'SYSTEM // TEST',
        description: 'Testing automated project insertion and deletion.',
        tech: ['Vitest', 'Express'],
        codeUrl: 'https://github.com/Omkumar32',
        launchUrl: '#'
      });
    expect(addRes.status).toBe(200);
    expect(addRes.body.success).toBe(true);

    // Delete newly added project
    const deleteRes = await request(app)
      .delete(`/api/projects/${initialCount}`)
      .set('Authorization', `Bearer ${validToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  it('should reject project deletion with out-of-bounds index', async () => {
    const res = await request(app)
      .delete('/api/projects/99999')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid project index');
  });

  it('should reject project image upload when missing payload data', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing file data');
  });

  it('should reject resume upload when missing base64Data', async () => {
    const res = await request(app)
      .post('/api/upload-resume')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing file data');
  });
});
