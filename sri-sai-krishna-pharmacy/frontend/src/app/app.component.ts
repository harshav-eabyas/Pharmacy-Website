import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { STORE } from './store.config';
@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <header class="nav"><div class="wrap bar">
    <a routerLink="/" class="brand"><span class="cross">+</span>{{s.name}}</a>
    <button class="burger" (click)="open=!open" aria-label="Menu">☰</button>
    <nav [class.open]="open" (click)="open=false">
      <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}">Home</a>
      <a routerLink="/about" routerLinkActive="on">About Us</a>
      <a routerLink="/products" routerLinkActive="on">Medicines</a>
      <a routerLink="/services" routerLinkActive="on">Services</a>
      <a routerLink="/support" routerLinkActive="on">Support</a>
      <a routerLink="/contact" class="btn">Contact Us</a>
    </nav></div></header>
  <main><router-outlet/></main>
  <footer><div class="wrap"><strong>{{s.name}}</strong><br>{{s.address}}<br>{{s.phone}} · {{s.email}}<br><small>{{s.hours}}</small></div></footer>`,
  styles: [`
  .nav{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
  .bar{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:68px;flex-wrap:wrap}
  .brand{display:flex;align-items:center;gap:10px;font:700 1.05rem Fraunces,serif;color:var(--navy);text-decoration:none}
  .cross{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--grad);color:#fff;font:700 1.4rem Inter}
  nav{display:flex;align-items:center;gap:22px}nav a{text-decoration:none;color:var(--navy);font-weight:500}nav a.on{color:var(--blue)}nav .btn{color:#fff;padding:9px 20px}
  .burger{display:none;background:none;border:0;font-size:1.6rem;cursor:pointer}
  footer{background:var(--navy);color:#cfe3ef;padding:36px 0;margin-top:0}
  @media(max-width:860px){.burger{display:block}nav{display:none;width:100%;flex-direction:column;align-items:flex-start;padding-bottom:14px}nav.open{display:flex}}`]
})
export class AppComponent { s = STORE; open = false; }
