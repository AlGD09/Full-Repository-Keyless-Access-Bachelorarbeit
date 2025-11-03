import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SmartphoneComponent } from './components/smartphone/smartphone.component';
import { RcuComponent } from './components/rcu/rcu.component';
import { RcuAssignComponent } from './components/rcu/rcu-assign.component';
import { HomeComponent } from './components/home/home.component';



export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'smartphone', component: SmartphoneComponent },
  { path: 'maschine', component: RcuComponent},
  { path: 'maschine/assign', component: RcuAssignComponent}
];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule]
// })
export class AppRoutingModule { }
