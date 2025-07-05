import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { API_CONFIG } from '@/config/api';

interface Props {
  doctorId: string;
  profilePictureUrl: string | null;
  onPictureChange: () => void;
}

const MAX_SIZE = 2.5 * 1024 * 1024; // 2.5MB

const DoctorProfilePicture: React.FC<Props> = ({ doctorId, profilePictureUrl, onPictureChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > MAX_SIZE) {
      setError('File size must be less than 2.5MB');
      return;
    }

    console.log('Uploading file:', file);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to upload a profile picture');
      setLoading(false);
      return;
    }

    try {
      console.log('Making upload request to:', API_CONFIG.DOCTORS.PROFILE_PICTURE(doctorId));
      const res = await fetch(API_CONFIG.DOCTORS.PROFILE_PICTURE(doctorId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Upload response:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      });
      
      if (res.ok) {
        onPictureChange();
      } else {
        const text = await res.text();
        console.log('Upload failed response:', text);
        setError(`Failed to upload profile picture: ${text}`);
      }
    } catch (err) {
      console.error('Upload error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to delete the profile picture');
      setLoading(false);
      return;
    }

    try {
      console.log('Making delete request to:', API_CONFIG.DOCTORS.PROFILE_PICTURE(doctorId));
      const res = await fetch(API_CONFIG.DOCTORS.PROFILE_PICTURE(doctorId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      });
      
      if (res.ok) {
        onPictureChange();
      } else {
        const text = await res.text();
        console.log('Delete failed response:', text);
        setError(`Failed to delete profile picture: ${text}`);
      }
    } catch (err) {
      console.error('Delete error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = () => {
    const token = localStorage.getItem('token');
    if (!profilePictureUrl || !token) return null;
    
    const url = new URL(`${API_CONFIG.USER_APPOINTMENT_BASE_URL}${profilePictureUrl}`);
    url.searchParams.append('token', token);
    return url.toString();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {profilePictureUrl ? (
        <img
          src={getImageUrl()}
          alt="Profile"
          className="w-64 h-72 rounded-lg object-cover border-2 border-gray-200"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
            console.error('Failed to load profile picture');
          }}
        />
      ) : (
        <div className="w-64 h-72 rounded-lg bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-5xl">?</span>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Buttons side by side below the picture */}
      <div className="flex gap-3 mt-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="relative flex-1"
        >
          {loading ? (
            <>
              <span className="opacity-0">Change Picture</span>
              <span className="absolute inset-0 flex items-center justify-center">
                Uploading...
              </span>
            </>
          ) : (
            'Change Picture'
          )}
        </Button>

        {profilePictureUrl && (
          <Button 
            size="default" 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
            className="relative flex-1"
          >
            {loading ? (
              <>
                <span className="opacity-0">Delete Picture</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  Deleting...
                </span>
              </>
            ) : (
              'Delete Picture'
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2 text-center max-w-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default DoctorProfilePicture;
