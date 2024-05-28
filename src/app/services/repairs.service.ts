import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RepairsService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/reparacion';
  private authToken =
    'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJAYWNjaHNqd3QiLCJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbImFkbWluIl0sImlhdCI6MTcxNjkyOTMwNCwiZXhwIjoxNzE2OTU4MTA0fQ.zIG1oIyU7PCazCr_yVlQy-VtFap9pon5mOz0eWRCuq0ScqlHFG6EntRDSsofVcfyjJExdDyVaPhS2sgQtcGU-w';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
    });
  }

  getReparaciones(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }

  agregarReparacion(nuevaReparacion: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(this.apiUrl, nuevaReparacion, { headers });
  }

  eliminarReparacion(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.delete<any>(url, { headers });
  }

  modificarReparacion(reparacion: any): Observable<any> {
    const url = `${this.apiUrl}/${reparacion.id}`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, reparacion, { headers });
  }

  obtenerReparacionPorId(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.get<any>(url, { headers });
  }
}
