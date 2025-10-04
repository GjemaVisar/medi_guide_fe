export interface Symptom {
  id: string;
  name: string;
  commonName: string;
  category: string;
  severity: 'low' | 'moderate' | 'high';
  description?: string;
}

export interface SymptomInput {
  symptom: Symptom;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  frequency: string;
  additionalInfo?: string;
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
