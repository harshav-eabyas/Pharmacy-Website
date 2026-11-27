import { Routes } from '@angular/router';
import { HomeComponent, AboutComponent, ServicesComponent } from './pages/static.pages';
import { ProductsComponent } from './pages/products.component';
import { ContactComponent } from './pages/contact.component';
export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Home' },
  { path: 'about', component: AboutComponent, title: 'About Us' },
  { path: 'products', component: ProductsComponent, title: 'Medicines' },
  { path: 'services', component: ServicesComponent, title: 'Services' },
  { path: 'contact', component: ContactComponent, title: 'Contact Us' },
  { path: 'support', component: ContactComponent, data: { support: true }, title: 'Email Support' },
  { path: '**', redirectTo: '' }
];
