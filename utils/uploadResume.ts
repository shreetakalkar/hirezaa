// utils/uploadResume.ts
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function uploadResume(file: File, userId: string, applicationId: string) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "job_resumes");
    formData.append("folder", "resumes");

    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${result.error?.message || "Unknown error"}`);
    }

    const publicId = result.public_id; // e.g., "resumes/filename_abc123"
    const secureUrl = result.secure_url;

    // Update Firebase with the correct public_id
    await updateDoc(doc(db, "applications", applicationId), {
      resume: secureUrl,
      publicId: publicId,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return { publicId, secureUrl };
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw error;
  }
}