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
import { TranslateModule } from '@ngx-translate/core';

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
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private symptomService: SymptomService, private router: Router) {}

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length >= 2) {
            this.isSearching = true;
            return this.symptomService.searchSymptoms(query);
          }
          return [];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.showResults = this.searchQuery.length >= 2;
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
      severity: 'moderate',
      duration: 'few-days',
      frequency: 'frequent',
      additionalInfo: '',
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

  continueToQuestions(): void {
    if (this.selectedSymptoms.length > 0) {
      this.router.navigate(['/questions']);
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
}
