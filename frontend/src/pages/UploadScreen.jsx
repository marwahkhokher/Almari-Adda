import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '../components/layout/Header.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import { uploadItem } from '../lib/api.js';

export default function UploadScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG).');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
    setResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const response = await uploadItem(file);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to upload item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-primary gradient-pastel flex flex-col"
    >
      <Header title="Upload Item" showBack={true} />
      
      <main className="flex-1 w-full max-w-lg mx-auto p-6 flex flex-col items-center">
        {!preview && !result && (
          <div
            className={`w-full border-2 border-dashed rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              isDragging ? 'border-accent bg-white shadow-medium' : 'border-surface-light bg-white/80 hover:border-accent-light hover:bg-white shadow-soft'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 rounded-2xl bg-pastel-pink flex items-center justify-center mb-4 text-accent-hover">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1 text-center font-display">
              Drag & drop or click to upload
            </h3>
            <p className="text-xs text-text-secondary text-center">Supports JPG, PNG photos</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
          </div>
        )}

        {preview && !result && (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="relative w-full aspect-[3/4] max-h-[480px] rounded-3xl overflow-hidden bg-white border border-surface-light shadow-medium">
              <img src={preview} alt="Preview" className="w-full h-full object-contain p-3" />
              {uploading && (
                <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center backdrop-blur-md z-10">
                  <LoadingSpinner className="w-10 h-10 text-accent mb-4" />
                  <p className="text-text-primary font-semibold text-sm">Segmenting & classifying item...</p>
                </div>
              )}
            </div>
            
            {!uploading && (
              <div className="w-full">
                <p className="text-center text-xs text-text-secondary mb-4">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
                <div className="flex gap-4">
                  <Button variant="secondary" onClick={resetState} className="flex-1">
                    Change
                  </Button>
                  <Button onClick={handleUpload} className="flex-1 gradient-accent text-white font-semibold">
                    Upload Photo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {result && result.item && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div className="w-full aspect-square max-h-[400px] rounded-3xl overflow-hidden bg-white border border-success/30 shadow-medium relative p-4 flex items-center justify-center">
              <img 
                src={result.item.image_url || preview} 
                alt="Segmented" 
                className="max-h-full max-w-full object-contain filter drop-shadow-md" 
              />
              <div className="absolute top-4 right-4 bg-pastel-sage text-success border border-success/30 rounded-full p-1.5 backdrop-blur-md">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            
            <div className="w-full bg-white p-5 rounded-3xl border border-surface-light shadow-soft text-center space-y-3">
              <h3 className="font-display text-2xl font-bold text-text-primary capitalize">
                {result.item.category}
              </h3>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="pink" className="capitalize text-xs">{result.item.subcategory}</Badge>
                {result.item.confidence && (
                  <Badge variant="success">
                    {Math.round(result.item.confidence * 100)}% Confidence
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <Button variant="secondary" onClick={resetState} className="flex-1">
                Upload Another
              </Button>
              <Button onClick={() => navigate('/closet')} className="flex-1 gradient-accent text-white font-semibold">
                View Closet
              </Button>
            </div>
          </motion.div>
        )}

        {error && !uploading && (
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6 w-full p-4 bg-error/10 border border-error/20 rounded-2xl flex flex-col items-center gap-3 text-center"
          >
            <AlertCircle className="w-6 h-6 text-error" />
            <p className="text-error text-xs font-medium">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => setError(null)}>
              Try Again
            </Button>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
