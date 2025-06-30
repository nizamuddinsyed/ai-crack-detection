import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Loader, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface DetectionResult {
  id: number;
  filename: string;
  crack_count: number;
  confidence_scores: number[];
  processing_time: number;
  result_image_url: string;
}

const UploadZone: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasBeenProcessed, setHasBeenProcessed] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Reset all states when a new file is selected
      setSelectedFile(file);
      setResult(null);
      setHasBeenProcessed(false);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile || uploading || hasBeenProcessed) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:8000/api/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      setHasBeenProcessed(true);
      toast.success(`Detection complete! Found ${response.data.crack_count} cracks.`);
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error('API limit exceeded. Please upgrade to Pro for unlimited detections.');
      } else {
        toast.error(error.response?.data?.detail || 'Detection failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setResult(null);
    setHasBeenProcessed(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const startNewDetection = () => {
    resetUpload();
  };

  // Clean up preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">Crack Detection</h2>
        
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500 hover:bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-white mb-2">
              {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
            </p>
            <p className="text-gray-300 mb-4">or click to select a file</p>
            <p className="text-sm text-gray-400">
              Supported formats: JPEG, PNG, GIF, BMP, WebP (max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg border border-white/20"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <ImageIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{selectedFile.name}</p>
                      <p className="text-gray-300 text-sm">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  {hasBeenProcessed && (
                    <div className="flex items-center space-x-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Detection completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!hasBeenProcessed ? (
                <>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Detect Cracks</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetUpload}
                    disabled={uploading}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={startNewDetection}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Detect New Image</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-white">Detection Results</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistics */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-gray-300 text-sm mb-1">Cracks Detected</p>
                  <p className="text-3xl font-bold text-white">{result.crack_count}</p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-gray-300 text-sm mb-1">Processing Time</p>
                  <p className="text-xl font-semibold text-white">
                    {result.processing_time.toFixed(2)}s
                  </p>
                </div>
              </div>
              
              {result.confidence_scores.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-3">Detection Confidence</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Average</span>
                      <span className="text-white font-medium">
                        {(result.confidence_scores.reduce((a, b) => a + b, 0) / result.confidence_scores.length * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Highest</span>
                      <span className="text-white font-medium">
                        {(Math.max(...result.confidence_scores) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Lowest</span>
                      <span className="text-white font-medium">
                        {(Math.min(...result.confidence_scores) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {result.crack_count === 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-300 font-medium">No cracks detected!</p>
                  </div>
                  <p className="text-green-200 text-sm mt-1">
                    The structure appears to be in good condition.
                  </p>
                </div>
              )}
            </div>
            
            {/* Result Image */}
            <div>
              <p className="text-gray-300 text-sm mb-3">Detection Result</p>
              <div className="relative">
                <img
                  src={`http://localhost:8000${result.result_image_url}`}
                  alt="Detection result"
                  className="w-full rounded-lg border border-white/20 shadow-lg"
                />
                {result.crack_count > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                    {result.crack_count} crack{result.crack_count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;