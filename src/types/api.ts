/**
 * Medool API Types
 * Generated from OpenAPI spec - DO NOT EDIT MANUALLY
 */

// ============ Authentication ============

export interface OTPRequest {
  phone: string;
  purpose: "LOGIN" | "REGISTER";
}

export interface OTPResponse {
  message: string;
  expires_at: string;
  cooldown_seconds: number;
}

export interface OTPVerify {
  phone: string;
  otp: string;
  purpose: "LOGIN" | "REGISTER";
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
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
  created_at: string;
  updated_at: string;
}

export type UserType = "CGHS" | "REGULAR";
export type Relation = "SELF" | "SPOUSE" | "CHILD" | "PARENT" | "OTHER";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  gender: Gender;
  date_of_birth: string;
  relation: Relation;
  user_type: UserType;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileCreate {
  name: string;
  gender: Gender;
  date_of_birth: string;
  relation: Relation;
  user_type: UserType;
}

export interface ProfileUpdate {
  name?: string;
  gender?: Gender;
  date_of_birth?: string;
  relation?: Relation;
}

// ============ Address ============

export interface Address {
  id: string;
  user_id: string;
  label: string;
  address_line: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressCreate {
  label: string;
  address_line: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface AddressUpdate {
  label?: string;
  address_line?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

// ============ Test Catalog ============

export type SampleType = "BLOOD" | "URINE" | "STOOL" | "OTHER";

export interface Test {
  id: string;
  code: string;
  name: string;
  description?: string;
  sample_type: SampleType;
  fasting_required: boolean;
  fasting_hours?: number;
  special_instructions?: string;
  aliases: string[];
  is_active: boolean;
}

export interface TestSearchParams {
  q?: string;
  sample_type?: SampleType;
  fasting_required?: boolean;
  limit?: number;
  offset?: number;
}

// ============ Prescription ============

export type PrescriptionStatus = 
  | "UPLOADED"
  | "EXTRACTING"
  | "EXTRACTED"
  | "EXTRACTION_FAILED";

export interface Prescription {
  id: string;
  profile_id: string;
  file_url: string;
  file_type: "IMAGE" | "PDF";
  title?: string;
  notes?: string;
  status: PrescriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionUpload {
  profile_id: string;
  title?: string;
  notes?: string;
}

export interface ExtractedTest {
  id: string;
  prescription_id: string;
  test_id?: string;
  extracted_name: string;
  confidence: number;
  is_mapped: boolean;
  test?: Test;
}

// ============ Cart ============

export interface CartItem {
  test_id: string;
  test: Test;
  quantity: number;
}

export interface Cart {
  profile_id: string;
  items: CartItem[];
  updated_at: string;
}

export interface CartAddItem {
  test_id: string;
}

// ============ Lab ============

export interface Lab {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  is_active: boolean;
}

export interface LabPricing {
  lab: Lab;
  items: LabPricingItem[];
  total_mrp_paise: number;
  total_price_paise: number;
  discount_paise: number;
}

export interface LabPricingItem {
  test_id: string;
  test_name: string;
  mrp_paise: number;
  price_paise: number;
}

// ============ Quote ============

export type QuoteStatus = "DRAFT" | "FINALIZED" | "EXPIRED" | "CONVERTED";

export interface Quote {
  id: string;
  user_id: string;
  profile_id: string;
  address_id: string;
  status: QuoteStatus;
  selected_lab_id?: string;
  selected_lab?: Lab;
  slot_start_at?: string;
  coupon_code?: string;
  items: QuoteItem[];
  total_mrp_paise: number;
  total_price_paise: number;
  discount_paise: number;
  coupon_discount_paise: number;
  final_price_paise: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  test_id: string;
  test: Test;
  mrp_paise: number;
  price_paise: number;
}

export interface QuotePreviewRequest {
  profile_id: string;
  address_id: string;
  test_ids: string[];
  slot_start_at?: string;
  coupon_code?: string;
}

export interface QuotePreviewResponse {
  labs: LabPricing[];
  selected_slot?: string;
  coupon_valid?: boolean;
  coupon_discount_paise?: number;
}

export interface QuoteCreateRequest {
  profile_id: string;
  address_id: string;
  test_ids: string[];
  lab_id: string;
  slot_start_at: string;
  coupon_code?: string;
}

export interface QuoteFinalizeRequest {
  lab_id: string;
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

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  profile_id: string;
  profile: Profile;
  address_id: string;
  address: Address;
  quote_id: string;
  lab_id: string;
  lab: Lab;
  status: OrderStatus;
  slot_start_at: string;
  slot_confirmed: boolean;
  items: OrderItem[];
  total_mrp_paise: number;
  total_price_paise: number;
  discount_paise: number;
  coupon_discount_paise: number;
  final_price_paise: number;
  payment_method: "COD";
  cod_amount_paise: number;
  cod_collected_paise: number;
  cod_outstanding_paise: number;
  rider_assignment?: RiderAssignment;
  reports: Report[];
  cancellation_reason?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  test_id: string;
  test: Test;
  mrp_paise: number;
  price_paise: number;
}

export interface OrderCreateRequest {
  quote_id: string;
}

export interface OrderCancelRequest {
  reason: string;
}

export interface RiderAssignment {
  id: string;
  order_id: string;
  rider_name?: string;
  status: RiderAssignmentStatus;
  assigned_at?: string;
  created_at: string;
}

// ============ Reports ============

export type ReportType = "PDF" | "IMAGE";

export interface Report {
  id: string;
  order_id: string;
  file_type: ReportType;
  file_size_bytes: number;
  is_verified: boolean;
  uploaded_at: string;
}

export interface ReportDownloadResponse {
  download_url: string;
  expires_at: string;
}

// ============ Slots ============

export interface Slot {
  start_at: string;
  end_at: string;
  capacity: number;
  booked: number;
  available: number;
}

// ============ Pagination ============

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============ Error Response ============

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Error code constants
export const ERROR_CODES = {
  // Auth
  INVALID_OTP: "invalid_otp",
  TOO_MANY_ATTEMPTS: "too_many_attempts",
  OTP_COOLDOWN: "otp_cooldown",
  RATE_LIMIT: "rate_limit",
  TOKEN_EXPIRED: "token_expired",
  INVALID_REFRESH_TOKEN: "invalid_refresh_token",
  
  // Profile
  USER_TYPE_LOCKED: "user_type_locked",
  PROFILE_INACTIVE: "profile_inactive",
  
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
