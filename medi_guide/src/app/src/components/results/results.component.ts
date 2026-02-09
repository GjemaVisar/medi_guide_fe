import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SymptomService } from '../../../services/symptom.service'; 
import { Condition, Assessment } from '../../../models/symptom.model'; 


@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html', 
  styleUrls: ['./results.component.scss'] // External styles
})
export class ResultsComponent implements OnInit, OnDestroy {
  conditions: Condition[] = [];
  primaryRecommendation: Condition | null = null;
  isLoading = false;
  error = '';
  loadingStep = 0;
  private destroy$ = new Subject<void>();
  private currentAssessment: Partial<Assessment> = {};

  constructor(
    private symptomService: SymptomService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.symptomService.getCurrentAssessment()
      .pipe(takeUntil(this.destroy$))
      .subscribe(assessment => {
        this.currentAssessment = assessment;
        
        // Basic navigation guards
        if (!assessment.symptoms || assessment.symptoms.length === 0) {
          this.router.navigate(['/symptom-input']);
          return;
        }

        this.performAssessment(assessment);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private performAssessment(assessment: Partial<Assessment>): void {
    this.isLoading = true;
    this.error = '';
    this.loadingStep = 0;

    // Simulate loading steps for UI feedback
    const steps = [1, 2, 3];
    steps.forEach((step, index) => {
      setTimeout(() => {
        this.loadingStep = step;
      }, index * 500);
    });

    this.symptomService.assessSymptoms(
      assessment.symptoms || [],
      []
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (conditions) => {
        this.conditions = conditions;
        this.primaryRecommendation = conditions[0] || null;
        this.isLoading = false;
        
        // Update assessment with results
        this.symptomService.updateAssessment({
          ...assessment,
          conditions,
          recommendations: {
            primary: this.primaryRecommendation?.recommendation || '',
            secondary: conditions.slice(1).map(c => c.recommendation),
            urgency: this.primaryRecommendation?.severity || 'low'
          }
        });
      },
      error: (error) => {
        this.error = 'Failed to analyze your symptoms. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Helper functions for class and text binding in HTML
  getUrgencyClass(category: string): string {
    return `urgency-${category}`;
  }

  getUrgencyText(category: string): string {
    switch (category) {
      case 'self-care': return 'Self Care';
      case 'non-emergent': return 'See Doctor';
      case 'urgent': return 'Urgent Care';
      case 'emergency': return 'Emergency';
      default: return 'General';
    }
  }

  getSeverityText(severity: string): string {
    switch (severity) {
      case 'low': return 'Low Severity';
      case 'moderate': return 'Moderate';
      case 'high': return 'High Severity';
      default: return 'Unknown';
    }
  }

  // Action methods
  startNewAssessment(): void {
    this.symptomService.resetAssessment();
    this.router.navigate(['/']);
  }

  printResults(): void {
    window.print();
  }

  retry(): void {
    this.performAssessment(this.currentAssessment);
  }

  goBack(): void {
    this.router.navigate(['/symptom-input']);
  }

  trackByConditionId(index: number, condition: Condition): string {
    return condition.id;
  }
}