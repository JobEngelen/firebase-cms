import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { MediaSchema } from '@/lib/schemas';
import { useAuth } from '@/lib/useAuth';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: z.infer<typeof MediaSchema>) => void;
}

type MediaItem = z.infer<typeof MediaSchema>;

const MediaModal: React.FC<MediaModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('existing');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  // Fetch existing media
  useEffect(() => {
    if (isOpen && user) {
      fetchMediaItems();
    }
  }, [isOpen, user]);

  // Generate preview for selected file
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const fetchMediaItems = async () => {
    if (!user) return;
    
    setIsLoadingMedia(true);
    setError(null);
    
    try {
      const mediaRef = collection(db, 'media');
      const mediaQuery = query(
        mediaRef,
      );
      
      const snapshot = await getDocs(mediaQuery);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MediaItem[];
      
      setMediaItems(items);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError('Failed to load media items.');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await user?.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', alt);
      formData.append('folder', 'media');

      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const media = await response.json();
        
        // Create a media item from the response
        const newMedia: MediaItem = {
          id: media.id || crypto.randomUUID(),
          url: media.url,
          alt: alt,
        };
        
        // Add to the list of media items
        setMediaItems(prev => [newMedia, ...prev]);
        
        // Select the newly uploaded item
        onSelect(newMedia);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to upload file.');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExisting = (media: MediaItem) => {
    onSelect(media);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">Media Library</h2>
        
        {/* Tab navigation */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 mr-2 ${activeTab === 'existing' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('existing')}
          >
            Select Existing
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'upload' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload New
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Upload tab content */}
        {activeTab === 'upload' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Upload File</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp, image/avif"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            {preview && (
              <div className="mb-4">
                <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <img src={preview} alt="Preview" className="max-h-full object-contain" />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Alt Text</label>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Describe the image for accessibility"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        {/* Existing media tab content */}
        {activeTab === 'existing' && (
          <div>
            {isLoadingMedia ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No media items found.</p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="mt-2 text-blue-500 hover:underline"
                >
                  Upload your first image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-1">
                {mediaItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="border rounded overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => handleSelectExisting(item)}
                  >
                    <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={item.url} 
                        alt={item.alt || 'Media item'} 
                        className="object-cover h-full w-full" 
                      />
                    </div>
                    <div className="p-2 text-xs text-gray-500 truncate" title={item.alt || ''}>
                      {item.alt || 'No description'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaModal;