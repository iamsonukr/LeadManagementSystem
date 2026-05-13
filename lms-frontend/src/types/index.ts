export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'On Hold'
  | 'Duplicate'
  | 'Spam';

export type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Paid Ads' | 'Email Campaign' | 'Trade India' | 'WhatsApp' | 'Facebook' | 'LinkedIn' | 'Other';
export type LeadPriority = 'Low' | 'Medium' | 'High';
export type CallStatus = 'Connected' | 'Not Answered' | 'Busy' | 'Callback Scheduled' | 'Wrong Number' | 'Voicemail';
export type CallDirection = 'Outgoing' | 'Incoming';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  services: string[];
  source: LeadSource;
  priority: LeadPriority;
  assignedTo: string;
  department: string;
  leadValue: number;
  stageProbability: number;
  expectedCloseDate?: string;
  lastActivityAt?: string;
  lastContactedAt?: string;
  nextAction?: string;
  location?: string;
  industry: string;
  companySize: string;
  budget: number;
  currency: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  tags: string[];
  aiScore: number;
  callCount: number;
  lastCallDate?: string;
  nextFollowUp?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecord {
  id: string;
  leadId: string;
  name: string;
  client: string;
  services: string[];
  owner: string;
  status: 'Kickoff' | 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';
  priority: LeadPriority;
  budget: number;
  amountReceived: number;
  startDate: string;
  deliveryDate?: string;
  lastMilestone: string;
  paymentStatus: 'Advance Pending' | 'Partially Paid' | 'Paid' | 'Overdue';
  source: LeadSource;
}

export interface UserAssignments {
  leads: Lead[];
  projects: ProjectRecord[];
}

export interface FollowUpRecord {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  owner: string;
  type: 'Call' | 'Email' | 'WhatsApp' | 'Meeting' | 'Demo' | 'Proposal' | 'Other';
  status: 'Pending' | 'Completed' | 'Overdue' | 'Rescheduled';
  priority: LeadPriority;
  dueAt: string;
  completedAt?: string;
  notes: string;
  nextAction: string;
  createdAt: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  leadCompany?: string;
  status: CallStatus;
  direction: CallDirection;
  duration: number; // minutes
  notes: string;
  callDate?: string;
  discussionPoints: string;
  nextAction: string;
  followUpDate?: string;
  calledBy: string;
  callbackDate?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  leadId?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  address: string;
  totalLeads: number;
  revenue: number;
  createdAt: string;
}

export interface TeamMemberRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  employeeId: string;
  role: string;
  department: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  joiningDate: string;
  workLocation: string;
  reportingManager: string;
  skills: string[];
  currentProject: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Resigned';
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales Manager' | 'Sales Executive';
  department: string;
  phone: string;
  status: 'Active' | 'Inactive';
  leads: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  conversionRate: number;
  revenueGenerated: number;
  totalLeadsDelta: number;
  newLeadsDelta: number;
  convertedLeadsDelta: number;
  conversionRateDelta: number;
  revenueDelta: number;
}

export interface FollowUpOverview {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

export type NotificationType =
  | 'lead_assigned'
  | 'project_assigned'
  | 'upcoming_follow_up'
  | 'overdue_follow_up';

export interface NotificationRecord {
  id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}
