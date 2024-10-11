import { getCollectionData, updateUser, getDataOfUser, notify } from './login.js';
import './ui.js';

const products = await getCollectionData('products')

let userShoppingCart = []

function updateShoppingCart() {
    document.querySelector('#shoppingcart-items > tbody').innerHTML = '';
    let totalPrice = 0;
    userShoppingCart.forEach(i => {
        let el = document.createElement('tr')
        el.innerHTML = `
            <th>${i.name}</th><th>${i.price * i.quantity}</th><th>${i.price}</th><th>${i.quantity}</th><th><button>delete</button></th>
        `
        el.querySelector('button').addEventListener('click', () => {
            userShoppingCart = userShoppingCart.filter(e => e.id !== i.id)
            updateUser(userShoppingCart)
            notify('successfully deleted item');
            updateShoppingCart()
        })
        totalPrice += i.price * i.quantity;
        document.querySelector('#shoppingcart-items > tbody').appendChild(el)
    })
    document.querySelector('#shoppingcart-total').innerHTML = '$' + totalPrice.toFixed(2);
}

let fileToken = 0;

if (localStorage.getItem('pocketbase_auth')) {
    userShoppingCart = await getDataOfUser().then(result => 
        result.shoppingcart.shoppingcart
    )
    fileToken = await pb.files.getToken();
    updateShoppingCart();
}

console.log(userShoppingCart)

products.forEach((i, index) => {
    let el = document.createElement("div");

    let url = pb.files.getUrl(i, i.image, { 'token': fileToken });

    console.log(url)

    el.innerHTML = `
        <img class="card-image" src="${url}" alt="${i.name}">
        <div class="card-body">
            <h3>${i.name}</h3>
            <p class="product-desc">${i.desc}</p>
            <p>$${i.price.toFixed(2)}</p>
            <button class="buy-button">Add to Cart</button>
        </div>
    `
    el.classList.add('product');

    el.querySelector(`.buy-button`).addEventListener('click', () => {
        console.log(index);
        if(userShoppingCart.find(i => {
            return i.id === products[index].id
        })) {
            userShoppingCart[userShoppingCart.indexOf(userShoppingCart.find(i => {
                return i.id === products[index].id
            }))].quantity++
        }else {
            userShoppingCart.push({...products[index], quantity: 1 })
        }
        updateUser(userShoppingCart)
        notify('successfully added to cart.')
        updateShoppingCart();
    })

    document.querySelector('#products').appendChild(el);
})

document.querySelectorAll('.open-pane-button').forEach(e => {
    e.addEventListener('click', (e) => {
        if (e.target.id === 'shoppingopenbutton') {
            document.querySelector('.shopping').style.display = 'block';
            document.querySelector('.shoppingcartdiv').style.display = 'none';
        };
        console.log(e.target.id)
        if (e.target.id === 'shoppingcartopen') {
            document.querySelector('.shopping').style.display = 'none';
            document.querySelector('.shoppingcartdiv').style.display = 'block';
        };
    })
});