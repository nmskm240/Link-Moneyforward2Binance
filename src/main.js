import { Wallet } from "./wallet.js";
import * as MF from "./moneyforward.js";
import * as dotenv from "dotenv";

dotenv.config();

const wallet = await (await Wallet.load()).toJPYPrice();
await MF.login();
await MF.updateWallet("Binance", wallet);
await MF.logout();
