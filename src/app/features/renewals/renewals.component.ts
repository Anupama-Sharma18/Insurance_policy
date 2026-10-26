import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PortalDataService } from '../../core/services/portal-data.service';
import { Policy, Renewal } from '../../shared/models/app.models';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  standalone: true,
  selector: 'app-renewals',
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './renewals.component.html',
  styleUrl: './renewals.component.scss'
})
export class RenewalsComponent implements OnInit {
  renewals: Renewal[]=[]; policies: Policy[]=[]; loading=true; saving=false; modalOpen=false;
  search=''; statusFilter='ALL'; toast=''; toastError=false;
  form={policyId:0,renewalDate:new Date().toISOString().slice(0,10),newExpiryDate:`${new Date().getFullYear()+1}-${new Date().toISOString().slice(5,10)}`,premiumAmount:0};
  constructor(private data: PortalDataService) {}
  ngOnInit(): void { this.load(); this.data.getPolicies().subscribe(rows=>{this.policies=rows;if(!this.form.policyId && rows.length)this.form.policyId=rows[0].policyId;}); }
  load(): void { this.loading=true;this.data.getRenewals().subscribe({next:rows=>{this.renewals=rows;this.loading=false;},error:()=>{this.loading=false;this.notify('Could not load renewals.',true);}}); }
  get filteredRenewals(): Renewal[] { const q=this.search.toLowerCase().trim();return this.renewals.filter(r=>(this.statusFilter==='ALL'||r.renewalStatus===this.statusFilter)&&(!q||[r.renewalId,r.policyId,r.renewalStatus,r.renewalDate].some(v=>String(v??'').toLowerCase().includes(q)))); }
  get pendingCount():number{return this.renewals.filter(r=>r.renewalStatus==='PENDING').length;}
  get paymentCount():number{return this.renewals.filter(r=>r.paymentVerified).length;}
  get renewedCount():number{return this.renewals.filter(r=>r.renewalStatus==='RENEWED').length;}
  policyNo(id:number):string{return this.policies.find(p=>p.policyId===id)?.policyNumber??`Policy #${id}`;}
  productLabel(id:number):string{const p=this.policies.find(x=>x.policyId===id);return p?`Customer #${p.customerId}`:'Policy record';}
  openCreate():void{this.form={policyId:this.policies[0]?.policyId??0,renewalDate:new Date().toISOString().slice(0,10),newExpiryDate:`${new Date().getFullYear()+1}-${new Date().toISOString().slice(5,10)}`,premiumAmount:0};this.modalOpen=true;}
  submit():void{if(!this.form.policyId||!this.form.renewalDate||!this.form.newExpiryDate||this.form.premiumAmount<=0){this.notify('Complete all fields and enter a premium above zero.',true);return;}if(this.form.newExpiryDate<=this.form.renewalDate){this.notify('New expiry date must be after the renewal date.',true);return;}this.saving=true;this.data.createRenewal({...this.form}).subscribe({next:()=>{this.saving=false;this.modalOpen=false;this.notify('Renewal request created.');this.load();},error:err=>{this.saving=false;this.notify(err?.error?.message||'Could not create renewal.',true);}});}
  action(row:Renewal, action:'reminder'|'confirm'|'verify-payment', success=true):void{let message='';if(action==='verify-payment'&&!window.confirm(success?'Confirm that payment has been received successfully?':'Mark this payment as unsuccessful?'))return;this.data.renewalAction(row.renewalId,action,success).subscribe({next:updated=>{message=action==='reminder'?'Renewal reminder marked as sent.':action==='confirm'?'Customer confirmation recorded.':success?'Payment verification completed.':'Payment marked as unsuccessful.';this.notify(message);this.load();},error:()=>this.notify('The renewal action could not be completed.',true)});}
  notify(message:string,error=false):void{this.toast=message;this.toastError=error;window.setTimeout(()=>{if(this.toast===message)this.toast='';},3200);}
}
