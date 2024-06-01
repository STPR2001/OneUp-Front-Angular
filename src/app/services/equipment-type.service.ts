import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EquipmentTypeService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/tipoEquipo/';
  private authToken =
    'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJAYWNjaHNqd3QiLCJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbImFkbWluIl0sImlhdCI6MTcxNzE4NzAxMCwiZXhwIjoxNzE3MjE1ODEwfQ.irI8n6D47Ra7gsZeW-VoohMaM2_-gtmea-x-c2T27KF692g6wWYBbs5-Iqx7suWoYr29mPsDZyckA0We1FpeMw';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
    });
  }

  getTipoEquipos(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }
  agregarTipoEquipo(nuevoTipoEquipo: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(this.apiUrl, nuevoTipoEquipo, { headers });
  }

  modificarTipoEquipo(tipoEquipo: any): Observable<any> {
    const url = `${this.apiUrl}/${tipoEquipo.id}`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, tipoEquipo, { headers });
  }

  obtenerTipoEquipoPorId(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.get<any>(url, { headers });
  }

  eliminarTipoEquipo(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.delete<any>(url, { headers });
  }
}
