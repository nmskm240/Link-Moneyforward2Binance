import Puppeteer from 'puppeteer';

const browser = await Puppeteer.launch({
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
    ], headless: false
});
const page = (await browser.pages())[0];

export async function login() {
    const login = await Login.load();
    await login.emailLogin();
}

export async function logout() {
    await browser.close();
}

export async function accountUpdate(accountName, portfolio) {
    const account = await Account.load(accountName);
    await account.update(portfolio);
}

class Page {
    constructor() {
        if (this.constructor == Page) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    static async load() {
        throw new Error("Method 'load()' must be implemented.");
    }
}

class Login extends Page {
    static async load() {
        page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36");
        await page.goto("https://moneyforward.com/login", { waitUntil: 'domcontentloaded' });

        page.click('a[class="link-btn-reg"]');
        await page.waitForNavigation({ waitUntil: "load" });
        return new Login();
    }

    async emailLogin() {
        const logingMethods = await page.$$('a[class="Sbsi4vRj ssoLink"]');
        for (const method of logingMethods) {
            if (await method.$(`img[alt="email"]`)) {
                method.click();
                await page.waitForNavigation({ waitUntil: "load" });
                break;
            }
        }
        await page.type(`input[type="email"]`, process.env.MONEYFORWARD_EMAIL);
        page.click('input[type="submit"]');
        await page.waitForNavigation({ waitUntil: "load" });
        await page.type(`input[type="password"]`, process.env.MONEYFORWARD_PASSWORD);
        page.click('input[type="submit"]');
        await page.waitForNavigation({ waitUntil: "load" });
    }
}

class Account extends Page {
    constructor(assets) {
        super();
        this.assets = assets;
    }

    static async _init() {
        const body = await page.$("tbody");
        const rows = await body.$$("tr");
        const dataTable = await Promise.all(rows.map(async (row) => await row.$$("td")));
        const assets = await Promise.all(dataTable.map(async (row) => {
            const name = await (await row.at(0).getProperty("textContent")).jsonValue();
            return new AccountAsset(name);
        }));
        return new Account(assets);
    }

    static async load(name) {
        const list = await page.$('ul[class="facilities accounts-list"]');
        const elements = await list.$$('li[class="account facilities-column border-bottom-dotted"]');
        for (const element of elements) {
            const link = await element.$("a");
            const text = await (await link.getProperty('textContent')).jsonValue();
            if (text == name) {
                link.click();
                await page.waitForNavigation({ waitUntil: "load" });
                return await this._init();
            }
        }
    }

    async update(portfolio) {
        const deleteTarget = this.assets.filter((target) => {
            return !portfolio.assets.some((asset) => {
                return asset.name == target.name;
            });
        });
        console.log(this.assets);
        console.log(deleteTarget);
        while (0 < deleteTarget.length) {
            const target = deleteTarget.pop();
            const index = this.assets.findIndex((asset) => target.name == asset.name);
            this.assets.splice(index, 1)
            await target.delete(index);
        }
        for (const asset of portfolio.assets) {
            const target = this.assets.find((value) => value.name == asset.name);
            if (target) {
                const index = this.assets.findIndex((asset) => target.name == asset.name);
                await target.update(index, asset);
            } else {
                await AccountAsset.create(asset);
            }
        }
    }
}

class AccountAsset {
    constructor(name) {
        this.name = name;
    }

    static async create(asset) {
        await page.evaluate(({ asset }) => {
            const form = document.forms[1];
            form.querySelector("#user_asset_det_asset_subclass_id").value = "66";
            form.querySelector("#user_asset_det_name").value = asset.name;
            form.querySelector("#user_asset_det_value").value = asset.amount.toFixed();
            form.submit();
        }, { asset });
        await page.waitForNavigation({ waitUntil: "load" });
    }

    async delete(index) {
        index = index + 1;
        const buttons = await page.$$('a[rel="nofollow"]');
        const button = buttons[index];
        await Promise.all([
            page.once('dialog', async (dialog) => {
                await dialog.accept();
                await page.waitForNavigation({ waitUntil: "load" });
            }),
            await button.click()
        ]);
    }

    async update(index, asset) {
        index = index + 3;
        await Promise.all([
            await page.evaluate(({ asset, index }) => {
                const form = document.forms[index];
                form.querySelector("#user_asset_det_name").value = asset.name;
                form.querySelector("#user_asset_det_value").value = asset.amount.toFixed();
                form.submit();
            }, { asset, index }),
            await page.waitForNavigation({ waitUntil: "load" })
        ]);
    }
}