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
            console.log('Email sent: ' + info.response);
            res.json({ info: "email sent successfully" })
        }
    });
}

async function createServer(name, shopID, shopUrl, iconSVG) {
    return new Promise(async resolve => {
        console.log('1');
        if(!(await exists('./apps'))) {
            await mkdir('./apps', {});
        }
        console.log('1');
        await cp('./example/', `./apps/${shopID}/`, {recursive: true}, (err) => {
            if(err) throw new Error(err);
        });
        console.log('1');
        await writeFile(`./apps/${shopID}/images/icon.svg`, iconSVG, (err) => {
            if(err) throw new Error(err)
        })
        console.log('1');
        app.use(`/${shopUrl}/`, express.static(`./apps/${shopID}/`))
        console.log('1');
        await pb.collection('shops').create({
            shopName: name,
            shopID,
            shopProducts: [],
            boughtProducts: [],
            shopURL: shopUrl
        })
        console.log('1');

        resolve()
    })
}

async function createProduct(shopURL, product, svg) {
    console.log('2');
    let shop = await pb.collection('shops').getFirstListItem(`shopURL="${shopURL}"`, {})
    console.log('2');
    let shopID = shop.shopID;
    console.log(shop)
    console.log('2');
    product.image = `/${shopURL}/images/productImages/${shop.shopProducts.length + 1}.svg`
    shop.shopProducts.push(product);
    console.log('2');
    await pb.collection('shops').update(shop.id, shop)
    console.log('2');
    await writeFile(__dirname + `/apps/${shopID}/images/productImages/${shop.shopProducts.length}.svg`, svg, (err) => {
        if(err) throw err
    })

    // handle payments too

    app.post(`/${shopURL}/bought-product/`, async (req, res) => {
        let { product, boughtBy } = req.body

        product.boughtBy = boughtBy;

        shop.boughtProducts.push(product)
        
        pb.collection('shops').update(shop.id, shop);
    })
}

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
    let { username, shoppingCart } = req.body
    let data = await pb.collection('users').getFirstListItem(`username="${username}"`, {})
    console.log(data);
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

app.listen(80, async () => {
    console.log('server listening on port 80');
    console.log(shopID)
    await createServer('testa', 0, 'testa')
    shopID++;
    createProduct('testa', {name: "test", price: 0.00}, "someSVG")
})