import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import PocketBase from 'pocketbase';
import { writeFile } from 'fs/promises';
import { exec, spawn, spawnSync } from 'child_process';

const pb = new PocketBase("http://127.0.0.1:8090");
const app = express();
await pb.admins.authWithPassword('test@bot.com', 'botbotbotbot');
const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.de',
    port: 465,
    secure: true,
    requiresAuth: true,
    auth: {
        user: "simeon@linkum.de",
        pass: "xof5Ao9u$"
    },
    requireTLS: true,
    tls: {
        rejectUnauthorized: false
    }
});

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

async function createServer(name) {
    let script = `
docker run -t --name "${name}" --rm -v "$(pwd)":"$(pwd)" -p 80:80 -p 8090:8090 node:22.4.0-alpine
echo started container
    `
    await writeFile('createContainer.sh', script, {})
    let child = exec('bash createContainer.sh')
    child.stderr.on('data', d => console.error(d))
    
    await new Promise(resolve => {
        child.stdout.on('data', d => {
            console.log(d)
            console.log('done')
            resolve()
        })
    })
    
    script = `
docker exec "${name}" /Users/simeonkummer/dev/pb-chat/pocketbase-linux serve &
docker exec "${name}" node /Users/simeonkummer/dev/pb-chat/server.js`

    await writeFile('createContainer.sh', script, {})
     
    // child = exec('bash createContainer.sh')
    // child.on('data', d => console.error(d))
    // child.stderr.on('data', d => console.error(d))
    // child.stdout.on('data', d => console.log(d))
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

app.listen(80, () => {
    console.log('server listening on port 80');
    createServer('testa')
})