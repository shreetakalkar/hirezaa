"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Edit,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { isJobSeeker, type JobSeeker } from "@/lib/types";

export function JobSeekerProfile() {
  const { user } = useAuth();

  if (!user || !isJobSeeker(user)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Unable to load profile information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Now TypeScript knows user is JobSeeker type
  const jobSeekerUser = user;

  const toDate = (value: any): Date => {
    try {
      if (!value) return new Date(0);
      return value instanceof Date ? value : new Date(value);
    } catch {
      return new Date(0);
    }
  };

  const formatDate = (value: any): string => {
    if (!value) return "Not available";
    const date = toDate(value);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTimeAgo = (value: any): string => {
    if (!value) return "Never";
    const date = toDate(value);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={jobSeekerUser.profilePicture || "/placeholder.svg"} 
                  alt={jobSeekerUser.name || "Job Seeker"} 
                />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                  {jobSeekerUser.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "JS"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {jobSeekerUser.name || "Unnamed Job Seeker"}
                  </h1>
                  <Badge variant={jobSeekerUser.profileComplete ? "default" : "secondary"} className="w-fit">
                    {jobSeekerUser.profileComplete ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Profile Complete
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Profile Incomplete
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline" className="w-fit">
                    <Briefcase className="w-3 h-3 mr-1" />
                    Job Seeker
                  </Badge>
                </div>
                
                {jobSeekerUser.title && (
                  <p className="text-lg text-gray-600 font-medium">{jobSeekerUser.title}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Joined {formatDate(jobSeekerUser.createdAt)}</span>
                  </div>
                  {jobSeekerUser.lastLoginAt && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Last active {getTimeAgo(jobSeekerUser.lastLoginAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button asChild>
                <Link href="/job-seeker/profile/edit">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{jobSeekerUser.email || "Not available"}</p>
                </div>
              </div>
              
              {jobSeekerUser.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{jobSeekerUser.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Search Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Job Search Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {jobSeekerUser.applicationsSubmitted ?? 0}
                  </p>
                  <p className="text-sm text-gray-600">Applications Submitted</p>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {jobSeekerUser.profileViews ?? 0}
                  </p>
                  <p className="text-sm text-gray-600">Profile Views</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Account Status</span>
                <Badge variant={jobSeekerUser.isActive ? "default" : "secondary"}>
                  {jobSeekerUser.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Education</p>
                <p className="font-medium text-lg">
                  {jobSeekerUser.education || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Experience</p>
                <p className="font-medium text-lg">
                  {jobSeekerUser.experience || "Not specified"}
                </p>
              </div>
              {jobSeekerUser.cgpa && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">CGPA</p>
                  <p className="font-medium text-lg">{jobSeekerUser.cgpa}</p>
                </div>
              )}
              {jobSeekerUser.location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-medium text-lg">{jobSeekerUser.location}</p>
                </div>
              )}
            </div>
            
            {jobSeekerUser.skills && jobSeekerUser.skills.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {jobSeekerUser.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Resume</span>
              <Badge variant={jobSeekerUser.resume ? "default" : "secondary"}>
                {jobSeekerUser.resume ? "Uploaded" : "Not uploaded"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Account Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Profile Created</span>
              <span className="text-sm font-medium">{formatDate(jobSeekerUser.createdAt)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium">{formatDate(jobSeekerUser.updatedAt)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Last Login</span>
              <span className="text-sm font-medium">
                {jobSeekerUser.lastLoginAt ? getTimeAgo(jobSeekerUser.lastLoginAt) : "Never"}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Email Verified</span>
              <Badge
                variant={jobSeekerUser.emailVerified ? "default" : "destructive"}
                className="text-xs"
              >
                {jobSeekerUser.emailVerified ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}