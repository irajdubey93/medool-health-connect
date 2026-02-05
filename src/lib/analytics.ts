/**
 * Minimal Analytics Events for Launch
 * - Event queue with offline support
 * - Batch send every 30 seconds or 10 events
 * - Console logging in development
 */

type AnalyticsEvent = {
  name: string;
  properties: Record<string, unknown>;
  timestamp: number;
};

// Event queue
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

/**
 * Hash a phone number for analytics (privacy)
 */
export function hashPhone(phone: string): string {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) {
    const char = phone.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Get platform info
 */
function getPlatform(): string {
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return "pwa";
  }
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    return "mobile_web";
  }
  return "desktop_web";
}

/**
 * Flush events to backend (or console in dev)
 */
async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  // In development, just log to console
  if (import.meta.env.DEV) {
    console.group("📊 Analytics Events");
    events.forEach((event) => {
      console.log(`${event.name}:`, event.properties);
    });
    console.groupEnd();
    return;
  }

  // In production, send to backend (when endpoint is available)
  // try {
  //   await api.post("/analytics/events", { events });
  // } catch (error) {
  //   // Re-queue failed events
  //   eventQueue = [...events, ...eventQueue];
  // }
}

/**
 * Schedule flush
 */
function scheduleFlush(): void {
  if (flushTimer) return;
  
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, FLUSH_INTERVAL);
}

/**
 * Track an analytics event
 */
export function track(name: string, properties: Record<string, unknown> = {}): void {
  const event: AnalyticsEvent = {
    name,
    properties: {
      ...properties,
      platform: getPlatform(),
    },
    timestamp: Date.now(),
  };

  eventQueue.push(event);

  // Flush immediately if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  } else {
    scheduleFlush();
  }
}

// Pre-defined event helpers
export const analytics = {
  /**
   * App opened
   */
  appOpen: (source: string = "direct") => {
    track("app_open", { source, platform: getPlatform() });
  },

  /**
   * Login started (OTP requested)
   */
  loginStart: (phone: string) => {
    track("login_start", { phone_hash: hashPhone(phone) });
  },

  /**
   * Login successful
   */
  loginSuccess: (userId: string, isNewUser: boolean) => {
    track("login_success", { user_id: userId, is_new_user: isNewUser });
  },

  /**
   * Profile created
   */
  profileCreated: (relation: string, userType: string) => {
    track("profile_created", { relation, user_type: userType });
  },

  /**
   * Prescription uploaded
   */
  prescriptionUploaded: (profileId: string, source: "camera" | "file") => {
    track("prescription_uploaded", { profile_id: profileId, source });
  },

  /**
   * Cart updated
   */
  cartUpdated: (itemCount: number, fromExtraction: boolean = false) => {
    track("cart_updated", { item_count: itemCount, from_extraction: fromExtraction });
  },

  /**
   * Quote created
   */
  quoteCreated: (itemCount: number, labId: string) => {
    track("quote_created", { item_count: itemCount, selected_lab_id: labId });
  },

  /**
   * Order placed
   */
  orderPlaced: (orderId: string, totalPaise: number) => {
    track("order_placed", { order_id: orderId, total_paise: totalPaise });
  },

  /**
   * Order cancelled
   */
  orderCancelled: (orderId: string, statusAtCancel: string) => {
    track("order_cancelled", { order_id: orderId, status_at_cancel: statusAtCancel });
  },

  /**
   * Report downloaded
   */
  reportDownloaded: (orderId: string, reportType: string) => {
    track("report_downloaded", { order_id: orderId, report_type: reportType });
  },
};

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    flushEvents();
  });

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushEvents();
    }
  });
}
