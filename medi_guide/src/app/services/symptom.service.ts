import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, forkJoin } from 'rxjs';
import { map, delay, catchError, tap } from 'rxjs/operators';
import {
  Symptom,
  Condition,
  Assessment,
  SymptomInput,
  Answer,
  PredictedDisease,
} from '../models/symptom.model';
import { environment } from '../../environments/environment';

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

  private symptomsCache: Symptom[] = [];
  private symptomsLoaded = false;
  private translationsCache: { en: any; sq: any } = { en: {}, sq: {} };
  private translationsLoaded = false;
  private predictedDiseases = new BehaviorSubject<PredictedDisease[]>([]);

  constructor(private http: HttpClient) {}

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

  /**
   * Loads symptoms and translations immediately when assessment starts
   */
  loadSymptoms(): Observable<Symptom[]> {
    if (this.symptomsLoaded && this.translationsLoaded) {
      return of(this.symptomsCache);
    }

    // Load both symptoms and translations in parallel
    const symptoms$ = this.fetchSymptoms().pipe(
      catchError(() => of([] as Symptom[]))
    );
    const translations$ = this.loadTranslations().pipe(
      catchError(() => of(void 0))
    );

    return forkJoin([symptoms$, translations$]).pipe(
      map(([symptoms]) => {
        // Update symptoms with translation keys for searching
        const symptomsWithKeys = symptoms.map(symptom => ({
          ...symptom,
          translationKey: this.diseaseNameToTranslationKey(symptom.commonName)
        }));
        this.symptomsCache = symptomsWithKeys;
        return symptomsWithKeys;
      })
    );
  }

  /**
   * Loads translation files for searching
   */
  private loadTranslations(): Observable<void> {
    if (this.translationsLoaded) {
      return of(void 0);
    }

    const en$ = this.http.get<any>('./assets/i18n/en.json').pipe(
      catchError((err) => {
        console.error('Error loading English translations:', err);
        return of({});
      })
    );
    const sq$ = this.http.get<any>('./assets/i18n/sq.json').pipe(
      catchError((err) => {
        console.error('Error loading Albanian translations:', err);
        return of({});
      })
    );

    return forkJoin([en$, sq$]).pipe(
      tap(([enTranslations, sqTranslations]) => {
        this.translationsCache.en = enTranslations;
        this.translationsCache.sq = sqTranslations;
        this.translationsLoaded = true;
      }),
      map(() => void 0)
    );
  }

  /**
   * Converts disease name to translation key format
   * e.g., "abdominal aortic aneurysm" -> "ABDOMINAL_AORTIC_ANEURYSM"
   */
  getTranslationKey(diseaseName: string): string {
    return diseaseName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  /**
   * Gets the translations cache for use in components
   */
  getTranslations(): { en: any; sq: any } {
    return this.translationsCache;
  }

  private diseaseNameToTranslationKey(diseaseName: string): string {
    return this.getTranslationKey(diseaseName);
  }

  /**
   * Fetches all diseases from the API and converts them to Symptom objects
   */
  private fetchSymptoms(): Observable<Symptom[]> {
    if (this.symptomsLoaded) {
      return of(this.symptomsCache);
    }

    return this.http.get<string[]>(`${environment.apiBaseUrl}/diseases`).pipe(
      map((diseaseNames) => {
        // Map string array to Symptom objects
        const symptoms = diseaseNames.map((diseaseName, index) => 
          this.mapDiseaseNameToSymptom(diseaseName, index)
        );
        this.symptomsCache = symptoms;
        this.symptomsLoaded = true;
        return symptoms;
      }),
      catchError((error) => {
        console.error('Error fetching diseases from API:', error);
        // Return empty array on error
        return of([]);
      })
    );
  }

  /**
   * Maps a disease name string to a Symptom object
   */
  private mapDiseaseNameToSymptom(diseaseName: string, index: number): Symptom {
    // Generate a simple ID from the disease name (using hash or index)
    const id = this.generateIdFromName(diseaseName, index);
    
    // Infer category from disease name (basic categorization)
    const category = this.inferCategory(diseaseName);
    
    return {
      id,
      name: diseaseName.toLowerCase().replace(/\s+/g, '-'), // Convert to slug format
      commonName: diseaseName, // Use the disease name as common name
      category,
      severity: 'low' as const, // Default severity since API doesn't provide it
      description: undefined, // No description available from API
    };
  }

  /**
   * Generates a unique ID from disease name
   */
  private generateIdFromName(name: string, index: number): string {
    // Simple hash function to generate ID
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Infers category from disease name (basic keyword matching)
   */
  private inferCategory(diseaseName: string): string {
    const lowerName = diseaseName.toLowerCase();
    
    if (lowerName.includes('cardiac') || lowerName.includes('heart') || lowerName.includes('aortic') || lowerName.includes('myocardial')) {
      return 'cardiovascular';
    }
    if (lowerName.includes('respiratory') || lowerName.includes('bronch') || lowerName.includes('lung') || lowerName.includes('pneumonia')) {
      return 'respiratory';
    }
    if (lowerName.includes('abdominal') || lowerName.includes('stomach') || lowerName.includes('gastric') || lowerName.includes('intestinal')) {
      return 'gastrointestinal';
    }
    if (lowerName.includes('neurological') || lowerName.includes('brain') || lowerName.includes('headache') || lowerName.includes('migraine')) {
      return 'neurological';
    }
    if (lowerName.includes('muscle') || lowerName.includes('bone') || lowerName.includes('joint') || lowerName.includes('skeletal')) {
      return 'musculoskeletal';
    }
    if (lowerName.includes('skin') || lowerName.includes('dermat') || lowerName.includes('keratosis') || lowerName.includes('acne')) {
      return 'dermatological';
    }
    
    return 'general'; // Default category
  }

  /**
   * Searches symptoms by query string
   * Uses cached symptoms if already loaded
   */
  searchSymptoms(query: string): Observable<Symptom[]> {
    if (!this.symptomsLoaded || !this.translationsLoaded) {
      // If not loaded, load first then search
      return this.loadSymptoms().pipe(
        map((symptoms) => this.filterSymptoms(symptoms, query))
      );
    }

    return of(this.filterSymptoms(this.symptomsCache, query)).pipe(delay(100));
  }

  /**
   * Filters symptoms based on search query
   * Also searches in translation files (English and Albanian)
   */
  private filterSymptoms(symptoms: Symptom[], query: string): Symptom[] {
    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    
    return symptoms.filter((symptom) => {
      // Search in original disease name
      if (
        symptom.commonName?.toLowerCase().includes(lowerQuery) ||
        symptom.name?.toLowerCase().includes(lowerQuery) ||
        symptom.description?.toLowerCase().includes(lowerQuery)
      ) {
        return true;
      }

      // Search in translation files using stored translation key or generate it
      const translationKey = symptom.translationKey || this.diseaseNameToTranslationKey(symptom.commonName);
      
      // Search in English translations
      const enTranslation = this.translationsCache.en[translationKey];
      if (enTranslation && typeof enTranslation === 'string' && enTranslation.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in Albanian translations
      const sqTranslation = this.translationsCache.sq[translationKey];
      if (sqTranslation && typeof sqTranslation === 'string' && sqTranslation.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
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
    this.predictedDiseases.next([]);
  }

  setPredictedDiseases(diseases: PredictedDisease[]): void {
    this.predictedDiseases.next(diseases || []);
  }

  getPredictedDiseases(): Observable<PredictedDisease[]> {
    return this.predictedDiseases.asObservable();
  }

  /**
   * Calls the selectedSymptoms API endpoint with all selected symptoms.
   * Sends the original lowercase display names (commonName) as the backend expects them.
   * e.g., "anxiety and nervousness", "burning chest pain"
   */
  selectedSymptoms(symptoms: Symptom[]): Observable<PredictedDisease[] | null> {
    // Use commonName directly — it already stores the lowercase display name from the API
    const payload = symptoms.map(symptom => symptom.commonName.toLowerCase());
    
    return this.http.post<PredictedDisease[]>(
      `${environment.apiBaseUrl}/diseases/selectedSymptoms?topN=5`,
      { symptoms: payload }
    ).pipe(
      catchError((error) => {
        console.error('Error calling selectedSymptoms API:', error);
        return of(null);
      })
    );
  }
}
