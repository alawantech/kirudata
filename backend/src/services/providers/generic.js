const axios = require("axios");

// Generic API Provider
// Handles: direct_token, basic, token auth types
// Used for: dorosub.com, legitdataway.com, kirudata.com, n3tdata247.com, etc.

class GenericProvider {
  constructor(apiKey, authType = "direct_token") {
    this.apiKey = apiKey;
    this.authType = authType;
  }

  // For basic auth: exchange credentials for AccessToken
  async _getBasicToken(host) {
    const userUrl = host.replace(/\/api\/(data|airtime|cable|bill|exam|bulksms|data_card|recharge_card)\/?$/, "/api/user/");
    const { data } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${this.apiKey}` },
      timeout: 15000,
    });
    if (!data.AccessToken) throw new Error("Basic auth failed: no AccessToken");
    return data.AccessToken;
  }

  _headers(token) {
    if (this.authType === "basic" || this.authType === "subwallet") {
      return { "Content-Type": "application/json", Authorization: `Token ${token}` };
    }
    // direct_token uses static API key
    return { "Content-Type": "application/json", Authorization: `Token ${this.apiKey}` };
  }

  async _getAuth(host) {
    if (this.authType === "basic") {
      const token = await this._getBasicToken(host);
      return this._headers(token);
    }
    return this._headers();
  }

  // ── Data ────────────────────────────────────────────────
  async purchaseData({ host, network, phone, dataPlan, ref }) {
    const headers = await this._getAuth(host);
    const body = { network, phone, bypass: false, "request-id": ref, data_plan: dataPlan };
    const { data } = await axios.post(host, body, { headers, timeout: 30000 });
    return this._interpret(data);
  }

  // ── Airtime ─────────────────────────────────────────────
  async purchaseAirtime({ host, network, phone, amount, airtimeType, ref }) {
    const headers = await this._getAuth(host);
    const body = { network, amount, phone, bypass: false, "request-id": ref, plan_type: airtimeType };
    const { data } = await axios.post(host, body, { headers, timeout: 30000 });
    return this._interpret(data);
  }

  // ── Cable TV ────────────────────────────────────────────
  async purchaseCable({ host, cableName, cablePlan, smartCardNumber, ref }) {
    const headers = await this._getAuth(host);
    const body = { cablename: cableName, cableplan: cablePlan, smart_card_number: smartCardNumber, "request-id": ref };
    const { data } = await axios.post(host, body, { headers, timeout: 30000 });
    return this._interpret(data);
  }

  // ── IUC Verification ───────────────────────────────────
  async verifyIUC({ host, iuc, cable }) {
    const headers = await this._getAuth(host);
    const url = `${host}?iuc=${encodeURIComponent(iuc)}&cable=${cable}`;
    const { data } = await axios.get(url, { headers, timeout: 15000 });
    return { status: "success", customer: data, apiResponseLog: JSON.stringify(data) };
  }

  // ── Electricity ─────────────────────────────────────────
  async purchaseElectricity({ host, disco, meterType, meterNumber, amount, ref }) {
    const headers = await this._getAuth(host);
    const body = { disco, meter_type: meterType, meter_number: meterNumber, amount, bypass: false, "request-id": ref };
    const { data } = await axios.post(host, body, { headers, timeout: 30000 });
    return this._interpret(data);
  }

  // ── Meter Verification ──────────────────────────────────
  async verifyMeter({ host, meterNumber, disco, meterType }) {
    const headers = await this._getAuth(host);
    const url = `${host}?meter_number=${encodeURIComponent(meterNumber)}&disco=${disco}&meter_type=${meterType}`;
    const { data } = await axios.get(url, { headers, timeout: 15000 });
    return { status: "success", customer: data, apiResponseLog: JSON.stringify(data) };
  }

  // ── Exam ────────────────────────────────────────────────
  async purchaseExam({ host, exam, quantity, ref }) {
    const headers = await this._getAuth(host);
    const { data } = await axios.post(host, { exam, quantity, "request-id": ref }, { headers, timeout: 30000 });
    const result = this._interpret(data);
    if (data?.pin) {
      result.pins = data.pin.split("\n").filter(Boolean).map((entry) => {
        const [pin, serial] = entry.split("<=>").map((s) => s?.trim());
        return { pin: pin || entry, serial: serial || "" };
      });
    }
    return result;
  }

  // ── Bulk SMS ────────────────────────────────────────────
  async sendBulkSms({ host, sender, number, message, ref }) {
    const headers = await this._getAuth(host);
    const { data } = await axios.post(host, { sender: sender || "API", number, message, "request-id": ref }, { headers, timeout: 30000 });
    return this._interpret(data);
  }

  // ── Data Card ───────────────────────────────────────────
  async purchaseDataCard({ host, network, planType, quantity, cardName, ref }) {
    const headers = await this._getAuth(host);
    const { data } = await axios.post(host, { network, plan_type: String(planType), quantity, card_name: cardName, "request-id": ref }, { headers, timeout: 30000 });
    const result = this._interpret(data);
    const rawSerials = data.serial ? String(data.serial).split(",").map((s) => s.trim()) : [];
    const rawPins = data.pin ? String(data.pin).split(",").map((p) => p.trim()) : [];
    result.cards = rawSerials.map((serial, i) => ({ serial, pin: rawPins[i] || "" }));
    result.loadPin = data.load_pin || null;
    result.checkBalance = data.check_balance || null;
    return result;
  }

  // ── Recharge Card ──────────────────────────────────────
  async purchaseRechargeCard({ host, network, planType, quantity, cardName, ref }) {
    const headers = await this._getAuth(host);
    const { data } = await axios.post(host, { network, plan_type: String(planType), quantity, card_name: cardName, "request-id": ref }, { headers, timeout: 30000 });
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

module.exports = GenericProvider;
