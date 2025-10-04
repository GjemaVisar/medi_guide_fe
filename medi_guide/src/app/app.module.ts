import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './src/components/landing_page/landing-page.component';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SymptomInputComponent } from './src/components/symptom-input/symptom-input.component';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './src/components/header/header.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    LandingPageComponent,
    SymptomInputComponent,
    HeaderComponent,
    FormsModule,
    TranslateModule.forRoot({
      defaultLanguage: 'sq',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    HeaderComponent,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
