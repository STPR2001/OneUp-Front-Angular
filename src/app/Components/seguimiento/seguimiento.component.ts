import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RepairsService } from 'src/app/services/repairs.service';

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.component.html',
  styleUrls: ['./seguimiento.component.css'],
})
export class SeguimientoComponent implements OnInit {
  reparacionBuscada: any = null;
  noseEncontro: boolean = true;
  ultimaNota: any = null;
  form: FormGroup;
  constructor(private fb: FormBuilder, private repairsService: RepairsService) {
    this.form = this.fb.group({
      codigo: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  buscarReparacion(): void {
    if (this.form.valid) {
      const idBusqueda = this.form.get('codigo')?.value ?? '';
      this.repairsService.getReparacion(idBusqueda).subscribe(
        (data) => {
          this.noseEncontro = true;
          this.reparacionBuscada = data;
          if (
            this.reparacionBuscada.notasreparacion &&
            this.reparacionBuscada.notasreparacion.length > 0
          ) {
            this.reparacionBuscada.notasreparacion.sort(
              (
                a: { fecha: string | number | Date },
                b: { fecha: string | number | Date }
              ) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
            this.ultimaNota = this.reparacionBuscada.notasreparacion[0].informe;
          }
        },
        (error) => {
          console.error('Error al obtener reparaciones:', error);
          this.noseEncontro = false;
          this.reparacionBuscada = null;
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }
}
