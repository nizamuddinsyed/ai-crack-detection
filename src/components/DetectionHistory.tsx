import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Calendar, Clock, Target } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface Detection {
  id: number;
  filename: string;
  crack_count: number;
  confidence_scores: number[];
  processing_time: number;
  created_at: string;
  result_image_url: string;
}

const DetectionHistory: React.FC = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  useEffect(() => {
    fetchDetections();
  }, []);

  const fetchDetections = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/detections');
      setDetections(response.data);
    } catch (error) {
      console.error('Failed to fetch detections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-white/20">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-white">Loading detection history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">Detection History</h2>
        
        {detections.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-300 mb-2">No detections yet</p>
            <p className="text-gray-400">Upload your first image to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detections.map((detection) => (
              <div
                key={detection.id}
                onClick={() => setSelectedDetection(detection)}
                className="bg-white/5 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-colors border border-white/10 hover:border-white/20"
              >
                <img
                  src={`http://localhost:8000${detection.result_image_url}`}
                  alt={`Detection ${detection.id}`}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm">
                      {detection.filename}
                    </span>
                    <span className="text-blue-400 font-bold">
                      {detection.crack_count}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(detection.created_at), 'MMM dd')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{detection.processing_time.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for detailed view */}
      {selectedDetection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Detection Details</h3>
              <button
                onClick={() => setSelectedDetection(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <img
                src={`http://localhost:8000${selectedDetection.result_image_url}`}
                alt={`Detection ${selectedDetection.id}`}
                className="w-full rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">Filename</p>
                  <p className="text-white font-medium">{selectedDetection.filename}</p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">Cracks Detected</p>
                  <p className="text-white font-bold text-xl">{selectedDetection.crack_count}</p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">Processing Time</p>
                  <p className="text-white font-medium">{selectedDetection.processing_time.toFixed(2)}s</p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">Date</p>
                  <p className="text-white font-medium">
                    {format(new Date(selectedDetection.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              {selectedDetection.confidence_scores.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-300 text-sm mb-2">Confidence Scores</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetection.confidence_scores.map((score, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm"
                      >
                        {(score * 100).toFixed(1)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionHistory;