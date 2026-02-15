import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { KosovoHospital } from '../models/symptom.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class KosovoHospitalService {
  /** All major cities in Kosovo */
  readonly kosovoCities: string[] = [
    'Prishtinë',
    'Prizren',
    'Pejë',
    'Mitrovicë',
    'Gjilan',
    'Ferizaj',
    'Gjakovë',
    'Podujevë',
    'Vushtrri',
    'Suharekë',
    'Rahovec',
    'Drenas',
    'Lipjan',
    'Malishevë',
    'Kamenicë',
    'Viti',
    'Deçan',
    'Istog',
    'Klinë',
    'Skenderaj',
    'Dragash',
    'Fushë Kosovë',
    'Kaçanik',
    'Shtime',
    'Obiliq',
    'Hani i Elezit',
    'Mamushë',
    'Junik',
    'Graçanicë',
    'Ranillug',
    'Partesh',
    'Kllokot',
  ];

  constructor(private http: HttpClient) {}

  /**
   * Fetches hospitals by city name from the backend API.
   * GET /api/KosovoHospitals?city={city}
   */
  getHospitalsByCity(city: string): Observable<KosovoHospital[]> {
    const params = new HttpParams().set('city', city);

    return this.http
      .get<KosovoHospital[]>(`${environment.apiBaseUrl}/KosovoHospitals`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching Kosovo hospitals:', error);
          return of([]);
        })
      );
  }
}
