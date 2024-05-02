import { Component } from '@angular/core';
import { ClientsService } from 'src/app/services/clients/clients.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agregar-cliente',
  templateUrl: './agregar-cliente.component.html',
  styleUrls: ['./agregar-cliente.component.css'],
})
export class AgregarClienteComponent {
  nuevoCliente: any = {};
  errorAgregarCliente = false; // Bandera para controlar si ocurrió un error al agregar cliente

  constructor(private clientsService: ClientsService, private router: Router) {}

  agregarCliente(): void {
    this.clientsService.agregarCliente(this.nuevoCliente).subscribe(
      () => {
        console.log('Cliente agregado exitosamente');
        this.router.navigate(['/clients'], { queryParams: { success: true } });
        this.nuevoCliente = {};
      },
      (error) => {
        console.error('Error al agregar cliente:', error);
        this.errorAgregarCliente = true; // Establecer la bandera de error a verdadero
        setTimeout(() => {
          this.errorAgregarCliente = false; // Después de 5 segundos, ocultar el mensaje de error
        }, 5000); // 5000 milisegundos = 5 segundos
      }
    );
  }
}
