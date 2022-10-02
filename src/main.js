import * as Portfolio from "./portfolio.js";
import * as MF from "./moneyforward.js";
import * as dotenv from "dotenv";
import functions from'@google-cloud/functions-framework';

dotenv.config();

functions.http('synchronize', async (req, res) =>  {
    const portfolio = await Portfolio.load();
    await MF.login();
    await MF.accountUpdate("Binance", portfolio);
    await MF.logout();
    res.send("complite!");
});