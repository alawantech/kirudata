const axios = require("axios");

// First-sub API Provider
// Docs: https://first-sub.com/api
// Auth: 2-step Basic auth → POST /api/user → AccessToken → Token header
// Base URL: https://first-sub.com/api

class FirstSubProvider {
  constructor(apiKey, baseUrl = "https://first-sub.com/api") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  _headers(token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    };
  }

  // 2-step Basic auth: exchange credentials for AccessToken
  async _getToken() {
    const { data } = await axios.post(`${this.baseUrl}/user`, null, {
      headers: { Authorization: `Basic ${this.apiKey}` },
      timeout: 15000,
    });
    if (!data.AccessToken) throw new Error("First-sub auth failed: no AccessToken");
    return data.AccessToken;
  }

  // ── Data ────────────────────────────────────────────────
  async purchaseData({ network, phone, dataPlan, ref }) {
    const token = await this._getToken();
    const body = {
      network: parseInt(network),
      phone,
      data_plan: dataPlan,
      bypass: false,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/data`, body, {
      headers: this._headers(token),
      timeout: 30000,
    });
    return this._interpret(data);
  }

  // ── Airtime ─────────────────────────────────────────────
  async purchaseAirtime({ network, phone, amount, airtimeType, ref }) {
    const token = await this._getToken();
    const body = {
      network: parseInt(network),
      phone,
      plan_type: airtimeType || "VTU",
      amount: parseFloat(amount),
      bypass: false,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/topup`, body, {
      headers: this._headers(token),
      timeout: 30000,
    });
    return this._interpret(data);
  }

  // ── Cable TV ────────────────────────────────────────────
  async purchaseCable({ cableName, cablePlan, smartCardNumber, ref }) {
    const token = await this._getToken();
    const body = {
      cablename: cableName,
      cableplan: cablePlan,
      smart_card_number: smartCardNumber,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/cable`, body, {
      headers: this._headers(token),
      timeout: 30000,
    });
    return this._interpret(data);
  }

  // ── IUC / Smart Card Verification ──────────────────────
  async verifyIUC({ iuc, cable }) {
    const token = await this._getToken();
    const url = `${this.baseUrl}/cable/cable-validation?iuc=${encodeURIComponent(iuc)}&cable=${cable}`;
    const { data } = await axios.get(url, {
      headers: this._headers(token),
      timeout: 15000,
    });
    return { status: "success", customer: { name: data.name || null }, apiResponseLog: JSON.stringify(data) };
  }

  // ── Electricity ─────────────────────────────────────────
  async purchaseElectricity({ disco, meterType, meterNumber, amount, ref }) {
    const token = await this._getToken();
    const body = {
      disco: parseInt(disco),
      meter_type: meterType,
      meter_number: meterNumber,
      amount: parseFloat(amount),
      bypass: false,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/bill`, body, {
      headers: this._headers(token),
      timeout: 30000,
    });
    const result = this._interpret(data);
    if (data.token) result.token = data.token;
    return result;
  }

  // ── Meter Verification ──────────────────────────────────
  async verifyMeter({ meterNumber, disco, meterType }) {
    const token = await this._getToken();
    const url = `${this.baseUrl}/bill/bill-validation?meter_number=${encodeURIComponent(meterNumber)}&disco=${disco}&meter_type=${meterType}`;
    const { data } = await axios.get(url, {
      headers: this._headers(token),
      timeout: 15000,
    });
    return { status: "success", customer: { name: data.name || null }, apiResponseLog: JSON.stringify(data) };
  }

  // ── Exam / Result Checker ───────────────────────────────
  async purchaseExam({ exam, quantity, ref }) {
    const token = await this._getToken();
    const body = {
      exam: parseInt(exam),
      quantity: parseInt(quantity),
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/exam`, body, {
      headers: this._headers(token),
      timeout: 30000,
    });
    const result = this._interpret(data);
    if (data.pin) {
      result.pins = data.pin.split("\n").filter(Boolean).map((entry) => {
        const [pin, serial] = entry.split("<=>").map((s) => s?.trim());
        return { pin: pin || entry, serial: serial || "" };
      });
    }
    return result;
  }

  // ── Bulk SMS ────────────────────────────────────────────
  async sendBulkSms({ sender, number, message, ref }) {
    const token = await this._getToken();
    const body = {
      sender: sender || "API",
      number,
      message,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/bulksms`, body, {
      headers: this._headers(token),
      timeout: 30000,
    });
    return this._interpret(data);
  }

  // ── Data Card ───────────────────────────────────────────
  async purchaseDataCard({ network, planType, quantity, cardName, ref }) {
    const token = await this._getToken();
    const body = {
      network: parseInt(network),
      plan_type: parseInt(planType),
      quantity: parseInt(quantity),
      card_name: cardName,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/data_card`, body, {
      headers: this._headers(token),
      timeout: 30000,
    });
    const result = this._interpret(data);
    const rawSerials = data.serial ? String(data.serial).split(",").map((s) => s.trim()) : [];
    const rawPins = data.pin ? String(data.pin).split(",").map((p) => p.trim()) : [];
    result.cards = rawSerials.map((serial, i) => ({ serial, pin: rawPins[i] || "" }));
    result.loadPin = data.load_pin || null;
    result.checkBalance = data.check_balance || null;
    return result;
  }

  // ── Recharge Card ──────────────────────────────────────
  async purchaseRechargeCard({ network, planType, quantity, cardName, ref }) {
    const token = await this._getToken();
    const body = {
      network: parseInt(network),
      plan_type: parseInt(planType),
      quantity: parseInt(quantity),
      card_name: cardName,
      "request-id": ref,
    };
    const { data } = await axios.post(`${this.baseUrl}/recharge_card`, body, {
      headers: this._headers(token),
      timeout: 30000,
    });
    const result = this._interpret(data);
    const rawSerials = data.serial ? String(data.serial).split(",").map((s) => s.trim()) : [];
    const rawPins = data.pin ? String(data.pin).split(",").map((p) => p.trim()) : [];
    result.cards = rawSerials.map((serial, i) => ({ serial, pin: rawPins[i] || "" }));
    result.loadPin = data.load_pin || null;
    result.checkBalance = data.check_balance || null;
    return result;
  }

  // ── Response Interpreter ────────────────────────────────
  _interpret(data) {
    const apiStatus = (data?.Status || data?.status || "").toLowerCase();
    const result = { apiResponseLog: JSON.stringify(data) };
    if (["successful", "success", "delivered"].includes(apiStatus)) {
      result.status = "success";
      if (data?.token) result.token = data.token;
    } else if (["processing", "process", "pending"].includes(apiStatus)) {
      result.status = "processing";
    } else if (["failed", "fail", "error"].includes(apiStatus)) {
      result.status = "fail";
      const msg = data?.msg || data?.error?.[0] || "Transaction failed.";
      result.msg = /(balance|insufficient)/i.test(msg)
        ? "Unable to complete transaction. Please report to admin. (Error: BB)"
        : msg;
    } else {
      result.status = "fail";
      result.msg = "Transaction failed. Please try again.";
    }
    return result;
  }
}

module.exports = FirstSubProvider;
