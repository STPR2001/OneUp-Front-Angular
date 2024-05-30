import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { ClientsService } from 'src/app/services/clients.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { RepairsService } from 'src/app/services/repairs.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-add-repair',
  templateUrl: './add-repair.component.html',
  styleUrls: ['./add-repair.component.css'],
})
export class AddRepairComponent implements OnInit {
  @ViewChild('agregarTecnicoModal') modalCloseAddTecnico: any;
  @ViewChild('agregarClienteModal') modalCloseAddCliente: any;

  tecnicos: any[] = [];
  clientes: any[] = [];
  equipos: any[] = [];
  estados: string[] = ['En taller', 'Finalizada', 'Entregada'];
  nuevaReparacion: any = {
    fechaIngreso: '',
    tecnico: { id: '' },
    cliente: { id: '' },
    equipo: { id: '' },
    accesorios: '',
    falla: '',
    codigoSeguimiento: 'asdasdasd',
    estado: '',
    manoDeObra: 0,
    entrega: 0,
    saldo: 0,
  };
  errorAgregarReparacion: boolean = false;

  //para modales
  nuevoTecnico: any = {};
  errorAgregarTecnico = false;

  nuevoCliente: any = {};
  errorAgregarCliente = false;

  constructor(
    private RepairsService: RepairsService,
    private TecnicsService: TecnicsService,
    private ClientsService: ClientsService,
    private EquipoService: EquipoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setFechaActual();
    this.obtenerTecnicos();
    this.obtenerClientes();
    this.obtenerEquipos();
  }

  agregarReparacion(): void {
    this.RepairsService.agregarReparacion(this.nuevaReparacion)
      .pipe(
        tap(() => {
          console.log('Reparación agregada exitosamente');
          this.nuevaReparacion = {
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
          this.setFechaActual();
          this.router.navigate(['/reparaciones']);
          console.log(this.nuevaReparacion);
        }),
        catchError((error) => {
          console.error('Error al agregar reparación:', error);
          this.errorAgregarReparacion = true;
          setTimeout(() => {
            this.errorAgregarReparacion = false;
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
    this.nuevaReparacion.fechaIngreso = `${year}-${month}-${day}`;
  }

  //Codigo de modales

  agregarTecnico(): void {
    this.TecnicsService.agregarTecnico(this.nuevoTecnico)
      .pipe(
        tap(() => {
          this.nuevoTecnico = {};
          this.obtenerTecnicos();
          this.modalCloseAddTecnico.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al agregar tecnico:', error);
          this.errorAgregarTecnico = true;
          setTimeout(() => {
            this.errorAgregarTecnico = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  agregarCliente(): void {
    this.ClientsService.agregarCliente(this.nuevoCliente)
      .pipe(
        tap(() => {
          console.log('Cliente agregado exitosamente');
          this.nuevoCliente = {};
          this.obtenerClientes();
          this.modalCloseAddCliente.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al agregar cliente:', error);
          this.errorAgregarCliente = true;
          setTimeout(() => {
            this.errorAgregarCliente = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }
}
