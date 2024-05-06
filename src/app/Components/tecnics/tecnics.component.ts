import { Component, OnInit } from '@angular/core';
import { TecnicsService } from 'src/app/services/tecnics.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tecnics',
  templateUrl: './tecnics.component.html',
  styleUrls: ['./tecnics.component.css']
})

export class TecnicsComponent implements OnInit {

  tecnicos: any[] = [];
  tecnicoSeleccionado: any = {};
  searchTerm: string = '';

  constructor(private tecnicsService: TecnicsService, private router: Router) { }

  ngOnInit(): void {
    this.getTecnicos();
  }

  getTecnicos(): void {
    this.tecnicsService.getTecnicos().subscribe(
      (data) => {
        this.tecnicos = data;
      },
      (error) => {
        console.error('Error al obtener la lista de tecnicos:', error);
      }
    );
  }

  seleccionarTecnico(tecnico: any): void {
    this.tecnicoSeleccionado = { ...tecnico };
  }

  navigateToUpdateTecnico(id: string, nombre: string): void {
    this.router.navigateByUrl(`/tecnicos/update`, { state: { nombre: nombre, id: id } });
  }

  modificarTecnico(tecnicoSeleccionado: any): void {
    const id = this.tecnicoSeleccionado.id;
    this.tecnicsService
      .modificarTecnico(id, this.tecnicoSeleccionado)
      .subscribe(
        () => {
          this.getTecnicos();
          this.tecnicoSeleccionado = {};
        },
        (error) => {
          console.error('Error al modificar el tecnico:', error);
        }
      );
  }

  eliminarTecnico(id: number): void {
    this.tecnicsService.eliminarTecnico(id).subscribe(
      () => {
        this.getTecnicos();
      },
      (error) => {
        console.error('Error al eliminar tecnico:', error);
      }
    );
  }

  get filteredTecnicos() {
    return this.tecnicos.filter((tecnico) =>
      tecnico.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

}  