// lib/types.ts

export type UserRole = "job_seeker" | "recruiter" | "admin";

// Base User interface with all common fields from your Firebase data
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields that exist in your Firebase data
  phone?: string;
  profileComplete?: boolean;
  emailVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: Date;
}

export interface JobSeeker extends User {
  role: "job_seeker";
  skills: string[];
  experience: string; // Changed from number to string to match your data
  education: string;
  resume?: string;
  cgpa?: number;
  location?: string;
  title?: string; // Added this field from your data
  // Job seeker specific metrics
  applicationsSubmitted?: number;
  profileViews?: number;
}

export interface Recruiter extends User {
  role: "recruiter";
  company: string;
  position: string;
  // Recruiter specific metrics from your Firebase data
  jobsPosted?: number;
  applicationsReceived?: number;
  activeJobs?: number;
  hires?: number;
}

// Union type for all user types
export type AppUser = JobSeeker | Recruiter;

// Type guards
export function isJobSeeker(user: User): user is JobSeeker {
  return user.role === "job_seeker";
}

export function isRecruiter(user: User): user is Recruiter {
  return user.role === "recruiter";
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  numberOfOpenings: number;
  shortlistMultiplier: number;
  skills: string[];
  experience: {
    min: number;
    max: number;
  };
  postedBy: string;
  postedAt: Date;
  deadline: Date;
  status: "active" | "closed" | "draft";
  assessmentConfig?: {
    mcqCount: number;
    codingCount: number;
    sqlCount: number;
    timeLimit: number;
    topics: string[];
  };
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  cgpa: number;
  skills: string[];
  resume: string;
  coverLetter?: string;
  status: "applied" | "shortlisted" | "assessment_sent" | "assessment_completed" | "selected" | "rejected";
  appliedAt: Date;
  updatedAt: Date;
}

export interface Assessment {
  id: string;
  jobId: string;
  userId: string;
  applicationId: string;
  questions: {
    mcq: MCQQuestion[];
    coding: CodingQuestion[];
    sql: SQLQuestion[];
  };
  responses: {
    mcq: MCQResponse[];
    coding: CodingResponse[];
    sql: SQLResponse[];
  };
  score: {
    mcq: number;
    coding: number;
    sql: number;
    total: number;
  };
  timeSpent: number;
  cheatingEvents: CheatingEvent[];
  status: "pending" | "in_progress" | "completed" | "expired";
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }[];
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface SQLQuestion {
  id: string;
  question: string;
  schema: string;
  expectedOutput: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface MCQResponse {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

export interface CodingResponse {
  questionId: string;
  code: string;
  language: string;
  testResults: {
    passed: number;
    total: number;
    details: {
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
    }[];
  };
}

export interface SQLResponse {
  questionId: string;
  query: string;
  result: any[];
  isCorrect: boolean;
}

export interface CheatingEvent {
  type: "tab_switch" | "copy" | "paste" | "right_click" | "fullscreen_exit";
  timestamp: Date;
  details?: string;
}