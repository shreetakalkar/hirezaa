"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  FileText, 
  Calendar, 
  Building, 
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Briefcase,
  DollarSign,
  RefreshCw,
  SortAsc,
  SortDesc
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Application, Job } from "@/lib/types"

interface ApplicationWithJob extends Application {
  job: Job
}

type SortOption = "newest" | "oldest" | "company" | "status"

export default function ApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<ApplicationWithJob[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithJob[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  useEffect(() => {
    filterAndSortApplications()
  }, [applications, searchTerm, statusFilter, sortBy, activeTab])

  const fetchApplications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const applicationsQuery = query(
        collection(db, "applications"),
        where("userId", "==", user.id),
        orderBy("appliedAt", "desc"),
      )
      const applicationsSnapshot = await getDocs(applicationsQuery)

      const applicationsWithJobs = await Promise.all(
        applicationsSnapshot.docs.map(async (appDoc) => {
          const appData = {
            id: appDoc.id,
            ...appDoc.data(),
            appliedAt: appDoc.data().appliedAt?.toDate() || new Date(),
            updatedAt: appDoc.data().updatedAt?.toDate() || new Date(),
          } as Application

          // Fetch job details
          try {
            const jobDoc = await getDoc(doc(db, "jobs", appData.jobId))
            const jobData = jobDoc.exists()
              ? ({
                  id: jobDoc.id,
                  ...jobDoc.data(),
                  postedAt: jobDoc.data().postedAt?.toDate() || new Date(),
                  deadline: jobDoc.data().deadline?.toDate(),
                } as Job)
              : null

            return jobData ? {
              ...appData,
              job: jobData,
            } as ApplicationWithJob : null
          } catch (error) {
            console.error(`Error fetching job ${appData.jobId}:`, error)
            return null
          }
        }),
      )

      const validApplications = applicationsWithJobs.filter((app): app is ApplicationWithJob => app !== null)
      setApplications(validApplications)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortApplications = () => {
    let filtered = applications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    // Filter by tab
    if (activeTab !== "all") {
      const tabFilters = {
        pending: ["applied", "shortlisted"],
        assessment: ["assessment_sent", "assessment_completed"],
        completed: ["selected", "rejected"]
      }
      if (activeTab in tabFilters) {
        filtered = filtered.filter((app) => tabFilters[activeTab as keyof typeof tabFilters].includes(app.status))
      }
    }

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        case "oldest":
          return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
        case "company":
          return a.job.company.localeCompare(b.job.company)
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    setFilteredApplications(filtered)
  }

  const getStatusColor = (status: Application["status"]) => {
    switch (status) {
      case "applied":
        return "default"
      case "shortlisted":
        return "secondary"
      case "assessment_sent":
        return "outline"
      case "assessment_completed":
        return "secondary"
      case "selected":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: Application["status"]) => {
    switch (status) {
      case "applied":
        return <Clock className="h-3 w-3" />
      case "shortlisted":
        return <Users className="h-3 w-3" />
      case "assessment_sent":
      case "assessment_completed":
        return <AlertCircle className="h-3 w-3" />
      case "selected":
        return <CheckCircle className="h-3 w-3" />
      case "rejected":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusText = (status: Application["status"]) => {
    const statusMap = {
      applied: "Applied",
      shortlisted: "Shortlisted",
      assessment_sent: "Assessment Sent",
      assessment_completed: "Assessment Done",
      selected: "Selected",
      rejected: "Rejected"
    }
    return statusMap[status] || status.replace("_", " ").toUpperCase()
  }

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((app) => ["applied", "shortlisted"].includes(app.status)).length,
      assessment: applications.filter((app) => ["assessment_sent", "assessment_completed"].includes(app.status)).length,
      selected: applications.filter((app) => app.status === "selected").length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    }
  }, [applications])

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-600">Loading your applications...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600">Track and manage your job applications</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={fetchApplications} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/jobs">
                <Search className="mr-2 h-4 w-4" />
                Browse Jobs
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                  <p className="text-xs text-blue-600 font-medium">Total Applications</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                  <p className="text-xs text-yellow-600 font-medium">Under Review</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-700">{stats.assessment}</div>
                  <p className="text-xs text-purple-600 font-medium">Assessments</p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-700">{stats.selected}</div>
                  <p className="text-xs text-green-600 font-medium">Selected</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
                  <p className="text-xs text-red-600 font-medium">Rejected</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="assessment">Assessment ({stats.assessment})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.selected + stats.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Enhanced Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by job title, company, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-48">
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

                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-full lg:w-48">
                      {sortBy === "newest" || sortBy === "oldest" ? (
                        sortBy === "newest" ? <SortDesc className="mr-2 h-4 w-4" /> : <SortAsc className="mr-2 h-4 w-4" />
                      ) : (
                        <TrendingUp className="mr-2 h-4 w-4" />
                      )}
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="company">Company A-Z</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {applications.length === 0 ? "No applications yet" : "No applications match your filters"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {applications.length === 0
                      ? "Start applying to jobs to see them here."
                      : "Try adjusting your search criteria."}
                  </p>
                  {applications.length === 0 && (
                    <div className="mt-6">
                      <Button asChild>
                        <Link href="/jobs">Browse Jobs</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                  <Link href={`/jobs/${application.job.id}`}>
                                    {application.job.title}
                                  </Link>
                                </h3>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                  <Building className="mr-1 h-4 w-4" />
                                  <span className="font-medium">{application.job.company}</span>
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="mr-1 h-4 w-4" />
                                  <span>{application.job.location}</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="mr-1 h-4 w-4" />
                                  <span>Applied {getTimeAgo(application.appliedAt)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <Badge variant={getStatusColor(application.status)} className="flex items-center gap-1">
                              {getStatusIcon(application.status)}
                              {getStatusText(application.status)}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Badge variant="outline" className="capitalize">
                              {application.job.type.replace("-", " ")}
                            </Badge>

                            {application.job.salary && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {application.job.salary.currency} {application.job.salary.min.toLocaleString()}-
                                {application.job.salary.max.toLocaleString()}
                              </Badge>
                            )}

                            <Badge variant="outline">CGPA: {application.cgpa}</Badge>
                          </div>

                          {application.skills && application.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {application.skills.slice(0, 6).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {application.skills.length > 6 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{application.skills.length - 6} more
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              Last updated: {getTimeAgo(application.updatedAt)}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/jobs/${application.job.id}`}>
                                  <Eye className="mr-1 h-4 w-4" />
                                  View Job
                                </Link>
                              </Button>

                              {application.resume && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={application.resume} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-1 h-4 w-4" />
                                    Resume
                                  </a>
                                </Button>
                              )}

                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/job-seeker/applications/${application.id}`}>
                                  <Eye className="mr-1 h-4 w-4" />
                                  Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}