import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../api/axios';
import './FileUpload.css';

const FileUpload = ({ task, onClose }) => {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('files'); // 'files' or 'links'
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  useEffect(() => {
    // Fetch task details to get attachments
    fetchAttachments();
  }, [task._id]);

  const fetchAttachments = async () => {
    try {
      const res = await API.get(`/tasks/${task._id}`);
      setAttachments(res.data.task?.attachments || []);
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await API.post(`/upload/task/${task._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('File uploaded successfully!');
      fetchAttachments();
      e.target.value = ''; // Reset input
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm('Delete this file?')) return;

    try {
      await API.delete(`/upload/task/${task._id}/file/${filename}`);
      toast.success('File deleted!');
      fetchAttachments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file');
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(linkUrl);
    } catch {
      toast.error('Please enter a valid URL (include http:// or https://)');
      return;
    }

    setUploading(true);
    try {
      const res = await API.post(`/upload/task/${task._id}/link`, {
        url: linkUrl.trim(),
        title: linkTitle.trim() || linkUrl.trim()
      });

      toast.success('Link added successfully!');
      setLinkUrl('');
      setLinkTitle('');
      fetchAttachments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add link');
      console.error('Add link error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Remove this link?')) return;

    try {
      await API.delete(`/upload/task/${task._id}/link/${linkId}`);
      toast.success('Link removed!');
      fetchAttachments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove link');
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      zip: '📦',
      rar: '📦',
      txt: '📄',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️'
    };
    return icons[ext] || '📎';
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-upload">
      <div className="upload-header">
        <h4>📁 Files & Links: {task.title}</h4>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('files')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'files' ? 'linear-gradient(to right, #14b8a6, #10b981)' : 'transparent',
            color: activeTab === 'files' ? 'white' : '#6b7280',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'files' ? 'bold' : 'normal',
            transition: 'all 0.3s',
            borderRadius: '8px 8px 0 0'
          }}
        >
          📎 Upload Files
        </button>
        <button
          onClick={() => setActiveTab('links')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'links' ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' : 'transparent',
            color: activeTab === 'links' ? 'white' : '#6b7280',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'links' ? 'bold' : 'normal',
            transition: 'all 0.3s',
            borderRadius: '8px 8px 0 0'
          }}
        >
          🔗 Share Links
        </button>
      </div>

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div className="upload-area">
          <input
            type="file"
            id="file-input"
            onChange={handleFileUpload}
            disabled={uploading}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="upload-label">
            <div className="upload-content">
              <span className="upload-icon">📤</span>
              <span className="upload-text">
                {uploading ? 'Uploading...' : 'Click to upload or drag files'}
              </span>
              <span className="upload-hint">Max 10MB | PDF, Images, Documents</span>
            </div>
          </label>
        </div>
      )}

      {/* Links Tab */}
      {activeTab === 'links' && (
        <div className="link-form" style={{ padding: '1.5rem', background: 'linear-gradient(to bottom right, #eff6ff, #f3e8ff)', borderRadius: '12px', marginBottom: '1rem' }}>
          <form onSubmit={handleAddLink} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Link URL *
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/resource"
                required
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Title (Optional)
              </label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Give this link a descriptive name"
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !linkUrl.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: uploading || !linkUrl.trim() ? '#d1d5db' : 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: uploading || !linkUrl.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {uploading ? (
                <>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></span>
                  Adding...
                </>
              ) : (
                <>🔗 Add Link</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Attachments List */}
      <div className="attachments-section">
        <h5>All Attachments ({attachments.length})</h5>
        {attachments.length === 0 ? (
          <p className="no-attachments">No files or links added yet</p>
        ) : (
          <div className="attachments-list">
            {attachments.map((att, idx) => {
              const isLink = att.type === 'link' || att.url?.startsWith('http');
              const filePart = isLink ? null : att.url?.split('/').pop();
              return (
              <div key={att._id || idx} className="attachment-item">
                <div className="attachment-info">
                  <span className="attachment-icon">{isLink ? '🔗' : getFileIcon(att.filename)}</span>
                  <div className="attachment-details">
                    <a 
                      href={isLink ? att.url : `${window.location.origin}${att.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="attachment-name"
                      style={{ color: isLink ? '#3b82f6' : 'inherit' }}
                    >
                      {att.filename || att.title || att.url}
                    </a>
                    <div className="attachment-meta">
                      {isLink && <span style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>🌐 External Link</span>}
                      {att.uploadedAt && (
                        <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-delete"
                  onClick={() => isLink ? handleDeleteLink(att._id) : handleDeleteFile(filePart)}
                  title={isLink ? "Remove link" : "Delete file"}
                >
                  🗑️
                </button>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
