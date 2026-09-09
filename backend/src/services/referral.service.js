const prisma = require("../config/prisma");

async function getReferralBonusPercent() {
  const settings = await prisma.siteSetting.findFirst();
  return parseFloat(settings?.referralBonusPercent || "0");
}

async function hasReferralBonusBeenClaimed(refereeId) {
  const existing = await prisma.referralLog.findFirst({
    where: { refereeId, type: "first_deposit" },
  });
  return !!existing;
}

async function processFirstDepositBonus({ refereeId }) {
  try {
    const referee = await prisma.user.findUnique({
      where: { id: refereeId },
      select: { referral: true, firstname: true, lastname: true },
    });
    if (!referee || !referee.referral) return;

    const alreadyClaimed = await hasReferralBonusBeenClaimed(refereeId);
    if (alreadyClaimed) return;

    const bonusPercent = await getReferralBonusPercent();
    if (bonusPercent <= 0) return;

    const referrer = await prisma.user.findFirst({
      where: { phone: referee.referral },
      select: { id: true, firstname: true, lastname: true },
    });
    if (!referrer) return;
    if (referrer.id === refereeId) return;

    return { referrerId: referrer.id, referrerName: `${referrer.firstname} ${referrer.lastname}`, refereeName: `${referee.firstname} ${referee.lastname}`, bonusPercent };
  } catch (err) {
    console.error("[Referral] processFirstDepositBonus error:", err.message);
    return null;
  }
}

async function creditReferralBonus({ referrerId, refereeId, amount, bonusPercent }) {
  const bonus = amount * (bonusPercent / 100);
  if (bonus <= 0) return;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: referrerId },
      data: { refWallet: { increment: bonus } },
    });

    await tx.referralLog.create({
      data: {
        referrerId,
        refereeId,
        type: "first_deposit",
        amount: bonus,
        service: "first_deposit",
        note: `Referral bonus: ${bonusPercent}% of first deposit ₦${amount.toFixed(2)}`,
      },
    });
  });

  return bonus;
}

async function getReferralStats(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, refWallet: true },
  });
  if (!user) return null;

  const referralCount = await prisma.user.count({
    where: { referral: user.phone },
  });

  const totalEarned = await prisma.referralLog.aggregate({
    where: { referrerId: userId },
    _sum: { amount: true },
  });

  const recentReferrals = await prisma.user.findMany({
    where: { referral: user.phone },
    select: { firstname: true, lastname: true, phone: true, regDate: true, wallet: true },
    orderBy: { regDate: "desc" },
    take: 10,
  });

  const bonusPercent = await getReferralBonusPercent();

  return {
    referralCode: user.phone,
    referralCount,
    refWallet: user.refWallet,
    totalEarned: totalEarned._sum.amount || 0,
    recentReferrals,
    bonusPercent,
  };
}

module.exports = {
  getReferralBonusPercent,
  hasReferralBonusBeenClaimed,
  processFirstDepositBonus,
  creditReferralBonus,
  getReferralStats,
};
