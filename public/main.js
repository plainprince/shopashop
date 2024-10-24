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
            <th>${i.name}</th><th>${i.price}</th><th><button class="btn">delete</button></th>
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
let lastOpenedCreatedProductproduct = null
let lastOpenedCreatedProductShop = null;

function updateCustomizationMenu() {
    document.querySelector('#shopslist').innerHTML = '';
    console.log(shopsOwnedByUser)
    shopsOwnedByUser.forEach(i => {
        console.log('some shop passed')
        if(i.shopOwner !== pb.authStore.model.username) {
            return;
        }
        console.log('some shops owner is the user', i.shopName)
        console.log(i.shopOwner)
        console.log(i.shopProducts)
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
            document.querySelector('#customize-products-container-products').style.display = 'block'
            lastOpenedCreatedProduct = i;
            let productsOfShop = i.shopProducts;
            document.querySelector('#customize-products-container-list-products').innerHTML = '';
            productsOfShop.forEach(e => {
                let el3 = document.createElement('li');
                el3.innerHTML = `${e.name}`;
                el3.addEventListener('click', () => {
                    document.querySelector('#customize-product-container > #color-gs-customize').value = e.buttonColor;
                    document.querySelector('#customize-product-container > #name-gs-customize').value = e.name;
                    document.querySelector('#customize-product-container > #url-gs-customize').value = e.shopURL.substring(1);
                })
                el2s = [];
                document.querySelector('#customize-products-container-list-products').innerHTML = '';
                i.shopProducts.forEach((e, index, self) => {
                    let el2 = document.createElement('li');
                    el2.innerText = e.name
                    el2.innerHTML += '<br>'
                    el2.style.display = 'inline';
                    el2.addEventListener('click', () => {
                        document.querySelector('#customize-products-edit-name').value = e.name;
                        document.querySelector('#customize-products-edit-desc').value = e.desc;
                        document.querySelector('#customize-products-edit-price').value = e.price;
                        document.querySelector('#customize-products-edit-icon').value = e.image;
                        document.querySelector('#customize-products-edit').style.display = 'block';
                        el2s.forEach(j => {
                            j.style.backgroundColor = 'white';
                        })
                        el2.style.backgroundColor = 'lightgray';
                    })
                    el2s.push(el2);
                    document.querySelector('#customize-products-container-list-products').appendChild(el2)
                    self[index].listElement = el2;
                    self[index].index = index;
                    console.log(self[index])
                    lastOpenedCreatedProductproduct = self[index]
                    lastOpenedCreatedProductShop = i;
                    console.log('some product passed')
                });
            })
        })
        document.querySelector('#customize-products-container-list-products').innerHTML = '';
        let el2s = [];
        i.shopProducts.forEach((e, index, self) => {
            let el2 = document.createElement('li');
            el2.innerText = e.name
            el2.innerHTML += '<br>'
            el2.style.display = 'inline';
            el2.addEventListener('click', () => {
                document.querySelector('#customize-products-edit-name').value = e.name;
                document.querySelector('#customize-products-edit-desc').value = e.desc;
                document.querySelector('#customize-products-edit-price').value = e.price;
                document.querySelector('#customize-products-edit-icon').value = e.image;
                document.querySelector('#customize-products-edit').style.display = 'block';
                el2s.forEach(j => {
                    j.style.backgroundColor = 'white';
                })
                el2.style.backgroundColor = 'lightgray';
            })
            el2s.push(el2);
            document.querySelector('#customize-products-container-list-products').appendChild(el2)
            self[index].listElement = el2;
            self[index].index = index;
            console.log(self[index])
            lastOpenedCreatedProductproduct = self[index]
            lastOpenedCreatedProductShop = i;
            console.log('some product passed')
        });
        console.log(i.shopProducts)
        document.querySelector('#shopslist').appendChild(el)
    })
}

document.querySelector('#customize-products-edit-remove-button').addEventListener('click', () => {
    let shop = shopsOwnedByUser.find(i => {
        return i.id === lastOpenedCreatedProductShop.id
    });
    let shopIndex = shopsOwnedByUser.indexOf(shop);
    console.log(shop)
    let productIndex = shop.shopProducts.findIndex((_i, index) => {
        return index === lastOpenedCreatedProductproduct.index;
    })
    console.log(productIndex)
    shopsOwnedByUser[shopIndex].shopProducts.splice(productIndex, 1)
    shopsOwnedByUser = shopsOwnedByUser.map((i, index) => {
        i.index = index
        return i;
    })
    console.log(shopsOwnedByUser)
    document.querySelector('#customize-products-edit').style.display = 'none'
    updateCustomizationMenu();
})

let fileToken = 0;
let shopsOwnedByUser = [];

if (localStorage.getItem('pocketbase_auth')) {
    userShoppingCart = await getDataOfUser().then(result => 
        result.shoppingcart.shoppingcart
    )
    fileToken = await pb.files.getToken();
    shopsOwnedByUser = (await pb.collection('shops').getFullList({})).map(i => {
        console.log(i.buttonColor)
        return {
            id: i.id,
            shopID: i.shopID,
            shopURL: i.shopURL,
            iconSVG: i.iconSVG,
            shopName: i.shopName,
            buttonColor: i.buttonColor,
            shopOwner: i.shopOwner,
            shopProducts: i.shopProducts
        }
    }).filter(i => {
        return i.shopOwner === pb.authStore.model.username;
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
            <button class="buy-button btn">Add to Cart</button>
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
    updateCustomizationMenu()
})

document.querySelector('#customize-products-edit-add-button').addEventListener('click', () => {
    document.querySelector('#customize-product-popup').classList.add('visible')
})

document.querySelector('#customize-products-popup-cancel-button').addEventListener('click', () => {
    document.querySelector('#customize-product-popup').classList.remove('visible')
})

document.querySelector('#customize-products-popup-create-button').addEventListener('click', async () => {
    let productName = document.querySelector('#customize-products-edit-name-customize').value;
    let productDesc = document.querySelector('#customize-products-edit-desc-customize').value;
    let productIcon = document.querySelector('#customize-products-edit-icon-customize').value;
    let productPrice = parseFloat(document.querySelector('#customize-products-edit-price-customize').value);

    if(!productName ||!productDesc ||!productIcon || isNaN(productPrice) || productPrice <= 0) {
        notify('Please fill all fields correctly.')
        return;
    }

    let index = shopsOwnedByUser.findIndex(i => {
        return i.shopName === lastOpenedCreatedProduct.shopName;
    })

    console.log(index)

    shopsOwnedByUser[index].shopProducts.push({
        name: productName,
        desc: productDesc,
        image: productIcon,
        price: productPrice
    })

    updateCustomizationMenu();

    shopsOwnedByUser.forEach(async i => {
        await fetch('/updateShop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userID: pb.authStore.model.id,
                newShop: i,
                oldShopID: i.shopID
            })
        })
    })

    document.querySelector('#customize-product-popup').classList.remove('visible')
})