import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { ClientsService } from 'src/app/services/clients.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { RepairsService } from 'src/app/services/repairs.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-modify-repair',
  templateUrl: './modify-repair.component.html',
  styleUrls: ['./modify-repair.component.css'],
})
export class ModifyRepairComponent implements OnInit {
  tecnicos: any[] = [];
  clientes: any[] = [];
  equipos: any[] = [];
  estados: string[] = ['En taller', 'Finalizada', 'Entregada'];
  reparacion: any = {
    fechaIngreso: '',
    tecnico: { id: '' },
    cliente: { id: '' },
    equipo: { id: '' },
    accesorios: '',
    falla: '',
    codigoSeguimiento: '',
    estado: '',
    manoDeObra: 0,
    entrega: 0,
    saldo: 0,
  };

  errorModificarReparacion = false;

  constructor(
    private RepairsService: RepairsService,
    private TecnicsService: TecnicsService,
    private ClientsService: ClientsService,
    private EquipoService: EquipoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.setFechaActual();
    this.obtenerTecnicos();
    this.obtenerClientes();
    this.obtenerEquipos();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarReparacion(id);
    }
  }

  cargarReparacion(id: string): void {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      this.RepairsService.obtenerReparacionPorId(numericId).subscribe(
        (data) => {
          this.reparacion = data;
        },
        (error) => {
          console.error('Error al cargar reparación:', error);
        }
      );
    } else {
      console.error('El id no es un número válido:', id);
    }
  }

  modificarReparacion(): void {
    this.RepairsService.modificarReparacion(this.reparacion)
      .pipe(
        tap(() => {
          console.log('Reparación modificada exitosamente');
          this.router.navigate(['/reparaciones']);
        }),
        catchError((error) => {
          console.error('Error al modificar reparación:', error);
          this.errorModificarReparacion = true;
          setTimeout(() => {
            this.errorModificarReparacion = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  obtenerClientes(): void {
    this.ClientsService.getClientes().subscribe(
      (data) => {
        this.clientes = data;
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
      }
    );
  }

  obtenerTecnicos(): void {
    this.TecnicsService.getTecnicos().subscribe(
      (data) => {
        this.tecnicos = data;
        console.log(this.tecnicos);
      },
      (error) => {
        console.error('Error al obtener los tecnicos:', error);
      }
    );
  }

  obtenerEquipos(): void {
    this.EquipoService.getEquipos().subscribe(
      (data) => {
        this.equipos = data;
        console.log(this.equipos);
      },
      (error) => {
        console.error('Error al obtener los equipos:', error);
      }
    );
  }

  setFechaActual(): void {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    this.reparacion.fechaIngreso = `${year}-${month}-${day}`;
  }

  //Aplicar logica para modales
  abrirModalAgregarTecnico(): void {}

  abrirModalAgregarCliente(): void {}

  abrirModalAgregarEquipo(): void {}
}
