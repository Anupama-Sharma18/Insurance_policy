import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PortalDataService } from '../../core/services/portal-data.service';
import { IssuanceEndorsement, Policy, PolicyCoverage, PolicyHistory, PolicyRequest, PolicyRider } from '../../shared/models/app.models';
import { forkJoin } from 'rxjs';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { HumanizePipe } from '../../shared/pipes/humanize.pipe';

@Component({
  standalone: true,
  selector: 'app-policies',
  imports: [CommonModule, FormsModule, StatusBadgeComponent, HumanizePipe],
  templateUrl: './policies.component.html',
  styleUrl: './policies.component.scss'
})
export class PoliciesComponent implements OnInit {
  policies: Policy[] = [];
  search = '';
  statusFilter = 'ALL';
  loading = true;
  modalOpen = false;
  selectedPolicy: Policy | null = null;
  detailsTab: 'overview'|'coverages'|'riders'|'history'|'endorsements' = 'overview';
  detailsLoading = false;
  coverages: PolicyCoverage[] = []; riders: PolicyRider[] = []; policyHistory: PolicyHistory[] = []; issuanceEndorsements: IssuanceEndorsement[] = [];
  manageForm: 'coverage'|'rider'|'endorsement'|null = null; editingCoverageId: number|null = null; editingRiderId: number|null = null;
  coverageForm = { coverageName: '', sumInsured: 0, coverageStartDate: '', coverageEndDate: '' };
  riderForm = { riderId: 0, riderPremium: 0 };
  issuanceEndorsementForm = { endorsementType: 'ADDRESS_CHANGE', oldValue: '', newValue: '' };
  editingPolicy: Policy | null = null;
  saving = false;
  documentBusy = false;
  toast = '';
  toastError = false;
  form: PolicyRequest = this.emptyForm();
  constructor(private data: PortalDataService) {}
  ngOnInit(): void { this.load(); }
  private emptyForm(): PolicyRequest { return { quoteId: 0, customerId: 0, productId: 11, effectiveDate: new Date().toISOString().slice(0,10), expiryDate: `${new Date().getFullYear()+1}-${new Date().toISOString().slice(5,10)}` }; }
  load(): void { this.loading=true; this.data.getPolicies().subscribe({ next: rows => { this.policies=rows; this.loading=false; }, error: () => { this.loading=false; this.notify('Could not load policies.', true); } }); }
  get filteredPolicies(): Policy[] { const q=this.search.trim().toLowerCase(); return this.policies.filter(p => (this.statusFilter==='ALL'||p.policyStatus===this.statusFilter) && (!q || [p.policyNumber,p.policyId,p.customerId,p.quoteId,p.productId,p.policyStatus].some(v=>String(v??'').toLowerCase().includes(q)))); }
  get activeCount(): number { return this.policies.filter(p=>p.policyStatus==='ACTIVE').length; }
  get expiredCount(): number { return this.policies.filter(p=>p.policyStatus==='EXPIRED').length; }
  get suspendedCount(): number { return this.policies.filter(p=>p.policyStatus==='SUSPENDED').length; }
  productLabel(id: number): string { const names: Record<number,string>={11:'Life Secure',12:'Health Plus',13:'Motor Protect',14:'Family Shield'}; return names[id]??`Product ${id}`; }
  openCreate(): void { this.editingPolicy=null; this.form=this.emptyForm(); this.modalOpen=true; }
  openEdit(policy: Policy): void { this.editingPolicy=policy; this.form={quoteId:policy.quoteId,customerId:policy.customerId,productId:policy.productId,effectiveDate:policy.effectiveDate,expiryDate:policy.expiryDate}; this.selectedPolicy=null; this.modalOpen=true; }
  closeForm(): void { this.modalOpen=false; this.saving=false; }
  submitPolicy(): void {
    if (!this.form.quoteId || !this.form.customerId || !this.form.productId || !this.form.effectiveDate || !this.form.expiryDate) { this.notify('Please fill in all required fields.', true); return; }
    if (this.form.expiryDate <= this.form.effectiveDate) { this.notify('Expiry date must be after the effective date.', true); return; }
    this.saving=true;
    const request={...this.form};
    const action=this.editingPolicy ? this.data.updatePolicy(this.editingPolicy.policyId,request) : this.data.createPolicy(request);
    action.subscribe({ next: () => { this.closeForm(); this.notify(this.editingPolicy?'Policy details updated.':'Policy created successfully.'); this.load(); }, error: err => { this.saving=false; this.notify(err?.error?.message||'Could not save policy.',true); } });
  }
  openDetails(policy: Policy): void { this.selectedPolicy=policy; this.detailsTab='overview'; this.manageForm=null; this.loadDetails(policy); }
  closeDetails(): void { this.selectedPolicy=null; this.manageForm=null; }
  loadDetails(policy: Policy): void {
    this.detailsLoading=true;
    forkJoin({ coverages:this.data.getCoverages(policy.policyId), riders:this.data.getRiders(policy.policyId), history:this.data.getPolicyHistory(policy.policyId), endorsements:this.data.getIssuanceEndorsements(policy.policyId) })
      .subscribe({ next: result => { this.coverages=result.coverages; this.riders=result.riders; this.policyHistory=result.history; this.issuanceEndorsements=result.endorsements; this.detailsLoading=false; }, error:()=>{this.detailsLoading=false;this.notify('Some policy details could not be loaded.',true);} });
  }
  setDetailsTab(tab: 'overview'|'coverages'|'riders'|'history'|'endorsements'): void { this.detailsTab=tab; this.manageForm=null; }
  openCoverageForm(row?: PolicyCoverage): void { this.editingCoverageId=row?.coverageId??null; this.coverageForm=row?{coverageName:row.coverageName,sumInsured:Number(row.sumInsured),coverageStartDate:row.coverageStartDate,coverageEndDate:row.coverageEndDate}:{coverageName:'',sumInsured:0,coverageStartDate:this.selectedPolicy?.effectiveDate??'',coverageEndDate:this.selectedPolicy?.expiryDate??''}; this.manageForm='coverage'; }
  submitCoverage(): void { if(!this.selectedPolicy||!this.coverageForm.coverageName.trim()||this.coverageForm.sumInsured<=0||!this.coverageForm.coverageStartDate||!this.coverageForm.coverageEndDate||this.coverageForm.coverageEndDate<this.coverageForm.coverageStartDate){this.notify('Enter valid coverage details and dates.',true);return;}const input={...this.coverageForm};const request=this.editingCoverageId?this.data.updateCoverage(this.selectedPolicy.policyId,this.editingCoverageId,input):this.data.createCoverage(this.selectedPolicy.policyId,input);request.subscribe({next:()=>{const p=this.selectedPolicy!;this.manageForm=null;this.notify(this.editingCoverageId?'Coverage updated.':'Coverage added.');this.loadDetails(p);},error:()=>this.notify('Could not save coverage.',true)}); }
  deleteCoverage(row: PolicyCoverage): void { if(!this.selectedPolicy||!window.confirm(`Delete coverage “${row.coverageName}”?`))return;const p=this.selectedPolicy;this.data.deleteCoverage(p.policyId,row.coverageId).subscribe({next:()=>{this.notify('Coverage removed.');this.loadDetails(p);},error:()=>this.notify('Could not remove coverage.',true)}); }
  openRiderForm(row?: PolicyRider): void { this.editingRiderId=row?.policyRiderId??null;this.riderForm=row?{riderId:row.riderId,riderPremium:Number(row.riderPremium)}:{riderId:0,riderPremium:0};this.manageForm='rider'; }
  submitRider(): void { if(!this.selectedPolicy||this.riderForm.riderId<=0||this.riderForm.riderPremium<0){this.notify('Enter a valid rider ID and premium.',true);return;}const p=this.selectedPolicy;const input={...this.riderForm};const request=this.editingRiderId?this.data.updateRider(p.policyId,this.editingRiderId,input):this.data.createRider(p.policyId,input);request.subscribe({next:()=>{this.manageForm=null;this.notify(this.editingRiderId?'Rider updated.':'Rider added.');this.loadDetails(p);},error:()=>this.notify('Could not save rider.',true)}); }
  deleteRider(row: PolicyRider): void { if(!this.selectedPolicy||!window.confirm(`Remove rider #${row.riderId}?`))return;const p=this.selectedPolicy;this.data.deleteRider(p.policyId,row.policyRiderId).subscribe({next:()=>{this.notify('Rider removed.');this.loadDetails(p);},error:()=>this.notify('Could not remove rider.',true)}); }
  openIssuanceEndorsementForm(): void { this.issuanceEndorsementForm={endorsementType:'ADDRESS_CHANGE',oldValue:'',newValue:''};this.manageForm='endorsement'; }
  submitIssuanceEndorsement(): void { if(!this.selectedPolicy||!this.issuanceEndorsementForm.newValue.trim()){this.notify('Enter the requested new value.',true);return;}const p=this.selectedPolicy;this.data.createIssuanceEndorsement(p.policyId,{...this.issuanceEndorsementForm}).subscribe({next:()=>{this.manageForm=null;this.notify('Policy endorsement submitted for approval.');this.loadDetails(p);},error:()=>this.notify('Could not create policy endorsement.',true)}); }
  decideIssuanceEndorsement(row: IssuanceEndorsement, decision:'approve'|'reject'): void { if(!this.selectedPolicy)return;let reason='';if(decision==='reject'){const input=window.prompt('Enter a reason for rejecting this endorsement:');if(input===null)return;reason=input.trim();if(!reason){this.notify('A rejection reason is required.',true);return;}}const p=this.selectedPolicy;this.data.decideIssuanceEndorsement(p.policyId,row.endorsementId,decision,reason).subscribe({next:()=>{this.notify(`Policy endorsement ${decision==='approve'?'approved':'rejected'}.`);this.loadDetails(p);},error:()=>this.notify('Could not record endorsement decision.',true)}); }
  performAction(action: 'activate'|'suspend'|'expire'|'cancel'): void {
    if(!this.selectedPolicy) return;
    const p=this.selectedPolicy; const labels:Record<string,string>={activate:'activate',suspend:'suspend',expire:'mark as expired',cancel:'cancel'};
    if(action==='cancel' && !window.confirm(`Cancel policy ${p.policyNumber}? This action changes the policy status.`)) return;
    this.data.policyAction(p.policyId,action).subscribe({ next:()=>{this.selectedPolicy={...p,policyStatus:({activate:'ACTIVE',suspend:'SUSPENDED',expire:'EXPIRED',cancel:'CANCELLED'} as Record<string,string>)[action]};this.notify(`Policy ${labels[action]} action completed.`);this.load();},error:()=>this.notify('Policy action could not be completed.',true)});
  }
  generateDocument(): void { if(!this.selectedPolicy)return;this.documentBusy=true;this.data.generatePolicyDocument(this.selectedPolicy.policyId).subscribe({next:doc=>{this.documentBusy=false;this.notify(`Document generated${doc?.documentName ? ': '+doc.documentName : ''}.`);},error:()=>{this.documentBusy=false;this.notify('Could not generate the policy document.',true);}}); }
  regenerateDocument(): void { if(!this.selectedPolicy)return;this.documentBusy=true;this.data.regeneratePolicyDocument(this.selectedPolicy.policyId).subscribe({next:doc=>{this.documentBusy=false;this.notify(`Document regenerated${doc?.documentName ? ': '+doc.documentName : ''}.`);},error:()=>{this.documentBusy=false;this.notify('Could not regenerate the policy document.',true);}}); }
  downloadDocument(): void { if(!this.selectedPolicy)return;const p=this.selectedPolicy;this.documentBusy=true;this.data.downloadPolicyDocument(p.policyId).subscribe({next:blob=>{this.documentBusy=false;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${p.policyNumber}-document`;a.click();URL.revokeObjectURL(url);this.notify('Document download started.');},error:()=>{this.documentBusy=false;this.notify('Document download failed.',true);}}); }
  notify(message: string, error=false): void { this.toast=message;this.toastError=error;window.setTimeout(()=>{if(this.toast===message)this.toast='';},3200); }
}
