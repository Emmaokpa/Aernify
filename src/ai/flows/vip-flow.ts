
'use server';
/**
 * @fileOverview This file previously handled VIP subscription DVA generation.
 * This logic is now deprecated in favor of a direct payment webhook.
 */

// This file is intentionally left empty as the DVA logic has been removed.
// The new VIP payment logic is handled via a direct Paystack checkout on the client
// and a webhook on the server (`/api/paystack/webhook`).
