import { Injectable } from '@angular/core';
import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class ShoppingService {

    private apiUrl = 'http://localhost:3000/oneup-backend/api/compra';
    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            Authorization: `Bearer ${this.authService.getAuthenticatedToken()}`,
            'Content-Type': 'application/json',
        });
    }
    getCompras(): Observable<any> {
        const headers = this.getHeaders();
        return this.http
            .get<any>(this.apiUrl, { headers })
            .pipe(catchError(this.handleError));
    }

    getComprasPorMes(): Observable<any> {
        const headers = this.getHeaders();
        return this.http
            .get<any>(`${this.apiUrl}/compras-por-mes`, { headers })
            .pipe(catchError(this.handleError));
    }

    getComprasPorProveedor(): Observable<any> {
        const headers = this.getHeaders();
        return this.http
            .get<any>(`${this.apiUrl}/compras-por-proveedor`, { headers })
            .pipe(catchError(this.handleError));
    }

    agregarCompra(nuevoCompra: any): Observable<any> {
        const headers = this.getHeaders();
        return this.http
            .post<any>(this.apiUrl, nuevoCompra, { headers })
            .pipe(catchError(this.handleError));
    }

    modificarCompra(tecniceModificado: any): Observable<any> {
        const url = `${this.apiUrl}/${tecniceModificado.id}`;
        const headers = this.getHeaders();
        return this.http
            .put<any>(url, tecniceModificado, { headers })
            .pipe(catchError(this.handleError));
    }

    eliminarCompra(id: number): Observable<any> {
        const url = `${this.apiUrl}/${id}`;
        const headers = this.getHeaders();
        return this.http
            .delete<any>(url, { headers })
            .pipe(catchError(this.handleError));
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
