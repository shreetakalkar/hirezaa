"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Building,
  Users,
  Calendar,
  Star,
  TrendingUp,
  Zap,
  CheckCircle2,
  ArrowUpDown,
  X,
  Heart,
  Bookmark,
  ExternalLink,
  Target,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job } from "@/lib/types";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Variants, Transition } from "framer-motion";

// Animation variants with explicit typing
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    } as Transition,
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    } as Transition,
  },
};

const cardHover: Variants = {
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    } as Transition,
  },
};

const jobTypes = [
  { id: "full-time", label: "Full Time", icon: Briefcase },
  { id: "part-time", label: "Part Time", icon: Clock },
  { id: "contract", label: "Contract", icon: Users },
  { id: "internship", label: "Internship", icon: Star },
];

const experienceLevels = [
  { id: "entry", label: "Entry Level (0-2 years)", min: 0, max: 2 },
  { id: "mid", label: "Mid Level (2-5 years)", min: 2, max: 5 },
  { id: "senior", label: "Senior Level (5+ years)", min: 5, max: 20 },
];

const salaryRanges = [
  { id: "0-50k", label: "Under $50K", min: 0, max: 50000 },
  { id: "50k-100k", label: "$50K - $100K", min: 50000, max: 100000 },
  { id: "100k-150k", label: "$100K - $150K", min: 100000, max: 150000 },
  { id: "150k+", label: "$150K+", min: 150000, max: 999999 },
];

const sortOptions = [
  { value: "newest", label: "Newest First", icon: Calendar },
  { value: "oldest", label: "Oldest First", icon: Calendar },
  { value: "salary-high", label: "Salary: High to Low", icon: TrendingUp },
  { value: "salary-low", label: "Salary: Low to High", icon: DollarSign },
  { value: "deadline", label: "Deadline: Soonest", icon: Clock },
  { value: "relevance", label: "Most Relevant", icon: Target },
];

export default function JobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [remoteOnly, setRemoteOnly] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      console.log("Fetching jobs from Firestore...");
      setError(null);

      let jobsQuery = query(
        collection(db, "jobs"),
        where("status", "==", "active"),
        orderBy("postedAt", "desc")
      );
      let jobsSnapshot = await getDocs(jobsQuery);

      let jobsData: Job[] = jobsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          postedAt: data.postedAt?.toDate() || new Date(),
          deadline: data.deadline?.toDate() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        } as Job;
      });

      if (jobsData.length === 0) {
        console.log("No active jobs found, fetching all jobs...");
        jobsQuery = query(collection(db, "jobs"));
        jobsSnapshot = await getDocs(jobsQuery);
        jobsData = jobsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            postedAt: data.postedAt?.toDate() || new Date(),
            deadline: data.deadline?.toDate() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: data.status || "active",
          } as Job;
        });
      }

      console.log("Fetched jobs:", jobsData);
      setJobs(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load jobs. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((job) => {
        const searchableText = [
          job.title,
          job.company,
          job.description,
          job.location,
          ...job.skills,
          ...(job.requirements || []),
        ]
          .join(" ")
          .toLowerCase();
        return searchableText.includes(searchLower);
      });
    }

    if (locationFilter.trim()) {
      const locationLower = locationFilter.toLowerCase().trim();
      filtered = filtered.filter((job) => job.location.toLowerCase().includes(locationLower));
    }

    if (remoteOnly) {
      filtered = filtered.filter((job) => job.location.toLowerCase().includes("remote"));
    }

    if (selectedJobTypes.length > 0) {
      filtered = filtered.filter((job) => selectedJobTypes.includes(job.type));
    }

    if (selectedExperience.length > 0) {
      filtered = filtered.filter((job) => {
        return selectedExperience.some((expId) => {
          const expLevel = experienceLevels.find((level) => level.id === expId);
          if (!expLevel) return false;
          return job.experience.min <= expLevel.max && job.experience.max >= expLevel.min;
        });
      });
    }

if (selectedSalaryRanges.length > 0) {
  filtered = filtered.filter((job) => {
    if (!job.salary) return false;
    const salary = job.salary; // Local variable to aid type narrowing
    return selectedSalaryRanges.some((rangeId) => {
      const range = salaryRanges.find((r) => r.id === rangeId);
      if (!range) return false;
      return salary.min <= range.max && salary.max >= range.min;
    });
  });
}
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime());
        break;
      case "salary-high":
        filtered.sort((a, b) => (b.salary?.max || 0) - (a.salary?.max || 0));
        break;
      case "salary-low":
        filtered.sort((a, b) => (a.salary?.min || Infinity) - (b.salary?.min || Infinity));
        break;
      case "deadline":
        filtered.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
        break;
      case "relevance":
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase();
          filtered.sort((a, b) => {
            const aMatches =
              (a.title.toLowerCase().includes(searchLower) ? 2 : 0) +
              (a.skills.some((skill) => skill.toLowerCase().includes(searchLower)) ? 1 : 0);
            const bMatches =
              (b.title.toLowerCase().includes(searchLower) ? 2 : 0) +
              (b.skills.some((skill) => skill.toLowerCase().includes(searchLower)) ? 1 : 0);
            return bMatches - aMatches;
          });
        } else {
          filtered.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
        }
        break;
    }

    return filtered;
  }, [jobs, searchTerm, locationFilter, selectedJobTypes, selectedExperience, selectedSalaryRanges, sortBy, remoteOnly]);

  const handleJobTypeChange = (jobType: string, checked: boolean | "indeterminate") => {
    if (typeof checked === "boolean") {
      setSelectedJobTypes((prev) => (checked ? [...prev, jobType] : prev.filter((type) => type !== jobType)));
    }
  };

  const handleExperienceChange = (experience: string, checked: boolean | "indeterminate") => {
    if (typeof checked === "boolean") {
      setSelectedExperience((prev) => (checked ? [...prev, experience] : prev.filter((exp) => exp !== experience)));
    }
  };

  const handleSalaryRangeChange = (rangeId: string, checked: boolean | "indeterminate") => {
    if (typeof checked === "boolean") {
      setSelectedSalaryRanges((prev) => (checked ? [...prev, rangeId] : prev.filter((range) => range !== rangeId)));
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setSelectedJobTypes([]);
    setSelectedExperience([]);
    setSelectedSalaryRanges([]);
    setSortBy("newest");
    setRemoteOnly(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (locationFilter.trim()) count++;
    if (selectedJobTypes.length > 0) count++;
    if (selectedExperience.length > 0) count++;
    if (selectedSalaryRanges.length > 0) count++;
    if (remoteOnly) count++;
    return count;
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]));
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    return date.toLocaleDateString();
  };

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const diffInDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffInDays);
  };

  const getDeadlineStatus = (deadline: Date) => {
    const days = getDaysUntilDeadline(deadline);
    if (days === 0) return { text: "Today", color: "text-red-600", bg: "bg-red-50" };
    if (days <= 3) return { text: `${days} days left`, color: "text-orange-600", bg: "bg-orange-50" };
    if (days <= 7) return { text: `${days} days left`, color: "text-yellow-600", bg: "bg-yellow-50" };
    return { text: `${days} days left`, color: "text-gray-600", bg: "bg-gray-50" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-teal-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div>
              <p className="text-gray-600 animate-pulse">Finding perfect opportunities for you...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-teal-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="shadow-lg border-teal-100">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Jobs</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">{error}</p>
              <Button
                onClick={fetchJobs}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.div
            className="lg:w-80 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" } as Transition}
          >
            <Card className="shadow-lg bg-white/90 backdrop-blur-sm border-teal-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-lg text-gray-900">Filters</h3>
                    {getActiveFiltersCount() > 0 && (
                      <Badge className="bg-teal-100 text-teal-700">{getActiveFiltersCount()}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Search Jobs</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Job title, company, skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="City, state, or remote"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote-only"
                        checked={remoteOnly}
                        onCheckedChange={(checked) => {
                          if (typeof checked === "boolean") {
                            setRemoteOnly(checked);
                          }
                        }}
                      />
                      <label htmlFor="remote-only" className="text-sm text-gray-600">
                        Remote only
                      </label>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-700">Job Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {jobTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <div key={type.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={type.id}
                              checked={selectedJobTypes.includes(type.id)}
                              onCheckedChange={(checked) => handleJobTypeChange(type.id, checked)}
                            />
                            <label htmlFor={type.id} className="text-sm flex items-center space-x-1 cursor-pointer">
                              <Icon className="w-3 h-3 text-gray-500" />
                              <span>{type.label}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-700">Experience Level</label>
                    {experienceLevels.map((level) => (
                      <div key={level.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={level.id}
                          checked={selectedExperience.includes(level.id)}
                          onCheckedChange={(checked) => handleExperienceChange(level.id, checked)}
                        />
                        <label htmlFor={level.id} className="text-sm cursor-pointer">{level.label}</label>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-700">Salary Range</label>
                    {salaryRanges.map((range) => (
                      <div key={range.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={range.id}
                          checked={selectedSalaryRanges.includes(range.id)}
                          onCheckedChange={(checked) => handleSalaryRangeChange(range.id, checked)}
                        />
                        <label htmlFor={range.id} className="text-sm cursor-pointer flex items-center">
                          <DollarSign className="w-3 h-3 text-gray-500 mr-1" />
                          {range.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600 mb-1">{jobs.length}</div>
                  <div className="text-sm text-gray-600">Total Jobs Available</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Jobs List */}
          <div className="flex-1 space-y-6">
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-teal-100"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {filteredJobs.length} Job{filteredJobs.length !== 1 ? "s" : ""} Found
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  Discover your next career opportunity
                </p>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-52 border-gray-200 focus:border-teal-500">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </motion.div>

            {getActiveFiltersCount() > 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                <Card className="bg-teal-50/50 border-teal-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {searchTerm && (
                          <Badge variant="secondary" className="bg-white">
                            Search: {searchTerm}
                            <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSearchTerm("")} />
                          </Badge>
                        )}
                        {locationFilter && (
                          <Badge variant="secondary" className="bg-white">
                            Location: {locationFilter}
                            <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocationFilter("")} />
                          </Badge>
                        )}
                        {selectedJobTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="bg-white">
                            {jobTypes.find((jt) => jt.id === type)?.label}
                            <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleJobTypeChange(type, false)} />
                          </Badge>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {filteredJobs.length === 0 ? (
              <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                <Card className="shadow-lg border-teal-100">
                  <CardContent className="text-center py-16">
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="h-10 w-10 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                      Try adjusting your search criteria or explore our recommended opportunities below.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={clearFilters}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear Filters
                      </Button>
                      <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                        <Bell className="w-4 h-4 mr-2" />
                        Set Job Alert
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
                {filteredJobs.map((job) => {
                  const deadlineStatus = getDeadlineStatus(job.deadline);
                  const isUrgent = getDaysUntilDeadline(job.deadline) <= 3;
                  const isSaved = savedJobs.includes(job.id);

                  return (
                    <motion.div
                      key={job.id}
                      variants={{ ...fadeInUp, ...cardHover }}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <Card
                        className={`group hover:shadow-2xl transition-all duration-500 transform border-teal-100 bg-white/90 backdrop-blur-sm ${
                          isUrgent ? "ring-2 ring-orange-200" : ""
                        }`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-12 h-12 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                      <Building className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                                        {job.title}
                                      </h3>
                                      <p className="text-sm text-gray-600">{job.company}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge className="bg-teal-100 text-teal-700">
                                      {jobTypes.find((type) => type.id === job.type)?.label || job.type}
                                    </Badge>
                                    <Badge className="bg-gray-100 text-gray-700">{job.location}</Badge>
                                    {job.salary && (
                                      <Badge className="bg-green-100 text-green-700">
                                        {job.salary.currency} {job.salary.min.toLocaleString()} -{" "}
                                        {job.salary.max.toLocaleString()}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {job.skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="border-teal-200 text-teal-600">
                                    {skill}
                                  </Badge>
                                ))}
                                {job.skills.length > 3 && (
                                  <Badge variant="outline" className="border-teal-200 text-teal-600">
                                    +{job.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>Posted {getTimeAgo(job.postedAt)}</span>
                                  <span className={`ml-2 px-2 py-1 rounded-full ${deadlineStatus.bg} ${deadlineStatus.color}`}>
                                    {deadlineStatus.text}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleSaveJob(job.id)}
                                    className={isSaved ? "text-teal-600" : "text-gray-500"}
                                  >
                                    <Bookmark className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    asChild
                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                  >
                                    <Link href={`/jobs/${job.id}`}>
                                      Apply Now
                                      <ExternalLink className="w-4 h-4 ml-1" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}