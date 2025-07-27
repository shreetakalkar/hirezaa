"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Briefcase, 
  FileText, 
  Clock, 
  TrendingUp, 
  Plus, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  MapPin,
  Building2,
  Target,
  Award,
  Zap,
  ArrowRight,
  Star,
  Activity,
  Users,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Application, Job, Assessment } from "@/lib/types";

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  completedAssessments: number;
  selectedApplications: number;
}

interface RecentApplication extends Application {
  job: Job;
}

export default function JobSeekerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    completedAssessments: 0,
    selectedApplications: 0,
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user's applications
      const applicationsQuery = query(
        collection(db, "applications"),
        where("userId", "==", user.id),
        orderBy("appliedAt", "desc"),
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applications = applicationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Application[];

      // Fetch job details for recent applications
      const recentAppsWithJobs = await Promise.all(
        applications.slice(0, 5).map(async (app) => {
          const jobQuery = query(collection(db, "jobs"), where("__name__", "==", app.jobId));
          const jobSnapshot = await getDocs(jobQuery);
          const job = jobSnapshot.docs[0]?.data() as Job;
          return {
            ...app,
            job: {
              ...job,
              id: app.jobId,
              postedAt: job?.postedAt,
              deadline: job?.deadline,
            },
          };
        }),
      );

      // Fetch assessments
      const assessmentsQuery = query(collection(db, "assessments"), where("userId", "==", user.id));
      const assessmentsSnapshot = await getDocs(assessmentsQuery);
      const assessments = assessmentsSnapshot.docs.map((doc) => doc.data()) as Assessment[];

      // Fetch recent jobs
      const jobsQuery = query(
        collection(db, "jobs"),
        where("status", "==", "active"),
        orderBy("postedAt", "desc"),
        limit(5),
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobs = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate(),
        deadline: doc.data().deadline?.toDate(),
      })) as Job[];

      // Calculate stats
      setStats({
        totalApplications: applications.length,
        pendingApplications: applications.filter((app) => app.status === "applied" || app.status === "shortlisted")
          .length,
        completedAssessments: assessments.filter((assessment) => assessment.status === "completed").length,
        selectedApplications: applications.filter((app) => app.status === "selected").length,
      });

      setRecentApplications(recentAppsWithJobs.filter((app) => app.job));
      setRecentJobs(jobs);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "selected":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "assessment_completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "shortlisted":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "selected":
        return <CheckCircle2 className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      case "assessment_completed":
        return <BookOpen className="w-4 h-4" />;
      case "shortlisted":
        return <Star className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="text-gray-600 animate-pulse">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const successRate = stats.totalApplications > 0 ? (stats.selectedApplications / stats.totalApplications) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-gradient-to-br from-gray-50/50 to-blue-50/30 min-h-screen p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <Activity className="w-4 h-4 mr-1" />
                  Your career journey continues
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" asChild>
              <Link href="/jobs">
                <Target className="mr-2 w-4 h-4" />
                Find Jobs
              </Link>
            </Button>
            <Button variant="outline" className="border-2 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-300" asChild>
              <Link href="/job-seeker/profile">
                <Users className="mr-2 w-4 h-4" />
                Update Profile
              </Link>
            </Button>
          </div>
        </div>



        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalApplications}</div>
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">All time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Applications</CardTitle>
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.pendingApplications}</div>
              <div className="flex items-center text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-yellow-600 font-medium">Awaiting response</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tests Completed</CardTitle>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.completedAssessments}</div>
              <div className="flex items-center text-sm">
                <Zap className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-purple-600 font-medium">Technical assessments</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Selected</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.selectedApplications}</div>
              <div className="flex items-center text-sm">
                <Star className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">Successful applications</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        {stats.totalApplications > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <TrendingUp className="mr-2 w-5 h-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-700">{successRate.toFixed(1)}%</span>
                </div>
                <Progress value={successRate} className="h-3 bg-green-100" />
                <p className="text-sm text-gray-600">
                  You've been selected for {stats.selectedApplications} out of {stats.totalApplications} applications.
                  {successRate < 20 && " Keep applying and improving your profile!"}
                  {successRate >= 20 && successRate < 50 && " Great progress! Continue building your profile."}
                  {successRate >= 50 && " Excellent success rate! You're doing great!"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Recent Applications */}
          <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-gray-900">
                    <FileText className="mr-2 w-5 h-5 text-blue-600" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription>Track your latest job applications</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {recentApplications.length} Recent
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentApplications.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                  <p className="text-gray-500 mb-6">Start your job search journey by applying to positions that match your skills.</p>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white" asChild>
                    <Link href="/jobs">
                      <Target className="mr-2 w-4 h-4" />
                      Browse Jobs
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentApplications.map((application, index) => (
                    <div key={application.id} className="p-6 hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                {application.job?.title || "Job Title"}
                              </h3>
                              <div className="flex items-center text-gray-600 mb-3">
                                <Building2 className="w-4 h-4 mr-1" />
                                <span className="mr-3">{application.job?.company || "Company"}</span>
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{application.job?.location || "Location"}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                                  {getStatusIcon(application.status)}
                                  <span className="ml-1">
                                    {application.status.replace("_", " ").toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Applied {application.appliedAt.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="ml-4 hover:bg-blue-50 hover:border-blue-200 transition-colors" asChild>
                          <Link href={`/job-seeker/applications/${application.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="p-6 bg-gray-50/50 text-center">
                    <Button variant="outline" className="hover:bg-white transition-colors" asChild>
                      <Link href="/job-seeker/applications">
                        View All Applications
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Recommended Jobs */}
          <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-gray-900">
                    <Briefcase className="mr-2 w-5 h-5 text-green-600" />
                    Recommended Jobs
                  </CardTitle>
                  <CardDescription>Perfect matches for your profile</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {recentJobs.length} Available
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentJobs.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
                  <p className="text-gray-500 mb-6">We're constantly adding new opportunities. Check back soon!</p>
                  <Button variant="outline" asChild>
                    <Link href="/jobs">
                      <Target className="mr-2 w-4 h-4" />
                      Browse All Jobs
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentJobs.map((job, index) => (
                    <div key={job.id} className="p-6 hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Briefcase className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">{job.title}</h3>
                              <div className="flex items-center text-gray-600 mb-3">
                                <Building2 className="w-4 h-4 mr-1" />
                                <span className="mr-3">{job.company}</span>
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="bg-white">
                                  {job.type.replace("-", " ")}
                                </Badge>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Posted {job.postedAt.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button className="ml-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" size="sm" asChild>
                          <Link href={`/jobs/${job.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            Apply
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="p-6 bg-gray-50/50 text-center">
                    <Button variant="outline" className="hover:bg-white transition-colors" asChild>
                      <Link href="/jobs">
                        Browse All Jobs
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}