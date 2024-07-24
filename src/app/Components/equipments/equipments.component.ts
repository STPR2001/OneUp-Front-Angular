import { Component, OnInit, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-equipments',
  templateUrl: './equipments.component.html',
  styleUrls: ['./equipments.component.css'],
})
export class EquipmentsComponent implements OnInit {
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
    this.getEquipos();
    this.getMarcas();
    this.getTiposEquipo();
  }

  getEquipos(): void {
    this.EquipoService.getEquiposActivos(
      this.currentPage,
      this.pageSize,
      this.nombre
    ).subscribe(
      (data) => {
        this.equipos = data.content;
        this.totalPages = data.totalPages;
      },
      (error) => {
        console.error('Error al obtener la lista de equipos:', error);
      }
    );
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
    });
  }
}
