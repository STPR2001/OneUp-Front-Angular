import { Component, OnInit, ViewChild } from '@angular/core';
import { RepuestosService } from 'src/app/services/repuestos.service';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-repuestos',
  templateUrl: './repuestos.component.html',
  styleUrls: ['./repuestos.component.css'],
})
export class RepuestosComponent implements OnInit {
  @ViewChild('agregarRepuestoModal') modalCloseAdd: any;
  @ViewChild('ModificarRepuestoModal') modalCloseUpdate: any;

  repuesto: any = {};
  errorModificarRepuesto = false;
  nuevoRepuesto: any = {
    numeroDeParte: '',
    precioCosto: '',
    precioVenta: '',
  };
  repuestos: any[] = [];
  repuestoSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarRepuesto = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  constructor(
    private repuestosService: RepuestosService,
    private router: Router,
    private modalService: NgbModal,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getRepuestos();
  }

  getRepuestos(): void {
    this.repuestosService
      .getRepuestosActivos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.repuestos = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de repuestos:', error);
        }
      );
  }

  desactivarRepuesto(repuesto: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.repuestosService
          .desactivarRepuesto(repuesto)
          .pipe(
            tap(() => {
              console.log('Repuesto desactivado exitosamente');
              this.getRepuestos();
            }),
            catchError((error) => {
              console.error('Error al desactivar repuesto:', error);
              return of(error);
            })
          )
          .subscribe();
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getRepuestos();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.getRepuestos();
  }

  seleccionarRepuesto(repuesto: any): void {
    this.repuestoSeleccionado = { ...repuesto };
  }

  navigateToUpdateRepuesto(id: string, nombre: string): void {
    this.router.navigateByUrl(`/repuestos/update`, {
      state: { nombre: nombre, id: id },
    });
  }

  eliminarRepuesto(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.repuestosService.eliminarRepuesto(id).subscribe(
          () => {
            this.getRepuestos();
          },
          (error) => {
            console.error('Error al eliminar repuesto:', error);
          }
        );
      }
    });
  }

  agregarRepuesto(): void {
    this.repuestosService.agregarRepuesto(this.nuevoRepuesto).subscribe({
      next: (response) => {
        console.log(response);
        this.router.navigate(['/repuestos']);
        this.nuevoRepuesto = {
          numeroDeParte: '',
          precioCosto: '',
          precioVenta: '',
        };
        this.getRepuestos();
        this.modalCloseAdd.nativeElement.click();
      },
      error: (error) => {
        console.log('Error al agregar repuesto:', error);
        this.errorAgregarRepuesto = true;
        setTimeout(() => {
          this.errorAgregarRepuesto = false;
        }, 5000);
        return of(error);
      },
    });
  }

  modificarRepuesto(): void {
    this.repuestosService
      .modificarRepuesto(this.repuesto)
      .pipe(
        tap(() => {
          this.router.navigate(['/repuestos']);
          this.getRepuestos();
          this.modalCloseUpdate.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al modificar repuesto:', error);
          this.errorModificarRepuesto = true;
          setTimeout(() => {
            this.errorModificarRepuesto = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }
  abrirModalModificacion(
    repuestoId: string,
    repuestoNumeroDeParte: string,
    repuestoDescripcion: string,
    repuestoPrecioCosto: number,
    repuestoPrecioVenta: number,
    repuestoStock: number
  ) {
    this.repuesto.id = repuestoId;
    this.repuesto.numeroDeParte = repuestoNumeroDeParte;
    this.repuesto.descripcion = repuestoDescripcion;
    this.repuesto.precioCosto = repuestoPrecioCosto;
    this.repuesto.precioVenta = repuestoPrecioVenta;
    this.repuesto.stock = repuestoStock;
  }
}
