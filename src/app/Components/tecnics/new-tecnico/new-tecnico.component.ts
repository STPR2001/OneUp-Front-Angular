import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-new-tecnico',
  templateUrl: './new-tecnico.component.html',
  styleUrls: ['./new-tecnico.component.css']
})

export class NewTecnicoComponent {
  nuevoTecnico: any = {};
  errorAgregarTecnico = false; // Bandera para controlar si ocurrió un error al agregar cliente

  constructor(private tecnicsService: TecnicsService, private router: Router) { }

  agregarTecnico(): void {
    this.tecnicsService.agregarTecnico(this.nuevoTecnico).pipe(
      tap((response) => {
        console.log('Response from server:', response);
        this.router.navigate(['/tecnicos'], { queryParams: { success: true } });
        this.nuevoTecnico = {};
      }),
      catchError((error) => {
        console.error('Error al agregar tecnico:', error);
        this.errorAgregarTecnico = true;
        setTimeout(() => {
          this.errorAgregarTecnico = false;
        }, 5000);
        return of(error); // Returning an observable here to avoid breaking the observable chain
      })
    ).subscribe(); // This is required to trigger the observable chain
  }
}
