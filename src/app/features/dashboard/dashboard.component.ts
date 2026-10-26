import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PortalDataService } from '../../core/services/portal-data.service';
import { Cancellation, Policy, Renewal, ServiceRequest } from '../../shared/models/app.models';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  policies: Policy[] = [];
  renewals: Renewal[] = [];
  requests: ServiceRequest[] = [];
  cancellations: Cancellation[] = [];
  loading = true;
  today = new Date();
  constructor(private data: PortalDataService) {}
  ngOnInit(): void {
    forkJoin({ policies: this.data.getPolicies(), renewals: this.data.getRenewals(), requests: this.data.getServiceRequests(), cancellations: this.data.getCancellations() })
      .subscribe({ next: result => { this.policies=result.policies; this.renewals=result.renewals; this.requests=result.requests; this.cancellations=result.cancellations; this.loading=false; }, error: () => this.loading=false });
  }
  get activePolicies(): number { return this.policies.filter(p => p.policyStatus === 'ACTIVE').length; }
  get openRenewals(): number { return this.renewals.filter(r => ['PENDING','PAID'].includes(r.renewalStatus)).length; }
  get openRequests(): number { return this.requests.filter(r => !['COMPLETED','CLOSED','REJECTED'].includes(r.status)).length; }
  get pendingClosures(): number { return this.cancellations.filter(c => c.requestStatus === 'PENDING').length; }
  get recentPolicies(): Policy[] { return this.policies.slice(0, 4); }
  get upcomingRenewals(): Renewal[] { return [...this.renewals].filter(r => r.renewalStatus !== 'RENEWED').slice(0, 4); }
  policyNo(id: number): string { return this.policies.find(p => p.policyId === id)?.policyNumber ?? `POL-${id}`; }
  productLabel(id: number): string { const labels: Record<number,string> = { 11:'Life Secure',12:'Health Plus',13:'Motor Protect',14:'Family Shield' }; return labels[id] ?? `Product ${id}`; }
  getStatusCount(status: string): number { return this.policies.filter(p => p.policyStatus === status).length; }
  get activePercent(): number { return this.policies.length ? Math.round(this.activePolicies / this.policies.length * 100) : 0; }
  get requestAttentionPercent(): number { return this.requests.length ? Math.round(this.openRequests / this.requests.length * 100) : 0; }
}
