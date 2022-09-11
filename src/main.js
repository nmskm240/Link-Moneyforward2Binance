import { Wallet } from "./wallet.js";
import * as MF from "./moneyforward.js";
import * as dotenv from "dotenv";
import functions from'@google-cloud/functions-framework';

dotenv.config();

functions.http('synchronize', async (req, res) =>  {
    const wallet = await (await Wallet.load()).toJPYPrice();
    await MF.login();
    await MF.updateWallet("Binance", wallet);
    await MF.logout();
    res.send("complite!");
});

