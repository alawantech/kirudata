const axios = require("axios");

// mySubwallet API Provider
// Base URL: https://api.mysubwallet.ng/api
// Auth: 2-step Basic auth → POST /api/user with Basic header → get AccessToken → use Token header
// mySubwallet uses integer network IDs: MTN=1, Airtel=2, GLO=3, 9mobile=4

const NETWORK_MAP = {
  MTN: 1, mtn: 1,
  Airtel: 2, airtel: 2, AIRTEL: 2,
  GLO: 3, glo: 3, Glo: 3,
  "9mobile": 4, "9MOBILE": 4, Etisalat: 4, etisalat: 4,
};

const CABLE_MAP = { GOTV: 1, DSTV: 2, STARTIMES: 3 };

const DISCO_MAP = {
  "ikeja-electric": 1, "eko-electric": 2, "kano-electric": 3,
  "ph-electric": 4, "jos-electric": 5, "ibadan-electric": 6,
  "kaduna-electric": 7, "abuja-electric": 8, "benin-electric": 9,
  "enugu-electric": 10, "aba-electric": 11, "yola-electric": 12,
};

class MySubwalletProvider {
  constructor(apiKey, baseUrl = "https://api.mysubwallet.ng/api") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // 2-step Basic auth: exchange credentials for AccessToken
  async _getToken(serviceUrl) {
    const userUrl = serviceUrl.replace(/\/api\/(data|airtime|cable|bill|exam|bulksms|data_card|recharge_card)\/?$/, "/api/user");
    const { data } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${this.apiKey}` },
      timeout: 15000,
    });
    if (!data.AccessToken) throw new Error("mySubwallet auth failed: no AccessToken");
    return data.AccessToken;
  }

  _headers(token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    };
  }

  // ── Data ────────────────────────────────────────────────
  async purchaseData({ network, phone, dataPlan, ref, serviceUrl }) {
    const networkId = NETWORK_MAP[network] ?? parseInt(network) ?? 1;
    const token = await this._getToken(serviceUrl);
    const { data } = await axios.post(serviceUrl, {
      network: networkId, phone, data_plan: dataPlan,
      bypass: false, "request-id": ref,
    }, { headers: this._headers(token), timeout: 30000 });
    return this._interpret(data);
  }

  // ── Airtime ─────────────────────────────────────────────
  async purchaseAirtime({ network, phone, amount, airtimeType, ref, serviceUrl }) {
    const networkId = NETWORK_MAP[network] ?? parseInt(network) ?? 1;
    const token = await this._getToken(serviceUrl);
    const { data } = await axios.post(serviceUrl, {
      network: networkId, phone, plan_type: airtimeType || "VTU",
      amount, bypass: false, "request-id": ref,
    }, { headers: this._headers(token), timeout: 30000 });
    return this._interpret(data);
  }

  // ── Cable TV ────────────────────────────────────────────
  async purchaseCable({ cableName, cablePlan, smartCardNumber, ref, serviceUrl }) {
    const token = await this._getToken(serviceUrl);
    const { data } = await axios.post(serviceUrl, {
      cablename: cableName, cableplan: cablePlan,
      smart_card_number: smartCardNumber, "request-id": ref,
    }, { headers: this._headers(token), timeout: 30000 });
    return this._interpret(data);
  }

  // ── IUC / Smart Card Verification ──────────────────────
  async verifyIUC({ iuc, cable, serviceUrl }) {
    const cableId = CABLE_MAP[cable] || CABLE_MAP[String(cable).toUpperCase()];
    if (!cableId) return { status: "fail", msg: `Unknown cable provider: ${cable}` };
    const token = await this._getToken(serviceUrl);
    const url = `${serviceUrl}?iuc=${encodeURIComponent(iuc)}&cable=${cableId}`;
    const { data } = await axios.get(url, {
      headers: this._headers(token), timeout: 15000,
    });
    return { status: "success", customer: data, apiResponseLog: JSON.stringify(data) };
  }

  // ── Electricity ─────────────────────────────────────────
  async purchaseElectricity({ disco, meterType, meterNumber, amount, ref, serviceUrl }) {
    const discoId = DISCO_MAP[disco] ?? parseInt(disco) ?? 1;
    const token = await this._getToken(serviceUrl);
    const { data } = await axios.post(serviceUrl, {
      disco: discoId, meter_type: meterType, meter_number: meterNumber,
      amount, bypass: false, "request-id": ref,
    }, { headers: this._headers(token), timeout: 30000 });
    return this._interpret(data);
  }

  // ── Meter Verification ──────────────────────────────────
  async verifyMeter({ meterNumber, disco, meterType, serviceUrl }) {
    const discoId = DISCO_MAP[disco] ?? parseInt(disco) ?? 1;
    const token = await this._getToken(serviceUrl);
    const url = `${serviceUrl}?meter_number=${encodeURIComponent(meterNumber)}&disco=${discoId}&meter_type=${meterType}`;
    const { data } = await axios.get(url, {
      headers: this._headers(token), timeout: 15000,
    });
    return { status: "success", customer: data, apiResponseLog: JSON.stringify(data) };
  }

  // ── Exam ────────────────────────────────────────────────
  async purchaseExam({ exam, quantity, ref, serviceUrl }) {
    const token = await this._getToken(serviceUrl);
    const { data } = await axios.post(serviceUrl, {
      exam, quantity, "request-id": ref,
    }, { headers: this._headers(token), timeout: 30000 });
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
  async sendBulkSms({ sender, number, message, ref, serviceUrl }) {
    const token = await this._getToken(serviceUrl);
    const { data } = await axios.post(serviceUrl, {
      sender: sender || "API", number, message, "request-id": ref,
    }, { headers: this._headers(token), timeout: 30000 });
    return this._interpret(data);
  }

  // ── Data Card ───────────────────────────────────────────
  async purchaseDataCard({ network, planType, quantity, cardName, ref, serviceUrl }) {
    const networkId = NETWORK_MAP[network] ?? parseInt(network) ?? 1;
    const token = await this._getToken(serviceUrl);
    const { data } = await axios.post(serviceUrl, {
      network: networkId, plan_type: String(planType),
      quantity, card_name: cardName, "request-id": ref,
    }, { headers: this._headers(token), timeout: 30000 });
    const result = this._interpret(data);
    const rawSerials = data.serial ? String(data.serial).split(",").map((s) => s.trim()) : [];
    const rawPins = data.pin ? String(data.pin).split(",").map((p) => p.trim()) : [];
    result.cards = rawSerials.map((serial, i) => ({ serial, pin: rawPins[i] || "" }));
    result.loadPin = data.load_pin || null;
    result.checkBalance = data.check_balance || null;
    return result;
  }

  // ── Recharge Card ──────────────────────────────────────
  async purchaseRechargeCard({ network, planType, quantity, cardName, ref, serviceUrl }) {
    const networkId = NETWORK_MAP[network] ?? parseInt(network) ?? 1;
    const token = await this._getToken(serviceUrl);
    const { data } = await axios.post(serviceUrl, {
      network: networkId, plan_type: String(planType),
      quantity, card_name: cardName, "request-id": ref,
    }, { headers: this._headers(token), timeout: 30000 });
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

module.exports = MySubwalletProvider;
