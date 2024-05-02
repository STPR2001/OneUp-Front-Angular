import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/cliente';
  private authToken =
    'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJAYWNjaHNqd3QiLCJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbImFkbWluIl0sImlhdCI6MTcxNDY1MTE3MCwiZXhwIjoxNzE0Njc5OTcwfQ.2PMXNDWUQfSeqNZfTwHTmrZYl0EDBiS34Gpf6L5OOvK-QApDuNfkiX6wTA4Ua6sSBf40_drxfX29kE3_1fNGXQ';

  constructor(private http: HttpClient) {}

  getClientes(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
    });

    return this.http.get<any>(this.apiUrl, { headers });
  }
}
