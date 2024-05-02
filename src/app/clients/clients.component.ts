import { Component, OnInit } from '@angular/core';
import { ClientsService } from '../services/clients/clients.service';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
})
export class ClientsComponent implements OnInit {
  clientes: any[] = [];
  clienteSeleccionado: any = {};
  searchTerm: string = '';

  constructor(private clientsService: ClientsService) {}

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

  modificarCliente(clienteSeleccionado: any): void {
    const id = this.clienteSeleccionado.id;
    this.clientsService
      .modificarCliente(id, this.clienteSeleccionado)
      .subscribe(
        () => {
          console.log('Cliente modificado exitosamente');
          this.getClientes();
          this.clienteSeleccionado = {};
        },
        (error) => {
          console.error('Error al modificar cliente:', error);
        }
      );
  }

  eliminarCliente(id: number): void {
    this.clientsService.eliminarCliente(id).subscribe(
      () => {
        console.log('Cliente eliminado exitosamente');
        this.getClientes();
      },
      (error) => {
        console.error('Error al eliminar cliente:', error);
      }
    );
  }

  get filteredClientes() {
    return this.clientes.filter((cliente) =>
      cliente.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
