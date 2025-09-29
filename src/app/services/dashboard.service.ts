import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl =
    'https://app.oneupsoluciones.com:8443/oneup-backend/api/dashboard/summary';
  private cache$?: Observable<any>;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  getSummary(forceRefresh = false): Observable<any> {
    if (!this.cache$ || forceRefresh) {
      this.cache$ = this.http
        .get<any>(this.apiUrl, { headers: this.getHeaders() })
        .pipe(shareReplay(1));
    }
    return this.cache$;
  }
}
