export type PolicyStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED' | 'INACTIVE' | string;
export interface Policy {
  policyId: number; policyNumber: string; quoteId: number; customerId: number; productId: number;
  issueDate: string; effectiveDate: string; expiryDate: string; policyStatus: PolicyStatus;
}
export interface PolicyRequest {
  quoteId: number; customerId: number; productId: number; effectiveDate: string; expiryDate: string;
}
export interface Renewal {
  renewalId: number; policyId: number; renewalDate: string; newExpiryDate: string; premiumAmount: number;
  renewalStatus: 'PENDING' | 'PAID' | 'RENEWED' | 'EXPIRED' | string;
  reminderSent: boolean; customerConfirmed: boolean; paymentVerified: boolean;
}
export interface ServiceRequest {
  requestId: number; requestNumber: string; policyId: number; customerId: number; requestType: string;
  requestDate: string; status: string; requestDetails?: string;
}
export interface Endorsement {
  endorsementId: number; requestId: number; endorsementNumber: string; endorsementType: string;
  previousValue: string; updatedValue: string; approvalStatus: string;
}
export interface Nominee {
  nomineeId: number; policyId: number; nomineeName: string; relationship: string; dob: string;
  sharePercentage: number; guardianName?: string;
}
export interface ServiceHistory {
  historyId: number; requestId: number; action: string; actionBy: number; actionDate: string; remarks: string;
}
export interface Cancellation {
  cancellationId: number; policyId: number; cancellationDate: string; cancellationReason: string;
  refundAmount: number; approvedBy?: number; cancellationRequestNumber: string; requestStatus: string;
  decisionRemarks?: string; decisionDate?: string;
}
export interface PolicyDocument {
  documentId?: number; policyId: number; policyNumber?: string; documentName?: string; filePath?: string;
  versionNo?: number; generatedDate?: string;
}
export interface PolicyCoverage {
  coverageId: number; policyId?: number; policy?: Partial<Policy>; coverageName: string; sumInsured: number;
  coverageStartDate: string; coverageEndDate: string;
}
export interface PolicyRider {
  policyRiderId: number; policyId: number; riderId: number; riderPremium: number;
}
export interface PolicyHistory {
  historyId: number; policyId: number; action: string; changedBy: number; changeDate: string; remarks: string;
}
export interface IssuanceEndorsement {
  endorsementId: number; policyId: number; endorsementType: string; oldValue: string; newValue: string;
  approvalStatus: string; approvedBy?: number; rejectionReason?: string; endorsementDate: string;
}
