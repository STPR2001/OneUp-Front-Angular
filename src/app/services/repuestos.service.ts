import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class RepuestosService {
    private apiUrl = 'http://localhost:3000/oneup-backend/api/repuesto';
    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
            'Content-Type': 'application/json', responseType: 'text',
        });
    }

    getRepuestos(): Observable<any> {
        const headers = this.getHeaders();
        return this.http.get<any>(this.apiUrl, { headers }).pipe(
            catchError(this.handleError)
        );
    }

    agregarRepuesto(nuevoRepuesto: any): Observable<any> {
        const headers = this.getHeaders();
        return this.http.post(this.apiUrl, nuevoRepuesto, { headers, responseType: 'text' });
    }

    modificarRepuesto(repuestoModificado: any): Observable<any> {
        const url = `${this.apiUrl}/${repuestoModificado.id}`;
        const headers = this.getHeaders();
        return this.http.put<any>(url, repuestoModificado, { headers }).pipe(
            catchError(this.handleError)
        );
    }

    eliminarRepuesto(id: number): Observable<any> {
        const url = `${this.apiUrl}/${id}`;
        const headers = this.getHeaders();
        return this.http.delete<any>(url, { headers }).pipe(
            catchError(this.handleError)
        );
    }
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Error desconocido';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else {
            errorMessage = `Código de error: ${error.status}, mensaje: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(errorMessage);
    }
}
