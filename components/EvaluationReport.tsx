import React from 'react';
import { EvaluationResult } from '../types';
import MetricsDisplay from './MetricsDisplay';
import { CheckCircle, AlertCircle, MapPin, Calendar, DollarSign, Briefcase } from 'lucide-react';

interface EvaluationReportProps {
  data: EvaluationResult;
}

const EvaluationReport: React.FC<EvaluationReportProps> = ({ data }) => {
  const { details, metrics, missingInfo } = data;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="bg-vave-primary text-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{details.clientName || "Unknown Client"}</h1>
            <p className="text-vave-light text-lg">{details.projectName || "New Project Inquiry"}</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded text-sm font-medium">
              {details.type}
            </span>
          </div>
        </div>
      </div>

      {/* Project Basics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-vave-primary mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> Project Basics
            </h3>
            <div className="space-y-3 text-sm">
               <div className="flex justify-between border-b border-gray-50 pb-2">
                 <span className="text-gray-500">Location</span>
                 <span className="font-medium flex items-center gap-1"><MapPin className="w-3 h-3"/> {details.location}</span>
               </div>
               <div className="flex justify-between border-b border-gray-50 pb-2">
                 <span className="text-gray-500">Timeline</span>
                 <span className="font-medium flex items-center gap-1"><Calendar className="w-3 h-3"/> {details.timeline}</span>
               </div>
               <div className="flex justify-between border-b border-gray-50 pb-2">
                 <span className="text-gray-500">Budget</span>
                 <span className="font-medium flex items-center gap-1"><DollarSign className="w-3 h-3"/> {details.budget}</span>
               </div>
               <div className="pt-2">
                 <span className="text-gray-500 block mb-1">Scope</span>
                 <p className="font-medium text-gray-800 leading-snug">{details.scope}</p>
               </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-vave-primary mb-4 flex items-center gap-2">
               <CheckCircle className="w-5 h-5" /> Pitch Deliverables
            </h3>
            <ul className="space-y-2">
              {details.deliverables.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="min-w-[6px] h-[6px] rounded-full bg-vave-light mt-2"></div>
                  {item}
                </li>
              ))}
              {details.deliverables.length === 0 && <li className="text-gray-400 italic">No deliverables extracted yet.</li>}
            </ul>
        </div>
      </div>

      {/* Metrics Visualization */}
      <MetricsDisplay metrics={metrics} />

      {/* Missing Info Warning */}
      {missingInfo.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-orange-800 font-bold flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5" /> Missing Information
          </h3>
          <ul className="list-disc list-inside text-orange-700 space-y-1 text-sm">
            {missingInfo.map((info, i) => (
              <li key={i}>{info}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Executive Summary */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
          {details.summary}
        </p>
      </div>
    </div>
  );
};

export default EvaluationReport;