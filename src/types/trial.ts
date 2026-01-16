/**
 * Trial Types
 * 
 * Type definitions for the 7-day Pro trial system
 */

export type TrialStatus = 'active' | 'expired' | 'converted' | null;

export interface TrialInfo {
  isActive: boolean;
  daysLeft: number;
  hoursLeft: number;
  endDate: Date;
  startDate: Date;
  status: TrialStatus;
}

export interface TrialProfile {
  trial_status: TrialStatus;
  trial_start_date: string | null;
  trial_end_date: string | null;
  trial_notification_sent: boolean;
}
