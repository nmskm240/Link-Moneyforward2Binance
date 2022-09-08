import Puppeteer from 'puppeteer';

const browser = await Puppeteer.launch({
    headless: false,
    slowMo: 100,
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

export async function updateWallet(targetName, wallet) {
    await loadWalletPage(targetName);
    await updateBalance("Saving", wallet.saving);
    await updateBalance("Spot", wallet.spot);
    await updateBalance("Margin", wallet.margin);
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

async function loadWalletPage(target) {
    const list = await page.$('ul[class="facilities accounts-list"]');
    const elements = await list.$$('li[class="account facilities-column border-bottom-dotted"]');
    for (const element of elements) {
        const link = await element.$("a");
        const text = await (await link.getProperty('textContent')).jsonValue();
        if (text == target) {
            link.click();
            await page.waitForNavigation({ waitUntil: "load" });
            break;
        }
    }
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

async function updateBalance(name, balance) {
    const body = await page.$("tbody");
    const rows = await body.$$("tr");
    const dataTable = await Promise.all(rows.map(async (row) => await row.$$("td")));
    for (const row of dataTable) {
        const text = await (await row.at(0).getProperty("textContent")).jsonValue();
        if (text == name) {
            const index = dataTable.indexOf(row);
            await page.evaluate(({index, balance}) => {
                const form = document.forms[3 + index];
                const input = form.querySelector("#user_asset_det_value")
                input.value = balance.toFixed();
                form.submit();
            }, {index, balance});
            await page.waitForNavigation({ waitUntil: "load" });
            break;
        }
    }
}