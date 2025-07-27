"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Edit, Users, BarChart3, Calendar, MapPin, Briefcase, DollarSign, Clock } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job, Application } from "@/lib/types"
import { useParams } from "next/navigation"

export default function JobDetailsPage() {
  const { user } = useAuth()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && jobId) {
      fetchJobDetails()
    }
  }, [user, jobId])

  const fetchJobDetails = async () => {
    try {
      // Fetch job details
      const jobDoc = await getDoc(doc(db, "jobs", jobId))
      if (jobDoc.exists()) {
        const jobData = {
          id: jobDoc.id,
          ...jobDoc.data(),
          postedAt: jobDoc.data().postedAt?.toDate(),
          deadline: jobDoc.data().deadline?.toDate(),
        } as Job
        setJob(jobData)

        // Fetch applications for this job
        const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", jobId))
        const applicationsSnapshot = await getDocs(applicationsQuery)
        const applicationsData = applicationsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              appliedAt: doc.data().appliedAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
            }) as Application,
        )
        setApplications(applicationsData)
      }
    } catch (error) {
      console.error("Error fetching job details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading job details...</div>
      </DashboardLayout>
    )
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div>Job not found</div>
      </DashboardLayout>
    )
  }

  const applicationStats = {
    total: applications.length,
    applied: applications.filter((app) => app.status === "applied").length,
    shortlisted: applications.filter((app) => app.status === "shortlisted").length,
    assessmentSent: applications.filter((app) => app.status === "assessment_sent").length,
    assessmentCompleted: applications.filter((app) => app.status === "assessment_completed").length,
    selected: applications.filter((app) => app.status === "selected").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600">
              {job.company} • {job.location}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/recruiter/jobs/${job.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Job
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/recruiter/jobs/${job.id}/applicants`}>
                <Users className="mr-2 h-4 w-4" />
                View Applicants ({applications.length})
              </Link>
            </Button>
          </div>
        </div>

        {/* Job Status and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge
                variant={job.status === "active" ? "default" : job.status === "closed" ? "destructive" : "secondary"}
              >
                {job.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applicationStats.total}</div>
              <p className="text-xs text-muted-foreground">Total received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applicationStats.shortlisted}</div>
              <p className="text-xs text-muted-foreground">Candidates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Left</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(0, Math.ceil((job.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
              </div>
              <p className="text-xs text-muted-foreground">Until deadline</p>
            </CardContent>
          </Card>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {job.assessmentConfig && (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Configuration</CardTitle>
                  <CardDescription>Automated technical assessment settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{job.assessmentConfig.mcqCount}</div>
                      <div className="text-sm text-gray-600">MCQ Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{job.assessmentConfig.codingCount}</div>
                      <div className="text-sm text-gray-600">Coding Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{job.assessmentConfig.sqlCount}</div>
                      <div className="text-sm text-gray-600">SQL Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{job.assessmentConfig.timeLimit}</div>
                      <div className="text-sm text-gray-600">Minutes</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Assessment Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.assessmentConfig.topics.map((topic) => (
                        <Badge key={topic} variant="outline">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{job.location}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm capitalize">{job.type.replace("-", " ")}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Posted {job.postedAt.toLocaleDateString()}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Deadline {job.deadline.toLocaleDateString()}</span>
                </div>

                {job.salary && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                    </span>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Openings</h4>
                  <p className="text-sm text-gray-600">
                    {job.numberOfOpenings} position{job.numberOfOpenings > 1 ? "s" : ""} available
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Experience</h4>
                  <p className="text-sm text-gray-600">
                    {job.experience.min} - {job.experience.max} years
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Applied</span>
                  <span className="text-sm font-medium">{applicationStats.applied}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Shortlisted</span>
                  <span className="text-sm font-medium">{applicationStats.shortlisted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Assessment Sent</span>
                  <span className="text-sm font-medium">{applicationStats.assessmentSent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Assessment Completed</span>
                  <span className="text-sm font-medium">{applicationStats.assessmentCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Selected</span>
                  <span className="text-sm font-medium">{applicationStats.selected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rejected</span>
                  <span className="text-sm font-medium">{applicationStats.rejected}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
