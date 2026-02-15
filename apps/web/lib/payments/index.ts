/**
 * Payment Library — Central Exports
 */

// Core helpers
export { generateOrderId, compareAmount, PENDING_EXPIRY_MS, getPriceUSD, getPayPalPlanId } from './constants';
export { applySubscriptionChange, downgradeToStandard } from './activation';
export type { SubscriptionChangeParams } from './activation';

// Gateway helpers
export { verifySepaySignature, extractOrderId, buildSepayCheckoutUrl } from './sepay';
export type { SepayWebhookPayload } from './sepay';
export { getSubscriptionDetails, verifyWebhookSignature, cancelSubscription } from './paypal';
export type { PayPalSubscriptionDetails } from './paypal';

// PLG tracking
export { trackEvent, trackEventClient } from './trackEvent';
export type { PaymentEvent, TrackEventPayload } from './trackEvent';
