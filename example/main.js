const pb = new PocketBase("http://localhost:8090")

let shopURL = location.pathname.substring(1, location.pathname.length - 1)

let loggedIn = false;

let username;

if(localStorage.getItem('loggedIn')) {
    loggedIn = true;
    document.querySelector('#main').style.display = 'block';
    document.querySelector('#user').style.display = 'block';
    document.querySelector('#login').style.display = 'none';
    username = localStorage.getItem('loggedIn');
}

console.log(shopURL)

window.unescape = window.unescape || window.decodeURI;

function svgToBase64(svg) {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

let data = await pb
    .collection('shops')
    .getFirstListItem(`shopURL="/${shopURL}"`, {})

window.name = data.shopName;
document.title = data.shopName;
document.querySelector('title').innerHTML = data.shopName; // just for safety
data.shopProducts.forEach(async i => {
    let el = document.createElement("div");

    let img = i.image

    el.innerHTML = `
        <img class="card-image" src="${svgToBase64(img)}" alt="${i.name}">
        <div class="card-body">
            <h3>${i.name}</h3>
            <p class="product-desc">${i.desc}</p>
            <p>$${i.price.toFixed(2)}</p>
            <button class="buy-button">Buy now</button>
        </div>
    `
    el.classList.add('product');

    el.querySelector(`.buy-button`).addEventListener('click', () => {
        console.log(i)

        // add payment logic

        fetch('./bought-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                shopURL: shopURL,
                product: i,
                boughtBy: username
            })
        })
    })

    document.querySelector('#products').appendChild(el);
});

document.querySelector('#login').addEventListener('submit', e => {
    e.preventDefault();
    
    let username = document.querySelector('#username').value

    localStorage.setItem('loggedIn', username)

    username = localStorage.getItem('loggedIn');

    document.querySelector('#login').style.display = 'none';
    document.querySelector('#main').style.display = 'block';
    document.querySelector('#user').style.display = 'block';
})

document.querySelector('#searchproductinput').addEventListener('keyup', () => {
    const searchValue = document.querySelector('#searchproductinput').value;

    const products = document.querySelectorAll('.product');

    products.forEach(product => {
        if(product.querySelector('h3').innerText.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.querySelector('.product-desc').innerText.toLowerCase().includes(searchValue.toLowerCase())) {
            product.style.display = 'inline-block';
        }else {
            product.style.display = 'none';
        }
    })
})

document.querySelector('#logout').addEventListener('click', () => {
    document.querySelector('#main').style.display = 'none';
    document.querySelector('#user').style.display = 'none';
    document.querySelector('#login').style.display = 'block';

    loggedIn = false;
    localStorage.removeItem('loggedIn');
})