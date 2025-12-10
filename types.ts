export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  role: MessageRole;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64
  mimeType: string;
}

export interface ProjectMetrics {
  fame: number;
  fun: number;
  money: number;
  strategy: number;
  total: number;
  recommendation: 'GO' | 'NO-GO' | 'DISCUSS';
}

// Aligned strictly with the 6-box grid layout from VAVE framework
export interface NBInformation {
  clientAndType: {
    projectName: string;
    type: string; // RFP / Selected invitation
    businessModel: string; // Design / Concept / Consultancy
  };
  projectBasics: {
    exhibitionType: string;
    topic: string;
    size: string;
    location: string;
    locationType: string;
    experienceLevel: string;
  };
  scope: string[]; // List of scope items
  pitchDeliverables: string[]; // List of deliverables
  fees: {
    pitchFee: string;
    productionFee: string;
    agencyFee?: string;
  };
  timeFrame: string[]; // List of key dates/milestones
}

export interface ProjectDetails {
  clientName: string;
  projectName: string;
  type: string;
  location: string;
  budget: string;
  timeline: string;
  scope: string;
  deliverables: string[];
  summary: string;
}

export interface EvaluationResult {
  details: ProjectDetails;
  metrics: ProjectMetrics;
  nbInfo: NBInformation;
  missingInfo: string[];
}