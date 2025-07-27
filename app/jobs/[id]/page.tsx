
"use client";

import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Building,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  Share2,
  Bookmark,
  BookmarkCheck,
  Star,
  Award,
  TrendingUp,
  Globe,
  Mail,
  Phone,
  Heart,
  ChevronLeft,
  ExternalLink,
  Timer,
  Target,
  Code,
  Database,
  BookOpen,
  Zap,
  Shield,
  RefreshCw,
  Copy,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, Application } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { motion, Variants, Transition } from "framer-motion";

interface SimilarJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  postedAt: Date;
}

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    } as Transition,
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    } as Transition,
  },
};

const cardHover: Variants = {
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    } as Transition,
  },
};

export default function JobDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarJobsLoading, setSimilarJobsLoading] = useState(true);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      if (user) {
        checkBookmarkStatus();
      }
    }
  }, [jobId, user]);

  useEffect(() => {
    if (job) {
      fetchSimilarJobs();
    }
  }, [job]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const jobDoc = await getDoc(doc(db, "jobs", jobId));
      if (jobDoc.exists()) {
        const jobData = {
          id: jobDoc.id,
          ...jobDoc.data(),
          postedAt: jobDoc.data().postedAt?.toDate() || new Date(),
          deadline: jobDoc.data().deadline?.toDate() || new Date(),
          requirements: jobDoc.data().requirements || [],
          skills: jobDoc.data().skills || [],
        } as Job;
        setJob(jobData);

        if (user) {
          const applicationQuery = query(
            collection(db, "applications"),
            where("jobId", "==", jobId),
            where("userId", "==", user.id)
          );
          const applicationSnapshot = await getDocs(applicationQuery);
          if (!applicationSnapshot.empty) {
            const appData = applicationSnapshot.docs[0].data() as Application;
            setExistingApplication({
              ...appData,
              id: applicationSnapshot.docs[0].id,
              appliedAt: appData.appliedAt instanceof Timestamp ? appData.appliedAt.toDate() : new Date(),
              updatedAt: appData.updatedAt instanceof Timestamp ? appData.updatedAt.toDate() : new Date(),
            });
          }
        }
      } else {
        setJob(null);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast({
        title: "Error",
        description: "Failed to load job details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarJobs = async () => {
    if (!job) return;
    try {
      setSimilarJobsLoading(true);
      const similarJobsQuery = query(
        collection(db, "jobs"),
        where("type", "==", job.type),
        where("status", "==", "active"),
        orderBy("postedAt", "desc"),
        limit(5)
      );
      const similarJobsSnapshot = await getDocs(similarJobsQuery);
      const jobs: SimilarJob[] = [];
      similarJobsSnapshot.docs.forEach((doc) => {
        if (doc.id !== jobId) {
          const data = doc.data();
          jobs.push({
            id: doc.id,
            title: data.title,
            company: data.company,
            location: data.location,
            type: data.type,
            postedAt: data.postedAt?.toDate() || new Date(),
          });
        }
      });
      setSimilarJobs(jobs.slice(0, 3));
    } catch (error) {
      console.error("Error fetching similar jobs:", error);
    } finally {
      setSimilarJobsLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!user || !jobId) return;
    try {
      const bookmarksQuery = query(
        collection(db, "bookmarks"),
        where("userId", "==", user.id),
        where("jobId", "==", jobId)
      );
      const bookmarksSnapshot = await getDocs(bookmarksQuery);
      setIsBookmarked(!bookmarksSnapshot.empty);
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to bookmark jobs.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBookmarkLoading(true);
      if (isBookmarked) {
        const bookmarksQuery = query(
          collection(db, "bookmarks"),
          where("userId", "==", user.id),
          where("jobId", "==", jobId)
        );
        const bookmarksSnapshot = await getDocs(bookmarksQuery);
        for (const bookmarkDoc of bookmarksSnapshot.docs) {
          await deleteDoc(doc(db, "bookmarks", bookmarkDoc.id));
        }
        setIsBookmarked(false);
        toast({
          title: "Bookmark Removed",
          description: "Job removed from your bookmarks.",
        });
      } else {
        await addDoc(collection(db, "bookmarks"), {
          userId: user.id,
          jobId: jobId,
          createdAt: new Date(),
        });
        setIsBookmarked(true);
        toast({
          title: "Job Bookmarked",
          description: "Job added to your bookmarks.",
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookmarkLoading(false);
    }
  };

  const shareJob = async () => {
    if (!job) return;
    const shareData = {
      title: `${job.title} at ${job.company}`,
      text: `Check out this job opportunity: ${job.title} at ${job.company}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Shared Successfully",
          description: "Job details shared successfully.",
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Job link copied to clipboard.",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Job link copied to clipboard.",
        });
      } catch (clipboardError) {
        toast({
          title: "Share Failed",
          description: "Unable to share job. Please copy the URL manually.",
          variant: "destructive",
        });
      }
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchJobDetails();
    if (job) {
      await fetchSimilarJobs();
    }
    if (user) {
      await checkBookmarkStatus();
    }
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Job details have been updated.",
    });
  };

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const diffInDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffInDays);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMs < 60000) return "Just now";
    if (diffInMs < 3600000) return `${Math.floor(diffInMs / 60000)}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  const isDeadlinePassed = (deadline: Date) => {
    return new Date() > deadline;
  };

  const getApplicationStatus = (status: string) => {
    const statusConfig = {
      applied: { color: "bg-blue-500", text: "Applied", icon: Clock },
      shortlisted: { color: "bg-yellow-500", text: "Shortlisted", icon: Star },
      assessment_sent: { color: "bg-purple-500", text: "Assessment Sent", icon: FileText },
      assessment_completed: { color: "bg-orange-500", text: "Assessment Done", icon: CheckCircle },
      selected: { color: "bg-green-500", text: "Selected", icon: Award },
      rejected: { color: "bg-red-500", text: "Rejected", icon: AlertCircle },
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.applied;
  };

  const getUrgencyLevel = (daysLeft: number) => {
    if (daysLeft <= 1) return { level: "critical", color: "text-red-600", bg: "bg-red-50" };
    if (daysLeft <= 3) return { level: "high", color: "text-orange-600", bg: "bg-orange-50" };
    if (daysLeft <= 7) return { level: "medium", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { level: "low", color: "text-green-600", bg: "bg-green-50" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-64 bg-white rounded-xl shadow-sm"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-40 bg-white rounded-xl"></div>
                  <div className="h-40 bg-white rounded-xl"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-32 bg-white rounded-xl"></div>
                  <div className="h-32 bg-white rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Job not found</h3>
                  <p className="text-gray-600 mb-8">
                    The job you're looking for doesn't exist or has been removed.
                  </p>
                  <Button asChild className="w-full max-w-xs">
                    <Link href="/jobs">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Browse Other Jobs
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(job.deadline);
  const daysLeft = getDaysUntilDeadline(job.deadline);
  const urgency = getUrgencyLevel(daysLeft);
  const applicationStatus = existingApplication ? getApplicationStatus(existingApplication.status) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button & Refresh */}
          <motion.div
            className="mb-6 flex items-center justify-between"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={refreshing}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </motion.div>

          {/* Hero Section */}
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-blue-50 mb-8">
              <CardContent className="pt-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-6">
                      <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                        <AvatarImage
                          src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/\s+/g, "")}.com`}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                          {job.company.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                            {job.title}
                          </h1>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleBookmark}
                              disabled={bookmarkLoading}
                              className="text-gray-500 hover:text-red-500 transition-colors"
                            >
                              {bookmarkLoading ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                              ) : isBookmarked ? (
                                <BookmarkCheck className="h-5 w-5 text-red-500" />
                              ) : (
                                <Bookmark className="h-5 w-5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={shareJob}
                              className="text-gray-500 hover:text-blue-500 transition-colors"
                            >
                              <Share2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                          <div className="flex items-center font-medium">
                            <Building className="mr-2 h-4 w-4 text-blue-500" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="mr-2 h-4 w-4 text-red-500" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-green-500" />
                            <span>Posted {getTimeAgo(job.postedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Info Badges */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                        <Briefcase className="mr-2 h-4 w-4" />
                        {job.type.replace("-", " ")}
                      </Badge>
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                        <Users className="mr-2 h-4 w-4" />
                        {job.experience.min}-{job.experience.max} years
                      </Badge>
                      {job.salary && (
                        <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                          <DollarSign className="mr-2 h-4 w-4" />
                          {job.salary.currency} {job.salary.min.toLocaleString()}-{job.salary.max.toLocaleString()}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                        <Target className="mr-2 h-4 w-4" />
                        {job.numberOfOpenings} opening{job.numberOfOpenings > 1 ? "s" : ""}
                      </Badge>
                      {job.assessmentConfig && (
                        <Badge
                          variant="outline"
                          className="px-3 py-1.5 text-sm font-medium border-purple-200 text-purple-700"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Assessment Required
                        </Badge>
                      )}
                    </div>

                    {/* Status Alerts */}
                    {deadlinePassed ? (
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          This job posting has expired. The application deadline was {job.deadline.toLocaleDateString()}.
                        </AlertDescription>
                      </Alert>
                    ) : daysLeft <= 7 ? (
                      <Alert className={`border-orange-200 ${urgency.bg}`}>
                        <Timer className={`h-4 w-4 ${urgency.color}`} />
                        <AlertDescription className={urgency.color}>
                          {daysLeft <= 1
                            ? "⚡ Last day to apply! Application closes today."
                            : `Application deadline is approaching! Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left to apply.`}
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {existingApplication && applicationStatus && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <div className="flex items-center">
                          <applicationStatus.icon className="h-4 w-4 text-blue-600 mr-2" />
                          <AlertDescription className="text-blue-800">
                            You applied for this position on {existingApplication.appliedAt.toLocaleDateString()}.
                            <div className="flex items-center mt-2">
                              <span className="text-sm font-medium mr-2">Status:</span>
                              <Badge variant="outline" className={`${applicationStatus.color} text-white border-0`}>
                                {applicationStatus.text}
                              </Badge>
                            </div>
                          </AlertDescription>
                        </div>
                      </Alert>
                    )}
                  </div>

                  {/* Apply Card */}
                  <div className="lg:w-80">
                    <Card className="border-0 shadow-lg bg-white">
                      <CardContent className="pt-6">
                        <div className="text-center mb-6">
                          <div className={`text-4xl font-bold mb-2 ${urgency.color}`}>
                            {deadlinePassed ? "0" : daysLeft}
                          </div>
                          <div className="text-sm text-gray-600">
                            {deadlinePassed ? "Application closed" : `day${daysLeft !== 1 ? "s" : ""} left to apply`}
                          </div>
                          {!deadlinePassed && (
                            <div className="mt-3">
                              <Progress
                                value={Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100))}
                                className="h-2"
                              />
                            </div>
                          )}
                        </div>

                        <Separator className="mb-6" />

                        {!user ? (
                          <div className="space-y-3">
                            <Button className="w-full h-12 text-base font-medium" asChild>
                              <Link href="/auth/login">
                                <Heart className="mr-2 h-5 w-5" />
                                Login to Apply
                              </Link>
                            </Button>
                            <Button variant="outline" className="w-full h-12 text-base" asChild>
                              <Link href="/auth/register">Create Account</Link>
                            </Button>
                          </div>
                        ) : existingApplication ? (
                          <div className="space-y-3">
                            <Button className="w-full h-12 text-base font-medium" disabled>
                              <CheckCircle className="mr-2 h-5 w-5" />
                              Already Applied
                            </Button>
                            <Button variant="outline" className="w-full h-12 text-base" asChild>
                              <Link href={`/job-seeker/applications/${existingApplication.id}`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Application
                              </Link>
                            </Button>
                          </div>
                        ) : deadlinePassed ? (
                          <Button className="w-full h-12 text-base font-medium" disabled>
                            <Clock className="mr-2 h-5 w-5" />
                            Application Closed
                          </Button>
                        ) : user.role !== "job_seeker" ? (
                          <Alert>
                            <AlertDescription className="text-sm text-center">
                              Only job seekers can apply for positions.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Button
                            className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            asChild
                          >
                            <Link href={`/jobs/${job.id}/apply`}>
                              <Zap className="mr-2 h-5 w-5" />
                              Apply Now
                            </Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                <Tabs defaultValue="description" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="requirements">Requirements</TabsTrigger>
                    <TabsTrigger value="assessment">Assessment</TabsTrigger>
                    <TabsTrigger value="company">Company</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description">
                    <motion.div variants={fadeInUp}>
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-blue-500" />
                            Job Description
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose max-w-none text-gray-700 leading-relaxed">
                            <p className="whitespace-pre-wrap text-base">{job.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="requirements">
                    <motion.div variants={fadeInUp}>
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                            Requirements & Qualifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-4">
                            {job.requirements.length > 0 ? (
                              job.requirements.map((req, index) => (
                                <li key={index} className="flex items-start group">
                                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-4 flex-shrink-0 group-hover:bg-green-200 transition-colors">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  </div>
                                  <span className="text-gray-700 leading-relaxed">{req}</span>
                                </li>
                              ))
                            ) : (
                              <p className="text-gray-600">No specific requirements listed.</p>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="assessment">
                    <motion.div variants={fadeInUp}>
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Shield className="mr-2 h-5 w-5 text-purple-500" />
                            Technical Assessment
                          </CardTitle>
                          <CardDescription>
                            {job.assessmentConfig
                              ? "This position requires completing an online technical assessment."
                              : "No technical assessment required for this position."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {job.assessmentConfig ? (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                  <Code className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                  {/* <div className="text-2xl font-bold text-blue-700">
                                    {job.assessmentConfig.mcqCount || 0}
                                  </div> */}
                                  <div className="text-sm text-blue-600 font-medium">MCQ Questions</div>
                                </div>
                                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                  <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                  {/* <div className="text-2xl font-bold text-green-700">
                                    {job.assessmentConfig.codingCount || 0}
                                  </div> */}
                                  <div className="text-sm text-green-600 font-medium">Coding Problems</div>
                                </div>
                                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                  <Database className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                  {/* <div className="text-2xl font-bold text-purple-700">
                                    {job.assessmentConfig.sqlCount || 0}
                                  </div> */}
                                  <div className="text-sm text-purple-600 font-medium">SQL Questions</div>
                                </div>
                                <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                                  <div className="text-2xl font-bold text-yellow-700">
                                    {job.assessmentConfig.timeLimit || 60}
                                  </div>
                                  <div className="text-sm text-yellow-600 font-medium">Minutes</div>
                                </div>
                              </div>
                              <p className="text-gray-600">
                                The assessment includes multiple-choice questions, coding problems, and SQL queries to
                                evaluate your technical skills. Ensure you have a stable internet connection and a quiet
                                environment.
                              </p>
                              {job.assessmentConfig.topics && job.assessmentConfig.topics.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Topics Covered</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {job.assessmentConfig.topics.map((topic, index) => (
                                      <Badge key={index} variant="outline" className="border-purple-200 text-purple-700">
                                        {topic}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-600">
                              This position does not require a technical assessment. Candidates will be evaluated based on
                              their application and interview performance.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="company">
                    <motion.div variants={fadeInUp}>
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Building className="mr-2 h-5 w-5 text-blue-500" />
                            About {job.company}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage
                                src={`https://logo.clearbit.com/${job.company.toLowerCase().replace(/\s+/g, "")}.com`}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {job.company.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{job.company}</h3>
                            </div>
                          </div>
                          <div className="prose max-w-none text-gray-700">
                            <p className="whitespace-pre-wrap">
                              {job.description ? (
                                `Join ${job.company}, a leader in its field, where innovation and collaboration drive success.`
                              ) : (
                                `No company description available for ${job.company}.`
                              )}
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-blue-500" />
                              <a
                                href={`https://${job.company.toLowerCase().replace(/\s+/g, "")}.com`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {job.company.toLowerCase().replace(/\s+/g, "")}.com
                              </a>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.div className="lg:col-span-1 space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
              {/* Skills */}
              <motion.div variants={fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Code className="mr-2 h-5 w-5 text-teal-500" />
                      Required Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.length > 0 ? (
                        job.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-teal-200 text-teal-600 font-medium"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-600">No specific skills listed.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Similar Jobs */}
              <motion.div variants={fadeInUp}>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Briefcase className="mr-2 h-5 w-5 text-blue-500" />
                      Similar Jobs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {similarJobsLoading ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded"></div>
                        ))}
                      </div>
                    ) : similarJobs.length > 0 ? (
                      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                        {similarJobs.map((similarJob) => (
                          <motion.div
                            key={similarJob.id}
                            variants={fadeInUp}
                            whileHover="hover"
                            className="mb-4 last:mb-0"
                          >
                            <Card className="border-0 bg-white/90 backdrop-blur-sm">
                              <CardContent className="pt-4">
                                <Link href={`/jobs/${similarJob.id}`}>
                                  <h3 className="text-base font-semibold text-gray-900 hover:text-teal-600 transition-colors">
                                    {similarJob.title}
                                  </h3>
                                  <p className="text-sm text-gray-600">{similarJob.company}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{similarJob.location}</span>
                                    <Briefcase className="h-4 w-4 ml-2" />
                                    <span>{similarJob.type.replace("-", " ")}</span>
                                  </div>
                                </Link>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <p className="text-gray-600">No similar jobs found.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
