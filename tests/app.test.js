const request = require('supertest');
const app = require('../src/app');
const path = require('path');

// Reset environment before each test
beforeEach(() => {
  delete process.env.NODE_ENV;
});

describe('GET /', () => {
  it('should respond with a welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Hello from Node.js!');
  });
});

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });
});

describe('GET /api/info', () => {
  it('should return app info', async () => {
    const res = await request(app).get('/api/info');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'my-node-app');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('nodeVersion');
    expect(res.body).toHaveProperty('platform');
  });
});

describe('GET /api/users', () => {
  it('should return an empty list initially', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ users: [] });
  });
});

describe('POST /api/users', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Alice', email: 'alice@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('should return 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'bob@example.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toBe('Name and email are required');
  });

  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Bob' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toBe('Name and email are required');
  });

  it('should return 400 when body is empty', async () => {
    const res = await request(app).post('/api/users').send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('404 handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('Not Found');
  });
});
