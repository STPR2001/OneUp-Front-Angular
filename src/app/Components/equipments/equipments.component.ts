import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { EquipoService } from 'src/app/services/equipo.service';
import { BrandService } from 'src/app/services/brand.service';
import { EquipmentTypeService } from 'src/app/services/equipment-type.service';
import { ModelService } from 'src/app/services/model.service';
import { AfterViewInit, Renderer2 } from '@angular/core';
import { ElementRef } from '@angular/core';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable, debounceTime, distinctUntilChanged, map, Subject, Subscription } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-equipments',
  templateUrl: './equipments.component.html',
  styleUrls: ['./equipments.component.css'],
})
export class EquipmentsComponent implements OnInit, OnDestroy {
  @ViewChild('agregarEquipoModal') agregarEquipoModal: any;
  @ViewChild('ModificarEquipoModal') modalCloseUpdate: any;
  @ViewChild('agregarTipoEquipoModal') agregarTipoEquipoModal: any;
  @ViewChild('agregarMarcaModal') agregarMarcaModal: any;
  @ViewChild('agregarModeloModal') agregarModeloModal: any;
  @ViewChild('modificarEquipoModal') modificarEquipoModal: any;

  agregarEquipoModalRef: NgbModalRef | undefined;
  agregarTipoEquipoModalRef: NgbModalRef | undefined;
  agregarMarcaModalRef: NgbModalRef | undefined;
  agregarModeloModalRef: NgbModalRef | undefined;

  equipos: any[] = [];
  allEquipos: any[] = [];
  filteredEquipos: any[] = [];
  equipo: any = {};
  equipoSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarEquipo = false;
  errorModificarEquipo = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';
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

  // Para búsqueda con debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Nuevas propiedades para estadísticas y funcionalidades
  viewMode: 'cards' | 'table' = 'table';
  darkMode: boolean = false;
  isLoading: boolean = false;

  // Autocompletado
  tipoEquipoSeleccionado: boolean = false;
  marcaSeleccionada: boolean = false;
  modeloSeleccionado: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private EquipoService: EquipoService,
    private modalService: NgbModal,
    private BrandService: BrandService,
    private EquipmentTypeService: EquipmentTypeService,
    private ModelService: ModelService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeDarkMode();
    this.setupSearchDebounce();
    this.getEquipos();
    this.getAllEquiposForStats();
    this.getTiposEquipo();
    this.getMarcas();
    this.getModelos();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private initializeDarkMode(): void {
    const savedMode = localStorage.getItem('darkMode');
    this.darkMode = savedMode === 'true';
    this.applyDarkMode();
  }

  private applyDarkMode(): void {
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    this.applyDarkMode();
  }

  private setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.nombre = searchTerm;
        this.currentPage = 0;
        this.getEquipos();
      });
  }

  onSearchInput(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  getAllEquiposForStats(): void {
    // Obtener todos los equipos para las estadísticas
    this.EquipoService
      .getEquiposActivos(0, 1000, '')
      .subscribe(
        (data) => {
          this.allEquipos = data.content;
        },
        (error) => {
          console.error('Error al obtener equipos para estadísticas:', error);
        }
      );
  }

  // Métodos para estadísticas
  getTotalEquipos(): number {
    return this.allEquipos.length;
  }

  getEquiposPorTipo(): { [key: string]: number } {
    const equiposPorTipo: { [key: string]: number } = {};
    this.allEquipos.forEach(equipo => {
      const tipo = equipo.tipo_equipo?.nombre || 'Sin tipo';
      equiposPorTipo[tipo] = (equiposPorTipo[tipo] || 0) + 1;
    });
    return equiposPorTipo;
  }

  getEquiposPorMarca(): { [key: string]: number } {
    const equiposPorMarca: { [key: string]: number } = {};
    this.allEquipos.forEach(equipo => {
      const marca = equipo.marca?.nombre || 'Sin marca';
      equiposPorMarca[marca] = (equiposPorMarca[marca] || 0) + 1;
    });
    return equiposPorMarca;
  }

  getMarcaMasComun(): string {
    const equiposPorMarca = this.getEquiposPorMarca();
    const marcas = Object.keys(equiposPorMarca);
    if (marcas.length === 0) return '';
    
    return marcas.reduce((marcaMasComun, marca) => 
      equiposPorMarca[marca] > equiposPorMarca[marcaMasComun] ? marca : marcaMasComun
    );
  }

  getTiposEquipoCount(): number {
    const tipos = new Set(this.allEquipos.map(e => e.tipo_equipo?.nombre).filter(Boolean));
    return tipos.size;
  }

  getMarcasCount(): number {
    const marcas = new Set(this.allEquipos.map(e => e.marca?.nombre).filter(Boolean));
    return marcas.size;
  }

  // Funcionalidades adicionales
  trackByEquipoId(index: number, equipo: any): any {
    return equipo.id;
  }

  verDetallesEquipo(equipo: any): void {
    this.equipoSeleccionado = { ...equipo };
    const modalElement = document.getElementById('verDetallesEquipoModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  getEquipoIcon(equipo: any): string {
    const tipo = equipo.tipo_equipo?.nombre?.toLowerCase() || '';
    if (tipo.includes('laptop') || tipo.includes('portátil')) return 'laptop';
    if (tipo.includes('desktop') || tipo.includes('escritorio')) return 'computer';
    if (tipo.includes('tablet')) return 'tablet';
    if (tipo.includes('phone') || tipo.includes('móvil')) return 'smartphone';
    if (tipo.includes('monitor')) return 'monitor';
    if (tipo.includes('server') || tipo.includes('servidor')) return 'dns';
    return 'devices';
  }

  exportarEquipos(): void {
    if (this.equipos.length === 0) {
      return;
    }

    const csvHeaders = ['Tipo de Equipo', 'Marca', 'Modelo', 'Número de Serie'];
    const csvData = this.equipos.map(equipo => [
      equipo.tipo_equipo?.nombre || '',
      equipo.marca?.nombre || '',
      equipo.modelo?.nombre || '',
      equipo.numeroSerie || ''
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `equipos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refrescarDatos(): void {
    this.getEquipos();
    this.getAllEquiposForStats();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'table' ? 'cards' : 'table';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  getEquipos(): void {
    this.isLoading = true;
    this.EquipoService
      .getEquiposActivos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
      (data) => {
        this.equipos = data.content;
        this.totalPages = data.totalPages;
          this.isLoading = false;
      },
      (error) => {
          console.error('Error al obtener equipos:', error);
          this.isLoading = false;
      }
    );
  }

  desactivarEquipo(equipo: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.EquipoService.desactivarEquipo(equipo)
          .pipe(
            tap(() => {
              console.log('Equipo desactivado exitosamente');
              this.getEquipos();
              this.getAllEquiposForStats();
            }),
            catchError((error) => {
              console.error('Error al desactivar equipo:', error);
              return of(error);
            })
          )
          .subscribe();
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getEquipos();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.getEquipos();
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
          this.getAllEquiposForStats();
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

  modificarEquipo(): void {
    this.EquipoService.modificarEquipo(this.equipoSeleccionado)
      .pipe(
        tap(() => {
          console.log('Equipo modificado exitosamente');
          this.getEquipos();
          this.getAllEquiposForStats();
          this.modalService.dismissAll();
        }),
        catchError((error) => {
          console.error('Error al modificar equipo:', error);
          this.errorModificarEquipo = true;
          setTimeout(() => {
            this.errorModificarEquipo = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  eliminarEquipo(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.EquipoService.eliminarEquipo(id).subscribe(
          () => {
            this.getEquipos();
            this.getAllEquiposForStats();
          },
          (error) => {
            console.error('Error al eliminar equipo', error);
          }
        );
      }
    });
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

  getModelos(): void {
    this.ModelService.getModelos().subscribe(
      (modelos) => {
        this.modelos = modelos;
      },
      (error) => {
        console.error('Error al obtener modelos:', error);
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
          this.getModelosPorMarca(this.nuevoEquipo.marca.id);
          this.nuevoModelo = {
            nombre: '',
            marca: { id: '' },
          };
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

  openModificarEquipoModal(equipo: any) {
    this.equipoSeleccionado = { ...equipo };
    this.modalService.open(this.modificarEquipoModal, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
    });
  }

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
