import { Component, OnInit } from '@angular/core';
import { BrandService } from 'src/app/services/brand.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {
  isLoading: boolean = false;
  successMessage: string | null = null;

  constructor(private brandServices: BrandService) { }
  ngOnInit(): void {
  }

  cargarMarcasModelos(): void {
    this.isLoading = true;
    this.successMessage = null;
    this.brandServices.cargarMarcasModelos().subscribe({
      next: (response) => {
        console.log(response);
        this.isLoading = false;
        this.successMessage = 'Datos cargados con éxito';
        setTimeout(() => {
          this.successMessage = null;
        }, 5000);
      },
      error: (error) => {
        console.log('Error al agregar repuesto:', error);
        this.isLoading = false;
        this.successMessage = 'Fallo en la carga de datos';
        setTimeout(() => {
          this.successMessage = null;
        }, 5000);
      }
    });
  }
}

