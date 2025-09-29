import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
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
import { Observable, debounceTime, distinctUntilChanged, map } from 'rxjs';

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
  agregarTecnicoModalRef: NgbModalRef | undefined;
  agregarClienteModalRef: NgbModalRef | undefined;
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
    estado: 'En taller',
    manoDeObra: 0,
    entrega: 0,
    saldo: 0,
  };
  errorAgregarReparacion: boolean = false;

  nuevoTecnico: any = { nombre: '', email: '', telefono: '', especialidad: '', nivel: '' };
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
    private ModelService: ModelService,
    public dialogRef?: MatDialogRef<AddRepairComponent>
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
            estado: 'En taller',
            manoDeObra: 0,
            entrega: 0,
            saldo: 0,
          };
          //this.setFechaActual();
          if (this.dialogRef) {
            // Devuelve una bandera para que el padre refresque
            this.dialogRef.close({ refresh: true });
          } else {
            this.router.navigate(['/reparaciones']);
          }
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
          this.nuevoTecnico = { nombre: '', email: '', telefono: '', especialidad: '', nivel: '' };
          this.obtenerTecnicos();
          if (this.agregarTecnicoModalRef) {
            this.agregarTecnicoModalRef.close();
          }
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
          if (this.agregarClienteModalRef) {
            this.agregarClienteModalRef.close();
          }
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
    console.log('Nuevo modelo:', this.nuevoModelo);
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
        size: 'lg',
      }
    );
  }

  openAgregarTecnicoModal() {
    this.agregarTecnicoModalRef = this.modalService.open(
      this.modalCloseAddTecnico,
      {
        backdrop: 'static',
        ariaLabelledBy: 'modal-basic-title',
        size: 'lg',
      }
    );
  }

  openAgregarClienteModal() {
    this.agregarClienteModalRef = this.modalService.open(
      this.modalCloseAddCliente,
      {
        backdrop: 'static',
        ariaLabelledBy: 'modal-basic-title',
        size: 'lg',
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

  clienteSeleccionado = false; // Indica si se ha seleccionado un cliente

  // Función de búsqueda para Typeahead
  buscarClientes = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 1
          ? []
          : this.clientes.filter((cliente) =>
              cliente.nombre.toLowerCase().includes(term.toLowerCase())
            )
      )
    );

  // Formatear la visualización en la lista de sugerencias
  resultFormatter = (cliente: any) => cliente.nombre;

  // Formatear la visualización en el input cuando se selecciona un cliente
  inputFormatter = (cliente: any) => (cliente ? cliente.nombre : '');

  // Se ejecuta cuando el usuario selecciona un cliente de la lista
  onClienteSeleccionado(event: any) {
    if (event && event.item) {
      this.nuevaReparacion.cliente = event.item;
      this.clienteSeleccionado = true;
    }
  }

  // Permite limpiar la selección y volver a escribir
  borrarClienteSeleccionado() {
    this.nuevaReparacion.cliente = null;
    this.clienteSeleccionado = false;
  }

  equipoSeleccionado2 = false; // Indica si se ha seleccionado un equipo

  // Función de búsqueda para Typeahead
  buscarEquipos = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 1
          ? []
          : this.equipos.filter((equipo) =>
              (
                equipo.marca.nombre +
                ' ' +
                equipo.modelo.nombre +
                ' - ' +
                equipo.numeroSerie
              )
                .toLowerCase()
                .includes(term.toLowerCase())
            )
      )
    );

  // Formatear la visualización en la lista de sugerencias
  equipoResultFormatter = (equipo: any) =>
    `${equipo.marca.nombre} ${equipo.modelo.nombre} - ${equipo.numeroSerie}`;

  // Formatear la visualización en el input cuando se selecciona un equipo
  equipoInputFormatter = (equipo: any) =>
    equipo
      ? `${equipo.marca.nombre} ${equipo.modelo.nombre} - ${equipo.numeroSerie}`
      : '';

  // Se ejecuta cuando el usuario selecciona un equipo de la lista
  onEquipoSeleccionado(event: any) {
    if (event && event.item) {
      this.nuevaReparacion.equipo = event.item;
      this.equipoSeleccionado2 = true;
    }
  }

  // Permite limpiar la selección y volver a escribir
  borrarEquipoSeleccionado() {
    this.nuevaReparacion.equipo = null;
    this.equipoSeleccionado2 = false;
  }

  tipoEquipoSeleccionado = false;

  // Función de búsqueda para Typeahead
  buscarTiposEquipo = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 1
          ? []
          : this.tiposEquipo.filter((tipo) =>
              tipo.nombre.toLowerCase().includes(term.toLowerCase())
            )
      )
    );

  // Formatear la visualización en la lista de sugerencias
  resultEquipoFormatter = (tipo: any) => tipo.nombre;

  // Formatear la visualización en el input cuando se selecciona un tipo de equipo
  inputEquipoFormatter = (tipo: any) => (tipo ? tipo.nombre : '');

  // Se ejecuta cuando el usuario selecciona un tipo de equipo de la lista
  onTipoEquipoSeleccionado(event: any) {
    if (event && event.item) {
      this.nuevoEquipo.tipo_equipo = event.item;
      this.tipoEquipoSeleccionado = true;
    }
  }

  // Permite limpiar la selección y volver a escribir
  borrarTipoEquipoSeleccionado() {
    this.nuevoEquipo.tipo_equipo = null;
    this.tipoEquipoSeleccionado = false;
  }

  marcaSeleccionada = false;

  // Función de búsqueda para Typeahead
  buscarMarcas = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 1
          ? []
          : this.marcas.filter((marca) =>
              marca.nombre.toLowerCase().includes(term.toLowerCase())
            )
      )
    );

  // Formatear la visualización en la lista de sugerencias
  resultMarcaFormatter = (marca: any) => marca.nombre;

  // Formatear la visualización en el input cuando se selecciona una marca
  inputMarcaFormatter = (marca: any) => (marca ? marca.nombre : '');

  // Se ejecuta cuando el usuario selecciona una marca de la lista
  onMarcaSeleccionada(event: any) {
    if (event && event.item) {
      this.nuevoEquipo.marca = event.item;
      this.marcaSeleccionada = true;

      this.getModelosPorMarca(event.item.id);
    }
  }

  // Permite limpiar la selección y volver a escribir
  borrarMarcaSeleccionada() {
    this.nuevoEquipo.marca = null;
    this.marcaSeleccionada = false;
  }

  modeloSeleccionado = false; // Indica si se ha seleccionado un modelo

  // Función de búsqueda para Typeahead
  buscarModelos = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 1
          ? []
          : this.modelos.filter((modelo) =>
              modelo.nombre.toLowerCase().includes(term.toLowerCase())
            )
      )
    );

  // Formatear la visualización en la lista de sugerencias
  resultFormatterModelo = (modelo: any) => modelo.nombre;

  // Formatear la visualización en el input cuando se selecciona un modelo
  inputFormatterModelo = (modelo: any) => (modelo ? modelo.nombre : '');

  // Se ejecuta cuando el usuario selecciona un modelo de la lista
  onModeloSeleccionado(event: any) {
    if (event && event.item) {
      this.nuevoEquipo.modelo = event.item;
      this.modeloSeleccionado = true;
    }
  }

  // Permite limpiar la selección y volver a escribir
  borrarModeloSeleccionado() {
    this.nuevoEquipo.modelo = null;
    this.modeloSeleccionado = false;
  }
}
