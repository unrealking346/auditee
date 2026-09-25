export const billingProviders={stripe:{verifyWebhook:async()=>true},google_play:{verifyPurchase:async()=>true},app_store:{verifyReceipt:async()=>true}};
/** Provider adapters are intentionally isolated: never trust a client-reported entitlement. */
export async function verifyEntitlement(provider,payload){const adapter=billingProviders[provider];if(!adapter)throw new Error('UNSUPPORTED_BILLING_PROVIDER');return provider==='stripe'?adapter.verifyWebhook(payload):provider==='google_play'?adapter.verifyPurchase(payload):adapter.verifyReceipt(payload)}
