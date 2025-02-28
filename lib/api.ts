import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { verifyAuth } from './apiUtils';

// Initialize Firebase Admin SDK only once
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
    console.error("Service account file not found");
    throw new Error("Service account file not found");
  }
}

const db = admin.firestore();

/**
 * Fetch all documents from a Firestore collection
 */
export const getDocuments = async (req: NextApiRequest, res: NextApiResponse, collection: string) => {
  try {
    const snapshot = await db.collection(collection).get();
    if (snapshot.empty) return res.status(404).json({ success: false, message: `No ${collection}s found` });

    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json({ success: true, data: documents });
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Create a new document in Firestore dynamically
 */
export const createDocument = async (req: NextApiRequest, res: NextApiResponse, collection: string) => {
  const { isAuthenticated } = await verifyAuth(req, res);
  if (!isAuthenticated) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    // Create a new document with auto-generated ID
    const docRef = db.collection(collection).doc();

    // Create the document
    await docRef.set(req.body);

    if (typeof res.revalidate === 'function') await res.revalidate('/');

    return res.status(201).json({
      success: true,
      message: `${collection} document created successfully`,
      id: docRef.id  // Return the new document ID
    });
  } catch (error) {
    console.error(`Error creating ${collection}:`, error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update a document in Firestore dynamically
 */
export const updateDocument = async (req: NextApiRequest, res: NextApiResponse, collection: string, id?: string) => {
  const { isAuthenticated } = await verifyAuth(req, res);
  if (!isAuthenticated) return res.status(401).json({ success: false, message: 'Unauthorized' });

  console.log("updating document...");
  try {
    // Check if an ID was provided in the URL params
    if (!id) {
      return res.status(400).json({ success: false, message: 'Document ID is required for updates' });
    }

    // Reference the specific document with the provided ID
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: `Document with ID ${id} not found` });
    } else {
      console.log(`Updating document ${id} in collection ${collection}...`);
      await docRef.update(req.body);

      // Revalidate page if function exists
      if (typeof res.revalidate === 'function') await res.revalidate('/');

      return res.status(200).json({
        success: true,
        message: `${collection} document updated successfully`,
        id: id
      });
    }
  } catch (error) {
    console.error(`Error updating ${collection}:`, error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};