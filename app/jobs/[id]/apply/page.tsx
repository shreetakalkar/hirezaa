"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { X, Upload, FileText, Loader2, AlertCircle, CheckCircle, Calendar, MapPin, Building2, Clock, Users, Star } from "lucide-react"
import { doc, getDoc, addDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import type { Job, Application, JobSeeker } from "@/lib/types"

const skillOptions = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "Git",
  "HTML",
  "CSS",
  "Angular",
  "Vue.js",
  "Express.js",
  "Django",
  "Spring Boot",
  "Machine Learning",
  "Data Science",
  "DevOps",
  "Microservices",
  "GraphQL",
  "REST API",
  "Firebase",
  "TensorFlow",
  "Pandas",
  "NumPy",
  "Scikit-learn",
  "React Native",
  "Flutter",
  "Swift",
  "Kotlin",
  "Go",
  "Rust",
  "PHP",
  "Laravel",
  "Symfony",
  "Ruby on Rails",
  "ASP.NET",
  "C#",
  "Unity",
  "Unreal Engine",
  "Blockchain",
  "Solidity",
  "Ethereum",
  "Redis",
  "Elasticsearch",
  "Apache Kafka",
  "RabbitMQ",
  "Jenkins",
  "GitLab CI",
  "Terraform",
  "Ansible",
  "Linux",
  "Windows Server",
  "Nginx",
  "Apache",
]

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "ddcxoowcv"
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

// Helper function to safely convert Firestore Timestamp to Date
const safeToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date()
  if (timestamp instanceof Timestamp) return timestamp.toDate()
  if (timestamp.toDate && typeof timestamp.toDate === 'function') return timestamp.toDate()
  if (timestamp instanceof Date) return timestamp
  if (typeof timestamp === 'string') return new Date(timestamp)
  return new Date()
}

// Helper function to format deadline
const formatDeadline = (date: Date): string => {
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return "Expired"
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays <= 7) return `${diffDays} days left`
  return date.toLocaleDateString()
}

export default function ApplyJobPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [error, setError] = useState("")
  const [skillsFilter, setSkillsFilter] = useState("")

  const [formData, setFormData] = useState({
    cgpa: "",
    skills: [] as string[],
    coverLetter: "",
    resumeFile: null as File | null,
    agreeToTerms: false,
  })

  const [existingApplication, setExistingApplication] = useState<Application | null>(null)
  const [userProfile, setUserProfile] = useState<JobSeeker | null>(null)

  useEffect(() => {
    if (user && jobId) {
      fetchData()
    }
  }, [user, jobId])

  const fetchData = async () => {
    if (!user) return

    try {
      // Fetch job details
      const jobDoc = await getDoc(doc(db, "jobs", jobId))
      if (jobDoc.exists()) {
        const jobData = jobDoc.data()
        const job = {
          id: jobDoc.id,
          ...jobData,
          postedAt: safeToDate(jobData.postedAt),
          deadline: safeToDate(jobData.deadline),
        } as Job
        setJob(job)

        // Check if deadline has passed
        if (new Date() > job.deadline) {
          setError("The application deadline for this job has passed.")
          return
        }
      } else {
        setError("Job not found.")
        return
      }

      // Check if user has already applied
      const applicationQuery = query(
        collection(db, "applications"),
        where("jobId", "==", jobId),
        where("userId", "==", user.id),
      )
      const applicationSnapshot = await getDocs(applicationQuery)
      if (!applicationSnapshot.empty) {
        const appData = applicationSnapshot.docs[0].data()
        setExistingApplication({
          ...appData,
          id: applicationSnapshot.docs[0].id,
          appliedAt: safeToDate(appData.appliedAt),
          updatedAt: safeToDate(appData.updatedAt),
        } as Application)
        return
      }

      // Fetch user profile to pre-fill form
      const userDoc = await getDoc(doc(db, "users", user.id))
      if (userDoc.exists()) {
        const userData = userDoc.data() as JobSeeker
        setUserProfile(userData)

        // Pre-fill form with existing data
        setFormData((prev) => ({
          ...prev,
          cgpa: userData.cgpa?.toString() || "",
          skills: userData.skills || [],
        }))
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load job details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        })
        return
      }

      setFormData((prev) => ({ ...prev, resumeFile: file }))
    }
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Cloudinary upload preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.")
    }

    setUploadingResume(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      formData.append("folder", `resumes/${user!.id}`)
      formData.append("resource_type", "raw")
      
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      formData.append("public_id", fileName)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Cloudinary upload error:", errorData)
        throw new Error(errorData.error?.message || `Upload failed with status: ${response.status}`)
      }

      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error("Cloudinary upload error:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to upload resume. Please try again.")
    } finally {
      setUploadingResume(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !job) return

    setSubmitting(true)
    setError("")

    try {
      // Validation
      if (!formData.cgpa || Number.parseFloat(formData.cgpa) < 0 || Number.parseFloat(formData.cgpa) > 10) {
        throw new Error("Please enter a valid CGPA between 0 and 10.")
      }

      if (formData.skills.length === 0) {
        throw new Error("Please select at least one skill.")
      }

      if (!formData.resumeFile && !userProfile?.resume) {
        throw new Error("Please upload your resume.")
      }

      if (!formData.agreeToTerms) {
        throw new Error("Please agree to the terms and conditions.")
      }

      // Upload resume if new file is provided
      let resumeUrl = userProfile?.resume || ""
      if (formData.resumeFile) {
        try {
          resumeUrl = await uploadToCloudinary(formData.resumeFile)
          toast({
            title: "Resume uploaded successfully",
            description: "Your resume has been uploaded. Submitting application...",
          })
        } catch (uploadError: any) {
          throw new Error(uploadError.message || "Failed to upload resume")
        }
      }

      // Create application
      const applicationData: Omit<Application, "id"> = {
        jobId: job.id,
        userId: user.id,
        cgpa: Number.parseFloat(formData.cgpa),
        skills: formData.skills,
        resume: resumeUrl,
        coverLetter: formData.coverLetter || undefined,
        status: "applied",
        appliedAt: new Date(),
        updatedAt: new Date(),
      }

      await addDoc(collection(db, "applications"), applicationData)

      toast({
        title: "Application submitted successfully!",
        description: "Your application has been sent to the employer. You'll be notified of any updates.",
      })

      router.push(`/jobs/${job.id}`)
    } catch (error: any) {
      console.error("Application submission error:", error)
      setError(error.message)
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Filter skills based on search
  const filteredSkills = skillOptions.filter(skill => 
    skill.toLowerCase().includes(skillsFilter.toLowerCase())
  )

  // Calculate skills match percentage
  const skillsMatchPercentage = job?.skills?.length 
    ? (formData.skills.filter((skill) => job.skills.includes(skill)).length / job.skills.length) * 100
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading job details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
            <CardContent className="text-center py-12">
              <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Apply</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <a href="/jobs">Browse Other Jobs</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (existingApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-green-200 bg-green-50">
            <CardContent className="text-center py-12">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Already Applied</h3>
              <p className="text-gray-600 mb-4">
                You have already applied for this position on {existingApplication.appliedAt.toLocaleDateString()}.
              </p>
              <div className="mb-6">
                <Badge 
  variant={["selected", "shortlisted"].includes(existingApplication.status) ? 'default' : 'outline'} 
  className="text-sm px-3 py-1"
>
  Status: {existingApplication.status.replace("_", " ").toUpperCase()}
</Badge>

              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <a href={`/jobs/${job?.id}`}>View Job</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/job-seeker/applications/${existingApplication.id}`}>View Application</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="pt-8 pb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-3">Apply for {job.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-blue-100 mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{job.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline: {formatDeadline(job.deadline)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {job.type.replace("-", " ").toUpperCase()}
                    </Badge>
                    {job.salary && (
  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
    ₹{job.salary.min} - ₹{job.salary.max} {job.salary.currency}
  </Badge>
)}

                  </div>
                </div>
                <div className="text-center lg:text-right">
                  <div className="text-2xl font-bold mb-1">{skillsMatchPercentage.toFixed(0)}%</div>
                  <div className="text-sm text-blue-100">Skills Match</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="border-red-300 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic information for this application</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                    <Input 
                      id="name" 
                      value={user?.name || ""} 
                      disabled 
                      className="bg-gray-50 border-gray-200" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={user?.email || ""} 
                      disabled 
                      className="bg-gray-50 border-gray-200" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cgpa" className="text-sm font-semibold">CGPA *</Label>
                  <Input
                    id="cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 8.5"
                    value={formData.cgpa}
                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                    required
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500">Enter your CGPA on a scale of 10</p>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  Skills *
                </CardTitle>
                <CardDescription>Select the skills that match this job requirement</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <Input
                    placeholder="Search skills..."
                    value={skillsFilter}
                    onChange={(e) => setSkillsFilter(e.target.value)}
                    className="max-w-sm"
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {filteredSkills.map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={formData.skills.includes(skill)}
                          onCheckedChange={() => handleSkillToggle(skill)}
                        />
                        <Label htmlFor={skill} className="text-sm cursor-pointer">
                          {skill}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {formData.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-3">Selected Skills ({formData.skills.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100 transition-colors"
                            onClick={() => handleSkillToggle(skill)}
                          >
                            {skill}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resume Upload */}
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Resume *
                </CardTitle>
                <CardDescription>Upload your latest resume (PDF or Word document, max 5MB)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {userProfile?.resume && !formData.resumeFile && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      We'll use your existing resume from your profile. You can upload a new one if needed.
                      <Button variant="link" className="p-0 h-auto ml-2 text-blue-600" asChild>
                        <a href={userProfile.resume} target="_blank" rel="noopener noreferrer">
                          View Current Resume
                        </a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 transition-colors hover:border-blue-400 hover:bg-blue-50">
                  <div className="text-center">
                    {uploadingResume ? (
                      <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
                    ) : (
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="mt-4">
                      <Label htmlFor="resume" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {uploadingResume 
                            ? "Uploading resume..." 
                            : formData.resumeFile 
                              ? formData.resumeFile.name 
                              : "Click to upload your resume"
                          }
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">PDF, DOC, DOCX up to 5MB</span>
                      </Label>
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploadingResume}
                      />
                    </div>
                  </div>
                </div>

                {formData.resumeFile && (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <span className="text-sm font-medium text-green-800">{formData.resumeFile.name}</span>
                        <p className="text-xs text-green-600">{(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, resumeFile: null })}
                      disabled={uploadingResume}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cover Letter */}
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50">
                <CardTitle>Cover Letter</CardTitle>
                <CardDescription>Tell us why you're interested in this position (optional)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Write a brief cover letter explaining your interest in this position and how your skills align with the requirements..."
                  rows={8}
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">{formData.coverLetter.length}/1000 characters</p>
              </CardContent>
            </Card>

            {/* Enhanced Skills Match */}
            {job.skills && job.skills.length > 0 && (
              <Card className="shadow-md">
                <CardHeader className="bg-gray-50">
                  <CardTitle>Skills Match Analysis</CardTitle>
                  <CardDescription>How your skills align with job requirements</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Overall Match</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {formData.skills.filter((skill) => job.skills.includes(skill)).length} of {job.skills.length} skills
                      </span>
                    </div>

                    <Progress value={skillsMatchPercentage} className="h-3" />
                    
                    <div className="text-center">
                      <span className={`text-lg font-bold ${
                        skillsMatchPercentage >= 80 ? 'text-green-600' : 
                        skillsMatchPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {skillsMatchPercentage.toFixed(0)}% Match
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Matching Skills ({formData.skills.filter((skill) => job.skills.includes(skill)).length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills
                          .filter((skill) => job.skills.includes(skill))
                          .map((skill) => (
                            <Badge key={skill} className="bg-green-100 text-green-800 border-green-300">
                              {skill}
                            </Badge>
                          ))}
                        {formData.skills.filter((skill) => job.skills.includes(skill)).length === 0 && (
                          <p className="text-sm text-gray-500">No matching skills yet</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Missing Skills ({job.skills.filter((skill) => !formData.skills.includes(skill)).length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {job.skills
                          .filter((skill) => !formData.skills.includes(skill))
                          .map((skill) => (
                            <Badge 
                              key={skill} 
                              variant="outline" 
                              className="border-orange-300 text-orange-700 hover:bg-orange-50 cursor-pointer"
                              onClick={() => handleSkillToggle(skill)}
                            >
                              {skill}
                            </Badge>
                          ))}
                        {job.skills.filter((skill) => !formData.skills.includes(skill)).length === 0 && (
                          <p className="text-sm text-green-600 font-medium">All required skills selected! 🎉</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assessment Information */}
            {job.assessmentConfig && (
              <Card className="shadow-md border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Clock className="h-5 w-5" />
                    Assessment Information
                  </CardTitle>
                  <CardDescription>This position requires completing a technical assessment</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      If your application is shortlisted, you'll receive an email with a link to complete the technical
                      assessment. The assessment includes:
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li><strong>{job.assessmentConfig.mcqCount}</strong> Multiple Choice Questions</li>
                        <li><strong>{job.assessmentConfig.codingCount}</strong> Coding Problems</li>
                        <li><strong>{job.assessmentConfig.sqlCount}</strong> SQL Questions</li>
                        <li><strong>Time Limit:</strong> {job.assessmentConfig.timeLimit} minutes</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Terms and Conditions */}
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                    required
                    className="mt-1"
                  />
                  <div className="grid gap-2 leading-relaxed">
                    <Label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      I agree to the terms and conditions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      By submitting this application, I confirm that the information provided is accurate and complete.
                      I understand that any false information may result in the rejection of my application or termination of employment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Submit Section */}
            <Card className="shadow-lg border-blue-200">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Ready to submit your application?</h3>
                    <p className="text-sm text-gray-600">
                      Make sure you've filled out all required fields and uploaded your resume.
                    </p>
                    {skillsMatchPercentage < 50 && (
                      <p className="text-sm text-amber-600 mt-1">
                        ⚠️ Consider adding more relevant skills to improve your match percentage.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.back()}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting || uploadingResume || !formData.agreeToTerms}
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {(submitting || uploadingResume) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {uploadingResume ? "Uploading Resume..." : submitting ? "Submitting Application..." : "Submit Application"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Application Tips */}
          <Card className="shadow-md bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-800">💡 Application Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-purple-700 mb-2">Improve Your Chances:</h4>
                  <ul className="space-y-1 text-purple-600">
                    <li>• Match as many required skills as possible</li>
                    <li>• Write a compelling cover letter</li>
                    <li>• Ensure your resume is up-to-date</li>
                    <li>• Double-check your CGPA is accurate</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-700 mb-2">What Happens Next:</h4>
                  <ul className="space-y-1 text-purple-600">
                    <li>• You'll receive a confirmation email</li>
                    <li>• HR will review your application</li>
                    <li>• You may be invited for an assessment</li>
                    <li>• Updates will be sent via email</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}