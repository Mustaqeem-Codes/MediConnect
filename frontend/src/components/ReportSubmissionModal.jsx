import { useState } from 'react';
import '../styles/ReportSubmissionModal.css';

const ReportSubmissionModal = ({ appointmentId, patientName, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    treatmentSummary: '',
    medicalReport: '',
    medicines: '',
    prescriptions: '',
    recommendations: ''
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== selectedFiles.length) {
      setError('Some files were skipped. Only images and PDFs under 10MB are allowed.');
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.treatmentSummary.trim()) {
      setError('Treatment summary is required');
      return;
    }

    if (!formData.medicalReport.trim()) {
      setError('Medical report is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        appointmentId,
        treatmentSummary: formData.treatmentSummary.trim(),
        medicalReport: formData.medicalReport.trim(),
        medicines: formData.medicines
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
        prescriptions: formData.prescriptions.trim(),
        recommendations: formData.recommendations.trim(),
        files
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mc-report-modal-overlay" onClick={onClose}>
      <div className="mc-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mc-report-modal__header">
          <div>
            <h2>Submit Medical Report</h2>
            <p className="mc-report-modal__subtitle">
              Patient: <strong>{patientName}</strong>
            </p>
          </div>
          <button
            type="button"
            className="mc-report-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mc-report-modal__form">
          {error && (
            <div className="mc-report-modal__error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <div className="mc-report-modal__field">
            <label htmlFor="treatmentSummary">Treatment Summary *</label>
            <textarea
              id="treatmentSummary"
              name="treatmentSummary"
              value={formData.treatmentSummary}
              onChange={handleInputChange}
              placeholder="Describe the treatment provided..."
              rows={3}
              required
            />
          </div>

          <div className="mc-report-modal__field">
            <label htmlFor="medicalReport">Medical Report / Analysis *</label>
            <textarea
              id="medicalReport"
              name="medicalReport"
              value={formData.medicalReport}
              onChange={handleInputChange}
              placeholder="Detailed medical analysis and findings..."
              rows={4}
              required
            />
          </div>

          <div className="mc-report-modal__field">
            <label htmlFor="medicines">Medicines (comma-separated)</label>
            <input
              type="text"
              id="medicines"
              name="medicines"
              value={formData.medicines}
              onChange={handleInputChange}
              placeholder="e.g., Paracetamol 500mg, Omeprazole 20mg"
            />
          </div>

          <div className="mc-report-modal__field">
            <label htmlFor="prescriptions">Prescriptions</label>
            <textarea
              id="prescriptions"
              name="prescriptions"
              value={formData.prescriptions}
              onChange={handleInputChange}
              placeholder="Prescription details..."
              rows={2}
            />
          </div>

          <div className="mc-report-modal__field">
            <label htmlFor="recommendations">Recommendations / Tests / Advice</label>
            <textarea
              id="recommendations"
              name="recommendations"
              value={formData.recommendations}
              onChange={handleInputChange}
              placeholder="Follow-up recommendations, tests ordered, lifestyle advice..."
              rows={2}
            />
          </div>

          <div className="mc-report-modal__field">
            <label>Attachments (Optional)</label>
            <div className="mc-report-modal__upload-area">
              <input
                type="file"
                id="fileUpload"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="mc-report-modal__file-input"
              />
              <label htmlFor="fileUpload" className="mc-report-modal__upload-label">
                <span className="mc-report-modal__upload-icon">📎</span>
                <span>Drop files or click to upload</span>
                <span className="mc-report-modal__upload-hint">
                  Images & PDFs up to 10MB
                </span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mc-report-modal__file-list">
                {files.map((file, index) => (
                  <div key={index} className="mc-report-modal__file-item">
                    <span className="mc-report-modal__file-icon">
                      {file.type.startsWith('image/') ? '🖼' : '📄'}
                    </span>
                    <span className="mc-report-modal__file-name">{file.name}</span>
                    <span className="mc-report-modal__file-size">
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      className="mc-report-modal__file-remove"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mc-report-modal__actions">
            <button
              type="button"
              className="mc-report-modal__btn mc-report-modal__btn--cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="mc-report-modal__btn mc-report-modal__btn--submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mc-report-modal__spinner" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportSubmissionModal;
