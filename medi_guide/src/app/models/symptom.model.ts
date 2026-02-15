export interface Symptom {
  id: string;
  name: string;
  commonName: string;
  category: string;
  severity: 'low' | 'moderate' | 'high';
  description?: string;
  translationKey?: string;
}

export interface SymptomInput {
  symptom: Symptom;
}

export interface Question {
  id: string;
  text: string;
  type: 'yes-no' | 'multiple-choice' | 'scale' | 'text';
  options?: string[];
  required: boolean;
  followUpQuestions?: Question[];
}

export interface Answer {
  questionId: string;
  answer: string | number | boolean;
}

export interface Condition {
  id: string;
  name: string;
  commonName: string;
  probability: number;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  recommendation: string;
  category: 'self-care' | 'non-emergent' | 'urgent' | 'emergency';
  symptoms: string[];
}

/** Response item from selectedSymptoms API (cosine similarity prediction) */
export interface PredictedDisease {
  diseaseName: string;
  similarityScore: number;
}

export interface Assessment {
  symptoms: SymptomInput[];
  answers: Answer[];
  conditions: Condition[];
  recommendations: {
    primary: string;
    secondary: string[];
    urgency: 'low' | 'moderate' | 'high';
  };
}

/** Response from the KosovoHospitals API */
export interface KosovoHospital {
  id: string;
  name: string;
  location: string;
  description: string;
  link: string;
  image: string;
  phoneNumbers: string[];
  website: string | null;
}
