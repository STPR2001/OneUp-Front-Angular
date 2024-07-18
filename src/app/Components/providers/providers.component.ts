import { Component, OnInit, ViewChild } from '@angular/core';
import { ProvidersService } from 'src/app/services/providers.service';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-providers',
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.css'],
})
export class ProvidersComponent implements OnInit {
  @ViewChild('agregarProveedorModal') modalCloseAdd: any;
  @ViewChild('ModificarProveedorModal') modalCloseUpdate: any;

  proveedor: any = {};
  errorModificarProveedor = false;
  nuevoProveedor: any = {};
  proveedores: any[] = [];
  proveedorSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarProveedor = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  constructor(
    private providersService: ProvidersService,
    private router: Router,
    private modalService: NgbModal,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getProveedores();
  }

  getProveedores(): void {
    this.providersService
      .getProveedores(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.proveedores = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de proveedores:', error);
        }
      );
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getProveedores();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.getProveedores();
  }
  seleccionarProveedor(proveedor: any): void {
    this.proveedorSeleccionado = { ...proveedor };
  }

  navigateToUpdateProveedor(id: string, nombre: string): void {
    this.router.navigateByUrl(`/proveedores/update`, {
      state: { nombre: nombre, id: id },
    });
  }

  eliminarProveedor(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.providersService.eliminarProveedor(id).subscribe(
          () => {
            this.getProveedores();
          },
          (error) => {
            console.error('Error al eliminar proveedor:', error);
          }
        );
      }
    });
  }

  agregarProveedor(): void {
    this.providersService
      .agregarProveedor(this.nuevoProveedor)
      .pipe(
        tap(() => {
          this.router.navigate(['/proveedores']);
          this.nuevoProveedor = {};
          this.getProveedores();
          this.modalCloseAdd.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al agregar proveedor:', error);
          this.errorAgregarProveedor = true;
          setTimeout(() => {
            this.errorAgregarProveedor = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  modificarProveedor(): void {
    this.providersService
      .modificarProveedor(this.proveedor)
      .pipe(
        tap(() => {
          this.router.navigate(['/proveedores']);
          this.getProveedores();
          this.modalCloseUpdate.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al modificar proveedor:', error);
          this.errorModificarProveedor = true;
          setTimeout(() => {
            this.errorModificarProveedor = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }
  abrirModalModificacion(
    proveedorId: string,
    proveedorNombre: string,
    proveedorDireccion: string,
    proveedorTelefono: string,
    proveedorCorreo: string
  ) {
    this.proveedor.id = proveedorId;
    this.proveedor.nombre = proveedorNombre;
    this.proveedor.direccion = proveedorDireccion;
    this.proveedor.telefono = proveedorTelefono;
    this.proveedor.email = proveedorCorreo;
  }
}
