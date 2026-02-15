import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { take } from 'rxjs/operators';
import { SymptomService } from '../../../services/symptom.service';
import { Condition, Assessment, PredictedDisease } from '../../../models/symptom.model';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, OnDestroy {
  conditions: Condition[] = [];
  primaryRecommendation: Condition | null = null;
  predictedDiseases: PredictedDisease[] = [];
  hasPrediction = false;
  isLoading = false;
  error = '';
  loadingStep = 0;
  animateResults = false;
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

        if (!assessment.symptoms || assessment.symptoms.length === 0) {
          this.router.navigate(['/symptom-input']);
          return;
        }

        this.symptomService.getPredictedDiseases().pipe(take(1)).subscribe(diseases => {
          if (diseases && diseases.length > 0) {
            this.predictedDiseases = diseases;
            this.hasPrediction = true;
            // Trigger staggered animation after a short delay
            setTimeout(() => { this.animateResults = true; }, 100);
          } else {
            this.performAssessment(assessment);
          }
        });
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
      error: () => {
        this.error = 'Failed to analyze your symptoms. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Helper functions
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

  /** Get percentage value from similarity score */
  getPercentage(score: number): number {
    return Math.round(score * 100);
  }

  /** Get appropriate CSS class based on match strength */
  getMatchClass(score: number): string {
    const pct = this.getPercentage(score);
    if (pct >= 70) return 'match-high';
    if (pct >= 40) return 'match-medium';
    return 'match-low';
  }

  /** Get match label based on score */
  getMatchLabel(score: number): string {
    const pct = this.getPercentage(score);
    if (pct >= 70) return 'MATCH_HIGH';
    if (pct >= 40) return 'MATCH_MEDIUM';
    return 'MATCH_LOW';
  }

  /** Get ordinal rank label (1st, 2nd, 3rd...) */
  getRankLabel(index: number): string {
    const n = index + 1;
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return n + 'th';
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

  trackByDiseaseName(index: number, item: PredictedDisease): string {
    return item.diseaseName + '-' + index;
  }

  /** Format disease name for display (e.g. "panic disorder" -> "Panic Disorder") */
  formatDiseaseName(name: string): string {
    if (!name || !name.trim()) return name;
    return name.trim().replace(/\b\w/g, c => c.toUpperCase());
  }
}