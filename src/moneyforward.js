import Puppeteer from 'puppeteer';

const browser = await Puppeteer.launch({
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
    ], headless: false
});
const page = await browser.newPage();

export async function login() {
    await loadLoginPage();
    await selectLoginMethod("email");
    await autoCompliteForm("email", process.env.MONEYFORWARD_EMAIL);
    await autoCompliteForm("password", process.env.MONEYFORWARD_PASSWORD);
}

export async function logout() {
    await browser.close();
}

export async function accountUpdate(accountName, portfolio) {
    const account = await Account.load(accountName);
    await account.update(portfolio);
}

async function autoCompliteForm(type, text) {
    await page.type(`input[type="${type}"]`, text);
    page.click('input[type="submit"]');
    await page.waitForNavigation({ waitUntil: "load" });
}

async function loadLoginPage() {
    page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36");
    await page.goto("https://moneyforward.com/login", { waitUntil: 'domcontentloaded' });

    page.click('a[class="link-btn-reg"]');
    await page.waitForNavigation({ waitUntil: "load" });
}

async function selectLoginMethod(methodName) {
    const logingMethods = await page.$$('a[class="Sbsi4vRj ssoLink"]');
    for (const method of logingMethods) {
        if (await method.$(`img[alt="${methodName}"]`)) {
            method.click();
            await page.waitForNavigation({ waitUntil: "load" });
            break;
        }
    }
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
            const index = dataTable.indexOf(row) + 3;
            const button = row.at(3);
            return new AccountAsset(name, index, button);
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
        const deleteTargets = this.assets.filter((asset) => {
            return portfolio.assets.some((value) => {
                return asset.name != value.name;
            });
        });
        for (const target of deleteTargets) {
            await target.delete();
        }
        for (const asset of portfolio.assets) {
            const target = this.assets.find((value) => value.name == asset.name);
            if (target) {
                await target.update(asset);
            } else {
                await AccountAsset.create(asset);
            }
        }
    }
}

class AccountAsset {
    constructor(name, updateFormIndex, deleteButton) {
        this.name = name;
        this._updateFormIndex = updateFormIndex;
        this._deleteButton = deleteButton;
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

    async delete() {
        await Promise.all([
            page.once('dialog', async (dialog) => {
                await dialog.accept();
            }),
            await this._deleteButton.click()
        ]);
        await page.waitForNavigation({ waitUntil: "load" });
    }

    async update(asset) {
        await page.evaluate(({ asset }) => {
            const form = document.forms[this._updateFormIndex];
            form.querySelector("#user_asset_det_name").value = asset.name;
            form.querySelector("user_asset_det_value").value = asset.amount.toFixed();
            form.submit();
        }, { asset });
        await page.waitForNavigation({ waitUntil: "load" });
    }
}