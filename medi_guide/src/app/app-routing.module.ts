import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './src/components/landing_page/landing-page.component';
import { SymptomInputComponent } from './src/components/symptom-input/symptom-input.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'symptom-input', component: SymptomInputComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
