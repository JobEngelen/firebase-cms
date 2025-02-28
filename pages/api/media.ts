import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import * as fs from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';
import admin from 'firebase-admin';
import { verifyAuth } from '@/lib/apiUtils';

// Configure API endpoint to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse multipart form data
const parseFormData = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      allowEmptyFiles: false,
      maxFileSize: 10_000_000, // 10MB limit
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

// Initialize Firebase Admin SDK only once
try {
  if (!admin.apps.length) {
    const serviceAccountPath = path.join(process.cwd(), 'skinpoint-nl-firebase-adminsdk-fbsvc-a35cbcf8ae.json');
    
    // Verify the service account file exists
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      
      console.log("Firebase Admin initialized successfully with service account");
    } else {
      // Fallback to environment variables if file doesn't exist
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      
      console.log("Firebase Admin initialized with environment variables");
    }
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  // Don't throw here, let the code continue to execute
  // so we can see the actual error when Firestore is accessed
}

let db: FirebaseFirestore.Firestore | null = null;
try {
  db = admin.firestore();
  console.log("Firestore initialized successfully");
} catch (error) {
  console.error("Firestore initialization error:", error);
  // Re-throw to make the error visible
  throw error;
}

const storage = admin.storage();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { isAuthenticated, uid } = await verifyAuth(req, res);
  if (!isAuthenticated) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!db) return res.status(500).json({ success: false, message: 'Firestore not initialized' });

  if (req.method === 'POST') {
    try {
      // Verify storage bucket is configured
      if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
        return res.status(500).json({ 
          success: false, 
          message: 'Storage bucket not configured in environment variables' 
        });
      }
      
      const { fields, files } = await parseFormData(req);
      
      // Check if files exist and get the first file
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      
      if (!file) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }

      // Get metadata from form fields
      const alt = Array.isArray(fields.alt) ? fields.alt[0] : fields.alt || '';
      const folder = (Array.isArray(fields.folder) ? fields.folder[0] : fields.folder) || 'media';
      
      // Generate unique filename
      const fileId = nanoid();
      const fileExt = path.extname(file.originalFilename || 'image.jpg');
      const fileName = `${fileId}${fileExt}`;
      const destination = `${folder}/${uid}/${fileName}`;

      // Read file data
      const fileData = await fs.promises.readFile(file.filepath);
      
      try {
        // Upload to Firebase Storage
        const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        const fileUpload = bucket.file(destination);
        await fileUpload.save(fileData);

        // Set metadata
        await fileUpload.setMetadata({
          contentType: file.mimetype || undefined,
        });

        // Make file publicly accessible
        await fileUpload.makePublic();
        
        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        
        try {
          // Create media document in Firestore
          const mediaRef = db.collection('media').doc();
          
          // Try-catch specifically for the Firestore operation
          await mediaRef.set({
            url: publicUrl,
            alt: alt,
          });
          
          // Clean up temporary file
          await fs.promises.rm(file.filepath);

          return res.status(201).json({
            success: true,
            id: mediaRef.id,
            url: publicUrl,
            alt: alt,
          });
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          
          // We successfully uploaded the file but failed to save to Firestore
          // Return partial success with the file URL
          return res.status(206).json({
            success: true,
            partial: true,
            message: 'File uploaded but metadata could not be saved to database',
            url: publicUrl,
            error: (firestoreError as Error).message
          });
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload file to storage', 
          error: (storageError as Error).message 
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to upload file', 
        error: (error as Error).message || String(error) 
      });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}