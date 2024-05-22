import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RepairsService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/reparacion';
  private authToken =
    'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJAYWNjaHNqd3QiLCJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbImFkbWluIl0sImlhdCI6MTcxNjMyNjI1OSwiZXhwIjoxNzE2MzU1MDU5fQ.Iv5N_lkHFvLP0RxKpN9YGG2HPms-YwSIwHNx2TaTUmBqKG24s_gXNQU0KRtP2AhUtFkDAJAFu15hGRJwxfNkyg';

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
}
