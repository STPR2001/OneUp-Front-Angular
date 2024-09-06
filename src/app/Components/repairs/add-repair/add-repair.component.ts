import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { ClientsService } from 'src/app/services/clients.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { RepairsService } from 'src/app/services/repairs.service';
import { BrandService } from 'src/app/services/brand.service';
import { EquipmentTypeService } from 'src/app/services/equipment-type.service';
import { ModelService } from 'src/app/services/model.service';
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
  @ViewChild('agregarEquipoModal') agregarEquipoModal: any;
  @ViewChild('ModificarEquipoModal') modalCloseUpdate: any;
  @ViewChild('agregarTipoEquipoModal') agregarTipoEquipoModal: any;
  @ViewChild('agregarMarcaModal') agregarMarcaModal: any;
  @ViewChild('agregarModeloModal') agregarModeloModal: any;

  agregarEquipoModalRef: NgbModalRef | undefined;
  agregarTipoEquipoModalRef: NgbModalRef | undefined;
  agregarMarcaModalRef: NgbModalRef | undefined;
  agregarModeloModalRef: NgbModalRef | undefined;

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

  nuevoTecnico: any = {};
  errorAgregarTecnico = false;

  nuevoCliente: any = {
    email: '',
    cedula: '',
    direccion: '',
    observacion: '',
    telefono: '',
  };
  errorAgregarCliente = false;

  equipo: any = {};
  equipoSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarEquipo = false;
  errorModificarEquipo = false;
  nuevoEquipo: any = {
    numeroSerie: '',
    tipo_equipo: { id: '' },
    marca: { id: '' },
    modelo: { id: '' },
  };

  modelos: any[] = [];
  tiposEquipo: any[] = [];
  marcas: any[] = [];

  nuevoTipoEquipo: any = {};
  errorAgregarTipoEquipo = false;

  nuevaMarca: any = {};
  errorAgregarMarca = false;

  nuevoModelo: any = {
    nombre: '',
    marca: { id: '' },
  };
  errorAgregarModelo = false;

  constructor(
    private RepairsService: RepairsService,
    private TecnicsService: TecnicsService,
    private ClientsService: ClientsService,
    private router: Router,
    private EquipoService: EquipoService,
    private modalService: NgbModal,
    private BrandService: BrandService,
    private EquipmentTypeService: EquipmentTypeService,
    private ModelService: ModelService
  ) {}

  ngOnInit(): void {
    this.setFechaActual();
    this.obtenerTecnicos();
    this.obtenerClientes();
    this.obtenerEquipos();
    this.getEquipos();
    this.getMarcas();
    this.getTiposEquipo();
  }

  agregarReparacion(): void {
    this.RepairsService.agregarReparacion(this.nuevaReparacion)
      .pipe(
        tap(() => {
          console.log('Reparación agregada exitosamente');
          console.log(this.nuevaReparacion);
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
          //this.setFechaActual();
          this.router.navigate(['/reparaciones']);
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
    this.ClientsService.getClientesActivosSinPaginacionParaFormularios().subscribe(
      (data) => {
        this.clientes = data;
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
      }
    );
  }

  obtenerTecnicos(): void {
    this.TecnicsService.getTecnicosActivosParaFormularios().subscribe(
      (data) => {
        this.tecnicos = data.content;
      },
      (error) => {
        console.error('Error al obtener los tecnicos:', error);
      }
    );
  }

  obtenerEquipos(): void {
    this.EquipoService.getEquiposActivosSinPaginacionParaFormularios().subscribe(
      (data) => {
        this.equipos = data;
        console.log(data);
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
          this.nuevoCliente = {
            email: '',
            cedula: '',
            direccion: '',
            observacion: '',
            telefono: '',
          };
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

  getEquipos(): void {
    this.EquipoService.getEquiposActivosSinPaginacionParaFormularios().subscribe(
      (data) => {
        this.equipos = data;
      },
      (error) => {
        console.error('Error al obtener la lista de equipos:', error);
      }
    );
  }
  agregarEquipo(): void {
    this.EquipoService.agregarEquipos(this.nuevoEquipo)
      .pipe(
        tap(() => {
          console.log('Equipo agregado exitosamente');
          this.nuevoEquipo = {
            numeroSerie: '',
            tipo_equipo: { id: '' },
            marca: { id: '' },
            modelo: { id: '' },
          };
          this.getEquipos();
          if (this.agregarEquipoModalRef) {
            this.agregarEquipoModalRef.close();
          }
        }),
        catchError((error) => {
          console.error('Error al agregar equipo:', error);
          this.errorAgregarEquipo = true;
          setTimeout(() => {
            this.errorAgregarEquipo = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  getMarcas(): void {
    this.BrandService.getMarcas().subscribe(
      (data) => {
        this.marcas = data;
      },
      (error) => {
        console.error('Error al obtener la lista de marcas:', error);
      }
    );
  }

  onMarcaChange(event: any): void {
    const marcaId = event.target.value;
    this.getModelosPorMarca(marcaId);
  }

  getModelosPorMarca(marcaId: number): void {
    if (marcaId) {
      this.ModelService.getModelosPorMarca(marcaId).subscribe(
        (data) => {
          this.modelos = data;
        },
        (error) => {
          console.error('Error al obtener la lista de modelos:', error);
        }
      );
    } else {
      this.modelos = [];
    }
  }

  getTiposEquipo(): void {
    this.EquipmentTypeService.getTipoEquipos().subscribe(
      (data) => {
        this.tiposEquipo = data;
      },
      (error) => {
        console.error('Error al obtener la lista de tipos de equipos:', error);
      }
    );
  }

  //modals selects

  agregarTipoEquipo(): void {
    this.EquipmentTypeService.agregarTipoEquipo(this.nuevoTipoEquipo)
      .pipe(
        tap(() => {
          console.log('Tipo de equipo agregado exitosamente');
          this.nuevoTipoEquipo = {};
          this.getTiposEquipo();
          if (this.agregarTipoEquipoModalRef) {
            this.agregarTipoEquipoModalRef.close();
          }
        }),
        catchError((error) => {
          console.error('Error al agregar tipo de equipo:', error);
          this.errorAgregarTipoEquipo = true;
          setTimeout(() => {
            this.errorAgregarTipoEquipo = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  agregarMarca(): void {
    this.BrandService.agregarMarca(this.nuevaMarca)
      .pipe(
        tap(() => {
          console.log('Marca agregada exitosamente');
          this.nuevaMarca = {};
          this.getMarcas();
          if (this.agregarMarcaModalRef) {
            this.agregarMarcaModalRef.close();
          }
        }),
        catchError((error) => {
          console.error('Error al agregar marca:', error);
          this.errorAgregarMarca = true;
          setTimeout(() => {
            this.errorAgregarMarca = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  agregarModelo(): void {
    this.ModelService.agregarModelo(this.nuevoModelo)
      .pipe(
        tap(() => {
          console.log('Modelo agregado exitosamente');
          this.nuevoModelo = {
            nombre: '',
            marca: { id: '' },
          };
          this.getModelosPorMarca(this.nuevoEquipo.marca.id);
          if (this.agregarModeloModalRef) {
            this.agregarModeloModalRef.close();
          }
        }),
        catchError((error) => {
          console.error('Error al agregar modelo:', error);
          this.errorAgregarModelo = true;
          setTimeout(() => {
            this.errorAgregarModelo = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  openAgregarEquipoModal() {
    this.agregarEquipoModalRef = this.modalService.open(
      this.agregarEquipoModal,
      {
        ariaLabelledBy: 'modal-basic-title',
      }
    );
  }

  openAgregarTipoEquipoModal() {
    this.agregarTipoEquipoModalRef = this.modalService.open(
      this.agregarTipoEquipoModal,
      {
        backdrop: 'static',
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'second-modal',
      }
    );
  }

  openAgregarMarcaModal() {
    this.agregarMarcaModalRef = this.modalService.open(this.agregarMarcaModal, {
      backdrop: 'static',
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'second-modal',
    });
  }

  openAgregarModeloModal() {
    this.agregarModeloModalRef = this.modalService.open(
      this.agregarModeloModal,
      {
        backdrop: 'static',
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'second-modal',
      }
    );
  }
}
