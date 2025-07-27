// "use client";

// import { useAuth } from "@/components/providers/auth-provider";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Loader2, AlertCircle } from "lucide-react";
// import Link from "next/link";

// // Import the profile components
// import { JobSeekerProfile } from "@/components/profiles/job-seeker-profile";
// import { RecruiterProfile } from "@/components/profiles/recruiter-profile";

// export function ProfileView() {
//   const { user, loading } = useAuth();

//   // 1. Show loading spinner
//   if (loading) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <Card>
//           <CardContent className="p-8 text-center">
//             <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
//             <p className="text-gray-500">Loading profile...</p>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // 2. Not logged in - redirect to auth
//   if (!user) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <Card>
//           <CardContent className="p-8 text-center space-y-4">
//             <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
//             <div>
//               <p className="text-gray-900 font-medium mb-2">Authentication Required</p>
//               <p className="text-gray-500 mb-4">You need to be logged in to view your profile.</p>
//             </div>
//             <div className="flex justify-center gap-3">
//               <Button asChild variant="outline">
//                 <Link href="/auth/login">Login</Link>
//               </Button>
//               <Button asChild>
//                 <Link href="/auth/register">Sign Up</Link>
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // 3. Render profile based on user role - using the same pattern as your Header component
//   if (user.role === "job_seeker") {
//     return <JobSeekerProfile />;
//   }

//   if (user.role === "recruiter") {
//     return <RecruiterProfile />;
//   }

//   // 4. Fallback for unknown roles
//   return (
//     <div className="container mx-auto px-4 py-8">
//       <Card>
//         <CardContent className="p-8 text-center space-y-4">
//           <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
//           <div>
//             <p className="text-gray-900 font-medium mb-2">Unknown User Role</p>
//             <p className="text-gray-500 mb-4">
//               User role "{user.role}" is not recognized. Please contact support.
//             </p>
//           </div>
//           <Button asChild variant="outline">
//             <Link href="/">Go Home</Link>
//           </Button>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// export default ProfileView;