package com.waeve.app

import android.app.Activity
import com.android.billingclient.api.*

class BillingManager(private val activity: Activity) : PurchasesUpdatedListener {
    private val billing=BillingClient.newBuilder(activity).setListener(this).enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()).build()
    fun connect(onReady:(Boolean)->Unit){ billing.startConnection(object:BillingClientStateListener{override fun onBillingSetupFinished(r:BillingResult){onReady(r.responseCode==BillingClient.BillingResponseCode.OK)};override fun onBillingServiceDisconnected(){}}) }
    fun queryPremium(onResult:(List<ProductDetails>)->Unit){
        val p=QueryProductDetailsParams.newBuilder().setProductList(listOf(QueryProductDetailsParams.Product.newBuilder().setProductId("waeve_premium_monthly").setProductType(BillingClient.ProductType.SUBS).build())).build()
        billing.queryProductDetailsAsync(p){r,result->if(r.responseCode==BillingClient.BillingResponseCode.OK)onResult(result.productDetailsList) else onResult(emptyList())}
    }
    fun buy(product:ProductDetails){ val offer=product.subscriptionOfferDetails?.firstOrNull()?:return; val params=BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).setOfferToken(offer.offerToken).build())).build();billing.launchBillingFlow(activity,params) }
    override fun onPurchasesUpdated(r:BillingResult,purchases:MutableList<Purchase>?){ if(r.responseCode==BillingClient.BillingResponseCode.OK) purchases?.forEach{ if(it.purchaseState==Purchase.PurchaseState.PURCHASED && !it.isAcknowledged) billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(it.purchaseToken).build()) } }
}
