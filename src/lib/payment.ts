/**
 * Module de paiement.
 *
 * Ce module définit une interface unique pour initier et vérifier un paiement,
 * avec plusieurs implémentations :
 *  - "simulation" : pour développer/tester sans compte marchand réel
 *  - "cinetpay"   : intégration réelle avec CinetPay (Orange Money + MTN MoMo au Cameroun)
 *  - "monetbil"   : intégration réelle avec Monetbil (Orange Money + MTN MoMo au Cameroun)
 *
 * Pour activer les vrais paiements via Monetbil, il suffira de :
 *  1. Créer un compte et un service sur https://www.monetbil.com/services
 *  2. Renseigner MONETBIL_SERVICE_KEY et MONETBIL_SERVICE_SECRET dans .env
 *  3. Mettre PAYMENT_MODE="monetbil" dans .env
 *  4. Configurer l'URL de notification (webhook) chez Monetbil vers /api/payments/webhook
 *
 * Pour activer les vrais paiements via CinetPay, il suffira de :
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
// Implémentation MONETBIL — paiement réel Orange Money / MTN MoMo
// Documentation officielle : https://www.monetbil.company/doc
// ---------------------------------------------------------------------------

// Monetbil exige un numéro de téléphone camerounais sans le préfixe +237.
// On nettoie ce qui est saisi par l'étudiant pour ne garder que les chiffres
// utiles (en retirant un éventuel +237 ou 237 en tête).
function normalizeCameroonPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.startsWith("237") && digitsOnly.length > 9) {
    return digitsOnly.slice(3);
  }
  return digitsOnly;
}

async function initiateMonetbilPayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  try {
    const serviceKey = process.env.MONETBIL_SERVICE_KEY;
    const response = await fetch(
      `https://api.monetbil.com/widget/v2.1/${serviceKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: params.amountXAF,
          currency: "XAF",
          country: "CM",
          locale: "fr",
          phone: normalizeCameroonPhone(params.customerPhone),
          item_ref: params.orderReference,
          payment_ref: params.orderReference,
          first_name: params.customerName,
          email: params.customerEmail,
          return_url: params.returnUrl,
          notify_url: params.notifyUrl,
        }),
      }
    );

    const data = await response.json();

    if (data.success && data.payment_url) {
      return {
        success: true,
        paymentUrl: data.payment_url,
        externalTxId: params.orderReference,
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

async function verifyMonetbilPayment(
  orderReference: string
): Promise<VerifyPaymentResult> {
  try {
    const serviceSecret = process.env.MONETBIL_SERVICE_SECRET;
    const response = await fetch(
      "https://api.monetbil.com/payment/v1/checkPaymentStatus",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: serviceSecret,
          paymentRef: orderReference,
        }),
      }
    );
    const data = await response.json();

    // status : 1 = succès, -1 = annulé, 0 = échec (cf. doc Monetbil)
    if (data?.status === 1 || data?.transaction?.status === 1) {
      return { status: "PAID", externalTxId: orderReference };
    }
    if (data?.status === 0 || data?.transaction?.status === 0) {
      return { status: "FAILED" };
    }
    return { status: "PENDING" };
  } catch {
    return { status: "PENDING" };
  }
}


export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  if (PAYMENT_MODE === "cinetpay") {
    return initiateCinetPayPayment(params);
  }
  if (PAYMENT_MODE === "monetbil") {
    return initiateMonetbilPayment(params);
  }
  return initiateSimulationPayment(params);
}

export async function verifyPayment(
  orderReference: string
): Promise<VerifyPaymentResult> {
  if (PAYMENT_MODE === "cinetpay") {
    return verifyCinetPayPayment(orderReference);
  }
  if (PAYMENT_MODE === "monetbil") {
    return verifyMonetbilPayment(orderReference);
  }
  return verifySimulationPayment();
}

export function getPaymentMode() {
  return PAYMENT_MODE;
}
