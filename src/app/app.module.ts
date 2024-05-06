import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ClientsComponent } from './clients/clients.component';
import { AgregarClienteComponent } from './clients/agregar-cliente/agregar-cliente.component';
import { TecnicsComponent } from './Components/tecnics/tecnics.component';
import { NewTecnicoComponent } from './Components/tecnics/new-tecnico/new-tecnico.component';
import { UpdateTecnicoComponent } from './Components/tecnics/update-tecnico/update-tecnico.component';

@NgModule({
  declarations: [AppComponent, SidebarComponent, ClientsComponent, AgregarClienteComponent, TecnicsComponent, NewTecnicoComponent, UpdateTecnicoComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
