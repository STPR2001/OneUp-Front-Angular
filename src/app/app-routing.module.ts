import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './Components/clients/clients.component';
import { AgregarClienteComponent } from './Components/clients/agregar-cliente/agregar-cliente.component'; 
import { TecnicsComponent } from './Components/tecnics/tecnics.component'; 
import { ProvidersComponent } from './Components/providers/providers.component'; 
import { RepuestosComponent } from './Components/repuestos/repuestos.component'; 
import { ModificarClienteComponent } from './Components/clients/modificar-cliente/modificar-cliente.component';
import { EliminarClienteComponent } from './Components/clients/eliminar-cliente/eliminar-cliente.component'; 

const routes: Routes = [
  { path: 'clients', component: ClientsComponent },
  { path: 'add-client', component: AgregarClienteComponent }, 
  { path: 'tecnicos', component: TecnicsComponent },
 { path: 'proveedores', component: ProvidersComponent },
  { path: 'update-client/:id', component: ModificarClienteComponent },
  { path: 'delete-client/:id', component: EliminarClienteComponent }, 
 { path: 'repuestos', component: RepuestosComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
