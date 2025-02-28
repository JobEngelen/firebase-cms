// pages/api/revalidate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Implement revalidation logic here
      // For example, using Next.js's `res.revalidate` method
      await Promise.all([
        res.revalidate('/'),
        res.revalidate('/about'),
        // Add more paths as needed
      ]);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Revalidation error:', error);
      res.status(500).json({ success: false, error: 'Failed to revalidate pages' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}