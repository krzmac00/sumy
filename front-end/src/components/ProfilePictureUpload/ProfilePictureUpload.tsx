import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { profileService } from '../../services/profileService';
import { getMediaUrl } from '../../utils/mediaUrl';
import './ProfilePictureUpload.css';

interface ProfilePictureUploadProps {
  currentPictureUrl?: string | null;
  onUploadSuccess: (userData: any) => void;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({ 
  currentPictureUrl, 
  onUploadSuccess 
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t('profile.picture.invalidType', 'Invalid file type. Please select JPEG, PNG, GIF or WebP.'));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(t('profile.picture.tooLarge', 'File size exceeds 5MB limit.'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Clear error
    setError(null);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await profileService.uploadProfilePicture(file);
      onUploadSuccess(response.user);
      setPreview(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.errors?.join(', ') ||
        t('profile.picture.uploadFailed', 'Failed to upload profile picture.')
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('profile.picture.confirmDelete', 'Are you sure you want to delete your profile picture?'))) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await profileService.deleteProfilePicture();
      onUploadSuccess({ 
        profile_picture_url: null, 
        profile_thumbnail_url: null 
      });
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(
        err.response?.data?.error || 
        t('profile.picture.deleteFailed', 'Failed to delete profile picture.')
      );
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="profile-picture-upload">
      <div className="upload-container">
        <div className="current-picture">
          {preview ? (
            <img src={preview} alt={t('profile.picture.preview', 'Preview')} />
          ) : currentPictureUrl ? (
            <img 
              src={getMediaUrl(currentPictureUrl) || ''} 
              alt={t('profile.picture.current', 'Current profile picture')} 
              onError={(e) => {
                console.error('Failed to load profile picture:', currentPictureUrl);
                console.error('Computed URL:', getMediaUrl(currentPictureUrl));
                // Replace with default image on error
                e.currentTarget.src = '/user_default_image.png';
              }}
            />
          ) : null}
          {!preview && !currentPictureUrl && (
            <img 
              src="/user_default_image.png" 
              alt={t('profile.picture.current', 'Current profile picture')} 
            />
          )}
        </div>

        {error && (
          <div className="upload-error">
            <p>{error}</p>
          </div>
        )}

        <div className="upload-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {preview ? (
            <>
              <button 
                onClick={handleUpload} 
                disabled={uploading}
                className="upload-button primary"
              >
                {uploading ? t('common.uploading', 'Uploading...') : t('profile.picture.upload', 'Upload')}
              </button>
              <button 
                onClick={handleCancelPreview} 
                disabled={uploading}
                className="upload-button secondary"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleButtonClick} className="upload-button primary">
                {currentPictureUrl 
                  ? t('profile.picture.change', 'Change Picture') 
                  : t('profile.picture.upload', 'Upload Picture')}
              </button>
              {currentPictureUrl && (
                <button 
                  onClick={handleDelete} 
                  disabled={uploading}
                  className="upload-button danger"
                >
                  {uploading ? t('common.deleting', 'Deleting...') : t('profile.picture.delete', 'Delete')}
                </button>
              )}
            </>
          )}
        </div>

        <div className="upload-info">
          <p>{t('profile.picture.info', 'Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP')}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;