// pages/components/SchemaData.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import SchemaForm from './SchemaForm';
import { schemaMap } from '@/lib/schemaMap';

const SchemaData = ({ schemaName }: { schemaName: string }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const imgFormats = ["jpg", "png", "jpeg", "gif", "svg", "webp", "avif"];

  const fetchData = async () => {
    if (user) {
      setLoading(true);
      setError(null);
      const token = await user.getIdToken();
      try {
        const response = await fetch(`/api/admin/collection?collection=${schemaName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else if (response.status === 404) {
          // Collection doesn't exist yet
          setError(`No ${schemaName}s yet`);
          setData(null);
        } else {
          console.error('Failed to fetch data');
          setError('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [schemaName, user]);

  const handleCreateSuccess = () => {
    // Hide form and refetch data
    setShowForm(false);
    setEditingItem(null);
    setIsCreating(false);
    if (user) {
      fetchData();
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsCreating(false);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsCreating(true);
    setShowForm(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user || !confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/collection/put?collection=${schemaName}&id=${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchData(); // Refresh the data after deletion
      } else {
        const errorData = await response.json();
        alert(`Failed to delete: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (showForm) {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setShowForm(false)}
            className="text-blue-500 hover:text-blue-700"
          >
            ← Back to {schemaName}
          </button>
        </div>
        <SchemaForm
          schemaName={schemaName}
          schema={schemaMap[schemaName]}
          onSuccess={handleCreateSuccess}
          initialData={editingItem}
          isEditing={!isCreating}
        />
      </div>
    );
  }

  // Show creation button if no items or error
  if (error || !data || data.data.length === 0) {
    return (
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">{schemaName}</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <button
          onClick={handleCreateNew}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Create first {schemaName}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{schemaName}</h2>
        <button
          onClick={handleCreateNew}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Add New {schemaName}
        </button>
      </div>
      <div className="space-y-4">
        {data && data.data.map((item: any, index: number) => (
          <div key={item.id || index} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium">Item {index + 1}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditItem(item)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="border-t pt-2 mt-2">
              {Object.entries(item).filter(([key]) => key !== 'id').map(([key, value]) => (
                <div key={key} className="mb-2">
                  {typeof value === 'string' && value.startsWith('http') && imgFormats.some(format => value.endsWith(format)) ? (
                    <div>
                      <span className="font-medium">{key}:</span>
                      <img src={value} alt={key} className="mt-2 max-w-[300px] h-auto max-h-[300px]" />
                    </div>
                  ) : typeof value === 'object' && value !== null ? (
                    <div className="mt-2">
                      <span className="font-medium">{key}:</span>
                      <div className="pl-4 mt-1">
                        {Object.entries(value).map(([subKey, subValue]) => (
                          <div key={subKey} className="mb-1">
                            {typeof subValue === 'string' && subValue.startsWith('http') && imgFormats.some(format => subValue.endsWith(format)) ? (
                              <div>
                                <span className="font-medium">{subKey}:</span>
                                <img src={subValue as string} alt={subKey} className="mt-1 max-w-[100px] h-auto max-h-[100px]" />
                              </div>
                            ) : (
                              <div><span className="font-medium">{subKey}:</span> {String(subValue)}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div><span className="font-medium">{key}:</span> {String(value)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchemaData;