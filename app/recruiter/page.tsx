"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Briefcase, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  Plus, 
  Eye,
  Calendar,
  MapPin,
  Building2,
  Activity,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job, Application } from "@/lib/types"

// Utility function to handle different date formats
const convertToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date(0)
  
  // Handle Firestore Timestamp
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }
  
  // Handle Firestore Timestamp object structure
  if (timestamp && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000)
  }
  
  // Handle regular Date or string
  return new Date(timestamp)
}

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  totalApplications: number
  pendingReviews: number
}

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingReviews: 0,
  })
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      let jobs: Job[] = []

      // Try the optimized query first (with orderBy)
      try {
        const optimizedQuery = query(
          collection(db, "jobs"), 
          where("postedBy", "==", user.id), 
          orderBy("postedAt", "desc")
        )
        const jobsSnapshot = await getDocs(optimizedQuery)
        jobs = jobsSnapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }) as Job)
      } catch (indexError) {
        console.log("Index not ready, falling back to simple query...")
        
        // Fallback to simple query without orderBy
        const fallbackQuery = query(
          collection(db, "jobs"), 
          where("postedBy", "==", user.id)
        )
        const jobsSnapshot = await getDocs(fallbackQuery)
        jobs = jobsSnapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }) as Job)

        // Sort jobs by postedAt in JavaScript
        jobs.sort((a, b) => {
          const dateA = convertToDate(a.postedAt)
          const dateB = convertToDate(b.postedAt)
          return dateB.getTime() - dateA.getTime()
        })
      }

      // Fetch applications for user's jobs
      let applications: Application[] = []
      const jobIds = jobs.map((job) => job.id)

      if (jobIds.length > 0) {
        // Firebase 'in' query has a limit of 10 items, so we might need to batch
        const batchSize = 10
        const batches = []
        
        for (let i = 0; i < jobIds.length; i += batchSize) {
          const batch = jobIds.slice(i, i + batchSize)
          const applicationsQuery = query(
            collection(db, "applications"), 
            where("jobId", "in", batch)
          )
          batches.push(getDocs(applicationsQuery))
        }

        const batchResults = await Promise.all(batches)
        applications = batchResults.flatMap(snapshot => 
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Application)
        )
      }

      setStats({
        totalJobs: jobs.length,
        activeJobs: jobs.filter((job) => job.status === "active").length,
        totalApplications: applications.length,
        pendingReviews: applications.filter((app) => app.status === "applied").length,
      })

      setRecentJobs(jobs.slice(0, 5))
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      
      // If it's an index error and we haven't retried too many times
      if (err instanceof Error && err.message.includes("index") && retryCount < 3) {
        setError("Database index is still building. Retrying...")
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          fetchDashboardData()
        }, 2000)
      } else {
        setError("Failed to load dashboard data. Please refresh the page.")
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, retryCount])

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
    }
  }, [user?.id, fetchDashboardData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "closed":
        return "bg-red-100 text-red-800 border-red-200"
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "Unknown"
    
    const dateObj = convertToDate(date)
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date"
    }
    
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const LoadingSkeleton = () => (
    <DashboardLayout>
      <div className="w-full max-w-none space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-12 w-36" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-36" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-lg mr-3" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-none space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, <span className="font-semibold">{user?.name || "Recruiter"}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Manage your job postings and track applications
            </p>
          </div>
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl px-8"
          >
            <Link href="/recruiter/post-job">
              <Plus className="mr-2 h-5 w-5" />
              Post New Job
            </Link>
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div className="flex items-center justify-between w-full">
              <AlertDescription>{error}</AlertDescription>
              {!loading && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setError(null)
                    setRetryCount(0)
                    fetchDashboardData()
                  }}
                  className="ml-4"
                >
                  Retry
                </Button>
              )}
            </div>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
              <div className="p-3 bg-blue-100 rounded-xl shadow-sm">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalJobs}</div>
              <p className="text-xs text-gray-500 flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                All time posts
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Jobs</CardTitle>
              <div className="p-3 bg-green-100 rounded-xl shadow-sm">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeJobs}</div>
              <p className="text-xs text-gray-500 flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                Currently hiring
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
              <div className="p-3 bg-purple-100 rounded-xl shadow-sm">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalApplications}</div>
              <p className="text-xs text-gray-500 flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                Total received
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
              <div className="p-3 bg-orange-100 rounded-xl shadow-sm">
                <ClipboardList className="h-6 w-6 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingReviews}</div>
              <p className="text-xs text-gray-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Jobs - Takes up 2/3 of the space */}
          <div className="xl:col-span-2">
            <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-xl">
                      <Briefcase className="mr-2 h-5 w-5 text-gray-600" />
                      Recent Jobs
                    </CardTitle>
                    <CardDescription>Your latest job postings and their performance</CardDescription>
                  </div>
                  {recentJobs.length > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/recruiter/jobs">View All</Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentJobs.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <Briefcase className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                      Get started by posting your first job and attract top talent to your organization.
                    </p>
                    <Button 
                      asChild 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Link href="/recruiter/post-job">
                        <Plus className="mr-2 h-4 w-4" />
                        Post Your First Job
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {recentJobs.map((job, index) => (
                      <div 
                        key={job.id} 
                        className="p-6 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                                {job.title}
                              </h3>
                              <Badge 
                                className={`${getStatusColor(job.status)} text-xs font-medium px-2.5 py-0.5 rounded-full border flex-shrink-0`}
                              >
                                {job.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600 mb-3 space-x-4 flex-wrap">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 mr-1.5 text-gray-400" />
                                {job.company}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                                {job.location}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                                Posted {formatDate(job.postedAt)}
                              </div>
                            </div>

                            {job.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {job.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Job #{index + 1}</span>
                                {job.salary && (
                                  <span className="font-medium text-green-600">
                                    ${job.salary.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 flex-shrink-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                            >
                              <Link href={`/recruiter/jobs/${job.id}`}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Overview - Takes up 1/3 of the space */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Manage your recruitment process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    asChild 
                    className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    variant="outline"
                  >
                    <Link href="/recruiter/post-job">
                      <Plus className="mr-2 h-4 w-4" />
                      Post New Job
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                    variant="outline"
                  >
                    <Link href="/recruiter/applications">
                      <Users className="mr-2 h-4 w-4" />
                      View Applications
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                    variant="outline"
                  >
                    <Link href="/recruiter/jobs">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Manage Jobs
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    className="w-full justify-start bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
                    variant="outline"
                  >
                    <Link href="/recruiter/analytics">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Overview</CardTitle>
                <CardDescription>Your recruitment performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Active Jobs</p>
                        <p className="text-xs text-gray-500">Currently hiring</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{stats.activeJobs}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Applications</p>
                        <p className="text-xs text-gray-500">Total received</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-green-600">{stats.totalApplications}</span>
                  </div>

                  {stats.pendingReviews > 0 && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg mr-3">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Pending Reviews</p>
                          <p className="text-xs text-gray-500">Need your attention</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-orange-600">{stats.pendingReviews}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}