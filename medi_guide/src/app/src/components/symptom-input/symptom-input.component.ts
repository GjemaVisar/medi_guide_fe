import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from 'rxjs';
import { SymptomService } from '../../../services/symptom.service';
import { Symptom, SymptomInput } from '../../../models/symptom.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-symptom-input',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './symptom-input.component.html',
  styleUrls: ['./symptom-input.component.scss'],
})
export class SymptomInputComponent implements OnInit, OnDestroy {
  searchQuery = '';
  searchResults: Symptom[] = [];
  selectedSymptoms: SymptomInput[] = [];
  showResults = false;
  isSearching = false;
  isSubmitting = false;
  currentLang = 'sq';
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private symptomService: SymptomService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'sq';
    
    this.translate.onLangChange.pipe(
      takeUntil(this.destroy$)
    ).subscribe((event) => {
      this.currentLang = event.lang;
    });

    this.symptomService.loadSymptoms().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
      },
      error: (err) => {
        console.error('Error loading symptoms:', err);
      }
    });

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length >= 3) {
            this.isSearching = true;
            return this.symptomService.searchSymptoms(query);
          }
          return [];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.showResults = this.searchQuery.length >= 3;
        this.isSearching = false;
      });

    this.symptomService
      .getCurrentAssessment()
      .pipe(takeUntil(this.destroy$))
      .subscribe((assessment) => {
        if (assessment.symptoms) {
          this.selectedSymptoms = [...assessment.symptoms];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(this.searchQuery);
  }

  selectSymptom(symptom: Symptom): void {
    if (this.selectedSymptoms.find((s) => s.symptom.id === symptom.id)) return;

    const symptomInput: SymptomInput = {
      symptom,
    };

    this.selectedSymptoms.push(symptomInput);
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;

    this.symptomService.updateAssessment({ symptoms: this.selectedSymptoms });
  }

  removeSymptom(symptomInput: SymptomInput): void {
    this.selectedSymptoms = this.selectedSymptoms.filter(
      (s) => s.symptom.id !== symptomInput.symptom.id
    );
    this.symptomService.updateAssessment({ symptoms: this.selectedSymptoms });
  }

  continueToResults(): void {
    if (this.selectedSymptoms.length > 0 && !this.isSubmitting) {
      this.isSubmitting = true;
      this.symptomService.selectedSymptoms(this.selectedSymptoms.map(s => s.symptom)).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          if (response && Array.isArray(response)) {
            this.symptomService.setPredictedDiseases(response);
          } else {
            this.symptomService.setPredictedDiseases([]);
          }
          this.isSubmitting = false;
          this.router.navigate(['/results']);
        },
        error: (err) => {
          console.error('Error calling selectedSymptoms API:', err);
          this.symptomService.setPredictedDiseases([]);
          this.isSubmitting = false;
          this.router.navigate(['/results']);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  trackBySymptomId(index: number, symptom: Symptom): string {
    return symptom.id;
  }

  trackBySymptomInputId(index: number, symptomInput: SymptomInput): string {
    return symptomInput.symptom.id;
  }

  isSymptomSelected(symptom: Symptom): boolean {
    return this.selectedSymptoms.some((s) => s.symptom.id === symptom.id);
  }

  getTranslatedSymptomName(symptom: Symptom): string {
    const lang = (this.currentLang || this.translate.currentLang || this.translate.defaultLang || 'sq') as 'en' | 'sq';
    const translationKey = symptom.translationKey || this.symptomService.getTranslationKey(symptom.commonName);
    const translations = this.symptomService.getTranslations();
    
    if (translations && translations[lang] && translations[lang][translationKey]) {
      const translated = translations[lang][translationKey];
      if (typeof translated === 'string') {
        if (lang === 'sq') {
          const enTranslation = translations.en?.[translationKey];
          if (translated !== enTranslation || !enTranslation) {
            return translated;
          }
        } else {
          return translated;
        }
      }
    }
    
    const translatedViaService = this.translate.instant(translationKey);
    if (translatedViaService && translatedViaService !== translationKey) {
      return translatedViaService;
    }
    
    return symptom.commonName;
  }
}
