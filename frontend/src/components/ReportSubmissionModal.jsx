import { useState } from 'react';
import '../styles/ReportSubmissionModal.css';

// Common diagnosis codes (simplified ICD-10 subset)
const COMMON_DIAGNOSES = [
  { code: 'J00', name: 'Acute nasopharyngitis (Common cold)' },
  { code: 'J06.9', name: 'Acute upper respiratory infection' },
  { code: 'J18.9', name: 'Pneumonia, unspecified' },
  { code: 'K30', name: 'Dyspepsia (Indigestion)' },
  { code: 'R50.9', name: 'Fever, unspecified' },
  { code: 'R51', name: 'Headache' },
  { code: 'M54.5', name: 'Low back pain' },
  { code: 'I10', name: 'Essential hypertension' },
  { code: 'E11.9', name: 'Type 2 diabetes mellitus' },
  { code: 'J45.909', name: 'Asthma, unspecified' },
  { code: 'K21.0', name: 'GERD with esophagitis' },
  { code: 'N39.0', name: 'Urinary tract infection' },
  { code: 'L30.9', name: 'Dermatitis, unspecified' },
  { code: 'F41.9', name: 'Anxiety disorder, unspecified' },
  { code: 'G43.909', name: 'Migraine, unspecified' }
];

const FREQUENCY_OPTIONS = [
  'Once daily (OD)',
  'Twice daily (BD)',
  'Three times daily (TDS)',
  'Four times daily (QDS)',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed (PRN)',
  'Before meals',
  'After meals',
  'At bedtime'
];

const DURATION_OPTIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '21 days',
  '1 month',
  '2 months',
  '3 months',
  'Ongoing',
  'As directed'
];

const ReportSubmissionModal = ({ appointmentId, patientName, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    treatmentSummary: '',
    medicalReport: '',
    clinicalFindings: '',
    patientInstructions: '',
    prescriptions: '',
    recommendations: ''
  });
  
  // Structured diagnosis array
  const [diagnoses, setDiagnoses] = useState([]);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  
  // Structured medication array
  const [medications, setMedications] = useState([
    { drug_name: '', dosage: '', frequency: '', duration: '' }
  ]);
  
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('diagnosis');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Diagnosis handlers
  const addDiagnosis = (diagnosis) => {
    if (!diagnoses.find(d => d.code === diagnosis.code)) {
      setDiagnoses([...diagnoses, { ...diagnosis, type: 'icd10' }]);
    }
    setDiagnosisSearch('');
  };

  const addCustomDiagnosis = () => {
    if (customDiagnosis.trim()) {
      setDiagnoses([...diagnoses, { 
        code: `CUSTOM-${Date.now()}`, 
        name: customDiagnosis.trim(), 
        type: 'custom' 
      }]);
      setCustomDiagnosis('');
    }
  };

  const removeDiagnosis = (code) => {
    setDiagnoses(diagnoses.filter(d => d.code !== code));
  };

  const filteredDiagnoses = COMMON_DIAGNOSES.filter(d => 
    d.name.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(diagnosisSearch.toLowerCase())
  );

  // Medication handlers
  const addMedication = () => {
    setMedications([...medications, { drug_name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024;
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

    // Filter out empty medications
    const validMedications = medications.filter(m => m.drug_name.trim());

    setIsSubmitting(true);

    try {
      await onSubmit({
        appointmentId,
        treatmentSummary: formData.treatmentSummary.trim(),
        medicalReport: formData.medicalReport.trim(),
        // Legacy field - convert medications to simple array for backward compat
        medicines: validMedications.map(m => 
          `${m.drug_name} ${m.dosage} ${m.frequency} ${m.duration}`.trim()
        ),
        prescriptions: formData.prescriptions.trim(),
        recommendations: formData.recommendations.trim(),
        // New structured EHR fields
        diagnosis: diagnoses,
        medication_array: validMedications,
        clinical_findings: formData.clinicalFindings.trim(),
        patient_instructions: formData.patientInstructions.trim(),
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
      <div className="mc-report-modal mc-report-modal--ehr" onClick={(e) => e.stopPropagation()}>
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

        {/* Tab Navigation */}
        <div className="mc-report-modal__tabs">
          <button
            type="button"
            className={`mc-report-modal__tab ${activeTab === 'diagnosis' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnosis')}
          >
            Diagnosis
          </button>
          <button
            type="button"
            className={`mc-report-modal__tab ${activeTab === 'medications' ? 'active' : ''}`}
            onClick={() => setActiveTab('medications')}
          >
            Medications
          </button>
          <button
            type="button"
            className={`mc-report-modal__tab ${activeTab === 'clinical' ? 'active' : ''}`}
            onClick={() => setActiveTab('clinical')}
          >
            Clinical Notes
          </button>
          <button
            type="button"
            className={`mc-report-modal__tab ${activeTab === 'attachments' ? 'active' : ''}`}
            onClick={() => setActiveTab('attachments')}
          >
            Attachments
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mc-report-modal__form">
          {error && (
            <div className="mc-report-modal__error">
              <span>⚠</span>
              {error}
            </div>
          )}

          {/* Diagnosis Tab */}
          {activeTab === 'diagnosis' && (
            <div className="mc-report-modal__section">
              <h3>Diagnosis (ICD-10 or Custom)</h3>
              
              {/* Selected diagnoses */}
              {diagnoses.length > 0 && (
                <div className="mc-report-modal__tags">
                  {diagnoses.map(d => (
                    <span key={d.code} className="mc-report-modal__tag">
                      <span className="mc-report-modal__tag-code">{d.code}</span>
                      {d.name}
                      <button type="button" onClick={() => removeDiagnosis(d.code)}>×</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search ICD-10 */}
              <div className="mc-report-modal__field">
                <label>Search ICD-10 Codes</label>
                <input
                  type="text"
                  value={diagnosisSearch}
                  onChange={(e) => setDiagnosisSearch(e.target.value)}
                  placeholder="Search by code or description..."
                />
                {diagnosisSearch && filteredDiagnoses.length > 0 && (
                  <div className="mc-report-modal__dropdown">
                    {filteredDiagnoses.slice(0, 5).map(d => (
                      <div
                        key={d.code}
                        className="mc-report-modal__dropdown-item"
                        onClick={() => addDiagnosis(d)}
                      >
                        <strong>{d.code}</strong> — {d.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom diagnosis */}
              <div className="mc-report-modal__field mc-report-modal__field--inline">
                <input
                  type="text"
                  value={customDiagnosis}
                  onChange={(e) => setCustomDiagnosis(e.target.value)}
                  placeholder="Or enter custom diagnosis..."
                />
                <button
                  type="button"
                  className="mc-report-modal__btn mc-report-modal__btn--secondary"
                  onClick={addCustomDiagnosis}
                  disabled={!customDiagnosis.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Medications Tab */}
          {activeTab === 'medications' && (
            <div className="mc-report-modal__section">
              <h3>Medications</h3>
              
              {medications.map((med, index) => (
                <div key={index} className="mc-report-modal__medication-row">
                  <div className="mc-report-modal__medication-grid">
                    <input
                      type="text"
                      placeholder="Drug Name *"
                      value={med.drug_name}
                      onChange={(e) => updateMedication(index, 'drug_name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g., 500mg)"
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    />
                    <select
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    >
                      <option value="">Frequency</option>
                      {FREQUENCY_OPTIONS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <select
                      value={med.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    >
                      <option value="">Duration</option>
                      {DURATION_OPTIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      className="mc-report-modal__medication-remove"
                      onClick={() => removeMedication(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="mc-report-modal__btn mc-report-modal__btn--secondary"
                onClick={addMedication}
              >
                + Add Another Medication
              </button>

              <div className="mc-report-modal__field" style={{ marginTop: '1rem' }}>
                <label htmlFor="prescriptions">Additional Prescription Notes</label>
                <textarea
                  id="prescriptions"
                  name="prescriptions"
                  value={formData.prescriptions}
                  onChange={handleInputChange}
                  placeholder="Special instructions, compounding notes, etc..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Clinical Notes Tab */}
          {activeTab === 'clinical' && (
            <div className="mc-report-modal__section">
              <h3>Clinical Documentation</h3>

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
                <label htmlFor="clinicalFindings">
                  Clinical Findings 
                  <span className="mc-report-modal__label-hint">(Doctor-only, not visible to patient)</span>
                </label>
                <textarea
                  id="clinicalFindings"
                  name="clinicalFindings"
                  value={formData.clinicalFindings}
                  onChange={handleInputChange}
                  placeholder="Physical examination findings, vitals, lab interpretations..."
                  rows={3}
                />
              </div>

              <div className="mc-report-modal__field">
                <label htmlFor="patientInstructions">Patient Instructions</label>
                <textarea
                  id="patientInstructions"
                  name="patientInstructions"
                  value={formData.patientInstructions}
                  onChange={handleInputChange}
                  placeholder="Clear, plain-language advice for the patient..."
                  rows={3}
                />
              </div>

              <div className="mc-report-modal__field">
                <label htmlFor="recommendations">Follow-up & Recommendations</label>
                <textarea
                  id="recommendations"
                  name="recommendations"
                  value={formData.recommendations}
                  onChange={handleInputChange}
                  placeholder="Follow-up appointments, tests ordered, lifestyle advice..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <div className="mc-report-modal__section">
              <h3>Attachments</h3>
              
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
          )}

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

        <div className="mc-report-modal__footer-note">
          Note: Report can be edited within 2 hours of submission. After that, it becomes read-only.
        </div>
      </div>
    </div>
  );
};

export default ReportSubmissionModal;
