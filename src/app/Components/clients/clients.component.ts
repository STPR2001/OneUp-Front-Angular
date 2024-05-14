import { Component, OnInit, ViewChild } from '@angular/core';
import { ClientsService } from 'src/app/services/clients.service';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientsService: ClientsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getClientes();
  }

  getClientes(): void {
    this.clientsService.getClientes().subscribe(
      (data) => {
        this.clientes = data;
      },
      (error) => {
        console.error('Error al obtener la lista de clientes:', error);
      }
    );
  }

  seleccionarCliente(cliente: any): void {
    this.clienteSeleccionado = { ...cliente };
  }

  get filteredClientes() {
    return this.clientes.filter((cliente) =>
      cliente.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
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
    this.clientsService.eliminarCliente(id).subscribe(
      () => {
        this.getClientes();
      },
      (error) => {
        console.error('Error al eliminar cliente', error);
      }
    );
  }
}
