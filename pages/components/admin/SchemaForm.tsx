// pages/components/SchemaForm.tsx
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/lib/useAuth';
import MediaModal from './MediaModal';

// Helper function to get default values based on schema
const getDefaultValues = (schema: z.ZodType<any>, initialData?: any) => {
  if (initialData) return { ...initialData };
  
  const shape = (schema as any)._def?.shape;
  if (!shape) return {};

  const defaults: Record<string, any> = {};

  Object.entries(shape).forEach(([key, value]: [string, any]) => {
    // Skip id field as it will be auto-generated
    if (key === 'id') return;

    const def = value._def;

    // Handle different types
    if (def.typeName === 'ZodString') {
      defaults[key] = '';
    } else if (def.typeName === 'ZodNumber') {
      defaults[key] = 0;
    } else if (def.typeName === 'ZodBoolean') {
      defaults[key] = false;
    } else if (def.typeName === 'ZodArray') {
      defaults[key] = [];
    } else if (def.typeName === 'ZodObject') {
      // For nested objects like MediaSchema
      defaults[key] = getDefaultValues(value);
    } else if (def.typeName === 'ZodOptional') {
      // Handle optional fields
      const innerType = def.innerType;
      if (innerType._def.typeName === 'ZodString') {
        defaults[key] = '';
      } else if (innerType._def.typeName === 'ZodNumber') {
        defaults[key] = 0;
      } else if (innerType._def.typeName === 'ZodBoolean') {
        defaults[key] = false;
      } else if (innerType._def.typeName === 'ZodObject') {
        defaults[key] = getDefaultValues(innerType);
      }
    } else if (def.typeName === 'ZodUnion') {
      // Handle union types (like category in TreatmentSchema)
      const options = def.options;
      if (options.some((opt: any) => opt._def.typeName === 'ZodString')) {
        defaults[key] = '';
      } else {
        defaults[key] = {};
      }
    }
  });

  return defaults;
};

// Helper to check if a schema is a MediaSchema by examining its shape
const isMediaSchema = (value: any): boolean => {
  if (!value || typeof value !== 'object') return false;

  // Get the shape, handling both direct objects and optional wrappers
  const shape = value.shape;

  if (!shape) return false;

  // Check for the signature fields of MediaSchema (url and alt)
  return Boolean(shape.url && shape.alt);
};

// Helper to handle optional schemas
const getActualSchema = (value: any): any => {
  if (!value) return null;

  if (value._def.typeName === 'ZodOptional') {
    return value._def.innerType;
  }

  return value;
};

interface SchemaFormProps {
  schemaName: string;
  schema: z.ZodType<any>;
  onSuccess: () => void;
  initialData?: any;
  isEditing?: boolean;
}

const SchemaForm: React.FC<SchemaFormProps> = ({ 
  schemaName, 
  schema, 
  onSuccess, 
  initialData = null,
  isEditing = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMediaField, setCurrentMediaField] = useState<string | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Initialize form data with initial values or defaults
  useEffect(() => {
    setFormData(getDefaultValues(schema, initialData));
  }, [schema, initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parentField: string, field: string, value: any) => {
    setFormData((prev: { [x: string]: any; }) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate with Zod schema
      const validatedData = schema.parse(formData);

      // Submit to API
      if (user) {
        const token = await user.getIdToken();
        
        const url = isEditing && formData.id 
          ? `${`/api/admin/collection/put?collection=${schemaName}`}&id=${formData.id}` 
          : `/api/admin/collection?collection=${schemaName}`;
          
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validatedData),
        });

        if (response.ok) {
          onSuccess();
        } else {
          const errorData = await response.json();
          setError(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} document`);
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Format Zod validation errors
        const errors = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        setError(`Validation error: ${errors}`);
      } else {
        setError('An error occurred while submitting the form');
        console.error('Form submission error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const openMediaModal = (fieldName: string) => {
    setCurrentMediaField(fieldName);
    setIsMediaModalOpen(true);
  };

  const handleMediaSelect = (media: any) => {
    if (currentMediaField) {
      handleChange(currentMediaField, media);
    }
    setIsMediaModalOpen(false);
    setCurrentMediaField(null);
  };

  // Render a preview of the selected media
  const renderMediaPreview = (media: any) => {
    if (!media || !media.url) return null;

    return (
      <div className="mt-2 border rounded p-2">
        <div className="h-24 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
          <img
            src={media.url}
            alt={media.alt || 'Media preview'}
            className="max-h-full object-contain"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate">
          {media.alt || 'No description'}
        </p>
      </div>
    );
  };

  // Recursively render form fields based on schema
  const renderFields = () => {
    if (!formData) return null;
    
    const shape = (schema as any).shape;
    if (!shape) return null;

    return Object.entries(shape).map(([key, value]: [string, any]) => {
      // Skip id field as it will be auto-generated or kept from existing data
      if (key === 'id') return null;

      const def = value._def;
      const isRequired = def.typeName !== 'ZodOptional';

      // Get the actual schema (handling optional fields)
      const actualSchema = getActualSchema(value);

      // Check if this field is a MediaSchema object
      if (def.typeName === 'ZodObject' || (def.typeName === 'ZodOptional' && def.innerType._def.typeName === 'ZodObject')) {
        // This is an object field, check if it's a MediaSchema
        if (isMediaSchema(actualSchema)) {
          return (
            <div key={key} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key} (Media) {isRequired && <span className="text-red-500">*</span>}
              </label>
              <button
                type="button"
                onClick={() => openMediaModal(key)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
              >
                {formData[key]?.url ? 'Change Media' : 'Select Media'}
              </button>
              {formData[key] && renderMediaPreview(formData[key])}
            </div>
          );
        }
      }

      // Handle different field types
      if (def.typeName === 'ZodString') {
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {key} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={formData[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={isRequired}
            />
          </div>
        );
      } else if (def.typeName === 'ZodNumber') {
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {key} {isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={formData[key] || 0}
              onChange={(e) => handleChange(key, parseFloat(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={isRequired}
            />
          </div>
        );
      } else if (def.typeName === 'ZodBoolean') {
        return (
          <div key={key} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData[key] || false}
                onChange={(e) => handleChange(key, e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">{key}</span>
            </label>
          </div>
        );
      } else if (def.typeName === 'ZodObject' || (def.typeName === 'ZodOptional' && def.innerType._def.typeName === 'ZodObject')) {
        // Handle regular objects (non-MediaSchema)
        const nestedShape = def.typeName === 'ZodOptional'
          ? def.innerType._def.shape
          : def.shape;

        return (
          <div key={key} className="mb-4 p-4 border border-gray-200 rounded">
            <h3 className="text-md font-medium mb-2">{key}</h3>
            {Object.entries(nestedShape).map(([nestedKey, nestedValue]: [string, any]) => {
              const nestedDef = nestedValue._def;
              const nestedRequired = nestedDef.typeName !== 'ZodOptional';

              // Handle different nested field types
              if (nestedDef.typeName === 'ZodString') {
                return (
                  <div key={`${key}-${nestedKey}`} className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {nestedKey} {nestedRequired && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={(formData[key] && formData[key][nestedKey]) || ''}
                      onChange={(e) => handleNestedChange(key, nestedKey, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={nestedRequired}
                    />
                  </div>
                );
              } else if (nestedDef.typeName === 'ZodNumber') {
                return (
                  <div key={`${key}-${nestedKey}`} className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {nestedKey} {nestedRequired && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      value={(formData[key] && formData[key][nestedKey]) || 0}
                      onChange={(e) => handleNestedChange(key, nestedKey, parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={nestedRequired}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      } else if (def.typeName === 'ZodArray') {
        // For arrays, we'll just show a placeholder for now 
        // A full implementation would need to handle array items dynamically
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {key} (Array) {isRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={JSON.stringify(formData[key] || [])}
              onChange={(e) => {
                try {
                  const value = JSON.parse(e.target.value);
                  handleChange(key, value);
                } catch (err) {
                  // Invalid JSON, keep the raw text
                  console.error('Invalid JSON input for array field', err);
                }
              }}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter array items as JSON"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter array items in JSON format. Example: [{'"name": "Item 1", "url": "/item1"'}, {'"name": "Item 2", "url": "/item2"'}]
            </p>
          </div>
        );
      } else if (def.typeName === 'ZodUnion') {
        // For union types like string | TreatmentCategorySchema
        // We'll provide a text input for simplicity
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {key} (Union) {isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={typeof formData[key] === 'string' ? formData[key] : JSON.stringify(formData[key])}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={isRequired}
            />
            <p className="text-sm text-gray-500 mt-1">
              For object values, enter as JSON string
            </p>
          </div>
        );
      }

      return null;
    });
  };

  if (!formData) return <div>Loading form...</div>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-6">
        {isEditing ? `Edit ${schemaName}` : `Create ${schemaName}`}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {renderFields()}

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? `Update ${schemaName}` : `Create ${schemaName}`)}
          </button>
        </div>
      </form>

      {isMediaModalOpen && (
        <MediaModal
          isOpen={isMediaModalOpen}
          onClose={() => {
            setIsMediaModalOpen(false);
            setCurrentMediaField(null);
          }}
          onSelect={handleMediaSelect}
        />
      )}
    </div>
  );
};

export default SchemaForm;