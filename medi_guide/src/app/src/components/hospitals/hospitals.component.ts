import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { KosovoHospitalService } from '../../../services/kosovo-hospital.service';
import { KosovoHospital } from '../../../models/symptom.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-hospitals',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './hospitals.component.html',
  styleUrls: ['./hospitals.component.scss'],
})
export class HospitalsComponent implements OnDestroy {
  kosovoCities: string[] = [];
  selectedCity = '';
  hospitals: KosovoHospital[] = [];
  hospitalsLoading = false;
  hospitalsError = '';
  hospitalsLoaded = false;

  private destroy$ = new Subject<void>();

  constructor(
    private hospitalService: KosovoHospitalService,
    private router: Router
  ) {
    this.kosovoCities = this.hospitalService.kosovoCities;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCityChange(city: string): void {
    this.selectedCity = city;
    this.hospitals = [];
    this.hospitalsError = '';
    this.hospitalsLoaded = false;

    if (!city) return;

    this.hospitalsLoading = true;
    this.hospitalService
      .getHospitalsByCity(city)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hospitals) => {
          this.hospitals = hospitals;
          this.hospitalsLoading = false;
          this.hospitalsLoaded = true;
        },
        error: () => {
          this.hospitalsError = 'Failed to load hospitals. Please try again.';
          this.hospitalsLoading = false;
          this.hospitalsLoaded = true;
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/results']);
  }

  trackByHospitalId(_index: number, hospital: KosovoHospital): string {
    return hospital.id;
  }
}
