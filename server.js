import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import PocketBase from 'pocketbase';
import { cp, exists, mkdir, writeFile } from 'fs/promises';
require('dotenv').config();

const pb = new PocketBase("http://127.0.0.1:8090");
const app = express();
await pb.admins.authWithPassword('test@bot.com', 'botbotbotbot');
const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.de',
    port: 465,
    secure: true,
    requiresAuth: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    requireTLS: true,
    tls: {
        rejectUnauthorized: false
    }
});
pb.autoCancellation(false)
let shopID = (await pb.collection('shops').getFullList()).length;

function sendMail(mailSettings) {
    transporter.sendMail(mailSettings, function (error, info) {
        if (error) {
            console.log(error);
            res.json({ info: "Error when sending email" })
        } else {
            res.json({ info: "email sent successfully" })
        }
    });
}

async function startServer(shopID, shopURL, iconSVG) {
    if (!(await exists('./apps'))) {
        await mkdir('./apps', {});
    }
    await cp('./example/', `./apps/${shopID}/`, { recursive: true }, (err) => {
        if (err) throw new Error(err);
    });
    await writeFile(`./apps/${shopID}/images/icon.svg`, iconSVG, (err) => {
        if (err) throw new Error(err)
    })
    app.use(`${shopURL}`, express.static(`./apps/${shopID}/`))
    console.log(shopID, shopURL)
}

async function createServer(name, shopID, shopUrl, iconSVG, products, buttonColor, shopOwner) {
    return new Promise(async resolve => {
        await startServer(shopID, '/' + shopUrl, iconSVG)

        await pb.collection('shops').create({
            shopName: name,
            shopID,
            shopProducts: products || [],
            boughtProducts: [],
            shopURL: '/' + shopUrl,
            buttonColor: buttonColor,
            shopOwner,
            iconSVG
        })

        resolve()
    })
}

async function createProduct(shopURL, product, svg) {
    let shop = await pb.collection('shops').getFirstListItem(`shopURL="${shopURL}"`, {})
    let shopID = shop.shopID;
    product.image = `/${shopURL}/images/productImages/${shop.shopProducts.length + 1}.svg`
    shop.shopProducts.push(product);
    await pb.collection('shops').update(shop.id, shop)
    await writeFile(__dirname + `/apps/${shopID}/images/productImages/${shop.shopProducts.length}.svg`, svg, (err) => {
        if (err) throw err
    })

    // handle payments too

    app.post(`/${shopURL}/bought-product/`, async (req, res) => {
        let { product, boughtBy } = req.body

        product.boughtBy = boughtBy;

        shop.boughtProducts.push(product)

        pb.collection('shops').update(shop.id, shop);
    })
}

(await pb.collection('shops').getFullList()).forEach(i => {
    startServer(i.shopID, i.shopURL, i.iconSVG)
})

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.get('/email/:email', (req, res) => {
    let { email } = req.params
    let random = performance.now()

    let mailSettingsVerify = {
        from: "simeon@linkum.de",
        to: email,
        subject: "Verify your pb_chat email",
        html: `<p>Hello,</p>
                   <p>Thank you for joining us at pb_chat.</p>
                   <p>Click on the button below to verify your email address.</p>
                   <p>
                     <a class="btn" href="http://localhost:80/${random}" target="_blank" rel="noopener">Verify</a>
                   </p>
                   <p>
                     Thanks,<br/>
                     pb_chat team
                   </p>`
    }

    sendMail(mailSettingsVerify)

    app.get(`/${random}`, async (req, res) => {
        let data = await pb.collection('users').getFirstListItem(`email="${email}"`, {});
        let id = data.id;
        data.verified = true;
        await pb.collection('users').update(id, data);
        res.send('Email verified successfully.');
    })
})

app.post('/updateShoppingCart', async (req, res) => {
    let { userID, shoppingCart } = req.body
    let username = (await pb.collection('users').getFirstListItem(`id="${userID}"`)).username
    let data = await pb.collection('users').getFirstListItem(`username="${username}"`, {})
    data.shoppingcart.shoppingcart = shoppingCart
    let stringData = JSON.stringify(data)
    await pb.collection('users').update(data.id, stringData)
    res.status(200);
    res.json({ info: "shoppingcart updated successfully" })
})

app.post('/changePassword', async (req, res) => {
    const { newPassword, newPasswordConfirm, email } = req.body

    if (newPassword !== newPasswordConfirm) {
        res.json({ info: 'error: passwords did not match.', errorCode: 1 })
    }

    let random = performance.now();

    let mailSettingsChange = {
        from: 'simeon@linkum.de',
        to: email,
        subject: 'Verify your password change',
        html: `<p>Hello,</p>
                <p>Click on the button below to change your password.</p>
                <p>
                    <a class="btn" href="http://localhost:80/${random}" target="_blank" rel="noopener">Change password</a>
                </p>
                <p><i>If you didn't ask to change your password, you can ignore this email.</i></p>
                <p>
                    Thanks,<br/>
                    pb-chat team
                </p>`
    }

    sendMail(mailSettingsChange)

    app.get(`/${random}`, async (req, res) => {
        let data = await pb.collection('users').getFirstListItem(`email="${email}"`, {})
        let id = data.id;
        data.password = newPassword;
        data.passwordConfirm = newPasswordConfirm
        await pb.collection('users').update(id, data).catch(_e => {
            res.send('Passwords did not match.')
        }).then(() => {
            res.send('Password changed successfully.');
        });
    })

    res.json({ info: 'done - now check your mail', errorCode: 0 })
})

let spamArray = []

app.post('/shoppingcart-bought', async (req, res) => {
    const { userID, shoppingcart } = req.body;
    let username = (await pb.collection('users').getFirstListItem(`id="${userID}"`)).username
    console.log(spamArray)
    if (spamArray.includes(username)) {
        res.json({
            info: 'Dont even try to do any type of attack, fuck off.',
            errorCode: 1
        })
        return;
    } else {
        spamArray.push(username)
    }

    let data = await pb.collection('users').getFirstListItem(`username="${username}"`, {})
    data.shoppingcart.shoppingcart = [];
    await pb.collection('users').update(data.id, data)

    let error = false;

    shoppingcart.forEach(async i => {
        let server = await pb.collection('products').getFirstListItem(`id="${i.id}"`, {})
        if (server.name === 'Simple GameShop') {
            console.log(i.shopName, i.shopURL, i.iconSVG)
            await createServer(i.shopName, shopID++, i.shopURL, i.iconSVG, null, i.buttonColor, username)
            console.log('created server');
        }
    });

    spamArray = spamArray.filter(i => {
        console.log(i)
        return i !== username
    });

    if (!error) {
        res.json({
            info: 'created servers successfully',
            errorCode: 0
        })
        return
    }

    res.json({
        info: 'something unknown went wrong',
        errorCode: 1
    })
})

app.post('/updateShop', async (req, res) => {
    let { userID, newShop, oldShopID } = req.body;

    let username;
    let oldShop;

    try {
        username = (await pb.collection('users').getFirstListItem(`id="${userID}"`)).username
        console.log(oldShopID)
        oldShop = await pb.collection('shops').getFirstListItem(`shopID="${oldShopID}"`)
    }catch (e) {
        console.error(e)
        res.json({
            info: 'failed to find user or shop',
            errorCode: 1
        })
        return;
    }
    

    let oldShopRoute = oldShop.shopURL;
    let oldShopOwner = oldShop.shopOwner;
    let oldShopEntryID = oldShop.id;

    if(!(oldShopOwner === username)) {
        res.json({
            info: 'you are not the owner of this shop',
            errorCode: 1
        })
        return;
    }

    const middlewareIndex = app._router.stack.findIndex(layer => {
        return layer.path === oldShopRoute
    });

    app._router.stack.splice(middlewareIndex, 1);

    app.use(newShop.shopURL, express.static(`./apps/${oldShopID}/`))

    try {
        await pb.collection('shops').update(oldShopEntryID, newShop)
    } catch(e) {
        console.error(e)
        res.json({
            info: 'failed to update shop',
            errorCode: 1
        })
        return;
    }    

    res.json({
        info: 'updated shop successfully',
        errorCode: 0
    })
})

app.listen(80, async () => {
    console.log('server listening on port 80');
})