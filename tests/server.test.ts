import request from 'supertest';
import express from 'express';

describe('Server Routes', () => {
  const app = express();
  const defaultNpub = 'npub1n00yy9y3704drtpph5wszen64w287nquftkcwcjv7gnnkpk2q54s73000n';

  beforeAll(() => {
    // Set up your routes here
    app.get('/', (req, res) => {
      res.redirect(`/${defaultNpub}`);
    });
  });

  it('should redirect to default npub on root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`/${defaultNpub}`);
  });
}); 