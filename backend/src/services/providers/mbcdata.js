const axios = require("axios");

// MBC Data API Provider
// Docs: https://mbcdata.com/api
// Auth: Authorization: Token <base64(username:password)>
// Base URL: https://mbcdata.com/api

class MBCDataProvider {
  constructor(apiKey, baseUrl = "https://mbcdata.com/api") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  _headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Token ${this.apiKey}`,
    };
  }

  // ── Data ────────────────────────────────────────────────
  async purchaseData({ network, phone, dataPlan, ref }) {
    const body = {
      network: parseInt(network),
      phone,
      data_plan: dataPlan,
      bypass: false,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/data`, body, {
      headers: this._headers(),
      timeout: 30000,
    });
    return {
      status: this._mapStatus(data.status),
      msg: data.message || "",
      apiResponseLog: JSON.stringify(data),
      extras: {
        network: data.network,
        amount: data.amount,
        dataplan: data.dataplan,
        plan_type: data.plan_type,
        oldbal: data.oldbal,
        newbal: data.newbal,
        phone_number: data.phone_number,
      },
    };
  }

  // ── Airtime ─────────────────────────────────────────────
  async purchaseAirtime({ network, phone, amount, airtimeType, ref }) {
    const body = {
      network: parseInt(network),
      phone,
      plan_type: airtimeType || "VTU",
      amount: parseFloat(amount),
      bypass: false,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/topup`, body, {
      headers: this._headers(),
      timeout: 30000,
    });
    return {
      status: this._mapStatus(data.status),
      msg: data.message || "",
      apiResponseLog: JSON.stringify(data),
      extras: {
        network: data.network,
        amount: data.amount,
        discount: data.discount,
        plan_type: data.plan_type,
        oldbal: data.oldbal,
        newbal: data.newbal,
        phone_number: data.phone_number,
      },
    };
  }

  // ── Cable TV ────────────────────────────────────────────
  async purchaseCable({ cableName, cablePlan, smartCardNumber, ref }) {
    const body = {
      cablename: cableName,
      cableplan: cablePlan,
      smart_card_number: smartCardNumber,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/cable`, body, {
      headers: this._headers(),
      timeout: 30000,
    });
    return {
      status: this._mapStatus(data.status),
      msg: data.message || "",
      apiResponseLog: JSON.stringify(data),
      extras: {
        cablename: data.cablename,
        cableplan: data.cableplan,
        amount: data.amount,
        smart_card_number: data.smart_card_number,
        oldbal: data.oldbal,
        newbal: data.newbal,
      },
    };
  }

  // ── IUC / Smart Card Verification ──────────────────────
  async verifyIUC({ iuc, cable }) {
    const url = `${this.baseUrl}/cable/cable-validation?iuc=${encodeURIComponent(iuc)}&cable=${cable}`;
    const { data } = await axios.get(url, {
      headers: this._headers(),
      timeout: 15000,
    });
    return {
      status: this._mapStatus(data.status),
      customer: { name: data.name || null },
      apiResponseLog: JSON.stringify(data),
    };
  }

  // ── Electricity ─────────────────────────────────────────
  async purchaseElectricity({ disco, meterType, meterNumber, amount, bypass, ref }) {
    const body = {
      disco: parseInt(disco),
      meter_type: meterType,
      meter_number: meterNumber,
      amount: parseFloat(amount),
      bypass: bypass !== undefined ? bypass : false,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/bill`, body, {
      headers: this._headers(),
      timeout: 30000,
    });
    return {
      status: this._mapStatus(data.status),
      msg: data.message || "",
      token: data.token || null,
      apiResponseLog: JSON.stringify(data),
      extras: {
        disco_name: data.disco_name,
        charges: data.charges,
        meter_number: data.meter_number,
        meter_type: data.meter_type,
        oldbal: data.oldbal,
        newbal: data.newbal,
      },
    };
  }

  // ── Meter Verification ──────────────────────────────────
  async verifyMeter({ meterNumber, disco, meterType }) {
    const url = `${this.baseUrl}/bill/bill-validation?meter_number=${encodeURIComponent(meterNumber)}&disco=${disco}&meter_type=${meterType}`;
    const { data } = await axios.get(url, {
      headers: this._headers(),
      timeout: 15000,
    });
    return {
      status: this._mapStatus(data.status),
      customer: { name: data.name || null },
      apiResponseLog: JSON.stringify(data),
    };
  }

  // ── Exam / Result Checker ───────────────────────────────
  async purchaseExam({ exam, quantity, ref }) {
    const body = {
      exam: parseInt(exam),
      quantity: parseInt(quantity),
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/exam`, body, {
      headers: this._headers(),
      timeout: 30000,
    });
    const pins = data.pin
      ? data.pin.split("\n").filter(Boolean).map((entry) => {
          const [pin, serial] = entry.split("<=>").map((s) => s?.trim());
          return { pin: pin || entry, serial: serial || "" };
        })
      : [];
    return {
      status: this._mapStatus(data.status),
      msg: data.message || "",
      pins,
      apiResponseLog: JSON.stringify(data),
    };
  }

  // ── Bulk SMS ────────────────────────────────────────────
  async sendBulkSms({ sender, number, message, ref }) {
    const body = {
      sender: sender || "API",
      number,
      message,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/bulksms`, body, {
      headers: this._headers(),
      timeout: 30000,
    });
    return {
      status: this._mapStatus(data.status),
      msg: data.message || "",
      apiResponseLog: JSON.stringify(data),
      extras: {
        correct_number: data.correct_number,
        wrong_number: data.wrong_number,
        total_number: data.total_number,
        total_correct_number: data.total_correct_number,
        total_wrong_number: data.total_wrong_number,
        sender_name: data.sender_name,
      },
    };
  }

  // ── Data Card ───────────────────────────────────────────
  async purchaseDataCard({ network, planType, quantity, cardName, ref }) {
    const body = {
      network: parseInt(network),
      plan_type: parseInt(planType),
      quantity: parseInt(quantity),
      card_name: cardName,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/data_card`, body, {
      headers: this._headers(),
      timeout: 30000,
    });
    const rawSerials = data.serial ? String(data.serial).split(",").map((s) => s.trim()) : [];
    const rawPins = data.pin ? String(data.pin).split(",").map((p) => p.trim()) : [];
    const cards = rawSerials.map((serial, i) => ({ serial, pin: rawPins[i] || "" }));
    return {
      status: this._mapStatus(data.status),
      msg: data.message || "",
      cards,
      loadPin: data.load_pin || null,
      checkBalance: data.check_balance || null,
      apiResponseLog: JSON.stringify(data),
    };
  }

  // ── Recharge Card ──────────────────────────────────────
  async purchaseRechargeCard({ network, planType, quantity, cardName, ref }) {
    const body = {
      network: parseInt(network),
      plan_type: parseInt(planType),
      quantity: parseInt(quantity),
      card_name: cardName,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/recharge_card`, body, {
      headers: this._headers(),
      timeout: 30000,
    });
    const rawSerials = data.serial ? String(data.serial).split(",").map((s) => s.trim()) : [];
    const rawPins = data.pin ? String(data.pin).split(",").map((p) => p.trim()) : [];
    const cards = rawSerials.map((serial, i) => ({ serial, pin: rawPins[i] || "" }));
    return {
      status: this._mapStatus(data.status),
      msg: data.message || "",
      cards,
      loadPin: data.load_pin || null,
      checkBalance: data.check_balance || null,
      apiResponseLog: JSON.stringify(data),
    };
  }

  // ── Helpers ─────────────────────────────────────────────
  _mapStatus(s) {
    const status = String(s || "").toLowerCase();
    if (["successful", "success", "delivered"].includes(status)) return "success";
    if (["processing", "process", "pending"].includes(status)) return "processing";
    return "fail";
  }
}

module.exports = MBCDataProvider;
