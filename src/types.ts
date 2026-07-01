// Shared app types.

// A row in the `matches` table (a student's request for / match with a mentor).
// The four goal_* fields hold the pre-request goals questionnaire answers and
// are optional so requests created before this feature still type-check.
export interface Match {
  id: string;
  student_id: string;
  mentor_id: string;
  status: string;
  matched_at?: string | null;
  goal_field?: string | null;
  goal_help?: string | null;
  goal_type?: string | null;
  goal_stage?: string | null;
  // Joined relations and other columns are accessed loosely elsewhere.
  [key: string]: any;
}
