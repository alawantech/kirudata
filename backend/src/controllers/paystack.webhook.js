const prisma = require("../config/prisma");
const crypto = require("crypto");

module.exports = async function paystackWebhook(req, res) {
  try {
    const body = req.body;
    const event = body?.event;

    if (event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = body?.data;
    if (!data) return res.sendStatus(200);

    const auth = data.authorization || {};
    const amountKobo = data.amount || 0;
    const amount = amountKobo / 100;
    const reference = data.reference || "";
    const accountNumber = auth.receiver_bank_account_number || "";
    const bankName = auth.bank || auth.sender_bank || "";
    const senderName = auth.sender_name || "";
    const narration = auth.narration || data.metadata?.narration || "";

    if (amount <= 0) return res.sendStatus(200);

    const idempotencyKey = `paystack_${reference}`;

    const existing = await prisma.transaction.findFirst({
      where: { transref: idempotencyKey },
    });
    if (existing) {
      console.log("[Paystack Webhook] Duplicate, skipping:", reference);
      return res.sendStatus(200);
    }

    let user = null;

    if (accountNumber) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { paystackWemaAccount: accountNumber },
            { paystackTitanAccount: accountNumber },
          ],
        },
      });
    }

    if (!user && reference) {
      const match = reference.match(/(?:ZDR|GCH)-(\d+)-/);
      if (match) {
        user = await prisma.user.findUnique({ where: { id: Number(match[1]) } });
      }
    }

    if (!user) {
      const metadata = data.metadata || {};
      if (metadata.email) {
        user = await prisma.user.findFirst({ where: { email: metadata.email } });
      }
    }

    if (!user) {
      console.error("[Paystack Webhook] No user found for account:", accountNumber, "ref:", reference);
      return res.sendStatus(200);
    }

    const settings = await prisma.siteSetting.findFirst();
    let fee = 0;
    if (settings) {
      const pct = parseFloat(settings.walletFundingFeePercent || "0");
      const cap = parseFloat(settings.walletFundingFeeCap || "50");
      if (pct > 0) {
        fee = Math.min(amount * (pct / 100), cap);
      }
    }
    const creditAmount = amount - fee;

    await prisma.$transaction(async (tx) => {
      const oldBal = user.wallet;
      const newBal = oldBal + creditAmount;

      await tx.user.update({
        where: { id: user.id },
        data: { wallet: { increment: creditAmount } },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          transref: idempotencyKey,
          servicename: "Wallet Funding",
          servicedesc: `Paystack ${bankName} transfer from ${senderName}${fee > 0 ? ` (fee: ₦${fee.toFixed(2)})` : ""}`,
          amount: String(creditAmount),
          status: 1,
          oldbal: String(oldBal),
          newbal: String(newBal),
          profit: fee,
          apiResponse: "PAYSTACK_WEBHOOK",
        },
      });
    });

    console.log(`[Paystack Webhook] Credited ${user.id}: ₦${creditAmount} (fee: ₦${fee}) ref: ${reference}`);

    // Fire-and-forget: process referral first-deposit bonus
    const referralService = require("../services/referral.service");
    referralService.processFirstDepositBonus({ refereeId: user.id })
      .then(async (info) => {
        if (!info) return;
        const bonus = await referralService.creditReferralBonus({
          referrerId: info.referrerId,
          refereeId: user.id,
          amount: creditAmount,
          bonusPercent: info.bonusPercent,
        });
        if (bonus) {
          console.log(`[Referral] Credited ${info.referrerName}: ₦${bonus} for referring ${info.refereeName}`);
        }
      })
      .catch((err) => console.error("[Referral] Bonus error:", err.message));

    return res.sendStatus(200);
  } catch (err) {
    console.error("[Paystack Webhook] Error:", err.message);
    return res.sendStatus(200);
  }
};
