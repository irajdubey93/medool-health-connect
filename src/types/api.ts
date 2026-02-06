/**
 * Medool API Types
 * Aligned with Backend OpenAPI spec
 */

// ============ Authentication ============

export interface OTPRequest {
  phone: string;
  purpose: "LOGIN";
}

export interface OTPResponse {
  status: string;  // "sent" or "otp_sent"
}

export interface OTPVerify {
  phone: string;
  otp: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface RefreshRequest {
  refresh_token: string;
}

// ============ User & Profile ============

export interface User {
  id: string;
  phone: string;
  is_active: boolean;
}

export type UserType = "CGHS" | "REGULAR";
export type Relation = "SELF" | "SPOUSE" | "CHILD" | "PARENT" | "OTHER";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  gender: Gender | null;
  date_of_birth: string | null;
  relation: Relation;
  user_type: UserType;
  user_type_locked: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileCreate {
  full_name: string;
  gender?: Gender;
  date_of_birth?: string;
  relation?: Relation;
  user_type: UserType;
}

export interface ProfileUpdate {
  full_name?: string;
  gender?: Gender;
  date_of_birth?: string;
  relation?: Relation;
  user_type?: UserType;
}

// ============ Address ============

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city_id: string | null;
  pincode: string | null;
  lat: number;
  lng: number;
  google_place_id: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressCreate {
  lat: number;
  lng: number;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city_id?: string;
  pincode?: string;
  label?: string;
  google_place_id?: string;
  is_default?: boolean;
}

export interface AddressUpdate {
  lat?: number;
  lng?: number;
  address_line1?: string;
  address_line2?: string | null;
  landmark?: string | null;
  city_id?: string | null;
  pincode?: string | null;
  label?: string | null;
  google_place_id?: string | null;
  is_default?: boolean;
}

// ============ City ============

export interface City {
  id: string;
  name: string;
  state: string;
  tier: number;
  is_active: boolean;
}

// ============ Test Catalog ============

export type SampleType = "BLOOD" | "URINE";

export interface Test {
  id: string;
  code: string;
  name: string;
  sample_type: SampleType;
  requires_fasting: boolean;
  requires_cold_chain: boolean;
  is_active: boolean;
}

export interface TestDetail extends Test {
  fasting_hours: number | null;
  cold_chain_min_c: number | null;
  cold_chain_max_c: number | null;
  max_transit_minutes: number | null;
  difficult_draw: boolean;
  created_at: string;
  updated_at: string;
  aliases: string[];
  collection_requirements: {
    requires_kit: boolean;
    requires_phlebotomist: boolean;
    requires_urine_container: boolean;
  };
  consumables: Array<{
    sku_id: string;
    name: string;
    qty: number;
  }>;
}

export interface TestSearchParams {
  q?: string;
  sample_type?: SampleType;
  requires_fasting?: boolean;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

// ============ Lab ============

export interface Lab {
  id: string;
  name: string;
  city_id: string | null;
  lat: number;
  lng: number;
  distance_km: number;
  lab_brand_id: string;
}

export interface LabSearchRequest {
  lat: number;
  lng: number;
  radius_km?: number;
  city_id?: string;
  limit?: number;
  offset?: number;
}

export interface LabSearchResponse {
  results: Lab[];
}

// ============ Prescription ============

export type PrescriptionSource = "UPLOAD" | "CAMERA";
export type PrescriptionStatus = "UPLOADED" | "EXTRACTING" | "EXTRACTED" | "FAILED";
export type ExtractionStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
export type MatchType = "ALIAS_EXACT" | "NAME_CONTAINS" | "UNMAPPED";

export interface PrescriptionFile {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_backend: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  user_id: string;
  profile_id: string;
  source: PrescriptionSource;
  status: PrescriptionStatus;
  title: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  files: PrescriptionFile[];
}

export interface PrescriptionListResponse {
  prescriptions: Prescription[];
  total: number;
}

export interface ResolvedItem {
  test_id: string;
  test_code: string;
  test_name: string;
  sample_type: string;
  requires_fasting: boolean;
  quantity: number;
  extracted_label: string;
  match_type: MatchType;
  confidence_bps: number;
}

export interface UnmappedItem {
  extracted_label: string;
}

export interface CartAssist {
  resolved_items: ResolvedItem[];
  unmapped_items: UnmappedItem[];
}

export interface Extraction {
  id: string;
  prescription_id: string;
  status: ExtractionStatus;
  error_message: string | null;
  gemini_model: string;
  prompt_version: number;
  created_at: string;
  updated_at: string;
  cart_assist?: CartAssist;
}

export interface ExtractionRunResponse {
  extraction: Extraction;
  cart_assist: CartAssist;
}

// ============ Quote ============

export type QuoteStatus = "DRAFT" | "FINALIZED" | "EXPIRED" | "CANCELLED";
export type PricingSource = "CGHS" | "LAB";

export interface QuoteItemInput {
  test_id: string;
  quantity: number;
  extracted_label?: string;
  match_type?: MatchType;
  confidence_bps?: number;
}

export interface QuotePreviewRequest {
  profile_id: string;
  address_id: string;
  items: QuoteItemInput[];
  slot_start_at?: string;
  radius_km?: number;
  limit_labs?: number;
  offset?: number;
  coupon_code?: string;
}

export interface LabOptionSummary {
  lab_id: string;
  lab_name: string;
  lab_brand_id: string;
  distance_km: number;
  tests_subtotal_paise: number;
  total_fees_paise: number;
  total_discount_paise: number;
  total_cashback_paise: number;
  total_payable_paise: number;
}

export interface QuotePreviewResponse {
  pricing_user_type: string;
  labs: LabOptionSummary[];
  unavailable_labs_count: number;
}

export interface QuoteCreateRequest {
  profile_id: string;
  address_id: string;
  items: QuoteItemInput[];
  slot_start_at?: string;
  radius_km?: number;
  coupon_code?: string;
}

export interface QuoteCreateResponse {
  quote_id: string;
  status: string;
  pricing_user_type: string;
  lab_options: Array<{
    lab_id: string;
    distance_km: number;
    tests_subtotal_paise: number;
    total_payable_paise: number;
  }>;
}

export interface QuoteFinalizeRequest {
  selected_lab_id: string;
}

export interface QuoteItem {
  id: string;
  test_id: string;
  quantity: number;
  unit_price_paise: number;
  pricing_source: string;
  lab_test_id: string | null;
  extracted_label: string | null;
  match_type: string | null;
  confidence_bps: number | null;
  created_at: string;
}

export interface QuoteLabOption {
  id: string;
  lab_id: string;
  distance_km: number;
  tests_subtotal_paise: number;
  total_fees_paise: number;
  total_discount_paise: number;
  total_cashback_paise: number;
  total_payable_paise: number;
  pricing_breakdown: Record<string, unknown>;
  created_at: string;
}

export interface QuoteEvent {
  id: string;
  event_type: string;
  event_meta: Record<string, unknown>;
  created_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  profile_id: string;
  address_id: string;
  pricing_user_type: string;
  status: QuoteStatus;
  slot_start_at: string | null;
  coupon_code: string | null;
  selected_lab_id: string | null;
  tests_subtotal_paise: number;
  total_fees_paise: number;
  total_discount_paise: number;
  total_cashback_paise: number;
  total_payable_paise: number;
  pricing_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  items: QuoteItem[];
  lab_options: QuoteLabOption[];
  events: QuoteEvent[];
}

export interface QuoteListItem {
  id: string;
  profile_id: string;
  pricing_user_type: string;
  status: string;
  selected_lab_id: string | null;
  total_payable_paise: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteListResponse {
  quotes: QuoteListItem[];
  total: number;
}

// ============ Order ============

export type OrderStatus =
  | "OPS_REVIEW"
  | "OPS_APPROVED"
  | "OPS_REJECTED"
  | "SCHEDULED"
  | "COLLECTED"
  | "DELIVERED_TO_LAB"
  | "REPORTS_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export type RiderAssignmentStatus =
  | "PENDING"
  | "OFFERING"
  | "ASSIGNED"
  | "CANCELLED"
  | "FAILED";

export interface OrderItem {
  id: string;
  test_id: string;
  quantity: number;
  unit_price_paise: number;
  pricing_source: string;
  lab_test_id: string | null;
  extracted_label: string | null;
  match_type: string | null;
  confidence_bps: number | null;
  created_at: string;
}

export interface OrderOpsTask {
  id: string;
  status: string;
  reviewer_id: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  checklist: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrderAttachment {
  id: string;
  attachment_type: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

export interface LabReport {
  id: string;
  attachment_id: string;
  report_type: string;
  source: string;
  collected_at: string | null;
  reported_at: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  attachment: OrderAttachment | null;
}

export interface Order {
  id: string;
  user_id: string;
  profile_id: string;
  address_id: string;
  quote_id: string;
  pricing_user_type: string;
  status: OrderStatus;
  slot_start_at: string | null;
  coupon_code: string | null;
  selected_lab_id: string;
  tests_subtotal_paise: number;
  total_fees_paise: number;
  total_discount_paise: number;
  total_cashback_paise: number;
  total_payable_paise: number;
  pricing_snapshot: Record<string, unknown>;
  quote_items_snapshot: unknown[];
  collection_notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  ops_task: OrderOpsTask | null;
  reports: LabReport[];
}

export interface OrderCreateRequest {
  quote_id: string;
}

export interface OrderCreateResponse {
  order_id: string;
  status: string;
}

export interface OrderCancelRequest {
  reason: string;
}

export interface OrderListItem {
  id: string;
  profile_id: string;
  quote_id: string;
  pricing_user_type: string;
  status: string;
  selected_lab_id: string;
  total_payable_paise: number;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  orders: OrderListItem[];
  total: number;
}

// ============ Rider Status ============

export interface CODSummary {
  expected_paise: number;
  collected_paise: number;
  deposited_paise: number;
  outstanding_paise: number;
}

export interface RiderStatus {
  order_id: string;
  assignment_status: RiderAssignmentStatus;
  rider_id: string | null;
  job_status: string | null;
  cod: CODSummary;
}

// ============ Reports ============

export interface ReportDownloadResponse {
  download_url: string;
  expires_in_minutes: number;
}

// ============ Slot ============

export interface Slot {
  start_at: string;
  end_at: string;
  capacity: number;
  booked: number;
  available: number;
}

// ============ Cart ============

export interface CartItem {
  test_id: string;
  test: Test;
  quantity: number;
}

// ============ Pagination ============

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============ Extracted Test (Prescription) ============

export interface ExtractedTest {
  id: string;
  prescription_id: string;
  test_id?: string;
  extracted_name: string;
  confidence: number;
  is_mapped: boolean;
  test?: Test;
}

// ============ Error Response ============

export interface APIError {
  error: {
    code: string;
    message: string;
    request_id?: string;
    details?: Record<string, string[]>;
  };
}

// Error code constants
export const ERROR_CODES = {
  // Auth
  INVALID_OTP: "invalid_otp",
  TOO_MANY_ATTEMPTS: "attempts_exceeded",
  OTP_COOLDOWN: "otp_cooldown",
  RATE_LIMIT: "rate_limit",
  RATE_LIMITED: "rate_limited",
  TOKEN_EXPIRED: "token_expired",
  INVALID_REFRESH_TOKEN: "invalid_token",
  UNAUTHORIZED: "unauthorized",
  
  // Profile
  USER_TYPE_LOCKED: "user_type_locked",
  PROFILE_INACTIVE: "profile_inactive",
  DUPLICATE_SELF: "duplicate_self_profile",
  
  // Quote & Order
  QUOTE_EXPIRED: "quote_expired",
  QUOTE_NOT_DRAFT: "quote_not_draft",
  QUOTE_NOT_FINALIZED: "quote_not_finalized",
  INVALID_LAB_SELECTION: "invalid_lab_selection",
  COUPON_LIMIT_EXCEEDED: "coupon_limit_exceeded",
  CAPACITY_EXCEEDED: "capacity_exceeded",
  
  // Cancellation
  CANNOT_CANCEL_AFTER_DISPATCH: "cannot_cancel_after_dispatch",
  CANNOT_CANCEL_AFTER_COLLECTION: "cannot_cancel_after_collection",
  ORDER_NOT_CANCELLABLE: "order_not_cancellable",
  
  // Generic
  VALIDATION_ERROR: "validation_error",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  INTERNAL_ERROR: "internal_error",
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
