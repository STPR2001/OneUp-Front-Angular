import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ClientsComponent } from './clients/clients.component';
import { AgregarClienteComponent } from './clients/agregar-cliente/agregar-cliente.component'; 
import { TecnicsComponent } from './components/tecnics/tecnics.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ModificarClienteComponent } from './clients/modificar-cliente/modificar-cliente.component';
import { EliminarClienteComponent } from './eliminar-cliente/eliminar-cliente.component';

@NgModule({
  declarations: [AppComponent, SidebarComponent, ClientsComponent, AgregarClienteComponent, TecnicsComponent, ModificarClienteComponent, EliminarClienteComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule, NgbModule], 
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
