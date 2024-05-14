import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientsService } from 'src/app/services/clients.service';

@Component({
  selector: 'app-modificar-cliente',
  templateUrl: './modificar-cliente.component.html',
  styleUrls: ['./modificar-cliente.component.css'],
})
export class ModificarClienteComponent implements OnInit {
  cliente: any = {};
  errorModificarCliente = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientsService: ClientsService
  ) {}

  ngOnInit(): void {
    this.obtenerCliente();
  }

  obtenerCliente(): void {
    const idString = this.route.snapshot.paramMap.get('id');
    if (idString) {
      const id = parseInt(idString, 10);
      this.clientsService.obtenerClientePorId(id).subscribe(
        (data) => {
          this.cliente = data;
        },
        (error) => {
          console.error('Error al obtener cliente:', error);
        }
      );
    } else {
      console.error('ID de cliente no encontrado en la URL');
    }
  }

  modificarCliente(): void {
    this.clientsService.modificarCliente(this.cliente).subscribe(
      () => {
        console.log('Cliente modificado exitosamente');
        this.router.navigate(['/clients'], { queryParams: { success: true } });
      },
      (error) => {
        console.error('Error al modificar cliente:', error);
        this.errorModificarCliente = true;
        setTimeout(() => {
          this.errorModificarCliente = false;
        }, 5000);
      }
    );
  }
}
