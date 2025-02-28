import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/useAuth';
import { schemaMap } from '@/lib/schemaMap';
import SchemaData from '../components/admin/SchemaData';

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }

    console.log("user = ", user, "loading = ", loading);
  }, [user, loading, router]);

  // Handle revalidation of pages
  const handleRevalidate = async () => {
    try {
      const response = await fetch('/api/revalidate', { method: 'POST' });
      if (response.ok) {
        alert('Pages revalidated successfully!');
      } else {
        alert('Failed to revalidate pages.');
      }
    } catch (error) {
      console.error('Revalidation error:', error);
      alert('An error occurred while revalidating pages.');
    }
  };

  // Show loading state while checking auth status
  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Administrator paneel</h2>
          <ul className="mt-4">
            {Object.keys(schemaMap).map((schemaName) => (
              <li key={schemaName} className="mb-2">
                <button
                  onClick={() => setSelectedSchema(schemaName)}
                  className="w-full text-left p-2 hover:bg-gray-200 rounded"
                >
                  {schemaName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">CMS Dashboard</h1>
          <button
            onClick={handleRevalidate}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Revalidate Pages
          </button>
        </div>

        {/* Schema Data */}
        <div>
          {selectedSchema && (
            <SchemaData schemaName={selectedSchema} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;