import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private apiUrl = 'http://localhost:3000/oneup-backend/api/cliente';
  private authToken =
    'eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJAYWNjaHNqd3QiLCJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbIlRlY25pY28iXSwiaWF0IjoxNzE1MTE2MTY3LCJleHAiOjE3MTUxNDQ5Njd9.kPlsMyXjTZWImYdGHDuXdhkfKT_QmqsW8QygfNslWraRxD4IFeGuw7-ISqyxmAnOQAmNYD54ivUjgrsIFyVRlQ';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
    });
  }

  getClientes(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(this.apiUrl, { headers });
  }

  agregarCliente(nuevoCliente: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(this.apiUrl, nuevoCliente, { headers });
  }

  modificarCliente(id: number, clienteModificado: any): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.put<any>(url, clienteModificado, { headers });
  }

  eliminarCliente(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    const headers = this.getHeaders();
    return this.http.delete<any>(url, { headers });
  }
}
