import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private apiUrl =
    'https://app.oneupsoluciones.com:8443/oneup-backend/api/venta';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
      'Content-Type': 'application/json',
    });
  }

  crearVenta(payload: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(this.apiUrl, payload, { headers });
  }

  listarVentas(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(this.apiUrl, { headers });
  }
}
