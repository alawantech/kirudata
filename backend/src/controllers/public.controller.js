/**
 * Public settings — no authentication required
 * Returns only safe, public-facing fields
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findFirst({
      select: {
        sitename: true,
        sitetitle: true,
        sitedesc: true,
        siteurl: true,
        address: true,
        logoUrl: true,
        faviconUrl: true,
        phone: true,
        email: true,
        whatsapp: true,
        telegram: true,
        facebook: true,
        instagram: true,
        twitter: true,
        bankName: true,
        accountName: true,
        accountNo: true,
        cableFee: true,
        electricityFee: true,
        walletFundingFeePercent: true,
        walletFundingFeeCap: true,
        referralBonusPercent: true,
      },
    });
    return res.json({
      status: "success",
      data: { settings: settings || {} },
    });
  } catch (e) {
    return res.status(500).json({ status: "error", msg: "Failed." });
  }
};
