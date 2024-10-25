const pb = new PocketBase('http://127.0.0.1:8090')
window.pb = pb;

function notify(message) {
    let el = document.createElement('div');
    el.id = 'outputdiv';
    el.innerHTML = `<span id="output">
        ${message}
    </span>`
    el.style.animation = 'notification 3s ease-in-out';
    setTimeout(() => {
        el.style.animation = '';
        el.remove()
    }, 3000);
    document.body.appendChild(el);
}

if (localStorage.getItem('pocketbase_auth')) {
    document.querySelector('#log').style.display = 'none';
    notify('still logged in.')
    document.querySelector('#main').style.display = 'block';
    document.querySelector('#user').style.display = 'block';
    document.querySelector('#userimage').innerHTML = `<img src="https://api.dicebear.com/9.x/identicon/svg?seed=${pb.authStore.model.username}">`
    document.querySelector('#buttons').style.display = 'block'
}

document.querySelector('form#register').addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;
    const passwordConfirm = document.querySelector('input[name="cpassword"]').value;
    const username = document.querySelector('input[name="username"]').value;
    const shoppingcart = JSON.stringify({ shoppingcart: [] });

    let error = false;

    if(password !== passwordConfirm) {
        notify('passwords did not match!');
        document.querySelector('input[name="cpassword"]').value = '';
        return;
    }

    await pb.collection('users').create({
        email,
        username,
        password,
        passwordConfirm,
        shoppingcart
    }).catch(() => {
        console.log('value exists');
        document.querySelector('#output').innerHTML = 'email or username already in use';
        document.querySelector('input[name="email"]').value = '';
        document.querySelector('input[name="username"]').value = '';
        // start optional
        document.querySelector('input[name="password"]').value = '';
        document.querySelector('input[name="cpassword"]').value = '';
        // end optional
        error = true;
    })

    if (error) {
        return;
    }

    await pb.collection('users').authWithPassword(email, password);

    fetch(`/email/${email}`)

    notify('registered successfully, please verify email')
    document.querySelector('#log').style.display = 'none';
    document.querySelector('#main').style.display = 'block';
    document.querySelector('#user').style.display = 'block';
    document.querySelector('#user > #userimage').innerHTMl = `<img src="https://api.dicebear.com/9.x/identicon/svg?seed=${pb.authStore.model.username}">`
    document.querySelector('#buttons').style.display = 'block'
})

document.querySelector('#changePassword').addEventListener('click', () => {
    document.querySelector('#changePasswordDiv').style.display = 'block';
    document.querySelector('#main').style.display = 'none';
    document.querySelector('#user').style.display = 'none';
})

document.querySelector('#changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    let output = await changePassword()

    console.log(output)

    if(output === 1) {
        notify('Passwords did not match');
        return;
    }else if(output === 0) {
        notify('confirmation email sent, you have been logged out');
        pb.authStore.clear()
        document.querySelector('#log').style.display = 'block';
        document.querySelector('#main').style.display = 'none';
        document.querySelector('#user').style.display = 'none';
        document.querySelector('#changePasswordDiv').style.display = 'none';
        document.querySelector('#buttons').style.display = 'none'
    }
})

document.querySelector('#closeChangePasswordDiv').addEventListener('click', () => {
    document.querySelector('#changePasswordDiv').style.display = 'none';
    document.querySelector('#main').style.display = 'block';
    document.querySelector('#user').style.display = 'block';
})

document.querySelector('form#login').addEventListener('submit', async e => {
    e.preventDefault();

    let error = false;
    const email = document.querySelector('input[name="emailLogin"]').value;
    const password = document.querySelector('input[name="passwordLogin"]').value;

    await pb.collection('users').authWithPassword(email, password).catch((e) => {
        console.log(e);
        notify('invalid email/password');
        error = true;
    });

    if (error) {
        return;
    }

    notify('logged in successfully');
    document.querySelector('#log').style.display = 'none';
    document.querySelector('#main').style.display = 'block';
    document.querySelector('#user').style.display = 'block';
    document.querySelector('#user > #userimage').innerHTMl = `<img src="https://api.dicebear.com/9.x/identicon/svg?seed=${pb.authStore.model.username}">`
    document.querySelector('#buttons').style.display = 'block'
})

document.querySelector('#logout').addEventListener('click', () => {
    pb.authStore.clear();
    document.querySelector('#log').style.display = 'block';
    notify('successfully logged out of any session');
    document.querySelector('#main').style.display = 'none';
    document.querySelector('#user').style.display = 'none';
    document.querySelector('#changePasswordDiv').style.display = 'none';
    document.querySelector('#buttons').style.display = 'none'
})

async function updateUser(shoppingCart) {
    fetch(`/updateShoppingCart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            shoppingCart,
            userID: pb.authStore.model.id
        }),
    })
}

async function changePassword() {
    let newPassword = document.querySelector('#newPassword').value;
    let newPasswordConfirm = document.querySelector('#cNewpassword').value;
    let result = await fetch('/changePassword', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            email: pb.authStore.model.email, 
            newPassword, 
            newPasswordConfirm
        }) 
    }).then(data => {
        return data.json()
    })
    console.log(result)
    
    return result.errorCode
}

async function getDataOfUser() {
    try {
        let data = await pb
        .collection('users')
        .getOne(pb.authStore.model.id)
        return data;
    }catch {
        notify('your session has ended')
        document.querySelector('#logout').click();
    }
}

async function getCollectionData(collection) {
    return await pb
        .collection(collection)
        .getFullList()
}

export { updateUser, getDataOfUser, getCollectionData, notify };