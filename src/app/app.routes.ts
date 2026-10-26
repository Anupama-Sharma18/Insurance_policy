import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Overview · Covera' },
  { path: 'policies', loadComponent: () => import('./features/policies/policies.component').then(m => m.PoliciesComponent), title: 'Policies · Covera' },
  { path: 'renewals', loadComponent: () => import('./features/renewals/renewals.component').then(m => m.RenewalsComponent), title: 'Renewals · Covera' },
  { path: 'servicing', loadComponent: () => import('./features/servicing/servicing.component').then(m => m.ServicingComponent), title: 'Policy servicing · Covera' },
  { path: 'cancellations', loadComponent: () => import('./features/cancellations/cancellations.component').then(m => m.CancellationsComponent), title: 'Policy closures · Covera' },
  { path: '**', redirectTo: 'dashboard' }
];
