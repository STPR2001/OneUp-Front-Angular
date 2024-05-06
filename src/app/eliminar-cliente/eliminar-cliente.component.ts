import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientsService } from 'src/app/services/clients/clients.service';

@Component({
  selector: 'app-eliminar-cliente',
  templateUrl: './eliminar-cliente.component.html',
  styleUrls: ['./eliminar-cliente.component.css'],
})
export class EliminarClienteComponent {
  clientID: string | null = null; // Inicializamos clientID como null

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientsService: ClientsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id !== null) {
      this.clientID = id;
    } else {
      console.error('El ID del cliente es nulo');
    }
  }

  confirmarEliminacion(): void {
    if (this.clientID !== null) {
      const idNumber = Number(this.clientID);
      if (!isNaN(idNumber)) {
        this.clientsService.eliminarCliente(idNumber).subscribe(
          () => {
            console.log('Cliente eliminado correctamente');
            this.router.navigate(['/clients']);
          },
          (error) => {
            console.error('Error al eliminar cliente:', error);
          }
        );
      } else {
        console.error('El ID del cliente no es un número válido');
      }
    } else {
      console.error('El ID del cliente es nulo, no se puede eliminar');
    }
  }
}
