import React, { useEffect, useState } from 'react';
import { Activity, Target, Clock, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface Stats {
  total_detections: number;
  total_cracks: number;
  recent_activity: Array<{ date: string; count: number }>;
}

const StatsCards: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-8 bg-white/20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: 'Total Detections',
      value: stats.total_detections,
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Cracks Found',
      value: stats.total_cracks,
      icon: Target,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
    {
      title: 'This Week',
      value: stats.recent_activity.reduce((sum, day) => sum + day.count, 0),
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      title: 'Avg. per Day',
      value: Math.round(stats.recent_activity.reduce((sum, day) => sum + day.count, 0) / 7),
      icon: Clock,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;