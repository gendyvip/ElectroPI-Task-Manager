/* eslint-disable no-console */
import { connectDatabase, disconnectDatabase } from '../config/database';
import { env } from '../config/env';
import { TASK_PRIORITIES } from '../constants';
import { ROLES } from '../constants';
import { TASK_STATUSES } from '../constants';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/password';

async function seed(): Promise<void> {
  await connectDatabase();

  let admin = await User.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      password: await hashPassword(env.SEED_ADMIN_PASSWORD),
      role: ROLES.ADMIN,
    });
    console.log(`Seeded ADMIN: ${env.SEED_ADMIN_EMAIL}`);
  }

  const demoMembers = [
    { name: 'Alice Member', email: 'alice@taskmanager.local', password: 'Member@12345' },
    { name: 'Bob Member', email: 'bob@taskmanager.local', password: 'Member@12345' },
  ];

  const members = [];
  for (const member of demoMembers) {
    let existing = await User.findOne({ email: member.email });
    if (!existing) {
      existing = await User.create({
        name: member.name,
        email: member.email,
        password: await hashPassword(member.password),
        role: ROLES.MEMBER,
      });
      console.log(`Seeded MEMBER: ${member.email}`);
    }
    members.push(existing);
  }

  let project = await Project.findOne({ owner: admin!._id });
  if (!project) {
    project = await Project.create({
      name: 'Demo Project',
      description: 'Seeded project for local development',
      owner: admin!._id,
      members: [admin!._id, members[0]._id, members[1]._id],
    });
    console.log(`Seeded project: ${project.name}`);
  }

  const existingTasks = await Task.countDocuments({ project: project._id });
  if (existingTasks === 0) {
    await Task.create([
      {
        title: 'Kickoff planning',
        description: 'Define milestones and owners',
        status: TASK_STATUSES.DONE,
        priority: TASK_PRIORITIES.HIGH,
        creator: admin!._id,
        assignee: admin!._id,
        project: project._id,
      },
      {
        title: 'Build task table',
        description: 'Simple table for project tasks',
        status: TASK_STATUSES.IN_PROGRESS,
        priority: TASK_PRIORITIES.MEDIUM,
        creator: admin!._id,
        assignee: members[0]._id,
        project: project._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Write README',
        description: 'Document setup and usage',
        status: TASK_STATUSES.TODO,
        priority: TASK_PRIORITIES.LOW,
        creator: members[0]._id,
        assignee: members[1]._id,
        project: project._id,
      },
    ]);
    console.log('Seeded demo tasks');
  }

  console.log('Seed complete.');
}

seed()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
