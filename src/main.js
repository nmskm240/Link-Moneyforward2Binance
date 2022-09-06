import { Wallet } from "./wallet.js";
import * as dotenv from "dotenv";

dotenv.config();

const wallet = await (await Wallet.load()).toJPYPrice();
console.log(wallet);