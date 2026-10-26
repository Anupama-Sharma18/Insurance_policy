import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PortalDataService } from '../../core/services/portal-data.service';
import { Cancellation, Policy } from '../../shared/models/app.models';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  standalone:true,
  selector:'app-cancellations',
  imports:[CommonModule,FormsModule,StatusBadgeComponent],
  templateUrl:'./cancellations.component.html',
  styleUrl:'./cancellations.component.scss'
})
export class CancellationsComponent implements OnInit {
  cancellations:Cancellation[]=[];policies:Policy[]=[];loading=true;saving=false;modalOpen=false;selected:Cancellation|null=null;decision:'approve'|'reject'='approve';search='';statusFilter='ALL';toast='';toastError=false;
  form={policyId:0,cancellationReason:''};remarks='';
  constructor(private data:PortalDataService){}
  ngOnInit():void{this.load();}
  load():void{this.loading=true;forkJoin({cancellations:this.data.getCancellations(),policies:this.data.getPolicies()}).subscribe({next:r=>{this.cancellations=r.cancellations;this.policies=r.policies;this.loading=false;if(!this.form.policyId&&r.policies.length)this.form.policyId=r.policies[0].policyId;},error:()=>{this.loading=false;this.notify('Could not load cancellation requests.',true);}});}
  get filtered():Cancellation[]{const q=this.search.toLowerCase().trim();return this.cancellations.filter(c=>(this.statusFilter==='ALL'||c.requestStatus===this.statusFilter)&&(!q||[c.cancellationRequestNumber,c.cancellationId,c.policyId,c.cancellationReason,c.requestStatus].some(v=>String(v??'').toLowerCase().includes(q))));}
  get pendingCount():number{return this.cancellations.filter(c=>c.requestStatus==='PENDING').length;}
  get approvedCount():number{return this.cancellations.filter(c=>c.requestStatus==='APPROVED').length;}
  get rejectedCount():number{return this.cancellations.filter(c=>c.requestStatus==='REJECTED').length;}
  get totalRefunds():number{return this.cancellations.filter(c=>c.requestStatus==='APPROVED').reduce((sum,c)=>sum+(Number(c.refundAmount)||0),0);}
  policyNo(id:number):string{return this.policies.find(p=>p.policyId===id)?.policyNumber??`Policy #${id}`;}
  openCreate():void{this.form={policyId:this.policies[0]?.policyId??0,cancellationReason:''};this.modalOpen=true;}
  create():void{if(!this.form.policyId||!this.form.cancellationReason.trim()){this.notify('Select a policy and provide a cancellation reason.',true);return;}this.saving=true;this.data.createCancellation(this.form.policyId,this.form.cancellationReason.trim()).subscribe({next:()=>{this.saving=false;this.modalOpen=false;this.notify('Cancellation request submitted for review.');this.load();},error:err=>{this.saving=false;this.notify(err?.error?.message||'Could not submit the cancellation request.',true);}});}
  openDecision(row:Cancellation,decision:'approve'|'reject'):void{this.selected=row;this.decision=decision;this.remarks=decision==='approve'?'Approved after review':'';}
  closeDecision():void{this.selected=null;this.saving=false;}
  submitDecision():void{if(!this.selected)return;if(this.decision==='reject'&&!this.remarks.trim()){this.notify('Please enter a reason before rejecting.',true);return;}this.saving=true;this.data.cancellationDecision(this.selected.cancellationId,this.decision,this.remarks.trim()).subscribe({next:()=>{this.saving=false;this.selected=null;this.notify(this.decision==='approve'?'Cancellation request approved.':'Cancellation request rejected.');this.load();},error:err=>{this.saving=false;this.notify(err?.error?.message||'Could not record the decision.',true);}});}
  notify(message:string,error=false):void{this.toast=message;this.toastError=error;window.setTimeout(()=>{if(this.toast===message)this.toast='';},3200);}
}
