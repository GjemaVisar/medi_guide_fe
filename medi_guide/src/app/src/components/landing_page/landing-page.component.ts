import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent {
  currentLang = 'sq';

  constructor(private router: Router) {}

  startAssessment() {
    this.router.navigate(['symptom-input']);
  }
}
