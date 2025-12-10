import React from 'react';
import { EvaluationResult } from '../types';

interface NBInfoTemplateProps {
  data: EvaluationResult;
}

const InfoBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col h-full">
    <div className="bg-vave-primary text-white text-center py-3 px-2 rounded-t-xl font-medium text-lg tracking-wide">
      {title}
    </div>
    <div className="bg-gray-200/60 p-6 rounded-b-xl flex-1 text-sm text-vave-primary font-medium leading-relaxed">
      {children}
    </div>
  </div>
);

const BulletPoint: React.FC<{ label?: string; value: string }> = ({ label, value }) => (
  <div className="mb-2 last:mb-0 flex items-start">
    <span className="mr-2 text-vave-primary">•</span>
    <span>
      {label && <span className="font-bold mr-1">{label}:</span>}
      {value || "N/A"}
    </span>
  </div>
);

const NBInfoTemplate: React.FC<NBInfoTemplateProps> = ({ data }) => {
  const info = data.nbInfo;

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm animate-fade-in print:p-0 print:shadow-none print:border-none">
      
      {/* Header */}
      <div className="mb-8 flex items-center gap-2">
        <span className="text-vave-primary text-2xl font-bold">↳</span>
        <h1 className="text-2xl font-bold text-gray-900">High level Q&A - {info.clientAndType.projectName}</h1>
      </div>

      {/* 3x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Row 1 */}
        <InfoBox title="Client & Type">
          <BulletPoint label="NAME of the project / occasion" value={info.clientAndType.projectName} />
          <BulletPoint label="Type" value={info.clientAndType.type} />
          <BulletPoint label="Business model" value={info.clientAndType.businessModel} />
        </InfoBox>

        <InfoBox title="Project Basics">
          <BulletPoint label="Exhibition type" value={info.projectBasics.exhibitionType} />
          <BulletPoint label="Exhibition topic" value={info.projectBasics.topic} />
          <BulletPoint label="Exhibition size" value={info.projectBasics.size} />
          <BulletPoint label="Location" value={info.projectBasics.location} />
          <BulletPoint label="Location type" value={info.projectBasics.locationType} />
          <BulletPoint label="Experience level" value={info.projectBasics.experienceLevel} />
        </InfoBox>

        <InfoBox title="Scope">
          {info.scope && info.scope.length > 0 ? (
             info.scope.map((item, i) => <BulletPoint key={i} value={item} />)
          ) : <BulletPoint value="Not specified" />}
        </InfoBox>

        {/* Row 2 */}
        <InfoBox title="Pitch Deliverables">
           {info.pitchDeliverables && info.pitchDeliverables.length > 0 ? (
             info.pitchDeliverables.map((item, i) => <BulletPoint key={i} value={item} />)
          ) : <BulletPoint value="Not specified" />}
        </InfoBox>

        <InfoBox title="Fees">
          <BulletPoint label="Pitch fee" value={info.fees.pitchFee} />
          <BulletPoint label="Production fee" value={info.fees.productionFee} />
          {info.fees.agencyFee && <BulletPoint label="Agency fee" value={info.fees.agencyFee} />}
        </InfoBox>

        <InfoBox title="Time frame">
           {info.timeFrame && info.timeFrame.length > 0 ? (
             info.timeFrame.map((item, i) => <BulletPoint key={i} value={item} />)
          ) : <BulletPoint value="Not specified" />}
        </InfoBox>

      </div>
      
      {/* Footer logo matching PDF style */}
      <div className="mt-12 border-t border-gray-900 pt-4 flex justify-between items-end">
          <div className="text-2xl font-bold text-gray-900 tracking-tighter">VAVE</div>
          <div className="text-xs font-medium uppercase tracking-widest text-gray-900">Strategic Framework</div>
      </div>
    </div>
  );
};

export default NBInfoTemplate;