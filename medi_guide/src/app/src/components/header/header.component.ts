import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  currentLang = 'sq';

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'sq']);
    this.translate.setDefaultLang('sq');
    const used = this.translate.currentLang || 'sq';
    this.currentLang = used;
    this.translate.use(used);
  }

  switchLang(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
  }
}
