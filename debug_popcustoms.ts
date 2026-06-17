
import crypto from "crypto";

const apiKey = process.env.POPCUSTOMS_API_KEY;
const storeId = process.env.POPCUSTOMS_STORE_ID;
const account = process.env.POPCUSTOMS_ACCOUNT;
const password = process.env.POPCUSTOMS_PASSWORD;

async function fetchStoreInfo() {
  if (!apiKey || !storeId || !account || !password) {
    console.error("Missing POPCustoms credentials in environment variables.");
    return;
  }

  try {
    // 1. Login
    const loginRes = await fetch("https://i.popcustoms.com/api/v1/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, password }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.data?.token) {
      console.error("POPCustoms login failed", loginData);
      return;
    }

    const token = loginData.data.token;

    // 2. Fetch Store Info
    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}`;
    const response = await fetch(popCustomsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("Store Info:", JSON.stringify(data, null, 2));

  } catch (error) {
    console.error("Error fetching store info:", error);
  }
}

fetchStoreInfo();
