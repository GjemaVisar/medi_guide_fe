import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import {
  Symptom,
  Question,
  Condition,
  Assessment,
  SymptomInput,
  Answer,
} from '../models/symptom.model';

@Injectable({
  providedIn: 'root',
})
export class SymptomService {
  private currentAssessment = new BehaviorSubject<Partial<Assessment>>({
    symptoms: [],
    answers: [],
    conditions: [],
    recommendations: {
      primary: '',
      secondary: [],
      urgency: 'low',
    },
  });

  // Mock symptom data
  private symptoms: Symptom[] = [
    {
      id: '1',
      name: 'cephalgia',
      commonName: 'headache',
      category: 'neurological',
      severity: 'low',
      description: 'Pain in the head or upper neck',
    },
    {
      id: '2',
      name: 'pyrexia',
      commonName: 'fever',
      category: 'systemic',
      severity: 'moderate',
      description: 'Elevated body temperature',
    },
    {
      id: '3',
      name: 'dyspnea',
      commonName: 'difficulty breathing',
      category: 'respiratory',
      severity: 'high',
      description: 'Shortness of breath or labored breathing',
    },
    {
      id: '4',
      name: 'thoracic pain',
      commonName: 'chest pain',
      category: 'cardiovascular',
      severity: 'high',
      description: 'Pain or discomfort in the chest area',
    },
    {
      id: '5',
      name: 'abdominal pain',
      commonName: 'stomach pain',
      category: 'gastrointestinal',
      severity: 'moderate',
      description: 'Pain in the abdominal region',
    },
    {
      id: '6',
      name: 'vertigo',
      commonName: 'dizziness',
      category: 'neurological',
      severity: 'low',
      description: 'Feeling of spinning or loss of balance',
    },
    {
      id: '7',
      name: 'myalgia',
      commonName: 'muscle pain',
      category: 'musculoskeletal',
      severity: 'low',
      description: 'Pain in muscle tissue',
    },
    {
      id: '8',
      name: 'emesis',
      commonName: 'vomiting',
      category: 'gastrointestinal',
      severity: 'moderate',
      description: 'Forceful expulsion of stomach contents',
    },
  ];

  // Mock questions based on symptoms
  private questions: Question[] = [
    {
      id: 'duration',
      text: 'How long have you been experiencing this symptom?',
      type: 'multiple-choice',
      options: [
        'Less than 1 day',
        '1-3 days',
        '4-7 days',
        'More than 1 week',
        'More than 1 month',
      ],
      required: true,
    },
    {
      id: 'severity',
      text: 'How would you rate the severity of your symptom?',
      type: 'scale',
      required: true,
    },
    {
      id: 'associated_symptoms',
      text: 'Are you experiencing any other symptoms?',
      type: 'yes-no',
      required: true,
    },
    {
      id: 'medications',
      text: 'Are you currently taking any medications?',
      type: 'yes-no',
      required: true,
    },
    {
      id: 'medical_history',
      text: 'Do you have any chronic health conditions?',
      type: 'yes-no',
      required: false,
    },
  ];

  // Mock conditions
  private conditions: Condition[] = [
    {
      id: '1',
      name: 'tension headache',
      commonName: 'tension headache',
      probability: 85,
      severity: 'low',
      description:
        'A common type of headache characterized by mild to moderate pain.',
      recommendation:
        'Rest in a quiet, dark room and consider over-the-counter pain relievers.',
      category: 'self-care',
      symptoms: ['headache'],
    },
    {
      id: '2',
      name: 'migraine',
      commonName: 'migraine',
      probability: 70,
      severity: 'moderate',
      description: 'A neurological condition that can cause severe headaches.',
      recommendation:
        'Rest in a dark room and consult with a healthcare provider about treatment options.',
      category: 'non-emergent',
      symptoms: ['headache', 'nausea'],
    },
    {
      id: '3',
      name: 'viral upper respiratory infection',
      commonName: 'common cold',
      probability: 75,
      severity: 'low',
      description: 'A mild viral infection of the upper respiratory tract.',
      recommendation:
        'Rest, stay hydrated, and monitor symptoms. Recovery typically occurs within 7-10 days.',
      category: 'self-care',
      symptoms: ['fever', 'cough', 'congestion'],
    },
    {
      id: '4',
      name: 'acute myocardial infarction',
      commonName: 'heart attack',
      probability: 30,
      severity: 'high',
      description: 'A serious medical emergency requiring immediate attention.',
      recommendation: 'Seek emergency medical care immediately. Call 911.',
      category: 'emergency',
      symptoms: ['chest pain', 'difficulty breathing'],
    },
  ];

  searchSymptoms(query: string): Observable<Symptom[]> {
    const filteredSymptoms = this.symptoms.filter(
      (symptom) =>
        symptom.commonName.toLowerCase().includes(query.toLowerCase()) ||
        symptom.name.toLowerCase().includes(query.toLowerCase())
    );

    return of(filteredSymptoms).pipe(delay(300));
  }

  getQuestions(symptoms: SymptomInput[]): Observable<Question[]> {
    // In a real app, questions would be dynamically generated based on symptoms
    return of(this.questions).pipe(delay(200));
  }

  assessSymptoms(
    symptoms: SymptomInput[],
    answers: Answer[]
  ): Observable<Condition[]> {
    // Simple mock assessment logic
    const relevantConditions = this.conditions.filter((condition) =>
      symptoms.some((symptom) =>
        condition.symptoms.some((conditionSymptom) =>
          conditionSymptom
            .toLowerCase()
            .includes(symptom.symptom.commonName.toLowerCase())
        )
      )
    );

    // Sort by probability
    const sortedConditions = relevantConditions.sort(
      (a, b) => b.probability - a.probability
    );

    return of(sortedConditions).pipe(delay(1000));
  }

  getCurrentAssessment(): Observable<Partial<Assessment>> {
    return this.currentAssessment.asObservable();
  }

  updateAssessment(assessment: Partial<Assessment>): void {
    const current = this.currentAssessment.value;
    this.currentAssessment.next({ ...current, ...assessment });
  }

  resetAssessment(): void {
    this.currentAssessment.next({
      symptoms: [],
      answers: [],
      conditions: [],
      recommendations: {
        primary: '',
        secondary: [],
        urgency: 'low',
      },
    });
  }
}
