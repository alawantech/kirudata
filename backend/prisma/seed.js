const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Networks ────────────────────────────────────────────────────────────────
  const networks = [
    {
      networkCode: "MTN",
      name: "MTN",
      vtuId: "1",
      sharesellId: "1",
      networkStatus: "On",
      vtuStatus: "On",
      sharesellStatus: "Off",
      airtimepinStatus: "On",
      smeStatus: "On",
      sme2Status: "On",
      giftingStatus: "Off",
      corporateStatus: "Off",
      datapinStatus: "Off",
      couponStatus: "Off",
      manualOrderStatus: "Off",
    },
    {
      networkCode: "GLO",
      name: "GLO",
      vtuId: "3",
      sharesellId: "3",
      networkStatus: "On",
      vtuStatus: "On",
      sharesellStatus: "Off",
      airtimepinStatus: "Off",
      smeStatus: "On",
      sme2Status: "Off",
      giftingStatus: "Off",
      corporateStatus: "Off",
      datapinStatus: "Off",
      couponStatus: "Off",
      manualOrderStatus: "Off",
    },
    {
      networkCode: "9MOBILE",
      name: "9MOBILE",
      vtuId: "4",
      sharesellId: "4",
      networkStatus: "On",
      vtuStatus: "On",
      sharesellStatus: "Off",
      airtimepinStatus: "Off",
      smeStatus: "On",
      sme2Status: "Off",
      giftingStatus: "Off",
      corporateStatus: "Off",
      datapinStatus: "Off",
      couponStatus: "Off",
      manualOrderStatus: "Off",
    },
    {
      networkCode: "AIRTEL",
      name: "AIRTEL",
      vtuId: "2",
      sharesellId: "2",
      networkStatus: "On",
      vtuStatus: "On",
      sharesellStatus: "Off",
      airtimepinStatus: "Off",
      smeStatus: "On",
      sme2Status: "Off",
      giftingStatus: "Off",
      corporateStatus: "Off",
      datapinStatus: "Off",
      couponStatus: "Off",
      manualOrderStatus: "Off",
    },
  ];

  for (const net of networks) {
    const e = await prisma.network.findFirst({ where: { name: net.name } });
    if (!e) await prisma.network.create({ data: net });
  }
  console.log("Networks seeded");

  const [mtn, glo, mobile9, airtel] = await Promise.all([
    prisma.network.findFirst({ where: { name: "MTN" } }),
    prisma.network.findFirst({ where: { name: "GLO" } }),
    prisma.network.findFirst({ where: { name: "9MOBILE" } }),
    prisma.network.findFirst({ where: { name: "AIRTEL" } }),
  ]);

  // ─── Airtime Discounts ────────────────────────────────────────────────────────
  const discounts = [
    {
      networkId: mtn.id,
      type: "VTU",
      buyDiscount: "3",
      userDiscount: "2",
      agentDiscount: "2.5",
      vendorDiscount: "3",
    },
    {
      networkId: mtn.id,
      type: "Share And Sell",
      buyDiscount: "5",
      userDiscount: "4",
      agentDiscount: "4.5",
      vendorDiscount: "5",
    },
    {
      networkId: glo.id,
      type: "VTU",
      buyDiscount: "3",
      userDiscount: "2",
      agentDiscount: "2.5",
      vendorDiscount: "3",
    },
    {
      networkId: glo.id,
      type: "Share And Sell",
      buyDiscount: "5",
      userDiscount: "4",
      agentDiscount: "4.5",
      vendorDiscount: "5",
    },
    {
      networkId: mobile9.id,
      type: "VTU",
      buyDiscount: "3",
      userDiscount: "2",
      agentDiscount: "2.5",
      vendorDiscount: "3",
    },
    {
      networkId: mobile9.id,
      type: "Share And Sell",
      buyDiscount: "5",
      userDiscount: "4",
      agentDiscount: "4.5",
      vendorDiscount: "5",
    },
    {
      networkId: airtel.id,
      type: "VTU",
      buyDiscount: "3",
      userDiscount: "2",
      agentDiscount: "2.5",
      vendorDiscount: "3",
    },
    {
      networkId: airtel.id,
      type: "Share And Sell",
      buyDiscount: "5",
      userDiscount: "4",
      agentDiscount: "4.5",
      vendorDiscount: "5",
    },
  ];

  for (const d of discounts) {
    const existing = await prisma.airtimeDiscount.findFirst({
      where: { networkId: d.networkId, type: d.type },
    });
    if (!existing)
      await prisma.airtimeDiscount.create({
        data: {
          ...d,
          buyDiscount: parseFloat(d.buyDiscount),
          userDiscount: parseFloat(d.userDiscount),
          agentDiscount: parseFloat(d.agentDiscount),
          vendorDiscount: parseFloat(d.vendorDiscount),
        },
      });
  }
  console.log("Airtime discounts seeded");

  // ─── Data Plans ───────────────────────────────────────────────────────────────
  const dataPlans = [
    // MTN SME
    {
      networkId: mtn.id,
      name: "500MB",
      buyingPrice: "140",
      userPrice: "145",
      agentPrice: "143",
      vendorPrice: "140",
      planCode: "SME_MTN_500MB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: mtn.id,
      name: "1GB",
      buyingPrice: "230",
      userPrice: "240",
      agentPrice: "235",
      vendorPrice: "230",
      planCode: "SME_MTN_1GB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: mtn.id,
      name: "2GB",
      buyingPrice: "455",
      userPrice: "465",
      agentPrice: "460",
      vendorPrice: "455",
      planCode: "SME_MTN_2GB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: mtn.id,
      name: "3GB",
      buyingPrice: "680",
      userPrice: "695",
      agentPrice: "690",
      vendorPrice: "680",
      planCode: "SME_MTN_3GB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: mtn.id,
      name: "5GB",
      buyingPrice: "1130",
      userPrice: "1150",
      agentPrice: "1140",
      vendorPrice: "1130",
      planCode: "SME_MTN_5GB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: mtn.id,
      name: "10GB",
      buyingPrice: "2250",
      userPrice: "2300",
      agentPrice: "2280",
      vendorPrice: "2250",
      planCode: "SME_MTN_10GB",
      type: "SME",
      validity: "30 days",
    },
    // GLO SME
    {
      networkId: glo.id,
      name: "1GB",
      buyingPrice: "230",
      userPrice: "240",
      agentPrice: "235",
      vendorPrice: "230",
      planCode: "SME_GLO_1GB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: glo.id,
      name: "2GB",
      buyingPrice: "455",
      userPrice: "465",
      agentPrice: "460",
      vendorPrice: "455",
      planCode: "SME_GLO_2GB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: glo.id,
      name: "5GB",
      buyingPrice: "1130",
      userPrice: "1150",
      agentPrice: "1140",
      vendorPrice: "1130",
      planCode: "SME_GLO_5GB",
      type: "SME",
      validity: "30 days",
    },
    // 9Mobile SME
    {
      networkId: mobile9.id,
      name: "1GB",
      buyingPrice: "230",
      userPrice: "240",
      agentPrice: "235",
      vendorPrice: "230",
      planCode: "SME_9MOBILE_1GB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: mobile9.id,
      name: "2GB",
      buyingPrice: "455",
      userPrice: "465",
      agentPrice: "460",
      vendorPrice: "455",
      planCode: "SME_9MOBILE_2GB",
      type: "SME",
      validity: "30 days",
    },
    // Airtel SME
    {
      networkId: airtel.id,
      name: "1GB",
      buyingPrice: "230",
      userPrice: "240",
      agentPrice: "235",
      vendorPrice: "230",
      planCode: "SME_AIRTEL_1GB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: airtel.id,
      name: "2GB",
      buyingPrice: "455",
      userPrice: "465",
      agentPrice: "460",
      vendorPrice: "455",
      planCode: "SME_AIRTEL_2GB",
      type: "SME",
      validity: "30 days",
    },
    {
      networkId: airtel.id,
      name: "5GB",
      buyingPrice: "1130",
      userPrice: "1150",
      agentPrice: "1140",
      vendorPrice: "1130",
      planCode: "SME_AIRTEL_5GB",
      type: "SME",
      validity: "30 days",
    },
  ];

  for (const plan of dataPlans) {
    const existing = await prisma.dataPlan.findFirst({
      where: { planCode: plan.planCode },
    });
    if (!existing) await prisma.dataPlan.create({ data: plan });
  }
  console.log("Data plans seeded");

  // ─── Cable Providers & Plans ──────────────────────────────────────────────────
  const cableProviders = [
    { cableCode: "gotv", name: "GOTV", status: "On" },
    { cableCode: "dstv", name: "DSTV", status: "On" },
    { cableCode: "startimes", name: "STARTIMES", status: "On" },
  ];
  for (const p of cableProviders) {
    const e = await prisma.cableProvider.findFirst({
      where: { cableCode: p.cableCode },
    });
    if (!e) await prisma.cableProvider.create({ data: p });
  }

  const [gotv, dstv, startimes] = await Promise.all([
    prisma.cableProvider.findFirst({ where: { cableCode: "gotv" } }),
    prisma.cableProvider.findFirst({ where: { cableCode: "dstv" } }),
    prisma.cableProvider.findFirst({ where: { cableCode: "startimes" } }),
  ]);

  const cablePlans = [
    {
      providerId: gotv.id,
      name: "GOTV Jinja",
      buyingPrice: "1575",
      userPrice: "1600",
      agentPrice: "1590",
      vendorPrice: "1580",
      planCode: "gotv-jinja",
      type: "GOTV",
      validity: "30 days",
    },
    {
      providerId: gotv.id,
      name: "GOTV Jolli",
      buyingPrice: "2460",
      userPrice: "2500",
      agentPrice: "2480",
      vendorPrice: "2460",
      planCode: "gotv-jolli",
      type: "GOTV",
      validity: "30 days",
    },
    {
      providerId: gotv.id,
      name: "GOTV Max",
      buyingPrice: "4850",
      userPrice: "4900",
      agentPrice: "4875",
      vendorPrice: "4850",
      planCode: "gotv-max",
      type: "GOTV",
      validity: "30 days",
    },
    {
      providerId: gotv.id,
      name: "GOTV Supa",
      buyingPrice: "6200",
      userPrice: "6250",
      agentPrice: "6225",
      vendorPrice: "6200",
      planCode: "gotv-supa",
      type: "GOTV",
      validity: "30 days",
    },
    {
      providerId: dstv.id,
      name: "DStv Padi",
      buyingPrice: "2950",
      userPrice: "3000",
      agentPrice: "2975",
      vendorPrice: "2950",
      planCode: "dstv-padi",
      type: "DSTV",
      validity: "30 days",
    },
    {
      providerId: dstv.id,
      name: "DStv Yanga",
      buyingPrice: "3950",
      userPrice: "4000",
      agentPrice: "3975",
      vendorPrice: "3950",
      planCode: "dstv-yanga",
      type: "DSTV",
      validity: "30 days",
    },
    {
      providerId: dstv.id,
      name: "DStv Confam",
      buyingPrice: "7900",
      userPrice: "7950",
      agentPrice: "7925",
      vendorPrice: "7900",
      planCode: "dstv-confam",
      type: "DSTV",
      validity: "30 days",
    },
    {
      providerId: dstv.id,
      name: "DStv Compact",
      buyingPrice: "14500",
      userPrice: "14600",
      agentPrice: "14550",
      vendorPrice: "14500",
      planCode: "dstv-compact",
      type: "DSTV",
      validity: "30 days",
    },
    {
      providerId: startimes.id,
      name: "StarTimes Nova",
      buyingPrice: "1200",
      userPrice: "1250",
      agentPrice: "1225",
      vendorPrice: "1200",
      planCode: "startimes-nova",
      type: "STARTIMES",
      validity: "30 days",
    },
    {
      providerId: startimes.id,
      name: "StarTimes Basic",
      buyingPrice: "2000",
      userPrice: "2050",
      agentPrice: "2025",
      vendorPrice: "2000",
      planCode: "startimes-basic",
      type: "STARTIMES",
      validity: "30 days",
    },
    {
      providerId: startimes.id,
      name: "StarTimes Smart",
      buyingPrice: "2800",
      userPrice: "2850",
      agentPrice: "2825",
      vendorPrice: "2800",
      planCode: "startimes-smart",
      type: "STARTIMES",
      validity: "30 days",
    },
  ];
  for (const plan of cablePlans) {
    const existing = await prisma.cablePlan.findFirst({
      where: { planCode: plan.planCode },
    });
    if (!existing) await prisma.cablePlan.create({ data: plan });
  }
  console.log("Cable providers and plans seeded");

  // ─── Electricity Providers ────────────────────────────────────────────────────
  const elecProviders = [
    {
      electricityCode: "ikeja-electric",
      name: "Ikeja Electric",
      abbreviation: "IKEDC",
      status: "On",
    },
    {
      electricityCode: "eko-electric",
      name: "Eko Electric",
      abbreviation: "EKEDC",
      status: "On",
    },
    {
      electricityCode: "kano-electric",
      name: "Kano Electric",
      abbreviation: "KEDCO",
      status: "On",
    },
    {
      electricityCode: "ph-electric",
      name: "Port Harcourt Electric",
      abbreviation: "PHED",
      status: "On",
    },
    {
      electricityCode: "jos-electric",
      name: "Jos Electric",
      abbreviation: "JED",
      status: "On",
    },
    {
      electricityCode: "ibadan-electric",
      name: "Ibadan Electric",
      abbreviation: "IBEDC",
      status: "On",
    },
    {
      electricityCode: "kaduna-electric",
      name: "Kaduna Electric",
      abbreviation: "KAEDCO",
      status: "On",
    },
    {
      electricityCode: "abuja-electric",
      name: "Abuja Electric (AEDC)",
      abbreviation: "AEDC",
      status: "On",
    },
    {
      electricityCode: "enugu-electric",
      name: "Enugu Electric",
      abbreviation: "EEDC",
      status: "On",
    },
    {
      electricityCode: "benin-electric",
      name: "Benin Electric",
      abbreviation: "BEDC",
      status: "On",
    },
    {
      electricityCode: "yola-electric",
      name: "Yola Electric",
      abbreviation: "YEDC",
      status: "On",
    },
  ];
  for (const p of elecProviders) {
    const existing = await prisma.electricityProvider.findFirst({
      where: { electricityCode: p.electricityCode },
    });
    if (!existing) await prisma.electricityProvider.create({ data: p });
  }
  console.log("Electricity providers seeded");

  // ─── Exam Providers ───────────────────────────────────────────────────────────
  const examProviders = [
    {
      examCode: "waec",
      name: "WAEC",
      price: 3900,
      buyingPrice: 3850,
      status: "On",
    },
    {
      examCode: "neco",
      name: "NECO",
      price: 1000,
      buyingPrice: 950,
      status: "On",
    },
    {
      examCode: "nabteb",
      name: "NABTEB",
      price: 1000,
      buyingPrice: 950,
      status: "On",
    },
  ];
  for (const p of examProviders) {
    const existing = await prisma.examProvider.findFirst({
      where: { examCode: p.examCode },
    });
    if (!existing) await prisma.examProvider.create({ data: p });
  }
  console.log("Exam providers seeded");

  // ─── API Configs (all with empty placeholder values) ─────────────────────────
  const apiConfigNames = [
    // Airtime VTU providers
    "mtnVtuProvider",
    "mtnVtuKey",
    "mtnVtuToken",
    "gloVtuProvider",
    "gloVtuKey",
    "gloVtuToken",
    "9mobileVtuProvider",
    "9mobileVtuKey",
    "9mobileVtuToken",
    "airtelVtuProvider",
    "airtelVtuKey",
    "airtelVtuToken",
    // Airtime Share & Sell providers
    "mtnShareProvider",
    "mtnShareKey",
    "gloShareProvider",
    "gloShareKey",
    "9mobileShareProvider",
    "9mobileShareKey",
    "airtelShareProvider",
    "airtelShareKey",
    // Data SME providers
    "mtnSmeProvider",
    "mtnSmeApi",
    "gloSmeProvider",
    "gloSmeApi",
    "9mobileSmeProvider",
    "9mobileSmeApi",
    "airtelSmeProvider",
    "airtelSmeApi",
    // Data SME2 providers
    "mtnSme2Provider",
    "mtnSme2Api",
    "gloSme2Provider",
    "gloSme2Api",
    "9mobileSme2Provider",
    "9mobileSme2Api",
    "airtelSme2Provider",
    "airtelSme2Api",
    // Data Gifting providers
    "mtnGiftingProvider",
    "mtnGiftingApi",
    "gloGiftingProvider",
    "gloGiftingApi",
    "9mobileGiftingProvider",
    "9mobileGiftingApi",
    "airtelGiftingProvider",
    "airtelGiftingApi",
    // Data Corporate providers
    "mtnCorporateProvider",
    "mtnCorporateApi",
    "gloCorporateProvider",
    "gloCorporateApi",
    "9mobileCorporateProvider",
    "9mobileCorporateApi",
    "airtelCorporateProvider",
    "airtelCorporateApi",
    // Data Coupon providers
    "mtnCouponProvider",
    "mtnCouponApi",
    "gloCouponProvider",
    "gloCouponApi",
    "9mobileCouponProvider",
    "9mobileCouponApi",
    "airtelCouponProvider",
    "airtelCouponApi",
    // Cable TV
    "cableVerificationProvider",
    "cableProvider",
    // Electricity
    "meterVerificationProvider",
    "meterProvider",
    // Exam
    "examProvider",
    // Payment gateways
    "paystackSecretKey",
    "paystackPublicKey",
    "monnifyApiKey",
    "monnifySecretKey",
    "monnifyContractCode",
    "monnifyBaseUrl",
    "payvesselApiKey",
    "payvesselSecretKey",
    // Misc
    "smsProvider",
    "smsApiKey",
    "smsFrom",
    "smtpHost",
    "smtpPort",
    "smtpUser",
    "smtpPass",
    "smtpFrom",
    // Data Provider plan routing (slug of active DataProvider per type)
    "smeDataProvider",
    "sme2DataProvider",
    "giftingDataProvider",
    "corporateDataProvider",
    "couponDataProvider",
    "awoofDataProvider",
  ];
  for (const name of apiConfigNames) {
    await prisma.apiConfig.upsert({
      where: { name },
      update: {},
      create: { name, value: "" },
    });
  }
  console.log("API configs seeded");

  // ─── Site Settings ────────────────────────────────────────────────────────────
  const siteSetting = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (!siteSetting) {
    await prisma.siteSetting.create({
      data: {
        id: 1,
        sitename: "GUCHOR DATA",
        siteurl: "http://localhost:3000",
        agentUpgradeFee: "5000",
        vendorUpgradeFee: "10000",
        airtimedaily: "50000",
      },
    });
    console.log("Site settings seeded");
  }

  // ─── Default Admin ────────────────────────────────────────────────────────────
  const adminExists = await prisma.admin.findUnique({
    where: { username: "admin" },
  });
  if (!adminExists) {
    const hashedPass = await bcrypt.hash("Admin@123", 12);
    await prisma.admin.create({
      data: {
        name: "Super Admin",
        role: 1,
        username: "admin",
        token: hashedPass,
        status: 1,
      },
    });
    console.log("Admin user seeded (username: admin, password: Admin@123)");
  }

  // ─── Default Site Settings ───────────────────────────────────────────────────
  const settingsExist = await prisma.siteSetting.count();
  if (settingsExist === 0) {
    await prisma.siteSetting.create({
      data: {
        sitename: "GUCHOR DATA",
        sitedesc:
          "Nigeria's most reliable VTU platform. Buy airtime, data, pay bills and more.",
      },
    });
    console.log("Site settings seeded.");
  }

  console.log("Database seeding complete!");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
