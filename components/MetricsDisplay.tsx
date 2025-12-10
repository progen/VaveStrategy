import React from 'react';
import { ProjectMetrics } from '../types';

interface MetricsDisplayProps {
  metrics: ProjectMetrics;
}

const MetricBar: React.FC<{ label: string; score: number; colorClass: string }> = ({ label, score, colorClass }) => {
  // Normalize score (0-5) to percentage, max 100%
  const percentage = Math.min((score / 5) * 100, 100);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{label}</span>
        <span className="text-lg font-bold text-vave-primary">{score.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
        <span>Poor (1)</span>
        <span>Excellent (5)</span>
      </div>
    </div>
  );
};

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics }) => {
  const getRecommendationColor = (rec: string) => {
    switch(rec) {
      case 'GO': return 'bg-green-100 text-green-800 border-green-200';
      case 'NO-GO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
          <h3 className="text-xl font-light text-gray-900">Strategic Evaluation</h3>
          <span className="text-xs text-gray-400 italic">Simple Average</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <MetricBar label="Fame Factor" score={metrics.fame} colorClass="bg-gradient-to-r from-indigo-300 to-indigo-600" />
          <MetricBar label="Fun Factor" score={metrics.fun} colorClass="bg-gradient-to-r from-pink-300 to-pink-600" />
          <MetricBar label="Money Factor" score={metrics.money} colorClass="bg-gradient-to-r from-emerald-300 to-emerald-600" />
          <MetricBar label="Strategy Factor" score={metrics.strategy} colorClass="bg-gradient-to-r from-blue-300 to-blue-600" />
        </div>

        <div className="flex flex-col justify-center items-center border-l border-gray-100 pl-0 md:pl-8">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">Total Score</p>
            <div className="text-5xl font-bold text-gray-900">{metrics.total.toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-2">Average Score (Max 5)</p>
            <p className="text-xs text-gray-400">Min 3.0 for 'GO'</p>
          </div>

          <div className={`px-8 py-3 rounded-lg border-2 font-bold text-2xl tracking-widest shadow-sm ${getRecommendationColor(metrics.recommendation)}`}>
            {metrics.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDisplay;