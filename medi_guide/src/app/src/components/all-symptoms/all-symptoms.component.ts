import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SymptomService } from '../../../services/symptom.service';
import { Symptom } from '../../../models/symptom.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface SymptomGroup {
  letter: string;
  symptoms: Symptom[];
}

@Component({
    selector: 'app-all-symptoms',
    imports: [CommonModule, FormsModule, TranslateModule],
    templateUrl: './all-symptoms.component.html',
    styleUrls: ['./all-symptoms.component.scss']
})
export class AllSymptomsComponent implements OnInit, OnDestroy {
  allSymptoms: Symptom[] = [];
  filteredSymptoms: Symptom[] = [];
  symptomGroups: SymptomGroup[] = [];
  filterQuery = '';
  isLoading = false;
  currentLang = 'sq';
  private destroy$ = new Subject<void>();

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
      this.buildGroups();
    });

    this.isLoading = true;
    this.symptomService.loadSymptoms().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (symptoms) => {
        this.allSymptoms = symptoms;
        this.filteredSymptoms = symptoms;
        this.buildGroups();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading symptoms:', err);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilter(): void {
    if (!this.filterQuery || this.filterQuery.trim().length === 0) {
      this.filteredSymptoms = this.allSymptoms;
    } else {
      const query = this.filterQuery.toLowerCase().trim();
      const translations = this.symptomService.getTranslations();

      this.filteredSymptoms = this.allSymptoms.filter(symptom => {
        const en = this.getEnglishName(symptom).toLowerCase();
        const sq = this.getAlbanianName(symptom).toLowerCase();
        return en.includes(query) || sq.includes(query) ||
               symptom.commonName?.toLowerCase().includes(query);
      });
    }
    this.buildGroups();
  }

  getEnglishName(symptom: Symptom): string {
    return this.symptomService.getSymptomNameInLang(symptom, 'en');
  }

  getAlbanianName(symptom: Symptom): string {
    return this.symptomService.getSymptomNameInLang(symptom, 'sq');
  }

  getCurrentLangName(symptom: Symptom): string {
    const lang = this.currentLang as 'en' | 'sq';
    return this.symptomService.getSymptomNameInLang(symptom, lang === 'en' ? 'en' : 'sq');
  }

  getOtherLangName(symptom: Symptom): string {
    const lang = this.currentLang as 'en' | 'sq';
    return this.symptomService.getSymptomNameInLang(symptom, lang === 'en' ? 'sq' : 'en');
  }

  goBack(): void {
    this.router.navigate(['/symptom-input']);
  }

  trackBySymptomId(index: number, symptom: Symptom): string {
    return symptom.id;
  }

  trackByLetter(index: number, group: SymptomGroup): string {
    return group.letter;
  }

  private buildGroups(): void {
    const sorted = [...this.filteredSymptoms].sort((a, b) => {
      const nameA = this.getCurrentLangName(a).toLowerCase();
      const nameB = this.getCurrentLangName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const groups = new Map<string, Symptom[]>();
    for (const symptom of sorted) {
      const name = this.getCurrentLangName(symptom);
      const letter = (name.charAt(0) || '#').toUpperCase();
      if (!groups.has(letter)) {
        groups.set(letter, []);
      }
      groups.get(letter)!.push(symptom);
    }

    this.symptomGroups = Array.from(groups.entries()).map(([letter, symptoms]) => ({
      letter,
      symptoms
    }));
  }
}
