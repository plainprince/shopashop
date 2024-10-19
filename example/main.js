const pb = new PocketBase("http://localhost:8090")

let shopURL = location.pathname.substring(1, location.pathname.length - 1)

let loggedIn = false;

let username;

if(localStorage.getItem('loggedIn')) {
    loggedIn = true;
    document.querySelector('#main').style.display = 'block';
    document.querySelector('#login').style.display = 'none';
    username = localStorage.getItem('loggedIn');
}

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

console.log(shopURL)

let data = await pb
    .collection('shops')
    .getFirstListItem(`shopURL="${shopURL}"`, {})
data.shopProducts.forEach(i => {
    let el = document.createElement("div");

    let url = i.image

    console.log(url)

    el.innerHTML = `
        <img class="card-image" src="${url}" alt="${i.name}">
        <div class="card-body">
            <h3>${i.name}</h3>
            <p class="product-desc">${i.desc}</p>
            <p>$${i.price.toFixed(2)}</p>
            <button class="buy-button">Buy</button>
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
})