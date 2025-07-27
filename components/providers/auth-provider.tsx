"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { type User as FirebaseUser, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser, JobSeeker, Recruiter, UserRole } from "@/lib/types";

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);

        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Validate that we have a valid role
            const role = userData.role as UserRole;
            if (!role || (role !== "job_seeker" && role !== "recruiter")) {
              console.error("Invalid or missing user role:", role);
              setUser(null);
              setLoading(false);
              return;
            }

            // Create base user object
            const baseUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name || "",
              role: role,
              profilePicture: userData.profilePicture,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              phone: userData.phone,
              profileComplete: userData.profileComplete ?? false,
              emailVerified: userData.emailVerified ?? false,
              isActive: userData.isActive ?? true,
              lastLoginAt: userData.lastLoginAt?.toDate() || null,
            };

            // Type-specific user creation with proper typing
            let typedUser: AppUser;
            
            if (role === "job_seeker") {
              typedUser = {
                ...baseUser,
                role: "job_seeker" as const,
                skills: userData.skills || [],
                experience: userData.experience || "",
                education: userData.education || "",
                resume: userData.resume,
                cgpa: userData.cgpa,
                location: userData.location,
                title: userData.title,
                applicationsSubmitted: userData.applicationsSubmitted ?? 0,
                profileViews: userData.profileViews ?? 0,
              } satisfies JobSeeker;
            } else {
              // role === "recruiter"
              typedUser = {
                ...baseUser,
                role: "recruiter" as const,
                company: userData.company || "",
                position: userData.position || "",
                jobsPosted: userData.jobsPosted ?? 0,
                applicationsReceived: userData.applicationsReceived ?? 0,
                activeJobs: userData.activeJobs ?? 0,
                hires: userData.hires ?? 0,
              } satisfies Recruiter;
            }

            setUser(typedUser);
          } else {
            console.error("User document not found in Firestore");
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    firebaseUser,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}