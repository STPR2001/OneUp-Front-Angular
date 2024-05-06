import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-update-tecnico',
  templateUrl: './update-tecnico.component.html',
  styleUrls: ['./update-tecnico.component.css']
})
export class UpdateTecnicoComponent {
  nombreTecnico: any = {};
  id: any = {};
  errorModificarTecnico = false;

  constructor(private tecnicsService: TecnicsService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.id = history.state.id;
    this.nombreTecnico.nombre = history.state.nombre;
  }

  modificarTecnico(): void {
    this.tecnicsService.modificarTecnico(this.id, this.nombreTecnico).pipe(
      tap((response) => {
        this.router.navigate(['/tecnicos'], { queryParams: { success: true } });
      }),
      catchError((error) => {
        console.error('Error al modificar tecnico:', error);
        this.errorModificarTecnico = true;
        setTimeout(() => {
          this.errorModificarTecnico = false;
        }, 5000);
        return of(error);
      })
    ).subscribe();
  }
}
