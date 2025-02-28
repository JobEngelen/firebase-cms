import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Function to validate a string with max length
export const validateString = (value: any, maxLength: number = 500): string | null => {
  if (typeof value !== 'string') return null;
  if (value.length > maxLength) return null;
  return DOMPurify.sanitize(value);
};

// Function to verify user authentication
export const verifyAuth = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAuthenticated: false };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    return { isAuthenticated: true, uid: decodedToken.uid };
  } catch (error) {
    console.error('Auth verification error:', error, res);
    return { isAuthenticated: false };
  }
};

// Function to validate request body against a schema
export const validateRequestBody = <T>(
  schema: z.ZodType<T>, 
  data: any
): { success: boolean; data?: T; error?: string } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: 'Invalid data format' };
  }
};

// Generic API handler with authentication and validation
export const createProtectedApiHandler = <T>(
  schema: z.ZodType<T>,
  handler: (
    req: NextApiRequest, 
    res: NextApiResponse, 
    data: T, 
    uid: string
  ) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Verify authentication
    const { isAuthenticated, uid } = await verifyAuth(req, res);
    
    if (!isAuthenticated) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Validate request body
    const validation = validateRequestBody(schema, req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    
    // Execute handler with validated data
    try {
      await handler(req, res, validation.data as T, uid as string);
    } catch (error) {
      console.error('API handler error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
};