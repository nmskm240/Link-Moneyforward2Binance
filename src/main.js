import { Spot } from '@binance/connector'

const client = new Spot(process.env.API_KEY, process.env.API_SECRET);
const saving = (await client.savingsAccount()).data;
const margin = (await client.marginAccount()).data;
const spot = (await client.userAsset()).data;
const rateOfBTCUSDT = parseFloat((await client.tickerPrice("BTCUSDT")).data.price);
const totalAmountInBtcOfSpot = spot.reduce((prev, current) => {
    return { btcValuation: parseFloat(current.btcValuation) + parseFloat(prev.btcValuation) };
}, { btcValuation: 0 });
const totalAmountInBTC = totalAmountInBtcOfSpot.btcValuation + parseFloat(margin.totalNetAssetOfBtc) + parseFloat(saving.totalAmountInBTC);
const totalAmountInUSDT = totalAmountInBTC * rateOfBTCUSDT;
console.log(totalAmountInUSDT);