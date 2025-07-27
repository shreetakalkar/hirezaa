"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Search, Filter, Eye, Edit, Trash2, Users, Calendar, MapPin, Building2, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

// Define the Job type based on the provided job data
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  status: string;
  postedBy: string;
  postedAt: Date | string;
  deadline: Date | string;
  numberOfOpenings: number;
  skills: string[];
  description?: string;
  requirements?: string[];
  salary?: { currency: string; min: number; max: number };
  experience?: { min: number; max: number };
  assessmentConfig?: { codingCount?: number; mcqCount?: number; sqlCount?: number; timeLimit?: number };
  topics?: string[];
  shortlistMultiplier?: number;
}

export default function RecruiterJobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    console.log("User state changed:", user);
    if (user?.id) {
      console.log("Fetching jobs for user:", user.id);
      fetchJobs();
    } else if (user === null) {
      console.log("User not authenticated");
      toast({
        title: "Authentication Error",
        description: "Please log in to view your jobs.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter]);

  const fetchJobs = async () => {
    console.log("fetchJobs called with user:", user);
    
    if (!user?.id) {
      console.log("No user ID available");
      setLoading(false);
      return;
    }

    try {
      console.log("Starting Firestore query...");
      
      const jobsQuery = query(
        collection(db, "jobs"),
        where("postedBy", "==", user.id)
      );
      
      console.log("Executing query...");
      const jobsSnapshot = await getDocs(jobsQuery);
      console.log("Query executed. Snapshot size:", jobsSnapshot.size);

      if (jobsSnapshot.empty) {
        console.log("No jobs found for user:", user.id);
        setJobs([]);
        setLoading(false);
        return;
      }

      const jobsData = jobsSnapshot.docs.map((docRef) => {
        const data = docRef.data();
        console.log("Processing job document:", docRef.id, data);
        
        return {
          id: docRef.id,
          title: data.title || "",
          company: data.company || "",
          location: data.location || "",
          type: data.type || "",
          status: data.status || "draft",
          postedBy: data.postedBy || "",
          numberOfOpenings: data.numberOfOpenings || 1,
          skills: Array.isArray(data.skills) ? data.skills : [],
          description: data.description,
          requirements: Array.isArray(data.requirements) ? data.requirements : [],
          salary: data.salary,
          experience: data.experience,
          assessmentConfig: data.assessmentConfig,
          topics: Array.isArray(data.topics) ? data.topics : [],
          shortlistMultiplier: data.shortlistMultiplier,
          postedAt: data.postedAt?.toDate ? data.postedAt.toDate() : 
                   data.postedAt ? new Date(data.postedAt) : new Date(),
          deadline: data.deadline?.toDate ? data.deadline.toDate() : 
                   data.deadline ? new Date(data.deadline) : new Date(),
        } as Job;
      });

      jobsData.sort((a, b) => {
        const dateA = a.postedAt instanceof Date ? a.postedAt : new Date(a.postedAt);
        const dateB = b.postedAt instanceof Date ? b.postedAt : new Date(b.postedAt);
        return dateB.getTime() - dateA.getTime();
      });

      console.log("Processed jobs data:", jobsData);
      setJobs(jobsData);
      
      toast({
        title: "Jobs loaded",
        description: `Found ${jobsData.length} job${jobsData.length !== 1 ? 's' : ''}`,
      });

    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      
      let errorMessage = "Failed to fetch jobs. Please try again.";
      
      if (error.code === "permission-denied") {
        errorMessage = "Permission denied. Please check your authentication and Firestore security rules.";
      } else if (error.code === "failed-precondition") {
        errorMessage = "Database index required. Please check the Firebase console for index creation prompts.";
      } else if (error.code === "unavailable") {
        errorMessage = "Firebase service temporarily unavailable. Please try again in a moment.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Error fetching jobs",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchLower) ||
          job.company?.toLowerCase().includes(searchLower) ||
          job.location?.toLowerCase().includes(searchLower) ||
          job.skills?.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "jobs", jobId));
      setJobs(prevJobs => prevJobs.filter((job) => job.id !== jobId));
      toast({
        title: "Success",
        description: "Job deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting job:", error);
      toast({
        title: "Error",
        description: `Failed to delete job: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-red-100 text-red-800 border-red-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex justify-center items-center min-h-screen">
          <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Jobs</h3>
                <p className="text-gray-600">Please wait while we fetch your job postings...</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show auth error state
  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex justify-center items-center min-h-screen">
          <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardContent className="pt-8 pb-8 text-center">
                  <Briefcase className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
                  <p className="text-gray-600 mb-6">Please log in to view and manage your job postings.</p>
                  <Button asChild className="w-full">
                    <Link href="/login">Log In to Continue</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 flex justify-center min-h-screen">
        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Job Postings</h1>
                  <p className="text-gray-600 text-lg">Manage and track your job listings</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {jobs.length} Total Jobs
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {jobs.filter(job => job.status === 'active').length} Active
                    </span>
                  </div>
                </div>
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/recruiter/post-job">
                    <Plus className="mr-2 h-5 w-5" />
                    Post New Job
                  </Link>
                </Button>
              </div>
            </div>

            {/* Search and Filter Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Find Your Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search by title, company, location, or skills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-48 h-11 border-gray-200">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Jobs</SelectItem>
                      <SelectItem value="closed">Closed Jobs</SelectItem>
                      <SelectItem value="draft">Draft Jobs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List Section */}
            {filteredJobs.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <Briefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {jobs.length === 0 ? "No Jobs Posted Yet" : "No Jobs Match Your Search"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {jobs.length === 0 
                        ? "Start building your talent pipeline by posting your first job opening." 
                        : "Try adjusting your search criteria or filters to find what you're looking for."}
                    </p>
                    {jobs.length === 0 && (
                      <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/recruiter/post-job">
                          <Plus className="mr-2 h-5 w-5" />
                          Post Your First Job
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          {/* Job Title and Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-900">
                              {job.title || "Untitled Job"}
                            </h3>
                            <Badge className={`${getStatusColor(job.status)} px-3 py-1 text-sm font-medium w-fit`}>
                              {job.status?.charAt(0).toUpperCase() + job.status?.slice(1) || "Unknown"}
                            </Badge>
                          </div>

                          {/* Job Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{job.company || "Unknown Company"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4 text-green-500" />
                              <span>{job.location || "Remote"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4 text-orange-500" />
                              <span>{job.type || "Full-time"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="h-4 w-4 text-purple-500" />
                              <span>{job.numberOfOpenings || 1} opening{(job.numberOfOpenings || 1) !== 1 ? "s" : ""}</span>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Posted: {job.postedAt instanceof Date 
                                ? job.postedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Deadline: {job.deadline instanceof Date 
                                ? job.deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>

                          {/* Skills */}
                          {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {job.skills.slice(0, 6).map((skill, index) => (
                                <Badge key={`${skill}-${index}`} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-1">
                                  {skill}
                                </Badge>
                              ))}
                              {job.skills.length > 6 && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-1">
                                  +{job.skills.length - 6} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row lg:flex-col gap-2 lg:w-auto w-full">
                          <Button variant="outline" size="sm" asChild className="flex-1 lg:flex-none hover:bg-blue-50 hover:border-blue-300">
                            <Link href={`/recruiter/jobs/${job.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </Button>

                          <Button variant="outline" size="sm" asChild className="flex-1 lg:flex-none hover:bg-green-50 hover:border-green-300">
                            <Link href={`/recruiter/jobs/${job.id}/applicants`}>
                              <Users className="mr-2 h-4 w-4" />
                              Applicants
                            </Link>
                          </Button>

                          <Button variant="outline" size="sm" asChild className="flex-1 lg:flex-none hover:bg-yellow-50 hover:border-yellow-300">
                            <Link href={`/recruiter/jobs/${job.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                            className="flex-1 lg:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="lg:mr-2 h-4 w-4" />
                            <span className="hidden lg:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}