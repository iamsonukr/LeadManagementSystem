import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { CallLogSchema } from './calls/calls.entity';
import { FollowUpSchema } from './followups/followups.entity';
import { LeadSchema } from './leads/leads.entity';
import { ProjectSchema } from './projects/projects.entity';
import { TeamMemberSchema } from './team/teamMember.entity';
import { UserSchema } from './users/user.entity';

const UserModel = mongoose.model('User', UserSchema);
const LeadModel = mongoose.model('Lead', LeadSchema);
const CallLogModel = mongoose.model('CallLog', CallLogSchema);
const FollowUpModel = mongoose.model('FollowUp', FollowUpSchema);
const ProjectModel = mongoose.model('Project', ProjectSchema);
const TeamMemberModel = mongoose.model('TeamMember', TeamMemberSchema);

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@lms.local';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

interface SeededLead {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  company?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  leadValue?: number;
  source?: string;
  nextAction?: string;
  nextFollowUp?: Date;
  notes?: string;
}

async function upsertAdmin() {
  const password = await bcrypt.hash(adminPassword, 10);

  const admin = await UserModel.findOneAndUpdate(
    { email: adminEmail },
    {
      $setOnInsert: {
        name: 'System Admin',
        email: adminEmail,
        password,
        role: 'Admin',
        department: 'Management',
        phone: '9999999999',
        status: 'Active',
        leads: 0,
      },
    },
    { new: true, upsert: true },
  );

  return admin;
}

async function seedTeam() {
  const members = [
    {
      fullName: 'Manish Sharma',
      email: 'manish.sales@lms.local',
      role: 'Sales Manager',
      department: 'Sales',
      joiningDate: '2025-04-01',
      currentProject: 'Enterprise CRM Rollout',
      status: 'Active',
    },
    {
      fullName: 'Aman Verma',
      email: 'aman.exec@lms.local',
      role: 'Sales Executive',
      department: 'Sales',
      joiningDate: '2025-07-15',
      currentProject: 'Website Leads',
      status: 'Active',
    },
  ];

  await Promise.all(
    members.map((member) =>
      TeamMemberModel.updateOne(
        { email: member.email },
        { $setOnInsert: member },
        { upsert: true },
      ),
    ),
  );
}

async function seedLeads() {
  const leads = [
    {
      name: 'Neha Kapoor',
      email: 'neha.kapoor@example.com',
      phone: '+91 98765 43210',
      company: 'Kapoor Textiles',
      status: 'New',
      source: 'Website',
      services: ['CRM Setup', 'Automation'],
      priority: 'High',
      assignedTo: 'Aman Verma',
      department: 'Sales',
      leadValue: 250000,
      stageProbability: 35,
      expectedCloseDate: new Date('2026-05-20'),
      nextAction: 'Schedule discovery call',
      location: 'Mumbai',
      industry: 'Manufacturing',
      companySize: '51-200',
      budget: 300000,
      currency: 'INR',
      tags: ['hot-lead', 'website'],
      aiScore: 82,
      nextFollowUp: new Date('2026-05-03T10:30:00.000Z'),
      notes: 'Interested in automating lead assignment and followups.',
    },
    {
      name: 'Arjun Mehta',
      email: 'arjun.mehta@example.com',
      phone: '+91 99887 77665',
      company: 'Mehta Consulting',
      status: 'Contacted',
      source: 'LinkedIn',
      services: ['Lead Management', 'Dashboard'],
      priority: 'Medium',
      assignedTo: 'Manish Sharma',
      department: 'Sales',
      leadValue: 180000,
      stageProbability: 55,
      expectedCloseDate: new Date('2026-05-28'),
      lastContactedAt: new Date('2026-04-29T12:00:00.000Z'),
      nextAction: 'Send proposal',
      location: 'Delhi',
      industry: 'Consulting',
      companySize: '11-50',
      budget: 200000,
      currency: 'INR',
      tags: ['linkedin', 'proposal'],
      aiScore: 74,
      nextFollowUp: new Date('2026-05-04T09:00:00.000Z'),
      notes: 'Asked for dashboard examples and pricing options.',
    },
    {
      name: 'Sara Dsouza',
      email: 'sara.dsouza@example.com',
      phone: '+91 91234 56780',
      company: 'BlueWave Digital',
      status: 'Won',
      source: 'Referral',
      services: ['CRM Setup'],
      priority: 'High',
      assignedTo: 'Manish Sharma',
      department: 'Sales',
      leadValue: 320000,
      stageProbability: 100,
      expectedCloseDate: new Date('2026-04-25'),
      lastActivityAt: new Date('2026-04-25T11:00:00.000Z'),
      lastContactedAt: new Date('2026-04-25T11:00:00.000Z'),
      nextAction: 'Start onboarding',
      location: 'Bengaluru',
      industry: 'Marketing',
      companySize: '51-200',
      budget: 350000,
      currency: 'INR',
      tags: ['won', 'referral'],
      aiScore: 91,
      notes: 'Converted after referral call.',
    },
  ];

  const seededLeads: SeededLead[] = [];
  for (const lead of leads) {
    const savedLead = await LeadModel.findOneAndUpdate(
      { email: lead.email },
      { $setOnInsert: lead },
      { new: true, upsert: true },
    );
    seededLeads.push(savedLead.toObject());
  }

  return seededLeads;
}

async function seedActivity(leads: SeededLead[]) {
  for (const lead of leads) {
    const leadId = lead._id;

    await CallLogModel.updateOne(
      { lead: leadId, callDate: new Date('2026-04-29T10:00:00.000Z') },
      {
        $setOnInsert: {
          lead: leadId,
          status: lead.status === 'New' ? 'Not Answered' : 'Connected',
          direction: 'Outgoing',
          duration: lead.status === 'New' ? 0 : 18,
          notes: `Initial call for ${lead.name}`,
          discussionPoints: 'Requirement, budget, timeline',
          nextAction: lead.nextAction,
          callDate: new Date('2026-04-29T10:00:00.000Z'),
          followUpDate: new Date('2026-05-03T10:30:00.000Z'),
          calledBy: lead.assignedTo,
        },
      },
      { upsert: true },
    );

    await FollowUpModel.updateOne(
      {
        lead: leadId,
        source: 'lead-next-followup',
      },
      {
        $set: {
          lead: leadId,
          owner: lead.assignedTo,
          type: lead.status === 'Won' ? 'Meeting' : 'Call',
          status: lead.status === 'Won' ? 'Completed' : 'Pending',
          priority: lead.priority,
          dueAt: lead.nextFollowUp ?? new Date('2026-05-03T10:30:00.000Z'),
          completedAt:
            lead.status === 'Won'
              ? new Date('2026-04-25T12:00:00.000Z')
              : undefined,
          source: 'lead-next-followup',
          notes: lead.notes ?? `Follow up with ${lead.company || lead.name}`,
          nextAction: lead.nextAction,
        },
      },
      { upsert: true },
    );
  }

  const wonLead = leads.find((lead) => lead.status === 'Won');
  if (wonLead) {
    await ProjectModel.updateOne(
      { lead: wonLead._id, name: 'CRM Implementation' },
      {
        $setOnInsert: {
          lead: wonLead._id,
          name: 'CRM Implementation',
          service: 'CRM Setup',
          owner: wonLead.assignedTo,
          status: 'Kickoff',
          priority: 'High',
          budget: wonLead.leadValue,
          amountReceived: 100000,
          paymentStatus: 'Advance Received',
          startDate: new Date('2026-04-26'),
          deliveryDate: new Date('2026-06-10'),
          lastMilestone: 'Contract signed',
          source: wonLead.source,
        },
      },
      { upsert: true },
    );
  }
}

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(mongoUri);

  const admin = await upsertAdmin();
  await seedTeam();
  const leads = await seedLeads();
  await seedActivity(leads);

  console.log('Seed completed');
  console.log(`Admin email: ${admin.email}`);
  console.log(`Admin password: ${adminPassword}`);
  console.log(`Leads available: ${leads.length}`);

  await mongoose.disconnect();
}

seed().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
