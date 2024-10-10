document.querySelector('#openRegister').addEventListener('click', () => {
    document.querySelector('#register').style.display = 'block';
    document.querySelector('#login').style.display = 'none';
    document.querySelector('#openLogin').classList.remove('loginOpened');
    document.querySelector('#openLogin').classList.add('loginNotOpened');
    document.querySelector('#openRegister').classList.remove('signupNotOpened');
    document.querySelector('#openRegister').classList.add('signupOpened');
})

document.querySelector('#openLogin').addEventListener('click', () => {
    document.querySelector('#register').style.display = 'none';
    document.querySelector('#login').style.display = 'block';
    document.querySelector('#openLogin').classList.add('loginOpened');
    document.querySelector('#openLogin').classList.remove('loginNotOpened');
    document.querySelector('#openRegister').classList.add('signupNotOpened');
    document.querySelector('#openRegister').classList.remove('signupOpened');
})

setInterval(() => {
    const password = document.querySelector('#password').value;
    
    if(password.length >= 8) {
        document.querySelector('#passwordLengthCheck').classList.remove('cross');
        document.querySelector('#passwordLengthCheck').classList.add('check');
    }else {
        document.querySelector('#passwordLengthCheck').classList.remove('check');
        document.querySelector('#passwordLengthCheck').classList.add('cross');
    }

    const email = document.querySelector('#email').value;

    if(email.includes('@')) {
        document.querySelector('#emailAtCheck').classList.remove('cross');
        document.querySelector('#emailAtCheck').classList.add('check');
    }else {
        document.querySelector('#emailAtCheck').classList.remove('check');
        document.querySelector('#emailAtCheck').classList.add('cross');
    }
    if(email.includes('.')) {
        document.querySelector('#emailDotCheck').classList.remove('cross');
        document.querySelector('#emailDotCheck').classList.add('check');
    }else {
        document.querySelector('#emailDotCheck').classList.remove('check');
        document.querySelector('#emailDotCheck').classList.add('cross');
    }

    if(email.includes('@') && email.includes('.') && password.length >= 8) {
        document.querySelector('#register > input[type="submit"]').disabled = false;
    }else {
        document.querySelector('#register > input[type="submit"]').disabled = true;
    }
}, 100);

document.querySelector('#searchproductinput').addEventListener('keyup', () => {
    const searchValue = document.querySelector('#searchproductinput').value;

    const products = document.querySelectorAll('.product');

    products.forEach(product => {
        if(product.querySelector('h3').innerText.toLowerCase().includes(searchValue.toLowerCase())) {
            product.style.display = 'block';
        }else {
            product.style.display = 'none';
        }
    })
})