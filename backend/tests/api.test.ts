import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/models/user.model';
import { ROLES } from '../src/constants';
import { hashPassword } from '../src/utils/password';

const app = createApp();

async function createUser(overrides: {
  name?: string;
  email: string;
  password?: string;
  role?: string;
}) {
  const password = overrides.password ?? 'Password1';
  const user = await User.create({
    name: overrides.name ?? 'Test User',
    email: overrides.email,
    password: await hashPassword(password),
    role: overrides.role ?? ROLES.MEMBER,
  });
  return { user, password };
}

async function login(email: string, password: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data.token as string;
}

describe('API MVP', () => {
  it('registers and logs in a user', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password1',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.token).toBeDefined();
    expect(registerRes.body.data.user.role).toBe('MEMBER');

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'alice@example.com',
      password: 'Password1',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });

  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(401);
  });

  it('allows admin to create a project and blocks members from creating', async () => {
    const { password: adminPass } = await createUser({
      email: 'admin@example.com',
      role: ROLES.ADMIN,
    });
    const { password: memberPass } = await createUser({
      email: 'member@example.com',
      role: ROLES.MEMBER,
    });

    const adminToken = await login('admin@example.com', adminPass);
    const memberToken = await login('member@example.com', memberPass);

    const created = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Alpha', description: 'Demo' });

    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe('Alpha');

    const blocked = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Nope' });

    expect(blocked.status).toBe(403);
  });

  it('shows members only projects they belong to', async () => {
    const { user: admin, password: adminPass } = await createUser({
      email: 'admin2@example.com',
      role: ROLES.ADMIN,
    });
    const { user: member, password: memberPass } = await createUser({
      email: 'member2@example.com',
      role: ROLES.MEMBER,
    });
    const { password: outsiderPass } = await createUser({
      email: 'outsider@example.com',
      role: ROLES.MEMBER,
    });

    const adminToken = await login('admin2@example.com', adminPass);
    const memberToken = await login('member2@example.com', memberPass);
    const outsiderToken = await login('outsider@example.com', outsiderPass);

    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Shared' });

    const projectId = projectRes.body.data.id as string;

    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: member.id });

    const memberList = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(memberList.status).toBe(200);
    expect(memberList.body.data.items).toHaveLength(1);

    const outsiderList = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(outsiderList.status).toBe(200);
    expect(outsiderList.body.data.items).toHaveLength(0);

    const forbidden = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(forbidden.status).toBe(403);

    // silence unused var lint
    expect(admin.email).toBeDefined();
  });

  it('creates tasks and filters by status', async () => {
    const { password: adminPass } = await createUser({
      email: 'admin3@example.com',
      role: ROLES.ADMIN,
    });
    const adminToken = await login('admin3@example.com', adminPass);

    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Task Project' });

    const projectId = projectRes.body.data.id as string;

    await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Todo item', status: 'TODO' });

    await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Done item', status: 'DONE' });

    const filtered = await request(app)
      .get(`/api/v1/projects/${projectId}/tasks`)
      .query({ status: 'DONE' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(filtered.status).toBe(200);
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0].title).toBe('Done item');
  });

  it('blocks unauthorized task access', async () => {
    const { password: adminPass } = await createUser({
      email: 'admin4@example.com',
      role: ROLES.ADMIN,
    });
    const { password: outsiderPass } = await createUser({
      email: 'outsider4@example.com',
      role: ROLES.MEMBER,
    });

    const adminToken = await login('admin4@example.com', adminPass);
    const outsiderToken = await login('outsider4@example.com', outsiderPass);

    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Private' });

    const projectId = projectRes.body.data.id as string;

    const taskRes = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Secret task' });

    const taskId = taskRes.body.data.id as string;

    const blocked = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(blocked.status).toBe(403);
  });
});
