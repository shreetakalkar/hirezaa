"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Mail, Phone, Calendar, Building2, Briefcase,
  Edit, CheckCircle, Clock, Target
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { isRecruiter, type Recruiter } from "@/lib/types";

export function RecruiterProfile() {
  const { user } = useAuth();

  if (!user || !isRecruiter(user)) {
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

  // Now TypeScript knows user is Recruiter type
  const recruiterUser = user;

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
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={recruiterUser.profilePicture || "/placeholder.svg"}
                  alt={recruiterUser.name || "Recruiter"}
                />
                <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
                  {recruiterUser.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "RR"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{recruiterUser.name || "Unnamed Recruiter"}</h1>

                  <Badge variant={recruiterUser.profileComplete ? "default" : "secondary"} className="w-fit">
                    {recruiterUser.profileComplete ? (
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
                    Recruiter
                  </Badge>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  {recruiterUser.position && (
                    <p className="text-lg text-gray-600 font-medium">{recruiterUser.position}</p>
                  )}
                  {recruiterUser.company && (
                    <div className="flex items-center text-gray-600">
                      <Building2 className="w-4 h-4 mr-1" />
                      <span className="font-medium">{recruiterUser.company}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Joined {formatDate(recruiterUser.createdAt)}</span>
                  </div>
                  {recruiterUser.lastLoginAt && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Last active {getTimeAgo(recruiterUser.lastLoginAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button asChild>
                <Link href="/recruiter/profile/edit">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Info */}
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
                  <p className="font-medium">{recruiterUser.email || "Not available"}</p>
                </div>
              </div>

              {recruiterUser.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{recruiterUser.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recruitment Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Recruitment Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{recruiterUser.jobsPosted ?? 0}</p>
                  <p className="text-sm text-gray-600">Jobs Posted</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{recruiterUser.applicationsReceived ?? 0}</p>
                  <p className="text-sm text-gray-600">Applications Received</p>
                </div>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Active Jobs</span>
                <span className="font-medium">{recruiterUser.activeJobs ?? 0}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Successful Hires</span>
                <span className="font-medium">{recruiterUser.hires ?? 0}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Account Status</span>
                <Badge variant={recruiterUser.isActive ? "default" : "secondary"}>
                  {recruiterUser.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Company Name</p>
                <p className="font-medium text-lg">{recruiterUser.company || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Position</p>
                <p className="font-medium text-lg">{recruiterUser.position || "Not specified"}</p>
              </div>
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
              <span className="text-sm font-medium">{formatDate(recruiterUser.createdAt)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium">{formatDate(recruiterUser.updatedAt)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Last Login</span>
              <span className="text-sm font-medium">
                {recruiterUser.lastLoginAt ? getTimeAgo(recruiterUser.lastLoginAt) : "Never"}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Email Verified</span>
              <Badge
                variant={recruiterUser.emailVerified ? "default" : "destructive"}
                className="text-xs"
              >
                {recruiterUser.emailVerified ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}