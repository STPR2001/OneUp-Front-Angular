import { Component, OnInit } from '@angular/core';
import { ClientsService } from 'src/app/services/clients.service';

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

  get filteredClientes() {
    return this.clientes.filter((cliente) =>
      cliente.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
