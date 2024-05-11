import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './clients/clients.component';
import { AgregarClienteComponent } from './clients/agregar-cliente/agregar-cliente.component'; 
import { TecnicsComponent } from './components/tecnics/tecnics.component'; 
import { ModificarClienteComponent } from './clients/modificar-cliente/modificar-cliente.component';
import { EliminarClienteComponent } from './eliminar-cliente/eliminar-cliente.component'; 

const routes: Routes = [
  { path: 'clients', component: ClientsComponent },
  { path: 'add-client', component: AgregarClienteComponent }, 
  { path: 'tecnicos', component: TecnicsComponent } 
  { path: 'update-client/:id', component: ModificarClienteComponent },
  { path: 'delete-client/:id', component: EliminarClienteComponent }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
