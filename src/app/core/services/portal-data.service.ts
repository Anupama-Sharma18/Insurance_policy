import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cancellation, Endorsement, IssuanceEndorsement, Nominee, Policy, PolicyCoverage, PolicyDocument, PolicyHistory, PolicyRequest, PolicyRider, Renewal, ServiceHistory, ServiceRequest } from '../../shared/models/app.models';

@Injectable({ providedIn: 'root' })
export class PortalDataService {
  private readonly base = environment.apiBaseUrl;
  private readonly demoSubject = new BehaviorSubject<boolean>(false);
  readonly demoMode$ = this.demoSubject.asObservable();
  get isDemoMode(): boolean { return this.demoSubject.value; }

  private readonly demoPolicies: Policy[] = [
    { policyId: 101, policyNumber: 'POL-2026-000101', quoteId: 501, customerId: 1001, productId: 11, issueDate: '2026-01-15', effectiveDate: '2026-02-01', expiryDate: '2027-01-31', policyStatus: 'ACTIVE' },
    { policyId: 102, policyNumber: 'POL-2026-000102', quoteId: 502, customerId: 1002, productId: 12, issueDate: '2026-02-08', effectiveDate: '2026-02-15', expiryDate: '2027-02-14', policyStatus: 'ACTIVE' },
    { policyId: 103, policyNumber: 'POL-2025-000078', quoteId: 478, customerId: 1003, productId: 13, issueDate: '2025-03-06', effectiveDate: '2025-03-10', expiryDate: '2026-03-09', policyStatus: 'EXPIRED' },
    { policyId: 104, policyNumber: 'POL-2026-000104', quoteId: 504, customerId: 1004, productId: 11, issueDate: '2026-05-21', effectiveDate: '2026-06-01', expiryDate: '2027-05-31', policyStatus: 'SUSPENDED' },
    { policyId: 105, policyNumber: 'POL-2026-000105', quoteId: 505, customerId: 1005, productId: 14, issueDate: '2026-08-02', effectiveDate: '2026-08-05', expiryDate: '2027-08-04', policyStatus: 'ACTIVE' }
  ];
  private readonly demoRenewals: Renewal[] = [
    { renewalId: 201, policyId: 103, renewalDate: '2026-02-15', newExpiryDate: '2027-03-09', premiumAmount: 18450, renewalStatus: 'PENDING', reminderSent: true, customerConfirmed: false, paymentVerified: false },
    { renewalId: 202, policyId: 101, renewalDate: '2026-10-10', newExpiryDate: '2028-01-31', premiumAmount: 12600, renewalStatus: 'PAID', reminderSent: true, customerConfirmed: true, paymentVerified: true },
    { renewalId: 203, policyId: 102, renewalDate: '2026-10-18', newExpiryDate: '2028-02-14', premiumAmount: 15800, renewalStatus: 'RENEWED', reminderSent: true, customerConfirmed: true, paymentVerified: true }
  ];
  private readonly demoRequests: ServiceRequest[] = [
    { requestId: 301, requestNumber: 'SR-2026-00301', policyId: 101, customerId: 1001, requestType: 'ADDRESS_CHANGE', requestDate: '2026-10-24T10:25:00', status: 'SUBMITTED', requestDetails: 'Please update my correspondence address.' },
    { requestId: 302, requestNumber: 'SR-2026-00302', policyId: 102, customerId: 1002, requestType: 'NOMINEE_UPDATE', requestDate: '2026-10-23T13:40:00', status: 'UNDER_REVIEW', requestDetails: 'Request to update nominee details.' },
    { requestId: 303, requestNumber: 'SR-2026-00303', policyId: 105, customerId: 1005, requestType: 'DOCUMENT_COPY', requestDate: '2026-10-20T09:15:00', status: 'COMPLETED', requestDetails: 'Need a fresh copy of the policy document.' },
    { requestId: 304, requestNumber: 'SR-2026-00304', policyId: 104, customerId: 1004, requestType: 'PREMIUM_QUERY', requestDate: '2026-10-19T16:05:00', status: 'SUBMITTED', requestDetails: 'Please explain the latest premium amount.' }
  ];
  private readonly demoEndorsements: Endorsement[] = [
    { endorsementId: 401, requestId: 302, endorsementNumber: 'END-2026-00401', endorsementType: 'NOMINEE_UPDATE', previousValue: 'Amit Sharma', updatedValue: 'Neha Sharma', approvalStatus: 'PENDING' },
    { endorsementId: 402, requestId: 303, endorsementNumber: 'END-2026-00402', endorsementType: 'ADDRESS_CHANGE', previousValue: 'Andheri, Mumbai', updatedValue: 'Powai, Mumbai', approvalStatus: 'APPROVED' },
    { endorsementId: 403, requestId: 301, endorsementNumber: 'END-2026-00403', endorsementType: 'CONTACT_UPDATE', previousValue: '+91 90000 11111', updatedValue: '+91 98888 22222', approvalStatus: 'REJECTED' }
  ];
  private readonly demoNominees: Nominee[] = [
    { nomineeId: 501, policyId: 101, nomineeName: 'Priya Sharma', relationship: 'SPOUSE', dob: '1997-04-12', sharePercentage: 60 },
    { nomineeId: 502, policyId: 101, nomineeName: 'Rohan Sharma', relationship: 'CHILD', dob: '2020-11-03', sharePercentage: 40, guardianName: 'Priya Sharma' },
    { nomineeId: 503, policyId: 102, nomineeName: 'Meera Patil', relationship: 'MOTHER', dob: '1968-07-08', sharePercentage: 100 }
  ];
  private readonly demoHistory: ServiceHistory[] = [
    { historyId: 601, requestId: 303, action: 'Status changed to COMPLETED', actionBy: 1, actionDate: '2026-10-21T11:20:00', remarks: 'Document copy shared with customer.' },
    { historyId: 602, requestId: 302, action: 'Request assigned for review', actionBy: 1, actionDate: '2026-10-23T14:00:00', remarks: 'Review nominee change documents.' },
    { historyId: 603, requestId: 403, action: 'Endorsement rejected', actionBy: 1, actionDate: '2026-10-22T10:30:00', remarks: 'Supporting document required.' }
  ];
  private readonly demoCancellations: Cancellation[] = [
    { cancellationId: 701, policyId: 102, cancellationDate: '2026-10-24', cancellationReason: 'Policy no longer required', refundAmount: 4200, cancellationRequestNumber: 'CAN-2026-00701', requestStatus: 'PENDING' },
    { cancellationId: 702, policyId: 105, cancellationDate: '2026-10-12', cancellationReason: 'Duplicate coverage', refundAmount: 6100, approvedBy: 1, cancellationRequestNumber: 'CAN-2026-00702', requestStatus: 'APPROVED', decisionRemarks: 'Approved after review', decisionDate: '2026-10-13T12:15:00' },
    { cancellationId: 703, policyId: 104, cancellationDate: '2026-10-08', cancellationReason: 'Incorrect details during purchase', refundAmount: 0, approvedBy: 1, cancellationRequestNumber: 'CAN-2026-00703', requestStatus: 'REJECTED', decisionRemarks: 'Policy has an active service hold.', decisionDate: '2026-10-09T14:10:00' }
  ];

  constructor(private http: HttpClient) {}

  private unwrap<T>(response: any): T {
    if (response && typeof response === 'object' && 'data' in response) return response.data as T;
    return response as T;
  }
  private url(service: 'policies' | 'renewals' | 'servicing' | 'closure', path: string): string {
    return `${this.base}/${service}${path}`;
  }
  private readStore<T>(key: string, seed: T[]): T[] {
    try {
      const raw = localStorage.getItem(`policy-portal-${key}`);
      if (raw !== null) return JSON.parse(raw) as T[];
      localStorage.setItem(`policy-portal-${key}`, JSON.stringify(seed));
    } catch { /* localStorage may be blocked; still return the in-memory seed */ }
    return seed.map(item => ({ ...item }));
  }
  private saveStore<T>(key: string, value: T[]): void {
    try { localStorage.setItem(`policy-portal-${key}`, JSON.stringify(value)); } catch { /* ignore storage quota/private mode */ }
  }
  private activateDemo(): void { this.demoSubject.next(true); }
  private list<T>(url: string, key: string, seed: T[]): Observable<T[]> {
    if (this.isDemoMode) return of(this.readStore(key, seed));
    return this.http.get<any>(url).pipe(
      map(raw => {
        const value = this.unwrap<any>(raw);
        const rows = Array.isArray(value) ? value as T[] : value == null ? [] : [value as T];
        this.saveStore(key, rows);
        return rows;
      }),
      catchError(() => { this.activateDemo(); return of(this.readStore(key, seed)); })
    );
  }
  private mutate<T>(url: string, method: string, body: unknown, key: string, seed: T[], fallback: (rows: T[]) => T, noResponse = false): Observable<any> {
    const applyFallback = () => {
      const rows = this.readStore(key, seed);
      const result = fallback(rows);
      this.saveStore(key, rows);
      return result;
    };
    if (this.isDemoMode) return of(applyFallback());
    return this.http.request<any>(method, url, body === undefined ? {} : { body }).pipe(
      map(raw => {
        const fallbackResult = applyFallback();
        return noResponse ? (this.unwrap(raw) ?? fallbackResult) : (this.unwrap(raw) ?? fallbackResult);
      }),
      catchError(() => { this.activateDemo(); return of(applyFallback()); })
    );
  }
  private nextId(rows: any[], field: string): number { return rows.reduce((max, row) => Math.max(max, Number(row[field]) || 0), 0) + 1; }

  getPolicies(): Observable<Policy[]> { return this.list(this.url('policies', '/api/v1/policies'), 'policies', this.demoPolicies); }
  createPolicy(input: PolicyRequest): Observable<Policy> {
    return this.mutate<Policy>(this.url('policies', '/api/v1/policies'), 'POST', input, 'policies', this.demoPolicies, rows => {
      const id = this.nextId(rows, 'policyId'); const today = new Date().toISOString().slice(0, 10);
      const row: Policy = { ...input, policyId: id, policyNumber: `POL-2026-${String(id).padStart(6, '0')}`, issueDate: today, policyStatus: 'ACTIVE' };
      rows.unshift(row); return row;
    });
  }
  updatePolicy(id: number, input: PolicyRequest): Observable<Policy> {
    return this.mutate<Policy>(this.url('policies', `/api/v1/policies/${id}`), 'PUT', input, 'policies', this.demoPolicies, rows => {
      const i = rows.findIndex(x => x.policyId === id); if (i < 0) return { ...input, policyId: id, policyNumber: `POL-${id}`, issueDate: input.effectiveDate, policyStatus: 'ACTIVE' };
      rows[i] = { ...rows[i], ...input }; return rows[i];
    });
  }
  policyAction(id: number, action: 'activate' | 'suspend' | 'expire' | 'cancel'): Observable<any> {
    const mapStatus: Record<string, string> = { activate: 'ACTIVE', suspend: 'SUSPENDED', expire: 'EXPIRED', cancel: 'CANCELLED' };
    return this.mutate<any>(this.url('policies', `/api/v1/policies/${id}/${action}`), 'PUT', undefined, 'policies', this.demoPolicies, rows => {
      const row = rows.find(x => x.policyId === id); if (row) row.policyStatus = mapStatus[action]; return row ?? { policyId: id, policyStatus: mapStatus[action] };
    }, true);
  }
  generatePolicyDocument(id: number): Observable<PolicyDocument> {
    return this.mutate<PolicyDocument>(this.url('policies', `/api/v1/policies/${id}/document`), 'POST', undefined, 'documents', [], rows => {
      const policy = this.readStore('policies', this.demoPolicies).find(x => x.policyId === id);
      const doc: PolicyDocument = { documentId: this.nextId(rows, 'documentId'), policyId: id, policyNumber: policy?.policyNumber ?? `POL-${id}`, documentName: `Policy-${id}-document.pdf`, versionNo: 1, generatedDate: new Date().toISOString() };
      rows.unshift(doc); return doc;
    });
  }
  regeneratePolicyDocument(id: number): Observable<PolicyDocument> {
    return this.mutate<PolicyDocument>(this.url('policies', `/api/v1/policies/${id}/document/regenerate`), 'POST', undefined, 'documents', [], rows => {
      const policy = this.readStore('policies', this.demoPolicies).find(x => x.policyId === id);
      const version = rows.filter(doc => doc.policyId === id).reduce((max, doc) => Math.max(max, Number(doc.versionNo) || 0), 0) + 1;
      const doc: PolicyDocument = { documentId: this.nextId(rows, 'documentId'), policyId: id, policyNumber: policy?.policyNumber ?? `POL-${id}`, documentName: `Policy-${id}-document-v${version}.pdf`, versionNo: version, generatedDate: new Date().toISOString() };
      rows.unshift(doc); return doc;
    });
  }
  downloadPolicyDocument(id: number): Observable<Blob> {
    if (this.isDemoMode) return of(new Blob([`Demo policy document for policy ${id}. Connect the Policy Insurance service to download the generated PDF.`], { type: 'text/plain' }));
    return this.http.get(this.url('policies', `/api/v1/policies/${id}/document`), { responseType: 'blob' }).pipe(catchError(() => {
      this.activateDemo(); return of(new Blob([`Demo policy document for policy ${id}.`], { type: 'text/plain' }));
    }));
  }


  getCoverages(policyId: number): Observable<PolicyCoverage[]> {
    const seed: PolicyCoverage[] = policyId === 101 ? [
      { coverageId: 801, policyId, coverageName: 'Base life cover', sumInsured: 1000000, coverageStartDate: '2026-02-01', coverageEndDate: '2027-01-31' },
      { coverageId: 802, policyId, coverageName: 'Accidental benefit', sumInsured: 250000, coverageStartDate: '2026-02-01', coverageEndDate: '2027-01-31' }
    ] : [];
    return this.list<PolicyCoverage>(this.url('policies', `/api/v1/policies/${policyId}/coverages`), `coverages-${policyId}`, seed)
      .pipe(map(rows => rows.map(row => ({ ...row, policyId: row.policyId ?? row.policy?.policyId ?? policyId }))));
  }
  createCoverage(policyId: number, input: Pick<PolicyCoverage, 'coverageName' | 'sumInsured' | 'coverageStartDate' | 'coverageEndDate'>): Observable<PolicyCoverage> {
    return this.mutate<PolicyCoverage>(this.url('policies', `/api/v1/policies/${policyId}/coverages`), 'POST', input, `coverages-${policyId}`, [], rows => {
      const row: PolicyCoverage = { ...input, policyId, coverageId: this.nextId(rows, 'coverageId') }; rows.unshift(row); return row;
    });
  }
  updateCoverage(policyId: number, coverageId: number, input: Pick<PolicyCoverage, 'coverageName' | 'sumInsured' | 'coverageStartDate' | 'coverageEndDate'>): Observable<PolicyCoverage> {
    return this.mutate<PolicyCoverage>(this.url('policies', `/api/v1/policies/coverages/${coverageId}`), 'PUT', input, `coverages-${policyId}`, [], rows => {
      const row = rows.find(x => x.coverageId === coverageId); if (!row) return { ...input, policyId, coverageId }; Object.assign(row, input); return row;
    });
  }
  deleteCoverage(policyId: number, coverageId: number): Observable<any> {
    return this.mutate<any>(this.url('policies', `/api/v1/policies/coverages/${coverageId}`), 'DELETE', undefined, `coverages-${policyId}`, [], rows => {
      const index = rows.findIndex(x => x.coverageId === coverageId); if (index >= 0) rows.splice(index, 1); return { coverageId };
    }, true);
  }
  getRiders(policyId: number): Observable<PolicyRider[]> {
    const seed: PolicyRider[] = policyId === 101 ? [
      { policyRiderId: 811, policyId, riderId: 21, riderPremium: 1200 },
      { policyRiderId: 812, policyId, riderId: 22, riderPremium: 650 }
    ] : [];
    return this.list<PolicyRider>(this.url('policies', `/api/v1/policies/${policyId}/riders`), `riders-${policyId}`, seed);
  }
  createRider(policyId: number, input: Pick<PolicyRider, 'riderId' | 'riderPremium'>): Observable<PolicyRider> {
    return this.mutate<PolicyRider>(this.url('policies', `/api/v1/policies/${policyId}/riders`), 'POST', input, `riders-${policyId}`, [], rows => {
      const row: PolicyRider = { ...input, policyId, policyRiderId: this.nextId(rows, 'policyRiderId') }; rows.unshift(row); return row;
    });
  }
  updateRider(policyId: number, id: number, input: Pick<PolicyRider, 'riderId' | 'riderPremium'>): Observable<PolicyRider> {
    return this.mutate<PolicyRider>(this.url('policies', `/api/v1/policies/riders/${id}`), 'PUT', input, `riders-${policyId}`, [], rows => {
      const row = rows.find(x => x.policyRiderId === id); if (!row) return { ...input, policyId, policyRiderId: id }; Object.assign(row, input); return row;
    });
  }
  deleteRider(policyId: number, id: number): Observable<any> {
    return this.mutate<any>(this.url('policies', `/api/v1/policies/riders/${id}`), 'DELETE', undefined, `riders-${policyId}`, [], rows => {
      const index = rows.findIndex(x => x.policyRiderId === id); if (index >= 0) rows.splice(index, 1); return { policyRiderId: id };
    }, true);
  }
  getPolicyHistory(policyId: number): Observable<PolicyHistory[]> {
    const seed: PolicyHistory[] = policyId === 101 ? [
      { historyId: 901, policyId, action: 'Policy issued', changedBy: 1, changeDate: '2026-02-01T10:10:00', remarks: 'Policy created and activated.' },
      { historyId: 902, policyId, action: 'Document generated', changedBy: 1, changeDate: '2026-02-01T10:12:00', remarks: 'Initial policy document generated.' }
    ] : [];
    return this.list<PolicyHistory>(this.url('policies', `/api/v1/policies/${policyId}/history`), `policy-history-${policyId}`, seed);
  }
  getIssuanceEndorsements(policyId: number): Observable<IssuanceEndorsement[]> {
    const seed: IssuanceEndorsement[] = [];
    return this.list<IssuanceEndorsement>(this.url('policies', `/api/v1/policies/${policyId}/endorsements`), `issuance-endorsements-${policyId}`, seed);
  }
  createIssuanceEndorsement(policyId: number, input: Pick<IssuanceEndorsement, 'endorsementType' | 'oldValue' | 'newValue'>): Observable<IssuanceEndorsement> {
    return this.mutate<IssuanceEndorsement>(this.url('policies', `/api/v1/policies/${policyId}/endorsements`), 'POST', input, `issuance-endorsements-${policyId}`, [], rows => {
      const row: IssuanceEndorsement = { ...input, policyId, endorsementId: this.nextId(rows, 'endorsementId'), approvalStatus: 'PENDING', endorsementDate: new Date().toISOString() }; rows.unshift(row); return row;
    });
  }
  decideIssuanceEndorsement(policyId: number, id: number, decision: 'approve' | 'reject', reason = ''): Observable<IssuanceEndorsement> {
    const query = decision === 'approve' ? '?approvedBy=1' : `?rejectedBy=1&reason=${encodeURIComponent(reason)}`;
    return this.mutate<IssuanceEndorsement>(this.url('policies', `/api/v1/endorsements/${id}/${decision}${query}`), 'PUT', undefined, `issuance-endorsements-${policyId}`, [], rows => {
      const row = rows.find(x => x.endorsementId === id); if (!row) return { endorsementId: id, policyId, endorsementType: '', oldValue: '', newValue: '', approvalStatus: decision === 'approve' ? 'APPROVED' : 'REJECTED', rejectionReason: decision === 'reject' ? reason : undefined, approvedBy: 1, endorsementDate: new Date().toISOString() };
      row.approvalStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED'; row.approvedBy = 1; if (decision === 'reject') row.rejectionReason = reason; return row;
    });
  }

  getRenewals(): Observable<Renewal[]> { return this.list(this.url('renewals', '/api/v1/renewals'), 'renewals', this.demoRenewals); }
  createRenewal(input: Omit<Renewal, 'renewalId' | 'renewalStatus' | 'reminderSent' | 'customerConfirmed' | 'paymentVerified'>): Observable<Renewal> {
    return this.mutate<Renewal>(this.url('renewals', '/api/v1/renewals'), 'POST', input, 'renewals', this.demoRenewals, rows => {
      const row: Renewal = { ...input, renewalId: this.nextId(rows, 'renewalId'), renewalStatus: 'PENDING', reminderSent: false, customerConfirmed: false, paymentVerified: false }; rows.unshift(row); return row;
    });
  }
  renewalAction(id: number, action: 'reminder' | 'confirm' | 'verify-payment', paymentSuccessful = true): Observable<Renewal> {
    const body = action === 'verify-payment' ? { paymentSuccessful } : undefined;
    return this.mutate<Renewal>(this.url('renewals', `/api/v1/renewals/${id}/${action}`), 'POST', body, 'renewals', this.demoRenewals, rows => {
      const row = rows.find(x => x.renewalId === id); if (!row) return { renewalId: id, policyId: 0, renewalDate: '', newExpiryDate: '', premiumAmount: 0, renewalStatus: 'PENDING', reminderSent: false, customerConfirmed: false, paymentVerified: false };
      if (action === 'reminder') row.reminderSent = true;
      if (action === 'confirm') row.customerConfirmed = true;
      if (action === 'verify-payment') { row.paymentVerified = paymentSuccessful; row.renewalStatus = paymentSuccessful ? 'PAID' : 'PENDING'; }
      return row;
    });
  }

  getServiceRequests(): Observable<ServiceRequest[]> { return this.list(this.url('servicing', '/api/v1/service-requests'), 'requests', this.demoRequests); }
  createServiceRequest(input: Pick<ServiceRequest, 'policyId' | 'customerId' | 'requestType'> & { requestDetails: string }): Observable<ServiceRequest> {
    return this.mutate<ServiceRequest>(this.url('servicing', '/api/v1/service-requests'), 'POST', input, 'requests', this.demoRequests, rows => {
      const id = this.nextId(rows, 'requestId'); const row: ServiceRequest = { ...input, requestId: id, requestNumber: `SR-2026-${String(id).padStart(5, '0')}`, requestDate: new Date().toISOString(), status: 'SUBMITTED' }; rows.unshift(row); return row;
    });
  }
  updateServiceRequest(id: number, status: string, remarks: string): Observable<ServiceRequest> {
    const body = { status, actionBy: 1, remarks };
    return this.mutate<ServiceRequest>(this.url('servicing', `/api/v1/service-requests/${id}`), 'PUT', body, 'requests', this.demoRequests, rows => {
      const row = rows.find(x => x.requestId === id); if (!row) return { requestId: id, requestNumber: `SR-${id}`, policyId: 0, customerId: 0, requestType: '', requestDate: new Date().toISOString(), status };
      row.status = status; return row;
    });
  }
  getEndorsements(): Observable<Endorsement[]> { return this.list(this.url('servicing', '/api/v1/endorsements'), 'endorsements', this.demoEndorsements); }
  createEndorsement(input: Pick<Endorsement, 'requestId' | 'endorsementType' | 'previousValue' | 'updatedValue'>): Observable<Endorsement> {
    return this.mutate<Endorsement>(this.url('servicing', '/api/v1/endorsements'), 'POST', input, 'endorsements', this.demoEndorsements, rows => {
      const id = this.nextId(rows, 'endorsementId'); const row: Endorsement = { ...input, endorsementId: id, endorsementNumber: `END-2026-${String(id).padStart(5, '0')}`, approvalStatus: 'PENDING' }; rows.unshift(row); return row;
    });
  }
  endorsementDecision(id: number, decision: 'approve' | 'reject'): Observable<Endorsement> {
    return this.mutate<Endorsement>(this.url('servicing', `/api/v1/endorsements/${id}/${decision}`), 'PUT', undefined, 'endorsements', this.demoEndorsements, rows => {
      const row = rows.find(x => x.endorsementId === id); if (row) row.approvalStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED'; return row ?? { endorsementId: id, requestId: 0, endorsementNumber: `END-${id}`, endorsementType: '', previousValue: '', updatedValue: '', approvalStatus: decision === 'approve' ? 'APPROVED' : 'REJECTED' };
    });
  }
  getNominees(policyIds: number[] = []): Observable<Nominee[]> {
    if (this.isDemoMode || policyIds.length === 0) return of(this.readStore('nominees', this.demoNominees));
    return forkJoin(policyIds.map(id => this.http.get<any>(this.url('servicing', `/api/v1/nominees/policy/${id}`)).pipe(map(raw => this.unwrap<any>(raw)), catchError(() => of([])))))
      .pipe(map(lists => lists.flatMap(item => Array.isArray(item) ? item : item ? [item] : [])));
  }
  createNominee(input: Omit<Nominee, 'nomineeId'>): Observable<Nominee> {
    return this.mutate<Nominee>(this.url('servicing', '/api/v1/nominees'), 'POST', input, 'nominees', this.demoNominees, rows => {
      const row: Nominee = { ...input, nomineeId: this.nextId(rows, 'nomineeId') }; rows.unshift(row); return row;
    });
  }
  updateNominee(id: number, input: Omit<Nominee, 'nomineeId'>): Observable<Nominee> {
    return this.mutate<Nominee>(this.url('servicing', `/api/v1/nominees/${id}`), 'PUT', input, 'nominees', this.demoNominees, rows => {
      const row = rows.find(x => x.nomineeId === id); if (!row) return { ...input, nomineeId: id }; Object.assign(row, input); return row;
    });
  }
  deleteNominee(id: number): Observable<any> {
    return this.mutate<any>(this.url('servicing', `/api/v1/nominees/${id}`), 'DELETE', undefined, 'nominees', this.demoNominees, rows => {
      const index = rows.findIndex(x => x.nomineeId === id); if (index >= 0) rows.splice(index, 1); return { nomineeId: id };
    }, true);
  }
  getServiceHistory(): Observable<ServiceHistory[]> { return this.list(this.url('servicing', '/api/v1/service-request-history'), 'history', this.demoHistory); }

  getCancellations(): Observable<Cancellation[]> { return this.list(this.url('closure', '/api/v1/cancellations'), 'cancellations', this.demoCancellations); }
  createCancellation(policyId: number, cancellationReason: string): Observable<Cancellation> {
    return this.mutate<Cancellation>(this.url('closure', `/api/v1/cancellations/policy/${policyId}`), 'POST', { cancellationReason }, 'cancellations', this.demoCancellations, rows => {
      const id = this.nextId(rows, 'cancellationId'); const row: Cancellation = { cancellationId: id, policyId, cancellationDate: new Date().toISOString().slice(0,10), cancellationReason, refundAmount: 0, cancellationRequestNumber: `CAN-2026-${String(id).padStart(5,'0')}`, requestStatus: 'PENDING' }; rows.unshift(row); return row;
    });
  }
  cancellationDecision(id: number, decision: 'approve' | 'reject', remarks: string): Observable<Cancellation> {
    return this.mutate<Cancellation>(this.url('closure', `/api/v1/cancellations/${id}/${decision}`), 'PUT', { approvedBy: 1, remarks }, 'cancellations', this.demoCancellations, rows => {
      const row = rows.find(x => x.cancellationId === id); if (!row) return { cancellationId: id, policyId: 0, cancellationDate: '', cancellationReason: '', refundAmount: 0, cancellationRequestNumber: `CAN-${id}`, requestStatus: decision === 'approve' ? 'APPROVED' : 'REJECTED' };
      row.requestStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED'; row.approvedBy = 1; row.decisionRemarks = remarks; row.decisionDate = new Date().toISOString(); return row;
    });
  }
}
