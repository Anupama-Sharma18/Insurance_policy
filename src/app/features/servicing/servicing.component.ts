import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PortalDataService } from '../../core/services/portal-data.service';
import { Endorsement, Nominee, Policy, ServiceHistory, ServiceRequest } from '../../shared/models/app.models';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { HumanizePipe } from '../../shared/pipes/humanize.pipe';

type ServicingTab = 'requests' | 'endorsements' | 'nominees' | 'history';
@Component({
  standalone: true,
  selector: 'app-servicing',
  imports: [CommonModule, FormsModule, StatusBadgeComponent, HumanizePipe],
  templateUrl: './servicing.component.html',
  styleUrl: './servicing.component.scss'
})
export class ServicingComponent implements OnInit {
  activeTab: ServicingTab='requests';
  search=''; statusFilter='ALL'; loading=true; saving=false; modalOpen=false; toast=''; toastError=false;
  requests:ServiceRequest[]=[]; endorsements:Endorsement[]=[]; nominees:Nominee[]=[]; history:ServiceHistory[]=[]; policies:Policy[]=[];
  editingNomineeId:number|null=null;
  requestForm={policyId:0,customerId:0,requestType:'ADDRESS_CHANGE',requestDetails:''};
  endorsementForm={requestId:0,endorsementType:'ADDRESS_CHANGE',previousValue:'',updatedValue:''};
  nomineeForm={policyId:0,nomineeName:'',relationship:'SPOUSE',dob:'',sharePercentage:100,guardianName:''};
  constructor(private data:PortalDataService){}
  ngOnInit():void{this.load();}
  load():void{
    this.loading=true;
    forkJoin({requests:this.data.getServiceRequests(),endorsements:this.data.getEndorsements(),policies:this.data.getPolicies(),history:this.data.getServiceHistory()}).subscribe({
      next:res=>{this.requests=res.requests;this.endorsements=res.endorsements;this.policies=res.policies;this.history=res.history;this.loading=false;this.data.getNominees(res.policies.map(p=>p.policyId)).subscribe(rows=>this.nominees=rows);if(!this.requestForm.policyId&&res.policies.length){this.requestForm.policyId=res.policies[0].policyId;this.requestForm.customerId=res.policies[0].customerId;}if(!this.nomineeForm.policyId&&res.policies.length)this.nomineeForm.policyId=res.policies[0].policyId;},
      error:()=>{this.loading=false;this.notify('Some servicing information could not be loaded.',true);}
    });
  }
  setTab(tab:ServicingTab):void{this.activeTab=tab;this.search='';this.statusFilter='ALL';}
  get filteredRequests():ServiceRequest[]{const q=this.search.toLowerCase().trim();return this.requests.filter(r=>(this.statusFilter==='ALL'||r.status===this.statusFilter)&&(!q||[r.requestNumber,r.requestId,r.policyId,r.customerId,r.requestType,r.status,r.requestDetails].some(v=>String(v??'').toLowerCase().includes(q))));}
  get filteredEndorsements():Endorsement[]{const q=this.search.toLowerCase().trim();return this.endorsements.filter(e=>(this.statusFilter==='ALL'||e.approvalStatus===this.statusFilter)&&(!q||[e.endorsementNumber,e.endorsementId,e.requestId,e.endorsementType,e.previousValue,e.updatedValue,e.approvalStatus].some(v=>String(v??'').toLowerCase().includes(q))));}
  get filteredNominees():Nominee[]{const q=this.search.toLowerCase().trim();return this.nominees.filter(n=>!q||[n.nomineeName,n.relationship,n.policyId,n.nomineeId,n.guardianName].some(v=>String(v??'').toLowerCase().includes(q)));}
  get filteredHistory():ServiceHistory[]{const q=this.search.toLowerCase().trim();return this.history.filter(h=>!q||[h.historyId,h.requestId,h.action,h.actionBy,h.remarks].some(v=>String(v??'').toLowerCase().includes(q)));}
  get openRequestCount():number{return this.requests.filter(r=>['SUBMITTED','UNDER_REVIEW'].includes(r.status)).length;}
  get pendingEndorsements():number{return this.endorsements.filter(e=>e.approvalStatus==='PENDING').length;}
  get nomineeShares():number{return this.nominees.reduce((sum,n)=>sum+(Number(n.sharePercentage)||0),0);}
  policyNo(id:number):string{return this.policies.find(p=>p.policyId===id)?.policyNumber??`Policy #${id}`;}
  onPolicyChange(policyId:number):void{this.requestForm.policyId=Number(policyId);const p=this.policies.find(x=>x.policyId===this.requestForm.policyId);if(p)this.requestForm.customerId=p.customerId;}
  openRequestForm():void{this.requestForm={policyId:this.policies[0]?.policyId??0,customerId:this.policies[0]?.customerId??0,requestType:'ADDRESS_CHANGE',requestDetails:''};this.modalOpen=true;}
  openEndorsementForm():void{this.endorsementForm={requestId:this.requests[0]?.requestId??0,endorsementType:'ADDRESS_CHANGE',previousValue:'',updatedValue:''};this.modalOpen=true;}
  openNomineeForm(row?:Nominee):void{this.editingNomineeId=row?.nomineeId??null;this.nomineeForm=row?{policyId:row.policyId,nomineeName:row.nomineeName,relationship:row.relationship,dob:row.dob,sharePercentage:row.sharePercentage,guardianName:row.guardianName??''}:{policyId:this.policies[0]?.policyId??0,nomineeName:'',relationship:'SPOUSE',dob:'',sharePercentage:100,guardianName:''};this.modalOpen=true;}
  submitRequest():void{if(!this.requestForm.policyId||!this.requestForm.customerId||!this.requestForm.requestDetails.trim()){this.notify('Choose a policy and enter the request details.',true);return;}this.saving=true;this.data.createServiceRequest({...this.requestForm}).subscribe({next:()=>{this.saving=false;this.modalOpen=false;this.notify('Service request submitted.');this.load();},error:err=>{this.saving=false;this.notify(err?.error?.message||'Could not create the service request.',true);}});}
  submitEndorsement():void{if(!this.endorsementForm.requestId||!this.endorsementForm.updatedValue.trim()){this.notify('Select a service request and enter the new value.',true);return;}this.saving=true;this.data.createEndorsement({...this.endorsementForm}).subscribe({next:()=>{this.saving=false;this.modalOpen=false;this.notify('Endorsement request created.');this.load();},error:err=>{this.saving=false;this.notify(err?.error?.message||'Could not create endorsement.',true);}});}
  submitNominee():void{if(!this.nomineeForm.policyId||!this.nomineeForm.nomineeName.trim()||!this.nomineeForm.relationship||!this.nomineeForm.dob||this.nomineeForm.sharePercentage<=0||this.nomineeForm.sharePercentage>100){this.notify('Check the nominee details and share percentage.',true);return;}const shareSum=this.nominees.filter(n=>n.policyId===this.nomineeForm.policyId&&n.nomineeId!==this.editingNomineeId).reduce((s,n)=>s+n.sharePercentage,0);if(shareSum+this.nomineeForm.sharePercentage>100){this.notify('Nominee share for a policy cannot exceed 100%.',true);return;}this.saving=true;const input={...this.nomineeForm,guardianName:this.nomineeForm.guardianName||undefined};const request=this.editingNomineeId?this.data.updateNominee(this.editingNomineeId,input):this.data.createNominee(input);request.subscribe({next:()=>{this.saving=false;this.modalOpen=false;this.notify(this.editingNomineeId?'Nominee details updated.':'Nominee added successfully.');this.load();},error:err=>{this.saving=false;this.notify(err?.error?.message||'Could not save nominee.',true);}});}
  requestNextAction(row:ServiceRequest):string{if(row.status==='SUBMITTED')return 'UNDER_REVIEW';if(row.status==='UNDER_REVIEW')return 'COMPLETED';if(row.status==='COMPLETED')return 'CLOSED';return '';}
  requestActionLabel(row:ServiceRequest):string{if(row.status==='SUBMITTED')return 'Start review';if(row.status==='UNDER_REVIEW')return 'Mark complete';if(row.status==='COMPLETED')return 'Close request';return '';}
  moveRequest(row:ServiceRequest):void{const next=this.requestNextAction(row);if(!next)return;const remarks=window.prompt('Add an optional note for the request history:','Updated by operations');if(remarks===null)return;this.data.updateServiceRequest(row.requestId,next,remarks).subscribe({next:()=>{this.notify(`Request moved to ${next.replaceAll('_',' ').toLowerCase()}.`);this.load();},error:err=>this.notify(err?.error?.message||'Could not update request status.',true)});}
  decideEndorsement(row:Endorsement,decision:'approve'|'reject'):void{if(decision==='reject'&&!window.confirm(`Reject endorsement ${row.endorsementNumber}?`))return;this.data.endorsementDecision(row.endorsementId,decision).subscribe({next:()=>{this.notify(`Endorsement ${decision==='approve'?'approved':'rejected'}.`);this.load();},error:()=>this.notify('Endorsement decision failed.',true)});}
  deleteNominee(row:Nominee):void{if(!window.confirm(`Remove nominee ${row.nomineeName}?`))return;this.data.deleteNominee(row.nomineeId).subscribe({next:()=>{this.notify('Nominee removed.');this.load();},error:()=>this.notify('Could not remove nominee.',true)});}
  closeModal():void{this.modalOpen=false;this.saving=false;}
  notify(message:string,error=false):void{this.toast=message;this.toastError=error;window.setTimeout(()=>{if(this.toast===message)this.toast='';},3200);}
}
