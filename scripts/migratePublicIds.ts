// scripts/migratePublicIds.ts
import { collection, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/firebase"; // Adjust the path to your Firebase config

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function migratePublicIds() {
  try {
    // Fetch all applications
    const applicationsSnapshot = await getDocs(collection(db, "applications"));
    const updates = [];

    for (const appDoc of applicationsSnapshot.docs) {
      const appData = appDoc.data();
      if (!appData.resume) continue;

      const resumeUrl = appData.resume;
      let publicId = appData.publicId;

      if (!publicId) {
        // Extract public_id from resumeUrl
        const publicIdMatch = resumeUrl.match(/resumes\/(.+?)(?=\.\w+$|$)/);
        if (!publicIdMatch) {
          console.log(`Invalid resume URL for application ${appDoc.id}: ${resumeUrl}`);
          continue;
        }
        publicId = `resumes/${publicIdMatch[1]}`;

        // Verify if the resource exists
        try {
          const resource = await cloudinary.api.resource(publicId, {
            resource_type: "raw",
            type: "upload",
          });
          console.log(`Found resource for application ${appDoc.id}: ${resource.public_id}`);
          updates.push(
            updateDoc(doc(db, "applications", appDoc.id), {
              publicId: resource.public_id,
              updatedAt: Timestamp.fromDate(new Date()),
            })
          );
        } catch (error) {
          console.log(`Resource not found for ${publicId}, searching folder...`);
          const folderPath = "resumes";
          const searchResults = await cloudinary.api.resources({
            resource_type: "raw",
            type: "upload",
            prefix: folderPath,
            max_results: 100,
          });

          const resources = searchResults?.resources || [];
          const fileName = publicId.substring(publicId.lastIndexOf("/") + 1);
          const baseName = fileName.split(".")[0].split("_")[0];
const match = resources.find((r: { public_id: string }) => r.public_id.includes(baseName));

          if (match) {
            console.log(`Found matching resource for application ${appDoc.id}: ${match.public_id}`);
            updates.push(
              updateDoc(doc(db, "applications", appDoc.id), {
                publicId: match.public_id,
                updatedAt: Timestamp.fromDate(new Date()),
              })
            );
          } else {
            console.log(`No matching resource found for application ${appDoc.id}`);
          }
        }
      }
    }

    // Execute updates
    await Promise.all(updates);
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migratePublicIds();