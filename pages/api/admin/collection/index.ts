// /pages/api/admin/[collection].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDocuments, createDocument } from '@/lib/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { collection } = req.query; // Extract collection name from URL

  if (typeof collection !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid collection name' });
  }

  if (req.method === 'GET') return getDocuments(req, res, collection);
  if (req.method === 'POST') return createDocument(req, res, collection);

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}