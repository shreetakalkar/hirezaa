"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Search, Filter, Download, Eye, XCircle, Send, Users, Loader2,
  Star, Calendar, GraduationCap, Mail, Phone, MapPin, Award,
  TrendingUp, Clock, CheckCircle, AlertCircle, FileText,
  MoreHorizontal, RefreshCw, ArrowUpDown, ExternalLink,
  Trash2, CheckSquare, Square
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  role: "job_seeker" | "recruiter";
  createdAt: Date;
  updatedAt: Date;
  profilePicture?: string;
  phone?: string;
}

interface JobSeeker extends User {
  skills: string[];
  experience: number;
  education: string;
  location?: string;
  cgpa?: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  description: string;
  requirements: string[];
  skills: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  postedAt: Date;
  deadline?: Date;
  status: "active" | "closed" | "draft";
  recruiterId: string;
  numberOfOpenings: number;
  shortlistMultiplier?: number;
  assessmentConfig?: {
    mcqCount: number;
    codingCount: number;
    sqlCount: number;
    topics: string[];
    timeLimit: number;
  };
}

interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: "applied" | "shortlisted" | "assessment_sent" | "assessment_completed" | "selected" | "rejected";
  appliedAt: Date;
  updatedAt: Date;
  resume?: string;
  publicId?: string; // Added to store Cloudinary public_id
  coverLetter?: string;
  skills?: string[];
  cgpa?: number;
}

interface Assessment {
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
  cheatingEvents: any[];
  status: "pending" | "in_progress" | "completed" | "expired";
  expiresAt: Date;
}

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface SQLQuestion {
  id: string;
  question: string;
  schema: Array<{ table: string; columns: Array<{ name: string; type: string }> }>;
  expectedOutput: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface MCQResponse {
  questionId: string;
  selectedAnswer: number;
  timeSpent: number;
}

interface CodingResponse {
  questionId: string;
  code: string;
  language: string;
  timeSpent: number;
  testResults?: Array<{ passed: boolean; input: string; output: string; expected: string }>;
}

interface SQLResponse {
  questionId: string;
  query: string;
  timeSpent: number;
  result?: any[];
}

interface ApplicationWithUser extends Application {
  user: Partial<JobSeeker>;
}

interface SortConfig {
  key: keyof ApplicationWithUser | "user.name" | "cgpa" | "appliedAt";
  direction: "asc" | "desc";
}

// Mock functions for services that might not exist yet
const generateMCQQuestions = async (config: any) => {
  // Mock implementation
  return { questions: [] };
};

const generateCodingQuestions = async (config: any) => {
  // Mock implementation
  return { questions: [] };
};

const generateSQLQuestions = async (config: any) => {
  // Mock implementation
  return { questions: [] };
};

const sendAssessmentEmail = async (
  email: string,
  name: string,
  jobTitle: string,
  assessmentLink: string,
  expiresAt: Date
) => {
  // Mock implementation
  console.log("Sending assessment email to:", email);
  return Promise.resolve();
};

export default function JobApplicantsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const { toast } = useToast();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<ApplicationWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "appliedAt", direction: "desc" });
  const [isLoading, setIsLoading] = useState(true);
  const [shortlistingLoading, setShortlistingLoading] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && jobId) {
      fetchData();
    }
  }, [user, jobId]);

  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          (app.user?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (app.user?.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          app.skills?.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.key) {
        case "user.name":
          aValue = a.user?.name || "";
          bValue = b.user?.name || "";
          break;
        case "cgpa":
          aValue = a.cgpa || a.user?.cgpa || 0;
          bValue = b.cgpa || b.user?.cgpa || 0;
          break;
        case "appliedAt":
          aValue = a.appliedAt?.getTime() || 0;
          bValue = b.appliedAt?.getTime() || 0;
          break;
        default:
          aValue = a[sortConfig.key as keyof ApplicationWithUser] || "";
          bValue = b[sortConfig.key as keyof ApplicationWithUser] || "";
      }

      if (sortConfig.direction === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [applications, searchTerm, statusFilter, sortConfig]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      applied: applications.filter((app) => app.status === "applied").length,
      shortlisted: applications.filter((app) => app.status === "shortlisted").length,
      assessmentSent: applications.filter((app) => app.status === "assessment_sent").length,
      assessmentCompleted: applications.filter((app) => app.status === "assessment_completed").length,
      selected: applications.filter((app) => app.status === "selected").length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    }),
    [applications]
  );

  // CONDITIONAL LOGIC AND EARLY RETURNS AFTER ALL HOOKS
  if (!user || user.role !== "recruiter") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Access Denied</h3>
              <p className="text-gray-500">Only recruiters can view applicants.</p>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fetchData = async () => {
    try {
      setRefreshing(true);

      // Fetch job details
      const jobDoc = await getDoc(doc(db, "jobs", jobId));
      if (jobDoc.exists()) {
        const jobData = jobDoc.data();
        const job: Job = {
          id: jobDoc.id,
          title: jobData.title || "",
          company: jobData.company || "",
          location: jobData.location || "",
          type: jobData.type || "full-time",
          description: jobData.description || "",
          requirements: jobData.requirements || [],
          skills: jobData.skills || [],
          salary: jobData.salary,
          postedAt: jobData.postedAt?.toDate() || new Date(),
          deadline: jobData.deadline?.toDate(),
          status: jobData.status || "active",
          recruiterId: jobData.recruiterId || "",
          numberOfOpenings: jobData.numberOfOpenings || 1,
          shortlistMultiplier: jobData.shortlistMultiplier || 1.5,
          assessmentConfig: jobData.assessmentConfig,
        };
        setJob(job);
      }

      // Fetch applications with user data
      const applicationsQuery = query(
        collection(db, "applications"),
        where("jobId", "==", jobId),
        orderBy("appliedAt", "desc")
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);

      const applicationsWithUsers = await Promise.all(
        applicationsSnapshot.docs.map(async (appDoc) => {
          const appData = appDoc.data();
          const application: Application = {
            id: appDoc.id,
            jobId: appData.jobId || "",
            userId: appData.userId || "",
            status: appData.status || "applied",
            appliedAt: appData.appliedAt?.toDate() || new Date(),
            updatedAt: appData.updatedAt?.toDate() || new Date(),
            resume: appData.resume,
            publicId: appData.publicId, // Added publicId
            coverLetter: appData.coverLetter,
            skills: appData.skills || [],
            cgpa: appData.cgpa,
          };

          try {
            const userDoc = await getDoc(doc(db, "users", application.userId));
            const userData = userDoc.exists() ? userDoc.data() : null;

            const user: Partial<JobSeeker> = {
              id: application.userId,
              name: userData?.name || "Unknown User",
              email: userData?.email || "No email provided",
              role: userData?.role || "job_seeker",
              createdAt: userData?.createdAt?.toDate() || new Date(),
              updatedAt: userData?.updatedAt?.toDate() || new Date(),
              profilePicture: userData?.profilePicture || "",
              phone: userData?.phone,
              skills: userData?.skills || [],
              experience: userData?.experience || 0,
              education: userData?.education || "Unknown",
              location: userData?.location,
              cgpa: userData?.cgpa || application.cgpa,
            };

            return {
              ...application,
              user,
            } as ApplicationWithUser;
          } catch (userError) {
            console.error(`Error fetching user ${application.userId}:`, userError);
            return {
              ...application,
              user: {
                id: application.userId,
                name: "Unknown User",
                email: "No email provided",
                role: "job_seeker" as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                profilePicture: "",
                skills: [],
                experience: 0,
                education: "Unknown",
              },
            } as ApplicationWithUser;
          }
        })
      );

      setApplications(applicationsWithUsers);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch applicants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleResumeClick = async (resumeUrl: string, publicId: string | undefined, candidateName: string) => {
    if (!resumeUrl) {
      toast({
        title: "No Resume Available",
        description: "This candidate hasn't uploaded a resume yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use stored publicId if available, otherwise extract from resumeUrl
      let public_id = publicId;
      if (!public_id) {
        const publicIdMatch = resumeUrl.match(/resumes\/(.+?)(?=\.\w+$|$)/);
        if (!publicIdMatch) {
          throw new Error("Invalid Cloudinary URL format");
        }
        public_id = `resumes/${publicIdMatch[1]}`;
      }

      // Fetch signed URL
      const signResponse = await fetch("/api/cloudinary/sign-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id }),
      });

      if (!signResponse.ok) {
        const errorData = await signResponse.json();
        throw new Error(`Failed to generate signed URL: ${errorData.error} - ${errorData.details}`);
      }

      const { signedUrl } = await signResponse.json();

      // Open in new tab
      const newWindow = window.open(signedUrl, "_blank", "noopener,noreferrer");
      if (!newWindow) {
        // Fallback to download if new tab is blocked
        const link = document.createElement("a");
        link.href = signedUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = `${candidateName.replace(/\s+/g, "_")}_Resume.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Opening Resume",
        description: "The resume is being opened in a new tab.",
      });
    } catch (error: any) {
      console.error("Error opening resume:", error);
      toast({
        title: "Error Opening Resume",
        description: `Failed to open resume: ${error.message}. Try downloading instead or contact support.`,
        variant: "destructive",
      });
    }
  };

  const handleResumeDownload = async (resumeUrl: string, publicId: string | undefined, candidateName: string) => {
    if (!resumeUrl) {
      toast({
        title: "No Resume Available",
        description: "This candidate hasn't uploaded a resume yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use stored publicId if available, otherwise extract from resumeUrl
      let public_id = publicId;
      if (!public_id) {
        const publicIdMatch = resumeUrl.match(/resumes\/(.+?)(?=\.\w+$|$)/);
        if (!publicIdMatch) {
          throw new Error("Invalid Cloudinary URL format");
        }
        public_id = `resumes/${publicIdMatch[1]}`;
      }

      // Fetch signed URL
      const signResponse = await fetch("/api/cloudinary/sign-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id }),
      });

      if (!signResponse.ok) {
        const errorData = await signResponse.json();
        throw new Error(`Failed to generate signed URL: ${errorData.error} - ${errorData.details}`);
      }

      const { signedUrl } = await signResponse.json();

      // Download the file
      const response = await fetch(signedUrl);
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Failed to fetch resume: ${response.statusText}. ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${candidateName.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Resume Downloaded",
        description: `${candidateName}'s resume has been downloaded successfully.`,
      });
    } catch (error: any) {
      console.error("Error downloading resume:", error);
      toast({
        title: "Error Downloading Resume",
        description: `Failed to download resume: ${error.message}. Try in incognito mode or contact support.`,
        variant: "destructive",
      });
    }
  };

  const handleManualShortlist = async (applicationId: string, showToast = true) => {
    if (!job?.assessmentConfig) {
      if (showToast) {
        toast({
          title: "No Assessment Configured",
          description: "This job doesn't have an assessment configured.",
          variant: "destructive",
        });
      }
      return false;
    }

    try {
      const application = applications.find((app) => app.id === applicationId);
      if (!application) return false;

      const [mcqQuestions, codingQuestions, sqlQuestions] = await Promise.all([
        job.assessmentConfig.mcqCount > 0
          ? generateMCQQuestions({
              topics: job.assessmentConfig.topics,
              difficulty: "medium",
              count: job.assessmentConfig.mcqCount,
              type: "mcq",
            })
          : Promise.resolve({ questions: [] }),
        job.assessmentConfig.codingCount > 0
          ? generateCodingQuestions({
              topics: job.assessmentConfig.topics,
              difficulty: "medium",
              count: job.assessmentConfig.codingCount,
              type: "coding",
            })
          : Promise.resolve({ questions: [] }),
        job.assessmentConfig.sqlCount > 0
          ? generateSQLQuestions({
              topics: job.assessmentConfig.topics,
              difficulty: "medium",
              count: job.assessmentConfig.sqlCount,
              type: "sql",
            })
          : Promise.resolve({ questions: [] }),
      ]);

      const assessmentData: Omit<Assessment, "id"> = {
        jobId: job.id,
        userId: application.userId,
        applicationId: application.id,
        questions: {
          mcq: mcqQuestions.questions.map((q: any, index: number) => ({
            id: `mcq_${index}`,
            question: q.question || "",
            options: q.options || [],
            correctAnswer: q.correctAnswer || 0,
            topic: q.topic || "",
            difficulty: (q.difficulty as "easy" | "medium" | "hard") || "medium",
          })),
          coding: codingQuestions.questions.map((q: any, index: number) => ({
            id: `coding_${index}`,
            title: q.title || "",
            description: q.description || "",
            examples: q.examples || [],
            constraints: q.constraints || [],
            testCases: q.testCases || [],
            topic: q.topic || "",
            difficulty: (q.difficulty as "easy" | "medium" | "hard") || "medium",
          })),
          sql: sqlQuestions.questions.map((q: any, index: number) => ({
            id: `sql_${index}`,
            question: q.question || "",
            schema: q.schema || [],
            expectedOutput: q.expectedOutput || "",
            topic: q.topic || "",
            difficulty: (q.difficulty as "easy" | "medium" | "hard") || "medium",
          })),
        },
        responses: {
          mcq: [],
          coding: [],
          sql: [],
        },
        score: {
          mcq: 0,
          coding: 0,
          sql: 0,
          total: 0,
        },
        timeSpent: 0,
        cheatingEvents: [],
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const assessmentRef = await addDoc(collection(db, "assessments"), {
        ...assessmentData,
        expiresAt: Timestamp.fromDate(assessmentData.expiresAt),
      });

      await updateDoc(doc(db, "applications", applicationId), {
        status: "assessment_sent",
        updatedAt: Timestamp.fromDate(new Date()),
      });

      const assessmentLink = `${window.location.origin}/assessment/${assessmentRef.id}`;
      await sendAssessmentEmail(
        application.user.email || "No email provided",
        application.user.name || "Candidate",
        job.title,
        assessmentLink,
        assessmentData.expiresAt
      );

      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, status: "assessment_sent", updatedAt: new Date() } : app
        )
      );

      if (showToast) {
        toast({
          title: "Assessment Sent",
          description: `Assessment link has been sent to ${application.user.name || "the candidate"}`,
        });
      }
      return true;
    } catch (error) {
      console.error("Error sending assessment:", error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to send assessment. Please try again.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleBulkShortlist = async () => {
    if (!job) return;

    setShortlistingLoading(true);
    try {
      const appliedCandidates = applications.filter((app) => app.status === "applied");
      const shortlistCount = Math.ceil((job.numberOfOpenings || 1) * (job.shortlistMultiplier || 1.5));

      const topCandidates = appliedCandidates
        .sort((a, b) => (b.cgpa || b.user?.cgpa || 0) - (a.cgpa || a.user?.cgpa || 0))
        .slice(0, shortlistCount);

      let successCount = 0;
      for (const candidate of topCandidates) {
        const success = await handleManualShortlist(candidate.id, false);
        if (success) successCount++;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast({
        title: "Bulk Shortlisting Complete",
        description: `${successCount} out of ${topCandidates.length} candidates have been shortlisted and sent assessments.`,
      });
    } catch (error) {
      console.error("Error in bulk shortlisting:", error);
      toast({
        title: "Error",
        description: "Failed to complete bulk shortlisting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShortlistingLoading(false);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      await updateDoc(doc(db, "applications", applicationId), {
        status: "rejected",
        updatedAt: Timestamp.fromDate(new Date()),
      });

      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, status: "rejected", updatedAt: new Date() } : app
        )
      );

      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      });
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shortlisted":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assessment_sent":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "assessment_completed":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "selected":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied":
        return <Clock className="h-3 w-3" />;
      case "shortlisted":
        return <Star className="h-3 w-3" />;
      case "assessment_sent":
        return <Send className="h-3 w-3" />;
      case "assessment_completed":
        return <CheckCircle className="h-3 w-3" />;
      case "selected":
        return <Award className="h-3 w-3" />;
      case "rejected":
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Loading applicants...</h3>
              <p className="text-gray-500">Please wait while we fetch the application data.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Job not found</h3>
              <p className="text-gray-500">The job you're looking for doesn't exist or has been removed.</p>
              <Button variant="outline" asChild>
                <Link href="/recruiter/jobs">Back to Jobs</Link>
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const progressPercentage = stats.total > 0 ? (stats.selected / (job.numberOfOpenings || 1)) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <Badge variant="outline" className="text-xs bg-white">
                  {job.type}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{stats.total} applications</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Posted {job.postedAt?.toLocaleDateString()}</span>
                </span>
                {job.deadline && (
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Deadline {job.deadline.toLocaleDateString()}</span>
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Hiring Progress</span>
                  <span className="font-semibold text-blue-700">
                    {stats.selected} / {job.numberOfOpenings || 1} positions filled
                  </span>
                </div>
                <Progress value={Math.min(progressPercentage, 100)} className="h-3 bg-gray-200" />
                <div className="text-xs text-gray-500">{progressPercentage.toFixed(1)}% complete</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button variant="outline" onClick={fetchData} disabled={refreshing} className="border-gray-300">
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>

              {stats.applied > 0 && job.assessmentConfig && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={shortlistingLoading} className="bg-blue-600 hover:bg-blue-700">
                      {shortlistingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Users className="mr-2 h-4 w-4" />
                      Bulk Shortlist ({Math.ceil((job.numberOfOpenings || 1) * (job.shortlistMultiplier || 1.5))})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bulk Shortlist Candidates</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will automatically shortlist the top{" "}
                        {Math.ceil((job.numberOfOpenings || 1) * (job.shortlistMultiplier || 1.5))} candidates based on
                        their CGPA and send them assessment links. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <DialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkShortlist} disabled={shortlistingLoading}>
                        {shortlistingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Proceed with Shortlisting
                      </AlertDialogAction>
                    </DialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button variant="outline" className="border-gray-300">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900", bgColor: "bg-gray-50", icon: Users },
            { label: "Applied", value: stats.applied, color: "text-blue-600", bgColor: "bg-blue-50", icon: Clock },
            { label: "Shortlisted", value: stats.shortlisted, color: "text-yellow-600", bgColor: "bg-yellow-50", icon: Star },
            { label: "Assessment Sent", value: stats.assessmentSent, color: "text-purple-600", bgColor: "bg-purple-50", icon: Send },
            { label: "Completed", value: stats.assessmentCompleted, color: "text-indigo-600", bgColor: "bg-indigo-50", icon: CheckCircle },
            { label: "Selected", value: stats.selected, color: "text-green-600", bgColor: "bg-green-50", icon: Award },
            { label: "Rejected", value: stats.rejected, color: "text-red-600", bgColor: "bg-red-50", icon: XCircle },
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card
                key={index}
                className={`${stat.bgColor} border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                    </div>
                    <IconComponent className={`h-5 w-5 ${stat.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 border-gray-300">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="assessment_sent">Assessment Sent</SelectItem>
                    <SelectItem value="assessment_completed">Assessment Completed</SelectItem>
                    <SelectItem value="selected">Selected</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => handleSort("user.name")}
                  className="flex items-center space-x-1 border-gray-300"
                  size="default"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span>Name</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSort("cgpa")}
                  className="flex items-center space-x-1 border-gray-300"
                  size="default"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span>CGPA</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredAndSortedApplications.length === 0 ? (
          <Card className="shadow-sm border-gray-200">
            <CardContent className="text-center py-16">
              <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {applications.length === 0 ? "No applications yet" : "No applicants match your filters"}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {applications.length === 0
                  ? "Applications will appear here once candidates start applying to this position."
                  : "Try adjusting your search criteria or filters to find the applicants you're looking for."}
              </p>
              {applications.length === 0 && (
                <Button variant="outline" asChild className="border-gray-300">
                  <Link href={`/recruiter/jobs/${jobId}/edit`}>Edit Job Posting</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedApplications.map((application) => (
              <Card
                key={application.id}
                className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500 border-gray-200"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-14 w-14 ring-2 ring-gray-100 shadow-sm">
                        <AvatarImage src={application.user?.profilePicture || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold text-lg">
                          {application.user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <h3 className="text-xl font-semibold text-gray-900">{application.user?.name || "Unknown User"}</h3>
                          <Badge className={`${getStatusColor(application.status)} flex items-center space-x-1 px-3 py-1 w-fit`}>
                            {getStatusIcon(application.status)}
                            <span className="text-xs font-medium">{application.status.replace("_", " ").toUpperCase()}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{application.user?.email || "No email"}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <GraduationCap className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>
                              CGPA: <span className="font-semibold">{(application.cgpa || application.user?.cgpa)?.toFixed(2) || "N/A"}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>Applied {application.appliedAt?.toLocaleDateString() || "Unknown"}</span>
                          </div>
                          {application.user?.phone && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span>{application.user.phone}</span>
                            </div>
                          )}
                        </div>

                        {application.coverLetter && application.coverLetter !== "ntg" && application.coverLetter.trim() !== "" && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-700 italic leading-relaxed">"{application.coverLetter}"</p>
                          </div>
                        )}

                        {application.skills && application.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {application.skills.slice(0, 8).map((skill) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {application.skills.length > 8 && (
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-300">
                                +{application.skills.length - 8} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <Button variant="outline" size="sm" asChild className="border-gray-300 hover:bg-gray-50">
                        <Link href={`/recruiter/applicants/${application.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </Button>

                      {application.resume && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResumeClick(application.resume!, application.publicId, application.user?.name || "Unknown")}
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Resume
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResumeDownload(application.resume!, application.publicId, application.user?.name || "Unknown")}
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {application.status === "applied" && job.assessmentConfig && (
                        <Button
                          size="sm"
                          onClick={() => handleManualShortlist(application.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Assessment
                        </Button>
                      )}

                      {application.status === "assessment_completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-green-300 hover:bg-green-50 text-green-700"
                        >
                          <Link href={`/recruiter/assessments/${application.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Results
                          </Link>
                        </Button>
                      )}

                      {(application.status === "applied" || application.status === "shortlisted") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Application</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reject {application.user?.name || "this candidate"}'s application? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <DialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRejectApplication(application.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Reject Application
                              </AlertDialogAction>
                            </DialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredAndSortedApplications.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">
              Showing {filteredAndSortedApplications.length} of {applications.length} applicants
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}