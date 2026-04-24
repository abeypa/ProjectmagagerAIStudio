/**
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';
export type StageType = '3d_design' | 'electrical_design' | 'software' | 'purchase' | 'manufacturing';
export type TopicStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';
export type IssueStatus = 'open' | 'in_progress' | 'resolved';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'revision_required';
export type MemberRole = 'owner' | 'stage_lead' | 'contributor' | 'viewer';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  customer: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  owner?: Profile;
  members_count?: number;
  stages?: Stage[];
  open_issues_count?: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: MemberRole;
  stage_assignment: StageType | null;
  joined_at: string;
  
  // Joined fields
  profile?: Profile;
}

export interface Stage {
  id: string;
  project_id: string;
  stage_type: StageType;
  order_index: number;
  created_at: string;
  
  // Calculated fields
  progress_pct?: number;
  open_issue_count?: number;
  pending_approvals_count?: number;
  finalized_idea_count?: number;
  file_count?: number;
}

export interface Topic {
  id: string;
  stage_id: string;
  title: string;
  description: string | null;
  status: TopicStatus;
  progress_pct: number;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  assignees?: Profile[];
  issues_count?: number;
  approval_status?: ApprovalStatus;
}

export interface Idea {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  submitted_by: string | null;
  is_finalized: boolean;
  finalized_at: string | null;
  created_at: string;
  
  // Joined fields
  author?: Profile;
}

export interface Approval {
  id: string;
  topic_id: string;
  requested_by: string | null;
  reviewed_by: string | null;
  status: ApprovalStatus;
  comment: string | null;
  deliverable_label: string | null;
  requested_at: string;
  reviewed_at: string | null;
  
  // Joined fields
  requester?: Profile;
  reviewer?: Profile;
}

export interface Issue {
  id: string;
  topic_id: string | null;
  stage_id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  severity: IssueSeverity;
  reported_by: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  reporter?: Profile;
  assignee?: Profile;
}

export interface StageFile {
  id: string;
  stage_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  
  // Joined fields
  uploader?: Profile;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
  
  // Joined fields
  actor?: Profile;
}
