import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { STORE } from '../store.config';

@Component({ standalone: true, imports: [RouterLink], template: `
<section class="hero"><div class="wrap">
  <h1>Your neighbourhood pharmacy,<br>stocked and ready.</h1>
  <p>Genuine medicines, everyday essentials and friendly advice from {{s.name}}.</p>
  <a routerLink="/products" class="btn">Browse medicines</a> <a routerLink="/contact" class="btn ghost">Contact the store</a>
  <div class="pills"><span>Genuine, in-date stock</span><span>Prescription help</span><span>Quick billing</span></div>
</div></section>
<section class="section"><div class="wrap"><h2>What you can count on</h2><div class="grid">
  <div class="card"><h3>Genuine medicines</h3><p>Bought from licensed distributors and checked for expiry before they reach the shelf.</p></div>
  <div class="card"><h3>Clear advice</h3><p>Ask how and when to take a medicine. We explain it in plain words.</p></div>
  <div class="card"><h3>Everything in one stop</h3><p>Medicines, health supplements, baby care and general household items.</p></div>
</div></div></section>`,
styles: [`.hero{padding:96px 0 80px;color:#fff;background:var(--grad);position:relative;overflow:hidden}
.hero p{max-width:560px;font-size:1.15rem;margin-bottom:28px}.hero .ghost{border-color:#fff;background:transparent;color:#fff}
.hero::after{content:'+';position:absolute;right:6%;top:50%;font:700 22rem/1 Inter;opacity:.1;transform:translateY(-50%);animation:drift 12s ease-in-out infinite alternate}
@keyframes drift{to{transform:translateY(-44%) rotate(8deg)}}
.pills{display:flex;gap:10px;flex-wrap:wrap;margin-top:34px}.pills span{background:rgba(255,255,255,.18);padding:6px 14px;border-radius:999px;font-size:.9rem}`] })
export class HomeComponent { s = STORE; }

@Component({ standalone: true, template: `
<section class="section"><div class="wrap" style="max-width:760px"><h2>About us</h2>
<p>{{s.name}} serves families in our community with genuine medicines and daily-use essentials. Our pharmacists check every prescription and every expiry date, so what you take home is safe to use.</p>
<p>We keep honest prices, clear bills and stock for the common medicines people need most. If we do not have something, we will order it for you.</p></div></section>` })
export class AboutComponent { s = STORE; }

@Component({ standalone: true, template: `
<section class="section"><div class="wrap"><h2>Services</h2><div class="grid">
@for (x of items; track x[0]) { <div class="card"><h3>{{x[0]}}</h3><p>{{x[1]}}</p></div> }
</div></div></section>` })
export class ServicesComponent {
  items = [['Prescription filling','Bring your doctor’s prescription and we will prepare it while you wait.'],
    ['Home delivery','Call or send an email inquiry and we will arrange delivery nearby.'],
    ['Medicine availability check','Ask whether a medicine is in stock before you travel.'],
    ['Health supplies','Thermometers, BP monitors, bandages, diabetic care and more.'],
    ['General store items','Baby care, personal care and household essentials.'],
    ['Pharmacist advice','Dosage timing, storage and side-effect questions answered.']];
}
