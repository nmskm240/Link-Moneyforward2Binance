import axiosBase from 'axios';

export async function USDJPY() {
    const axios = axiosBase.create({
        baseURL: process.env.ALPHA_VANTAGE_URL,
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        responseType: 'json'
    });
    const res = await axios.get("/query", {
        params: {
            function: "FX_INTRADAY",
            from_symbol: "USD",
            to_symbol: "JPY",
            interval: "5min",
            apikey: process.env.ALPHA_VANTAGE_API_KEY
        }
    });
    const priceDetail = Object.entries(res.data["Time Series FX (5min)"])[0];
    return parseFloat(priceDetail[1]["4. close"]);
}