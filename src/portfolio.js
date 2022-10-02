import { Spot } from '@binance/connector'
import axiosBase from 'axios';

export async function load() {
    const spotAssets = await getSpotAssets();
    const savingAssets = await getSavingAssets();
    const assets = [].concat(spotAssets, savingAssets);
    return new Portfolio(assets);
}

async function getSavingAssets() {
    const client = new Spot(process.env.BINANCE_API_KEY, process.env.BINANCE_SECRET_KEY);
    const assets = (await client.savingsAccount()).data.positionAmountVos;
    const BTCJPY = await Rate.BTCJPY();
    return assets.map((asset) => {
        const name = `Saving-${asset.asset}`;
        const amount = asset.amountInBTC * BTCJPY;
        return new Asset(name, amount);
    });
}

async function getSpotAssets() {
    const client = new Spot(process.env.BINANCE_API_KEY, process.env.BINANCE_SECRET_KEY);
    const assets = (await client.userAsset()).data;
    const BTCJPY = await Rate.BTCJPY();
    return assets.map((asset) => {
        const name = asset.asset;
        const amount = parseFloat(asset.btcValuation) * BTCJPY;
        return new Asset(name, amount);
    });
}

class Rate {
    static async BTCJPY() {
        const usdjpy = await this.USDJPY();
        const btcusdt = await this.BTCUSDT();
        return btcusdt * usdjpy;
    }

    static async BTCUSDT() {
        const client = new Spot(process.env.BINANCE_API_KEY, process.env.BINANCE_SECRET_KEY);
        return parseFloat((await client.tickerPrice("BTCUSDT")).data.price)
    }
    static async USDJPY() {
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
}

class Portfolio {
    constructor(assets) {
        this.assets = assets;
    }
}

class Asset {
    constructor(name, amount) {
        this.name = name;
        this.amount = amount;
    }
}