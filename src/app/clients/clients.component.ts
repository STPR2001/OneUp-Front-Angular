import { Component, OnInit } from '@angular/core';
import { ClientsService } from '../services/clients/clients.service';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
})
export class ClientsComponent implements OnInit {
  clientes: any[] = [];

  constructor(private clientsService: ClientsService) {}

  ngOnInit(): void {
    this.getClients();
  }

  getClients(): void {
    this.clientsService.getClientes().subscribe((data) => {
      this.clientes = data;
    });
  }
}
