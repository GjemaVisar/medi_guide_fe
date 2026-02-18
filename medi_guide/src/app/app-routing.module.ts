import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './src/components/landing_page/landing-page.component';
import { SymptomInputComponent } from './src/components/symptom-input/symptom-input.component';
import { ResultsComponent } from './src/components/results/results.component';
import { HospitalsComponent } from './src/components/hospitals/hospitals.component';
import { AllSymptomsComponent } from './src/components/all-symptoms/all-symptoms.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'symptom-input', component: SymptomInputComponent },
  { path: 'all-symptoms', component: AllSymptomsComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'hospitals', component: HospitalsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
