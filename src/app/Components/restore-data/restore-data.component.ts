import { Component } from '@angular/core';
import { ClientsService } from 'src/app/services/clients.service';

@Component({
  selector: 'app-restore-data',
  templateUrl: './restore-data.component.html',
  styleUrls: ['./restore-data.component.css']
})
export class RestoreDataComponent {

  clientes: any[] = [];
  
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  nombre: string = '';

  constructor(
    private clientsService: ClientsService,
  ) {}

  ngOnInit(): void {
    this.getClientes();
  }

  getClientes(): void {
    this.clientsService
      .getClientes(this.currentPage, this.pageSize, this.nombre)
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
}
