/**
 * Module de paiement.
 *
 * Ce module définit une interface unique pour initier et vérifier un paiement,
 * avec deux implémentations :
 *  - "simulation" : pour développer/tester sans compte marchand réel
 *  - "cinetpay"   : intégration réelle avec CinetPay (Orange Money + MTN MoMo au Cameroun)
 *
 * Pour activer les vrais paiements, il suffira de :
 *  1. Créer un compte sur https://cinetpay.com
 *  2. Renseigner CINETPAY_API_KEY et CINETPAY_SITE_ID dans .env
 *  3. Mettre PAYMENT_MODE="cinetpay" dans .env
 *  4. Configurer l'URL de notification (webhook) chez CinetPay vers /api/payments/webhook
 */

export type PaymentMethod = "ORANGE_MONEY" | "MTN_MOMO" | "SIMULATION";

export type InitiatePaymentParams = {
  orderReference: string;
  amountXAF: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string; // où rediriger l'étudiant après le paiement
  notifyUrl: string; // webhook que l'agrégateur appellera pour confirmer le paiement
};

export type InitiatePaymentResult = {
  success: boolean;
  paymentUrl?: string; // URL vers laquelle rediriger l'étudiant pour payer
  externalTxId?: string;
  errorMessage?: string;
};

export type VerifyPaymentResult = {
  status: "PAID" | "PENDING" | "FAILED";
  externalTxId?: string;
};

const PAYMENT_MODE = process.env.PAYMENT_MODE || "simulation";

// ---------------------------------------------------------------------------
// Implémentation SIMULATION — utile pour développer et faire des démos
// ---------------------------------------------------------------------------
async function initiateSimulationPayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  // En mode simulation, on redirige directement vers une page interne
  // qui imite l'écran de paiement Mobile Money, avec un bouton "Confirmer".
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/paiement/simulation`);
  url.searchParams.set("ref", params.orderReference);
  url.searchParams.set("amount", String(params.amountXAF));
  return {
    success: true,
    paymentUrl: url.toString(),
    externalTxId: `SIM-${params.orderReference}`,
  };
}

async function verifySimulationPayment(): Promise<VerifyPaymentResult> {
  // La confirmation se fait via l'action du bouton sur la page de simulation,
  // qui appelle directement /api/payments/webhook. Ici on ne fait rien de plus.
  return { status: "PENDING" };
}

// ---------------------------------------------------------------------------
// Implémentation CINETPAY — paiement réel Orange Money / MTN MoMo
// Documentation officielle : https://docs.cinetpay.com
// ---------------------------------------------------------------------------
async function initiateCinetPayPayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  try {
    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY,
        site_id: process.env.CINETPAY_SITE_ID,
        transaction_id: params.orderReference,
        amount: params.amountXAF,
        currency: "XAF",
        description: params.description,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone_number: params.customerPhone,
        notify_url: params.notifyUrl,
        return_url: params.returnUrl,
        channels: "MOBILE_MONEY", // couvre Orange Money + MTN MoMo
      }),
    });

    const data = await response.json();

    if (data.code === "201" && data.data?.payment_url) {
      return {
        success: true,
        paymentUrl: data.data.payment_url,
        externalTxId: data.data.payment_token,
      };
    }

    return {
      success: false,
      errorMessage: data.message || "Erreur lors de l'initiation du paiement",
    };
  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : "Erreur réseau",
    };
  }
}

async function verifyCinetPayPayment(
  orderReference: string
): Promise<VerifyPaymentResult> {
  try {
    const response = await fetch(
      "https://api-checkout.cinetpay.com/v2/payment/check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: process.env.CINETPAY_API_KEY,
          site_id: process.env.CINETPAY_SITE_ID,
          transaction_id: orderReference,
        }),
      }
    );
    const data = await response.json();

    if (data.data?.status === "ACCEPTED") {
      return { status: "PAID", externalTxId: data.data.payment_token };
    }
    if (data.data?.status === "REFUSED") {
      return { status: "FAILED" };
    }
    return { status: "PENDING" };
  } catch {
    return { status: "PENDING" };
  }
}

// ---------------------------------------------------------------------------
// Façade publique — le reste de l'app utilise uniquement ces deux fonctions
// ---------------------------------------------------------------------------
export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  if (PAYMENT_MODE === "cinetpay") {
    return initiateCinetPayPayment(params);
  }
  return initiateSimulationPayment(params);
}

export async function verifyPayment(
  orderReference: string
): Promise<VerifyPaymentResult> {
  if (PAYMENT_MODE === "cinetpay") {
    return verifyCinetPayPayment(orderReference);
  }
  return verifySimulationPayment();
}

export function getPaymentMode() {
  return PAYMENT_MODE;
}
