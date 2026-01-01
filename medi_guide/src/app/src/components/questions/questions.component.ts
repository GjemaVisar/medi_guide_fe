import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SymptomService } from '../../../services/symptom.service';
import { Question, Answer, Assessment } from '../../../models/symptom.model';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent implements OnInit, OnDestroy {
  questions: Question[] = [];
  answers: Answer[] = [];
  currentQuestionIndex = 0;
  currentQuestion: Question | null = null;
  textAnswer = '';
  isLoading = false;
  error = '';
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
          this.router.navigate(['/symptoms']);
          return;
        }

        if (assessment.answers) {
          this.answers = [...assessment.answers];
        }

        this.loadQuestions(assessment.symptoms || []);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadQuestions(symptoms: any[]): void {
    this.isLoading = true;
    this.error = '';

    this.symptomService.getQuestions(symptoms)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (questions) => {
          this.questions = questions;
          this.currentQuestion = questions[0] || null;
          this.isLoading = false;
          this.updateTextAnswer();
        },
        error: () => {
          this.error = 'Failed to load questions. Please try again.';
          this.isLoading = false;
        }
      });
  }

  answerQuestion(answer: string | number | boolean): void {
    if (!this.currentQuestion) return;

    const existingAnswerIndex = this.answers.findIndex(
      a => a.questionId === this.currentQuestion!.id
    );

    const answerObject: Answer = {
      questionId: this.currentQuestion.id,
      answer
    };

    if (existingAnswerIndex >= 0) {
      this.answers[existingAnswerIndex] = answerObject;
    } else {
      this.answers.push(answerObject);
    }

    this.symptomService.updateAssessment({ 
      ...this.currentAssessment, 
      answers: this.answers 
    });

    if (this.currentQuestion.type === 'text') {
      this.textAnswer = answer as string;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.updateTextAnswer();
    } else {
      this.router.navigate(['/results']);
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.updateTextAnswer();
    }
  }

  getCurrentAnswer(): string | number | boolean | undefined {
    if (!this.currentQuestion) return undefined;
    const answer = this.answers.find(a => a.questionId === this.currentQuestion!.id);
    return answer?.answer;
  }

  isCurrentQuestionAnswered(): boolean {
    if (!this.currentQuestion) return false;
    const answer = this.getCurrentAnswer();
    if (this.currentQuestion.required) {
      return answer !== undefined && answer !== '' && answer !== null;
    }
    return true;
  }

  private updateTextAnswer(): void {
    if (this.currentQuestion?.type === 'text') {
      const answer = this.getCurrentAnswer();
      this.textAnswer = typeof answer === 'string' ? answer : '';
    }
  }

  getScaleNumbers(): number[] {
    return Array.from({ length: 10 }, (_, i) => i + 1);
  }

  goBack(): void {
    this.router.navigate(['/symptoms']);
  }

  trackByOption(index: number, option: string): string {
    return option;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
