import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './Components/clients/clients.component';
import { TecnicsComponent } from './Components/tecnics/tecnics.component'; 
import { ProvidersComponent } from './Components/providers/providers.component'; 
import { LoginComponent } from './Components/login/login.component';
import { AuthGuard } from './services/auth/auth.guard';
import { HomeComponent } from './Components/home/home.component';
import { ShoppingComponent } from './Components/shopping/shopping.component'; 
import { NewShoppingComponent } from './Components/shopping/new-shopping/new-shopping.component';

const routes: Routes = [
  { path: 'clients', component: ClientsComponent, canActivate: [AuthGuard]},
  { path: 'tecnicos', component: TecnicsComponent, canActivate: [AuthGuard] },
  { path: 'proveedores', component: ProvidersComponent, canActivate: [AuthGuard] },
  { path: 'compras', component: ShoppingComponent, canActivate: [AuthGuard] },
  { path: 'compras/new', component:  NewShoppingComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [AuthGuard]},
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
