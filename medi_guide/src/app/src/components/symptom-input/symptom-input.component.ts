import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SymptomService } from '../../../services/symptom.service';
import { Symptom, SymptomInput } from '../../../models/symptom.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-symptom-input',
    imports: [CommonModule, FormsModule, TranslateModule],
    templateUrl: './symptom-input.component.html',
    styleUrls: ['./symptom-input.component.scss']
})
export class SymptomInputComponent implements OnInit, OnDestroy {
  searchQuery = '';
  allSymptoms: Symptom[] = [];
  filteredSymptoms: Symptom[] = [];
  selectedSymptoms: SymptomInput[] = [];
  dropdownOpen = false;
  isLoading = false;
  isSubmitting = false;
  currentLang = 'sq';
  private destroy$ = new Subject<void>();

  constructor(
    private symptomService: SymptomService,
    private router: Router,
    private translate: TranslateService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'sq';

    this.translate.onLangChange.pipe(
      takeUntil(this.destroy$)
    ).subscribe((event) => {
      this.currentLang = event.lang;
    });

    this.isLoading = true;
    this.symptomService.loadSymptoms().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (symptoms) => {
        this.allSymptoms = symptoms;
        this.filteredSymptoms = symptoms;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading symptoms:', err);
        this.isLoading = false;
      }
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const wrapper = this.elementRef.nativeElement.querySelector('.search-wrapper');
    if (wrapper && !wrapper.contains(event.target as Node)) {
      this.dropdownOpen = false;
    }
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.filterSymptoms();
    this.dropdownOpen = true;
  }

  onInputFocus(): void {
    this.dropdownOpen = true;
    if (!this.searchQuery) {
      this.filteredSymptoms = this.allSymptoms;
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen && !this.searchQuery) {
      this.filteredSymptoms = this.allSymptoms;
    }
  }

  private filterSymptoms(): void {
    if (!this.searchQuery || this.searchQuery.trim().length === 0) {
      this.filteredSymptoms = this.allSymptoms;
      return;
    }

    const lowerQuery = this.searchQuery.toLowerCase().trim();
    const translations = this.symptomService.getTranslations();

    this.filteredSymptoms = this.allSymptoms.filter(symptom => {
      if (symptom.commonName?.toLowerCase().includes(lowerQuery)) return true;
      if (symptom.name?.toLowerCase().includes(lowerQuery)) return true;

      const key = symptom.translationKey || this.symptomService.getTranslationKey(symptom.commonName);

      const en = translations.en?.[key];
      if (en && typeof en === 'string' && en.toLowerCase().includes(lowerQuery)) return true;

      const sq = translations.sq?.[key];
      if (sq && typeof sq === 'string' && sq.toLowerCase().includes(lowerQuery)) return true;

      return false;
    });
  }

  selectSymptom(symptom: Symptom): void {
    if (this.selectedSymptoms.find((s) => s.symptom.id === symptom.id)) return;

    const symptomInput: SymptomInput = { symptom };
    this.selectedSymptoms.push(symptomInput);
    this.searchQuery = '';
    this.filteredSymptoms = this.allSymptoms;
    this.dropdownOpen = false;

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

  navigateToAllSymptoms(): void {
    this.router.navigate(['/all-symptoms']);
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
