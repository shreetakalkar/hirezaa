// pages/api/cloudinary/sign-download.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { public_id } = await request.json();

    console.log("Received public_id:", public_id);

    if (!public_id || typeof public_id !== "string" || !public_id.startsWith("resumes/")) {
      return NextResponse.json({ error: "Invalid public_id format" }, { status: 400 });
    }

    let resourceExists = false;
    let actualResourceData: any = null;

    // Try fetching resource with exact public_id
    try {
      actualResourceData = await cloudinary.api.resource(public_id, {
        resource_type: "raw",
        type: "upload",
      });
      resourceExists = true;
      console.log("Found resource with exact public_id:", public_id);
    } catch (error) {
      console.log("Exact public_id not found, attempting to search...");
    }

    // If not found, search for similar resources in the resumes folder
    if (!resourceExists) {
      try {
        const folderPath = "resumes";
        const searchResults = await cloudinary.api.resources({
          resource_type: "raw",
          type: "upload",
          prefix: folderPath,
          max_results: 100,
        });

        const resources = searchResults?.resources || [];
        console.log("Resources found in folder:", resources.map((r: any) => r.public_id));

        // Extract the base filename (without extension or unique suffix)
        const fileName = public_id.substring(public_id.lastIndexOf("/") + 1);
        const baseName = fileName.split(".")[0].split("_")[0];

        // Find a resource that matches the base filename
        const possibleMatches = resources.filter((resource: any) => resource.public_id.includes(baseName));

        if (possibleMatches.length > 0) {
          actualResourceData = possibleMatches[0]; // Use the first match
          resourceExists = true;
          console.log("Found matching resource:", actualResourceData.public_id);
        }
      } catch (searchError) {
        console.error("Error searching for resources:", searchError);
      }
    }

    if (!resourceExists || !actualResourceData) {
      return NextResponse.json(
        {
          error: "Resume file not found",
          details: `No file found for public_id: ${public_id}`,
          suggestion: "The file may have been deleted or the public_id is incorrect",
        },
        { status: 404 }
      );
    }

    const actualPublicId = actualResourceData.public_id;
    const timestamp = Math.round(Date.now() / 1000) + 3600; // 1 hour expiry

    // Generate signed URL
    const signedUrl = cloudinary.utils.private_download_url(actualPublicId, "pdf", {
      resource_type: "raw",
      type: "upload",
      expires_at: timestamp,
      attachment: true,
    });

    console.log("Generated signed URL:", signedUrl);

    return NextResponse.json({
      signedUrl,
      expiresAt: new Date(timestamp * 1000).toISOString(),
      actualPublicId,
      originalPublicId: public_id,
    });
  } catch (error: any) {
    console.error("Cloudinary API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate signed URL",
        details: error.message,
        httpCode: error.http_code || 500,
        cloudinaryError: error.error || null,
      },
      { status: error.http_code || 500 }
    );
  }
}