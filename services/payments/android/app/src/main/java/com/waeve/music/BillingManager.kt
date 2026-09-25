package com.waeve.music
import android.app.Activity
import com.android.billingclient.api.*

class BillingManager(private val activity: Activity) : PurchasesUpdatedListener {
    private val billing = BillingClient.newBuilder(activity)
        .setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .build()

    fun connect(onReady: () -> Unit) {
        billing.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) onReady()
            }
            override fun onBillingServiceDisconnected() {}
        })
    }

    fun buyPremium() {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(listOf(QueryProductDetailsParams.Product.newBuilder()
                .setProductId("waeve_premium_monthly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build())).build()

        billing.queryProductDetailsAsync(params) { result, details ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK || details.productDetailsList.isEmpty()) return@queryProductDetailsAsync
            val product = details.productDetailsList.first()
            val offer = product.subscriptionOfferDetails?.firstOrNull() ?: return@queryProductDetailsAsync
            val productParams = BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(product)
                .setOfferToken(offer.offerToken)
                .build()
            val flow = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(listOf(productParams))
                .build()
            billing.launchBillingFlow(activity, flow)
        }
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        if (result.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            purchases.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED && !it.isAcknowledged }
                .forEach { p ->
                    billing.acknowledgePurchase(
                        AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.purchaseToken).build()
                    ) {}
                    // Production: send the purchase token to Waeve's backend and grant
                    // entitlement only after server-side Google Play verification.
                }
        }
    }

    fun close() = billing.endConnection()
}