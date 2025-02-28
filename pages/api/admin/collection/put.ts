// /pages/api/admin/[collection]/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { updateDocument } from '@/lib/api';
import admin from 'firebase-admin';
import { verifyAuth } from '@/lib/apiUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { collection, id } = req.query; // Extract collection name and document ID from URL

  if (typeof collection !== 'string' || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid collection name or document ID' });
  }

  console.log(`Operation on collection: ${collection}, document: ${id}, method: ${req.method}`);

  // For PUT or PATCH, update the document
  if (req.method === 'PUT' || req.method === 'PATCH') {
    return updateDocument(req, res, collection, id);
  }

  // For DELETE, delete the document
  if (req.method === 'DELETE') {
    try {
      const { isAuthenticated } = await verifyAuth(req, res);
      if (!isAuthenticated) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const db = admin.firestore();
      await db.collection(collection).doc(id).delete();

      // Revalidate page if function exists
      if (typeof res.revalidate === 'function') await res.revalidate('/');

      return res.status(200).json({ success: true, message: `Document deleted successfully` });
    } catch (error) {
      console.error(`Error deleting document:`, error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // For GET, fetch the specific document
  if (req.method === 'GET') {
    try {
      const { isAuthenticated } = await verifyAuth(req, res);
      if (!isAuthenticated) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const db = admin.firestore();
      const doc = await db.collection(collection).doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      return res.status(200).json({
        success: true,
        data: { id: doc.id, ...doc.data() }
      });
    } catch (error) {
      console.error(`Error fetching document:`, error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}