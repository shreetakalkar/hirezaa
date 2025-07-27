"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Eye,
  Download,
  Calendar,
  Building,
  MapPin,
  FileText,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Application, Job, Assessment } from "@/lib/types"
import { useParams } from "next/navigation"

interface ApplicationDetails extends Application {
  job: Job
  assessment?: Assessment
}

export default function ApplicationDetailsPage() {
  const { user } = useAuth()
  const params = useParams()
  const applicationId = params.id as string

  const [application, setApplication] = useState<ApplicationDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && applicationId) {
      fetchApplicationDetails()
    }
  }, [user, applicationId])

  const fetchApplicationDetails = async () => {
    try {
      // Fetch application details
      const appDoc = await getDoc(doc(db, "applications", applicationId))
      if (!appDoc.exists()) {
        return
      }

      const appData = {
        id: appDoc.id,
        ...appDoc.data(),
        appliedAt: appDoc.data().appliedAt?.toDate(),
        updatedAt: appDoc.data().updatedAt?.toDate(),
      } as Application

      // Fetch job details
      const jobDoc = await getDoc(doc(db, "jobs", appData.jobId))
      const jobData = jobDoc.exists()
        ? ({
            id: jobDoc.id,
            ...jobDoc.data(),
            postedAt: jobDoc.data().postedAt?.toDate(),
            deadline: jobDoc.data().deadline?.toDate(),
          } as Job)
        : null

      // Fetch assessment if exists
      let assessmentData: Assessment | undefined
      if (appData.status === "assessment_sent" || appData.status === "assessment_completed") {
        const assessmentQuery = query(collection(db, "assessments"), where("applicationId", "==", applicationId))
        const assessmentSnapshot = await getDocs(assessmentQuery)
        if (!assessmentSnapshot.empty) {
          const assessmentDoc = assessmentSnapshot.docs[0]
          assessmentData = {
            id: assessmentDoc.id,
            ...assessmentDoc.data(),
            startedAt: assessmentDoc.data().startedAt?.toDate(),
            completedAt: assessmentDoc.data().completedAt?.toDate(),
            expiresAt: assessmentDoc.data().expiresAt?.toDate(),
          } as Assessment
        }
      }

      setApplication({
        ...appData,
        job: jobData!,
        assessment: assessmentData,
      })
    } catch (error) {
      console.error("Error fetching application details:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: Application["status"]) => {
    switch (status) {
      case "applied":
        return "secondary"
      case "shortlisted":
        return "default"
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

  const getStatusText = (status: Application["status"]) => {
    return status.replace("_", " ").toUpperCase()
  }

  const getStatusDescription = (status: Application["status"]) => {
    switch (status) {
      case "applied":
        return "Your application has been submitted and is under review by the employer."
      case "shortlisted":
        return "Congratulations! You've been shortlisted for this position."
      case "assessment_sent":
        return "An assessment link has been sent to your email. Please complete it before the deadline."
      case "assessment_completed":
        return "You've completed the assessment. The employer is reviewing your results."
      case "selected":
        return "Congratulations! You've been selected for this position. The employer will contact you soon."
      case "rejected":
        return "Unfortunately, your application was not successful this time. Keep applying to other opportunities!"
      default:
        return "Application status is being processed."
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!application) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Application not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The application you're looking for doesn't exist or you don't have access to it.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/job-seeker/applications">Back to Applications</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const isAssessmentExpired = application.assessment && new Date() > application.assessment.expiresAt
  const canTakeAssessment = application.status === "assessment_sent" && application.assessment && !isAssessmentExpired

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
            <p className="text-gray-600">Track your application progress</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/jobs/${application.job.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Job
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/job-seeker/applications">Back to Applications</Link>
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{application.job.title}</h2>
                <p className="text-gray-600">
                  {application.job.company} • {application.job.location}
                </p>
              </div>
              <Badge variant={getStatusColor(application.status)} className="text-sm">
                {getStatusText(application.status)}
              </Badge>
            </div>

            <Alert
              className={
                application.status === "selected"
                  ? "border-green-200 bg-green-50"
                  : application.status === "rejected"
                    ? "border-red-200 bg-red-50"
                    : ""
              }
            >
              <div className="flex">
                {application.status === "selected" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : application.status === "rejected" ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <AlertDescription className="ml-2">{getStatusDescription(application.status)}</AlertDescription>
              </div>
            </Alert>

            {/* Assessment Alert */}
            {canTakeAssessment && (
              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      Assessment expires on {application.assessment!.expiresAt.toLocaleDateString()}. Complete it as
                      soon as possible.
                    </span>
                    <Button size="sm" asChild>
                      <Link href={`/assessment/${application.assessment!.id}`}>
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Take Assessment
                      </Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {isAssessmentExpired && application.status === "assessment_sent" && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The assessment has expired. Please contact the employer if you believe this is an error.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Information */}
            <Card>
              <CardHeader>
                <CardTitle>Application Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Applied On</p>
                      <p className="text-sm text-gray-600">{application.appliedAt.toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-gray-600">{application.updatedAt.toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">CGPA</p>
                      <p className="text-sm text-gray-600">{application.cgpa}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Resume</p>
                      {application.resume ? (
                        <Button variant="link" className="p-0 h-auto text-sm" asChild>
                          <a href={application.resume} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-1 h-3 w-3" />
                            View Resume
                          </a>
                        </Button>
                      ) : (
                        <p className="text-sm text-gray-600">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Skills Applied With</h4>
                  <div className="flex flex-wrap gap-2">
                    {application.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {application.coverLetter && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Cover Letter</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Assessment Results */}
            {application.assessment && application.status === "assessment_completed" && (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Results</CardTitle>
                  <CardDescription>Your performance in the technical assessment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{application.assessment.score.mcq}%</div>
                      <div className="text-sm text-gray-600">MCQ Score</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{application.assessment.score.coding}%</div>
                      <div className="text-sm text-gray-600">Coding Score</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{application.assessment.score.sql}%</div>
                      <div className="text-sm text-gray-600">SQL Score</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{application.assessment.score.total}%</div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Time Spent</p>
                      <p className="text-sm text-gray-600">
                        {Math.floor(application.assessment.timeSpent / 60)} minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Completed On</p>
                      <p className="text-sm text-gray-600">
                        {application.assessment.completedAt?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {application.assessment.cheatingEvents.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {application.assessment.cheatingEvents.length} potential cheating event(s) were detected during
                        the assessment.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Building className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm">{application.job.company}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm">{application.job.location}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm capitalize">{application.job.type.replace("-", " ")}</span>
                </div>
                {application.job.salary && (
                  <div className="flex items-center">
                    <span className="text-sm">
                      {application.job.salary.currency} {application.job.salary.min.toLocaleString()}-
                      {application.job.salary.max.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Application Submitted</p>
                      <p className="text-xs text-gray-500">{application.appliedAt.toLocaleDateString()}</p>
                    </div>
                  </div>

                  {application.status !== "applied" && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Status Updated</p>
                        <p className="text-xs text-gray-500">{application.updatedAt.toLocaleDateString()}</p>
                        <p className="text-xs text-gray-600">{getStatusText(application.status)}</p>
                      </div>
                    </div>
                  )}

                  {application.assessment?.startedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Assessment Started</p>
                        <p className="text-xs text-gray-500">{application.assessment.startedAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}

                  {application.assessment?.completedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Assessment Completed</p>
                        <p className="text-xs text-gray-500">
                          {application.assessment.completedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  {application.status === "applied" && (
                    <p>Your application is under review. You'll be notified if you're shortlisted.</p>
                  )}
                  {application.status === "shortlisted" && (
                    <p>Congratulations! Wait for further instructions from the employer.</p>
                  )}
                  {application.status === "assessment_sent" && !isAssessmentExpired && (
                    <p>Complete your assessment before the deadline to proceed to the next round.</p>
                  )}
                  {application.status === "assessment_completed" && (
                    <p>Your assessment has been submitted. The employer is reviewing your results.</p>
                  )}
                  {application.status === "selected" && (
                    <p>Congratulations! The employer will contact you with next steps.</p>
                  )}
                  {application.status === "rejected" && (
                    <p>Keep applying to other opportunities. Your perfect job is out there!</p>
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
