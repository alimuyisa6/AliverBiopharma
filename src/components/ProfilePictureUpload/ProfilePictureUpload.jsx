/* components/ProfilePictureUpload/ProfilePictureUpload.jsx */
import { useState, useRef } from 'react';
import Icon from '../Icon/Icon';
import { uploadProfilePicture, deleteProfilePicture } from '../../api/client';

export default function ProfilePictureUpload({ currentUrl, onUpdate, size = 80 }) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentUrl);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  async function handleUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Use JPEG, PNG, WebP, or GIF');
      return;
    }

    const formData = new FormData();

    formData.append('file', file);

    setUploading(true);
    setError('');

    try {
      const result = await uploadProfilePicture(formData);

      if (result.success) {
        setImageUrl(result.profile_picture_url);
        if (onUpdate) onUpdate(result.profile_picture_url);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleDelete() {
    if (!imageUrl) return;

    setUploading(true);

    try {
      const result = await deleteProfilePicture();
      if (result?.success === false) {
        throw new Error(result?.error || 'Failed to delete');
      }

      setImageUrl(null);
      if (onUpdate) onUpdate(null);
    } catch (err) {
      setError(err?.message || 'Failed to delete');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 shadow-sm" style={{ width: size, height: size }}>
        {imageUrl ? (
          <img src={imageUrl} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-700">
            <Icon name="user" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Icon name="camera" /> Upload
        </button>

        {imageUrl && (
          <button className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60" onClick={handleDelete} disabled={uploading}>
            <Icon name="trash" /> Remove
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          className="block w-full max-w-sm cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-100 file:px-3 file:py-2 file:font-semibold file:text-primary-800 hover:file:bg-primary-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
        />
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    </div>
  );
} 
