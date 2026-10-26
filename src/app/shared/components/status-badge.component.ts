import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="status-badge" [ngClass]="statusClass">{{ prettyStatus }}</span>`,
  styles: [`
    .status-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:750;letter-spacing:.035em;white-space:nowrap;text-transform:capitalize}
    .status-badge:before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.85}
    .status-active,.status-approved,.status-renewed,.status-completed,.status-resolved,.status-paid{background:#e6f7ef;color:#147d50}
    .status-pending,.status-submitted,.status-under-review,.status-in-progress,.status-waiting-for-customer{background:#fff5dc;color:#946200}
    .status-suspended,.status-inactive,.status-expired,.status-rejected,.status-cancelled,.status-closed{background:#fbe9e8;color:#b93832}
    .status-default{background:#eef1f7;color:#64708a}
  `]
})
export class StatusBadgeComponent {
  @Input() status = '';
  get prettyStatus(): string { return (this.status || 'Unknown').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }
  get statusClass(): string { const s=(this.status||'').toLowerCase().replaceAll('_','-'); return ['active','approved','renewed','completed','resolved','paid','pending','pending-payment','submitted','under-review','in-progress','waiting-for-customer','suspended','inactive','expired','rejected','cancelled','closed'].includes(s) ? `status-${s}` : 'status-default'; }
}
