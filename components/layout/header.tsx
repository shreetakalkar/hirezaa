"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  User, 
  LogOut, 
  Settings, 
  PlusCircle, 
  Users, 
  ClipboardList,
  FileText,
  BarChart3 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import the profile components
import { JobSeekerProfile } from "@/components/profiles/job-seeker-profile";
import { RecruiterProfile } from "@/components/profiles/recruiter-profile";

const recruiterNavItems = [
  {
    title: "Dashboard",
    url: "/recruiter",
    icon: BarChart3,
  },
  {
    title: "My Jobs",
    url: "/recruiter/jobs",
    icon: Briefcase,
  },
  {
    title: "Post Job",
    url: "/recruiter/post-job",
    icon: PlusCircle,
  },
  {
    title: "Applicants",
    url: "/recruiter/applicants",
    icon: Users,
  },
  {
    title: "Assessments",
    url: "/recruiter/assessments",
    icon: ClipboardList,
  },
];

const jobSeekerNavItems = [
  {
    title: "Dashboard",
    url: "/job-seeker",
    icon: BarChart3,
  },
  {
    title: "Browse Jobs",
    url: "/jobs",
    icon: Briefcase,
  },
  {
    title: "My Applications",
    url: "/job-seeker/applications",
    icon: FileText,
  },
  {
    title: "Assessments",
    url: "/job-seeker/assessments",
    icon: ClipboardList,
  },
];

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Determine the redirect URL based on user authentication and role
  const getHomeUrl = () => {
    if (!user) {
      return "/"; // Redirect to landing page if not logged in
    }
    if (user.role === "recruiter") {
      return "/recruiter"; // Redirect to recruiter dashboard
    }
    if (user.role === "job_seeker") {
      return "/job-seeker"; // Redirect to job seeker dashboard
    }
    return "/"; // Fallback to landing page for unknown roles
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
      toast({
        title: "Success",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      console.error("Logout error:", error.message);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get navigation items based on user role
  const getNavItems = () => {
    if (!user) return [];
    return user.role === "recruiter" ? recruiterNavItems : jobSeekerNavItems;
  };

  const navItems = getNavItems();

  // Render the appropriate profile component
  const renderProfile = () => {
    if (!user) return null;
    
    if (user.role === "job_seeker") {
      return <JobSeekerProfile />;
    }
    
    if (user.role === "recruiter") {
      return <RecruiterProfile />;
    }
    
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Unknown user role</p>
      </div>
    );
  };

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={getHomeUrl()} className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <Briefcase className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Hirezaa</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.url}
                href={item.url}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 font-medium transition-colors group"
              >
                <IconComponent className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation Menu */}
        {user && (
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">Navigation</p>
                </div>
                <DropdownMenuSeparator />
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <DropdownMenuItem key={item.url} asChild className="hover:bg-gray-100">
                      <Link href={item.url} className="w-full flex items-center">
                        <IconComponent className="mr-3 h-4 w-4 text-gray-600" />
                        <span className="text-gray-700">{item.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="bg-gray-200">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-2 p-3">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <Badge variant="secondary" className="w-fit mt-1 text-xs">
                    {user.role.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                
                {/* Profile Dialog Trigger */}
                <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:bg-gray-100">
                      <User className="mr-2 h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">View Profile</span>
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Profile</DialogTitle>
                    </DialogHeader>
                    {renderProfile()}
                  </DialogContent>
                </Dialog>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="hover:bg-gray-100 text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}