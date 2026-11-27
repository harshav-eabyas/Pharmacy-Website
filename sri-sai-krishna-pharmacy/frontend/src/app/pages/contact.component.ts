import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { STORE } from '../store.config';
@Component({ standalone: true, imports: [FormsModule], template: `
<section class="section"><div class="wrap two">
  <div><h2>{{support ? 'Email support' : 'Contact us'}}</h2>
    <p><strong>{{s.name}}</strong></p>
    <p>Phone: <a [href]="'tel:'+s.phone">{{s.phone}}</a><br>Email: <a [href]="'mailto:'+s.email">{{s.email}}</a><br>Address: {{s.address}}<br>Hours: {{s.hours}}</p></div>
  <form (ngSubmit)="send()" #f="ngForm" class="card">
    <input name="name" [(ngModel)]="d.name" placeholder="Your name" required>
    <input name="email" type="email" [(ngModel)]="d.email" placeholder="Email address" required>
    <input name="phone" [(ngModel)]="d.phone" placeholder="Phone (optional)">
    <input name="subject" [(ngModel)]="d.subject" placeholder="Subject">
    <textarea name="message" rows="5" [(ngModel)]="d.message" placeholder="How can we help?" required></textarea>
    <button class="btn" [disabled]="f.invalid || busy()">{{busy() ? 'Sending…' : 'Send Email'}}</button>
    @if (status()) { <p [class]="ok() ? 'ok' : 'err'">{{status()}}</p> }
  </form></div></section>`,
  styles: [`.two{display:grid;gap:32px;grid-template-columns:1fr 1fr}@media(max-width:800px){.two{grid-template-columns:1fr}}`] })
export class ContactComponent {
  s = STORE; support = false; d: any = { name: '', email: '', phone: '', subject: '', message: '' };
  busy = signal(false); status = signal(''); ok = signal(false);
  constructor(private http: HttpClient, r: ActivatedRoute) { this.support = !!r.snapshot.data['support']; }
  send() {
    this.busy.set(true); this.status.set('');
    this.http.post<any>(`${STORE.api}/contact`, { ...this.d, subject: this.d.subject || (this.support ? 'Support request' : 'Website inquiry') })
      .subscribe({
        next: r => { this.busy.set(false); this.ok.set(true);
          this.status.set(r.emailed ? 'Email sent. We will reply soon.' : 'Message saved. Email delivery failed, so please call us if urgent.');
          this.d = { name: '', email: '', phone: '', subject: '', message: '' }; },
        error: () => { this.busy.set(false); this.ok.set(false); this.status.set('Could not send your message. Check your details and try again.'); }
      });
  }
}
