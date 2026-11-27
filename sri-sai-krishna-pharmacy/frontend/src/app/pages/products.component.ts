import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { STORE } from '../store.config';
@Component({ standalone: true, imports: [FormsModule], template: `
<section class="section"><div class="wrap"><h2>Medicines</h2>
  <input [(ngModel)]="q" (ngModelChange)="load()" placeholder="Search by medicine or generic name" aria-label="Search medicines">
  @if (error()) { <p class="err">Could not load medicines. Check that the API is running.</p> }
  @else if (!items().length) { <p>No medicines match your search. Try another name or call the store.</p> }
  <div class="grid">
  @for (m of items(); track m.Id) {
    <div class="card"><h3>{{m.Name}}</h3><p>{{m.GenericName}} · {{m.Manufacturer}}<br><strong>₹{{m.Mrp}}</strong></p>
    <span [class]="m.InStock>0?'ok':'err'">{{m.InStock>0?'In stock':'Out of stock'}}</span></div>
  }</div></div></section>` })
export class ProductsComponent implements OnInit {
  q = ''; items = signal<any[]>([]); error = signal(false);
  constructor(private http: HttpClient) {}
  ngOnInit() { this.load(); }
  load() { this.http.get<any[]>(`${STORE.api}/medicines`, { params: { q: this.q } })
    .subscribe({ next: r => { this.items.set(r); this.error.set(false); }, error: () => this.error.set(true) }); }
}
