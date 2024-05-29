import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/equipo';
  private authToken =
    'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJAYWNjaHNqd3QiLCJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbImFkbWluIl0sImlhdCI6MTcxNzAwMzg2NSwiZXhwIjoxNzE3MDMyNjY1fQ.1cZ6b4MH89j21W4uoDOEcPJTVzyiisK075cSuE_jfOPZ_c9KV3_Y0-yU3-Arax32mSTaSJWOmLmTnvE0Ts3g2Q';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
    });
  }

  getEquipos(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }
}
