import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './Components/sidebar/sidebar.component';
import { ClientsComponent } from './Components/clients/clients.component';
import { AgregarClienteComponent } from './Components/clients/agregar-cliente/agregar-cliente.component'; 
import { TecnicsComponent } from './Components/tecnics/tecnics.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ModificarClienteComponent } from './Components/clients/modificar-cliente/modificar-cliente.component';
import { EliminarClienteComponent } from './Components/clients/eliminar-cliente/eliminar-cliente.component';
import { ProvidersComponent } from './Components/providers/providers.component';
import { RepuestosComponent } from './Components/repuestos/repuestos.component';

@NgModule({
  declarations: [AppComponent, SidebarComponent, ClientsComponent, AgregarClienteComponent, TecnicsComponent, ModificarClienteComponent, EliminarClienteComponent, ProvidersComponent, RepuestosComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule, NgbModule], 
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
