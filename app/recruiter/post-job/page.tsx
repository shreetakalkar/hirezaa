"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { X, Plus, Loader2 } from "lucide-react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import type { Job } from "@/lib/types"

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
]

const topicOptions = [
  "Data Structures",
  "Algorithms",
  "System Design",
  "Database Design",
  "Web Development",
  "Mobile Development",
  "Machine Learning",
  "DevOps",
  "Cloud Computing",
  "Security",
  "Testing",
  "API Development",
  "Frontend Development",
  "Backend Development",
]

export default function PostJobPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    requirements: [] as string[],
    location: "",
    type: "full-time" as Job["type"],
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    numberOfOpenings: 1,
    shortlistMultiplier: 2,
    skills: [] as string[],
    experienceMin: 0,
    experienceMax: 5,
    deadline: "",
    enableAssessment: false,
    mcqCount: 10,
    codingCount: 2,
    sqlCount: 1,
    timeLimit: 60,
    assessmentTopics: [] as string[],
  })

  const [newRequirement, setNewRequirement] = useState("")
  const [newSkill, setNewSkill] = useState("")

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()],
      })
      setNewRequirement("")
    }
  }

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    })
  }

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
      })
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    })
  }

  const addTopic = (topic: string) => {
    if (!formData.assessmentTopics.includes(topic)) {
      setFormData({
        ...formData,
        assessmentTopics: [...formData.assessmentTopics, topic],
      })
    }
  }

  const removeTopic = (topic: string) => {
    setFormData({
      ...formData,
      assessmentTopics: formData.assessmentTopics.filter((t) => t !== topic),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError("")

    try {
      const jobData: Omit<Job, "id"> = {
        title: formData.title,
        company: formData.company,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        type: formData.type,
        salary:
          formData.salaryMin && formData.salaryMax
            ? {
                min: Number.parseInt(formData.salaryMin),
                max: Number.parseInt(formData.salaryMax),
                currency: formData.currency,
              }
            : undefined,
        numberOfOpenings: formData.numberOfOpenings,
        shortlistMultiplier: formData.shortlistMultiplier,
        skills: formData.skills,
        experience: {
          min: formData.experienceMin,
          max: formData.experienceMax,
        },
        postedBy: user.id,
        postedAt: new Date(),
        deadline: new Date(formData.deadline),
        status: "active",
        assessmentConfig: formData.enableAssessment
          ? {
              mcqCount: formData.mcqCount,
              codingCount: formData.codingCount,
              sqlCount: formData.sqlCount,
              timeLimit: formData.timeLimit,
              topics: formData.assessmentTopics,
            }
          : undefined,
      }

      const docRef = await addDoc(collection(db, "jobs"), jobData)

      toast({
        title: "Job posted successfully!",
        description: "Your job posting is now live and accepting applications.",
      })

      router.push(`/recruiter/jobs/${docRef.id}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-screen p-6 md:p-8 w-full">
        <div className="w-full h-full flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Post New Job</h1>
            <p className="text-gray-600">Create a new job posting to attract top talent</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about the job position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Senior Software Engineer"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      placeholder="e.g. Tech Corp"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="min-h-[150px] w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g. San Francisco, CA or Remote"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Job Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: Job["type"]) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label htmlFor="deadline">Application Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
                <CardDescription>List the key requirements for this position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2 w-full">
                  <Input
                    placeholder="Add a requirement..."
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                  />
                  <Button type="button" onClick={addRequirement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.requirements.length > 0 && (
                  <div className="space-y-2">
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{req}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeRequirement(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills & Experience */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Skills & Experience</CardTitle>
                <CardDescription>Define the technical skills and experience level required</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Required Skills</Label>
                  <Select onValueChange={addSkill}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skills..." />
                    </SelectTrigger>
                    <SelectContent>
                      {skillOptions
                        .filter((skill) => !formData.skills.includes(skill))
                        .map((skill) => (
                          <SelectItem key={skill} value={skill}>
                            {skill}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experienceMin">Minimum Experience (years)</Label>
                    <Input
                      id="experienceMin"
                      type="number"
                      min="0"
                      value={formData.experienceMin}
                      onChange={(e) => setFormData({ ...formData, experienceMin: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experienceMax">Maximum Experience (years)</Label>
                    <Input
                      id="experienceMax"
                      type="number"
                      min="0"
                      value={formData.experienceMax}
                      onChange={(e) => setFormData({ ...formData, experienceMax: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compensation & Openings */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Compensation & Openings</CardTitle>
                <CardDescription>Salary range and number of positions available</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin">Minimum Salary</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      placeholder="50000"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salaryMax">Maximum Salary</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      placeholder="80000"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfOpenings">Number of Openings *</Label>
                    <Input
                      id="numberOfOpenings"
                      type="number"
                      min="1"
                      value={formData.numberOfOpenings}
                      onChange={(e) =>
                        setFormData({ ...formData, numberOfOpenings: Number.parseInt(e.target.value) || 1 })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortlistMultiplier">Shortlist Multiplier *</Label>
                    <Input
                      id="shortlistMultiplier"
                      type="number"
                      min="1"
                      step="0.1"
                      value={formData.shortlistMultiplier}
                      onChange={(e) =>
                        setFormData({ ...formData, shortlistMultiplier: Number.parseFloat(e.target.value) || 2 })
                      }
                      required
                    />
                    <p className="text-xs text-gray-500">Candidates to shortlist = Number of openings × Multiplier</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Configuration */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Assessment Configuration</CardTitle>
                <CardDescription>Configure automated technical assessments for candidates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableAssessment"
                    checked={formData.enableAssessment}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableAssessment: checked as boolean })}
                  />
                  <Label htmlFor="enableAssessment">Enable automated assessment</Label>
                </div>

                {formData.enableAssessment && (
                  <>
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mcqCount">MCQ Questions</Label>
                        <Input
                          id="mcqCount"
                          type="number"
                          min="0"
                          value={formData.mcqCount}
                          onChange={(e) => setFormData({ ...formData, mcqCount: Number.parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="codingCount">Coding Questions</Label>
                        <Input
                          id="codingCount"
                          type="number"
                          min="0"
                          value={formData.codingCount}
                          onChange={(e) =>
                            setFormData({ ...formData, codingCount: Number.parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sqlCount">SQL Questions</Label>
                        <Input
                          id="sqlCount"
                          type="number"
                          min="0"
                          value={formData.sqlCount}
                          onChange={(e) => setFormData({ ...formData, sqlCount: Number.parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                        <Input
                          id="timeLimit"
                          type="number"
                          min="15"
                          value={formData.timeLimit}
                          onChange={(e) => setFormData({ ...formData, timeLimit: Number.parseInt(e.target.value) || 60 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Assessment Topics</Label>
                      <Select onValueChange={addTopic}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select topics..." />
                        </SelectTrigger>
                        <SelectContent>
                          {topicOptions
                            .filter((topic) => !formData.assessmentTopics.includes(topic))
                            .map((topic) => (
                              <SelectItem key={topic} value={topic}>
                                {topic}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {formData.assessmentTopics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.assessmentTopics.map((topic) => (
                            <Badge
                              key={topic}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => removeTopic(topic)}
                            >
                              {topic}
                              <X className="ml-1 h-3 w-3" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4 w-full">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Job
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}