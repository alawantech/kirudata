/**
 * Monnify Webhook Handler
 *
 * Monnify sends a POST to /webhook/monnify when a payment lands on a
 * reserved account. We verify the HMAC signature, then credit the user's
 * wallet and log a transaction.
 *
 * Monnify signature header: monnify-signature
 * Signature = SHA-512 HMAC(rawBody, secretKey), hex-encoded
 */

const prisma = require("../config/prisma");
const UserModel = require("../models/user.model");
const TransactionModel = require("../models/transaction.model");
const monnifyService = require("../services/monnify.service");

module.exports = async function monnifyWebhook(req, res) {
  // Always respond 200 quickly so Monnify doesn't retry unnecessarily
  try {
    const rawBody = req.rawBody; // set by express middleware below
    const signature =
      req.headers["monnify-signature"] ||
      req.headers["x-monnify-signature"] ||
      req.headers["monnify-signature-2"] ||
      req.headers["x-monnify-signature-2"] ||
      "";
    const signatureHeaderKeys = Object.keys(req.headers || {}).filter((key) =>
      key.toLowerCase().includes("signature"),
    );

    // Verify HMAC
    const cfg = await monnifyService.getMonnifyConfig();
    const valid = monnifyService.verifyWebhookSignature(
      rawBody,
      signature,
      cfg.secretKey,
    );
    if (!valid) {
      console.warn(
        "[Monnify Webhook] Invalid signature — ignored",
        JSON.stringify({
          hasSignature: Boolean(signature),
          signatureLength: signature ? signature.length : 0,
          rawBodyLength: rawBody ? rawBody.length : 0,
          signatureHeaderKeys,
          ip: req.ip,
          forwardedFor: req.headers["x-forwarded-for"],
        }),
      );
      return res.status(200).json({ status: "ignored" });
    }

    const event = req.body;
    const eventType = event.eventType || event.event_type || "";

    // We only care about successful reserved-account payments
    if (
      eventType !== "SUCCESSFUL_TRANSACTION" &&
      eventType !== "SUCCESSFUL_RESERVATION"
    ) {
      return res.status(200).json({ status: "not_handled" });
    }

    const body = event.eventData || {};
    const paymentRef = body.paymentReference || body.transactionReference || "";
    const accountReference =
      body.reservedAccountDetails?.accountReference ||
      body.product?.reference ||
      body.product?.accountReference ||
      "";
    const amountPaid = parseFloat(body.amountPaid || body.amount || 0);
    const payerName = body.paymentSourceInformation?.[0]?.bankName || "";
    const narration = body.narration || "";

    if (!accountReference || amountPaid <= 0) {
      console.warn("[Monnify Webhook] Missing account reference or amount", {
        hasAccountReference: Boolean(accountReference),
        amountPaid,
      });
      return res.status(200).json({ status: "skipped" });
    }

    // Find user by accountReference stored on User row
    const userRow = await prisma.user.findFirst({
      where: { accountReference },
      select: { id: true, wallet: true },
    });

    if (!userRow) {
      console.warn(
        `[Monnify Webhook] No user found for accountReference: ${accountReference}`,
      );
      return res.status(200).json({ status: "user_not_found" });
    }

    // Atomically: check idempotency, credit wallet, and record transaction.
    // Wrapping all three in one DB transaction ensures two concurrent webhook
    // calls for the same paymentRef cannot both credit the wallet.
    // If the unique constraint on transref fires (P2002), the whole DB
    // transaction — including the wallet increment — is rolled back.
    const ref = paymentRef || `MONNIFY-${Date.now()}`;

    // Calculate funding fee (if configured)
    let fee = 0;
    let creditAmount = amountPaid;
    try {
      const siteSettings = await prisma.siteSetting.findFirst({ where: { id: 1 } });
      const feePercent = parseFloat(siteSettings?.walletFundingFeePercent || "0");
      const feeCap = parseFloat(siteSettings?.walletFundingFeeCap || "50");
      if (feePercent > 0) {
        fee = Math.min((amountPaid * feePercent) / 100, feeCap);
        fee = Math.round(fee * 100) / 100;
        creditAmount = amountPaid - fee;
      }
    } catch (err) {
      console.error("[Monnify Webhook] Fee calc error:", err.message);
    }

    const oldbal = userRow.wallet;
    const newbal = oldbal + creditAmount;

    let alreadyProcessed = false;
    try {
      await prisma.$transaction(async (tx) => {
        const exists = await tx.transaction.findFirst({
          where: { transref: ref },
          select: { id: true },
        });
        if (exists) {
          alreadyProcessed = true;
          return; // no-op — nothing written, transaction rolls back cleanly
        }

        await tx.user.update({
          where: { id: userRow.id },
          data: { wallet: { increment: creditAmount } },
        });

        const feeDesc = fee > 0 ? ` (fee: ₦${fee})` : "";
        await tx.transaction.create({
          data: {
            userId: userRow.id,
            transref: ref,
            servicename: "Wallet Funding",
            servicedesc: `Monnify transfer${feeDesc}${narration ? ": " + narration : ""}${payerName ? " from " + payerName : ""}`,
            amount: String(amountPaid),
            status: 1,
            oldbal: String(oldbal),
            newbal: String(newbal),
            profit: fee,
            apiResponse: "MONNIFY_WEBHOOK",
            apiResponseLog: JSON.stringify({ ...body, fee, creditAmount }),
          },
        });

        // Check for unpaid KYC verification fee
        const pendingKyc = await tx.kycVerification.findFirst({
          where: { 
            userId: userRow.id,
            feePaid: false,
            fee: { gt: 0 }
          }
        });

        if (pendingKyc) {
          const kycFee = pendingKyc.fee;
          // Current balance (after funding) is `newbal`
          if (newbal >= kycFee) {
            await tx.user.update({
              where: { id: userRow.id },
              data: { wallet: { decrement: kycFee } }
            });

            await tx.kycVerification.update({
              where: { id: pendingKyc.id },
              data: { feePaid: true }
            });

            await tx.transaction.create({
              data: {
                userId: userRow.id,
                transref: `KYC-DEDUCT-${Date.now()}`,
                servicename: "KYC Verification",
                servicedesc: `Pending ${pendingKyc.method} Verification Charge`,
                amount: String(kycFee),
                status: 1,
                oldbal: String(newbal),
                newbal: String(newbal - kycFee),
                profit: 0,
              }
            });
            console.log(`[Monnify Webhook] Deducted pending KYC fee of ${kycFee} from userId=${userRow.id}`);

            // If not yet verified, attempt verification now that fee is paid
            if (pendingKyc.status !== "verified") {
              try {
                const validationResult = await monnifyService.validateIdentity(
                  pendingKyc.number,
                  pendingKyc.dob,
                  pendingKyc.method,
                  {
                    name: `${pendingKyc.firstName || ""} ${pendingKyc.lastName || ""}`.trim(),
                    phone: userRow.phone,
                  },
                );
                
                if (validationResult.success) {
                  await tx.kycVerification.update({
                    where: { id: pendingKyc.id },
                    data: { 
                      status: "verified",
                      firstName: validationResult.data.firstName || pendingKyc.firstName,
                      lastName: validationResult.data.lastName || pendingKyc.lastName,
                    }
                  });

                  await tx.user.update({
                    where: { id: userRow.id },
                    data: { 
                      kycStatus: "verified",
                      firstname: validationResult.data.firstName || undefined,
                      lastname: validationResult.data.lastName || undefined,
                    }
                  });
                  console.log(`[Monnify Webhook] KYC automatically verified post-payment for userId=${userRow.id}`);
                } else {
                  // If it failed, mark as rejected so they know to try again
                  await tx.kycVerification.update({
                    where: { id: pendingKyc.id },
                    data: { status: "rejected" }
                  });
                  await tx.user.update({
                    where: { id: userRow.id },
                    data: { kycStatus: "not-started" }
                  });
                  console.warn(`[Monnify Webhook] KYC auto-verification failed post-payment for userId=${userRow.id}: ${validationResult.msg}`);
                }
              } catch (err) {
                console.error(`[Monnify Webhook] Auto-KYC validation system error for userId=${userRow.id}:`, err.message);
              }
            }
          }
        }
      });
    } catch (txErr) {
      // P2002 = unique constraint on transref — concurrent duplicate webhook
      if (txErr.code === "P2002") {
        return res.status(200).json({ status: "duplicate" });
      }
      throw txErr;
    }

    if (alreadyProcessed) {
      return res.status(200).json({ status: "duplicate" });
    }

    console.log(
      `[Monnify Webhook] Credited ₦${amountPaid} to userId=${userRow.id}`,
    );
    return res.status(200).json({ status: "credited" });
  } catch (err) {
    console.error("[Monnify Webhook] Error:", err.message);
    // Still return 200 so Monnify doesn't retry with a bad payload
    return res.status(200).json({ status: "error" });
  }
};
