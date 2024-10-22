import { getCollectionData, updateUser, getDataOfUser, notify } from './login.js';
import './ui.js';

const products = await getCollectionData('products')

let userShoppingCart = []

function updateShoppingCart() {
    document.querySelector('#shoppingcart-items > tbody').innerHTML = '';
    let totalPrice = 0;
    userShoppingCart.forEach((i, index) => {
        let el = document.createElement('tr')
        el.innerHTML = `
            <th>${i.name}</th><th>${i.price}</th><th><button>delete</button></th>
        `
        el.querySelector('button').addEventListener('click', () => {
            userShoppingCart = userShoppingCart.filter((e, index2) => !(e.id === i.id && index2 === index))
            updateUser(userShoppingCart)
            notify('successfully deleted item');
            updateShoppingCart()
        })
        totalPrice += i.price;
        document.querySelector('#shoppingcart-items > tbody').appendChild(el)
    })
    document.querySelector('#shoppingcart-total').innerHTML = '$' + totalPrice.toFixed(2);
}

let lastOpenedCreatedProduct = null;

function updateCustomizationMenu() {
    document.querySelector('#shopslist').innerHTML = '';
    shopsOwnedByUser.forEach(i => {
        if(i.shopOwner !== pb.authStore.model.username) {
            return;
        }
        let el = document.createElement('tr')
        el.innerHTML = `
            <li>${i.shopName}</li>
        `
        el.querySelector('li').addEventListener('click', () => {
            document.querySelector('#customize-product-container > #color-gs-customize').value = i.buttonColor;
            document.querySelector('#customize-product-container > #name-gs-customize').value = i.shopName;
            document.querySelector('#customize-product-container > #url-gs-customize').value = i.shopURL.substring(1);
            document.querySelector('#customize-product-container > #icon-gs-customize').value = i.iconSVG;
            document.querySelector('#customize-product-container').style.display = 'block'
            lastOpenedCreatedProduct = i;
        })
        document.querySelector('#shopslist').appendChild(el)
        let productsOfShop = i.shopProducts;
        productsOfShop.forEach(e => {
            let el2 = document.createElement('li');
            el2.innerHTML = `${e.name}`;
            el2.addEventListener('click', () => {
                document.querySelector('#customize-product-container > #color-gs-customize').value = e.buttonColor;
                document.querySelector('#customize-product-container > #name-gs-customize').value = e.name;
                document.querySelector('#customize-product-container > #url-gs-customize').value = e.shopURL.substring(1);
            })
        })
    })
}

let fileToken = 0;
let shopsOwnedByUser = [];

if (localStorage.getItem('pocketbase_auth')) {
    userShoppingCart = await getDataOfUser().then(result => 
        result.shoppingcart.shoppingcart
    )
    fileToken = await pb.files.getToken();
    shopsOwnedByUser = (await pb.collection('shops').getFullList({})).map(i => {
        return {
            id: i.id,
            shopID: i.shopID,
            shopURL: i.shopURL,
            iconSVG: i.iconSVG,
            shopName: i.shopName,
            buttonColor: i.buttonColor,
            shopOwner: i.shopOwner
        }
    })
    updateShoppingCart();
    updateCustomizationMenu();
}

console.log(userShoppingCart)

let lastOpenedProduct = null;

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
        let product = products[index]
        lastOpenedProduct = product;
        if(i.type === 'GameShop') {
            //customize simple gameShop
            document.querySelector('#customize-popup').classList.add('visible')
            notify('Please customize.')
        }
    })

    document.querySelector('#products').appendChild(el);
})

let customizeProductAddCartClickHandler = () => {
    if(!document.querySelector('#name-gs').value) {
        notify('Please enter a name.')
        return;
    }
    if(!document.querySelector('#url-gs').value) {
        notify('Please enter a valid URL.')
        return;
    }
    let product = lastOpenedProduct
    product.buttonColor = document.querySelector('#color-gs').value
    product.shopName = document.querySelector('#name-gs').value
    product.shopURL = document.querySelector('#url-gs').value
    product.iconSVG = document.querySelector('#icon-gs').value
    console.log(product)
    userShoppingCart.push(product)
    updateUser(userShoppingCart)
    notify(`Successfully added product "${lastOpenedProduct.name}" to your shoppingcart.`)
    updateShoppingCart();
    document.querySelector('#customize-popup').classList.remove('visible')
}

let customizeCreatedProductSaveChangesClickHandler = async () => {
    if(!document.querySelector('#name-gs-customize').value) {
        notify('Please do not remove the name.')
        return;
    }
    if(!document.querySelector('#url-gs-customize').value) {
        notify('Please enter a valid URL.')
        return;
    }
    let product = lastOpenedCreatedProduct;
    product.buttonColor = document.querySelector('#color-gs-customize').value
    product.shopName = document.querySelector('#name-gs-customize').value
    product.shopURL = '/' + document.querySelector('#url-gs-customize').value
    product.iconSVG = document.querySelector('#icon-gs-customize').value
    console.log(product)
    shopsOwnedByUser = shopsOwnedByUser.map(i => {
        if(i.id === product.id) {
            return product
        } else {
            return i
        }
    })
    await fetch('/updateShop', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userID: pb.authStore.model.id,
            newShop: product,
            oldShopID: product.shopID
        })
    })
    notify(`Successfully updated shop "${lastOpenedCreatedProduct.shopName}".`)
    updateCustomizationMenu();
}

document.querySelector('#close-customize-popup').addEventListener('click', () => {
    document.querySelector('#customize-popup').classList.remove('visible')
})

document.querySelector('#customize-product-add-cart').addEventListener('click', customizeProductAddCartClickHandler)
document.querySelector('#customize-product-save-changes-button').addEventListener('click', customizeCreatedProductSaveChangesClickHandler)

document.querySelectorAll('#shoppingopenbutton, #shoppingopenbutton > img').forEach(i => {
    i.addEventListener('click', () => {
        document.querySelector('.shopping').style.display = 'block';
        document.querySelector('.shoppingcartdiv').style.display = 'none';
        document.querySelector('.customizationdiv').style.display = 'none';
    })
})

document.querySelectorAll('#shoppingcartopen, #shoppingcartopen > img').forEach(i => {
    i.addEventListener('click', () => {
        document.querySelector('.shopping').style.display = 'none';
        document.querySelector('.shoppingcartdiv').style.display = 'block';
        document.querySelector('.customizationdiv').style.display = 'none';
    })
})

document.querySelectorAll('#customizationopen, #customizationopen > img').forEach(i => {
    i.addEventListener('click', () => {
        document.querySelector('.shopping').style.display = 'none';
        document.querySelector('.shoppingcartdiv').style.display = 'none';
        document.querySelector('.customizationdiv').style.display = 'block';
    })
})

document.querySelector('#checkout').addEventListener('click', async  () => {
    if(userShoppingCart.length === 0) {
        notify('No items in your cart.')
        return;
    }
    let response = await fetch('/shoppingcart-bought', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            shoppingcart: userShoppingCart,
            userID: pb.authStore.model.id
        })
    })
    response = await response.json();
    console.log(response)
    if(response.errorCode === 0) {
        notify('servers created successfully')
    }else {
        notify(response.info)
    }
    userShoppingCart = [];
    updateShoppingCart()
})