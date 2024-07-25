import { Component, OnInit, ViewChild } from '@angular/core';
import { ClientsService } from 'src/app/services/clients.service';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDialogComponent } from 'src/app/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
})
export class ClientsComponent implements OnInit {
  @ViewChild('agregarClienteModal') modalCloseAdd: any;
  @ViewChild('ModificarClienteModal') modalCloseUpdate: any;

  nuevoCliente: any = {};
  clientes: any[] = [];
  clienteSeleccionado: any = {};
  searchTerm: string = '';
  errorAgregarCliente = false;
  cliente: any = {};
  errorModificarCliente = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientsService: ClientsService,
    private modalService: NgbModal,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getClientes();
  }

  getClientes(): void {
    this.clientsService
      .getClientesActivos(this.currentPage, this.pageSize, this.nombre)
      .subscribe(
        (data) => {
          this.clientes = data.content;
          this.totalPages = data.totalPages;
        },
        (error) => {
          console.error('Error al obtener la lista de clientes:', error);
        }
      );
  }

  desactivarCliente(cliente: any): void {
    this.clientsService
      .desactivarCliente(cliente)
      .pipe(
        tap(() => {
          console.log('Cliente desactivado exitosamente');
          this.getClientes();
        }),
        catchError((error) => {
          console.error('Error al desactivar cliente:', error);
          return of(error);
        })
      )
      .subscribe();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getClientes();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.getClientes();
  }

  seleccionarCliente(cliente: any): void {
    this.clienteSeleccionado = { ...cliente };
  }

  agregarCliente(): void {
    this.clientsService
      .agregarCliente(this.nuevoCliente)
      .pipe(
        tap(() => {
          console.log('Cliente agregado exitosamente');
          this.nuevoCliente = {};
          this.getClientes();
          this.modalCloseAdd.nativeElement.click();
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

  modificarCliente(): void {
    this.clientsService
      .modificarCliente(this.cliente)
      .pipe(
        tap(() => {
          console.log('Cliente modificado exitosamente');
          this.router.navigate(['/clients']);
          this.getClientes();
          this.modalCloseUpdate.nativeElement.click();
        }),
        catchError((error) => {
          console.error('Error al modificar cliente:', error);
          this.errorModificarCliente = true;
          setTimeout(() => {
            this.errorModificarCliente = false;
          }, 5000);
          return of(error);
        })
      )
      .subscribe();
  }

  abrirModalModificacion(
    id: string,
    nombre: string,
    email: string,
    telefono: string,
    cedula: string,
    direccion: string,
    observacion: string
  ) {
    this.cliente.id = id;
    this.cliente.nombre = nombre;
    this.cliente.email = email;
    this.cliente.telefono = telefono;
    this.cliente.cedula = cedula;
    this.cliente.direccion = direccion;
    this.cliente.observacion = observacion;
  }

  eliminarCliente(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.clientsService.eliminarCliente(id).subscribe(
          () => {
            this.getClientes();
          },
          (error) => {
            console.error('Error al eliminar cliente', error);
          }
        );
      }
    });
  }
}
