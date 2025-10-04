import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent {
  currentLang = 'sq';

  constructor(private router: Router, private translate: TranslateService) {
    this.translate.addLangs(['en', 'sq']);
    this.translate.setDefaultLang('sq');
    this.translate.use('sq');
  }

  startAssessment() {
    this.router.navigate(['symptom-input']);
  }

  switchLang(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
  }
}
