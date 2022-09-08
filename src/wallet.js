import { Spot } from '@binance/connector'
import * as FX from "./fx.js";

export class Wallet {
    constructor(margin, saving, spot) {
        this.margin = margin;
        this.saving = saving;
        this.spot = spot;
    }

    static async load() {
        const client = new Spot(process.env.BINANCE_API_KEY, process.env.BINANCE_SECRET_KEY);
        const saving = parseFloat((await client.savingsAccount()).data.totalAmountInBTC);
        const margin = parseFloat((await client.marginAccount()).data.totalNetAssetOfBtc);
        const spot = parseFloat((await client.userAsset()).data.reduce((prev, current) => {
            return { btcValuation: parseFloat(current.btcValuation) + parseFloat(prev.btcValuation) };
        }, { btcValuation: 0 }).btcValuation);
        return new Wallet(margin, saving, spot);
    }

    async toJPYPrice() {
        const client = new Spot(process.env.BINANCE_API_KEY, process.env.BINANCE_SECRET_KEY);
        const BTCUSDT = parseFloat((await client.tickerPrice("BTCUSDT")).data.price)
        const USDJPY = await FX.USDJPY();
        const BTCJPY = BTCUSDT * USDJPY;
        return new Wallet(this.margin * BTCJPY, this.saving * BTCJPY, this.spot * BTCJPY);
    }
}