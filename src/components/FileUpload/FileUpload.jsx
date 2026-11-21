import { useState, useRef } from 'react';
import { uploadFile, deleteUserFile } from '../../api/client';
import Icon from '../Icon/Icon';
import Button from '../Button/Button';

export default function FileUpload({ category, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category || 'general');

    setUploading(true);
    setError('');

    try {
      const result = await uploadFile(formData);
      if (result.success) {
        setFiles((prev) => [result.file, ...prev]);
        onUploadComplete?.(result.file);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleDelete(fileId) {
    setError('');
    try {
      await deleteUserFile(fileId);
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
    } catch {
      setError('Failed to delete file');
    }
  }

  function getFileIcon(mimeType) {
    if (mimeType === 'application/pdf') return 'file-pdf';
    if (mimeType?.startsWith('image/')) return 'image';
    return 'file-lines';
  }

  return (
    <section className="grid min-w-0 gap-4" aria-label="File attachments">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-primary-200 bg-primary-50/70 p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm">
          <Icon name="arrow-up" className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold text-primary-900">Add an attachment</p>
          <p className="m-0 mt-1 text-xs leading-5 text-slate-600">PDF or image · Maximum file size 10 MB</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
          loadingLabel="Uploading…"
          icon="upload"
          disabled={uploading}
        >
          Choose file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="sr-only"
          aria-label="Choose a PDF or image to upload"
        />
      </div>

      {error && <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</p>}

      {files.length > 0 && (
        <ul className="m-0 grid list-none gap-2 p-0" aria-label="Uploaded files">
          {files.map((file) => (
            <li key={file.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${file.file_mime_type === 'application/pdf' ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-700'}`}>
                <Icon name={getFileIcon(file.file_mime_type)} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{file.file_name}</span>
              <span className="shrink-0 text-xs text-slate-500">{(file.file_size / 1024).toFixed(0)} KB</span>
              <Button
                variant="ghost"
                size="sm"
                icon
                aria-label={`Delete ${file.file_name}`}
                onClick={() => handleDelete(file.id)}
              >
                <Icon name="trash" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
