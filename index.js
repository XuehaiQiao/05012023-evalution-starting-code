const API = (() => {
  const URL = "http://localhost:3000";
  const CART = "/cart";
  const INVENTORY = "/inventory";

  const getCart = () => fetch(URL + CART).then((data) => data.json());
  const getInventory = () => fetch(URL + INVENTORY).then((data) => data.json());

  const addToCart = (cart) => {
    return fetch(URL + CART, {
      method: "POST",
      body: JSON.stringify(cart),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((data) => data.json());
  };

  const updateCart = (id, amount) => {
    // define your method to update an item in cart
    return fetch(URL + CART + "/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({amount})
    })
      .then(response => response.json())
      .catch(error => console.error("Error updating cart:", error));
  }


  const deleteFromCart = (id) => fetch(URL + CART + "/" + id, { method: "DELETE" }).then((data) => data.json());

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange; // []
    #inventory; // []
    #cart; // []
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      newInventory.forEach(inventoryItem => {
        inventoryItem.amount = 0;
      })
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;

  function createInventoryLi(inventoryItem) {
    return `<li item-id="${inventoryItem.id}"><span>${inventoryItem.content}</span>
    <button class="reduce-btn" >-</button>
    <span class="inventory-amount">${inventoryItem.amount}</span>
    <button class="add-btn" >+</button>
    <button class="addToCart-btn" >add to cart</button></li>`
  };

  function createCartLi(cartItem) {
    return `<li item-id="${cartItem.id}"><span>${cartItem.content + " x " + cartItem.amount}</span>
    <button class="delete-btn" >delete</button></li>`
  }

  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
    createInventoryLi,
    createCartLi
  };
})();

const View = (() => {
  const addToCartBtns = document.querySelectorAll(".addToCart-btn");
  const addBtns = document.querySelectorAll(".add-btn");
  const reduceBtns = document.querySelectorAll(".reduce-btn");
  const deleteBtns = document.querySelectorAll(".delete-btn");
  const checkOutBtn = document.querySelector(".checkout-btn");

  const inventoryListEl = document.querySelector(".inventory-container ul");
  const cartListEl = document.querySelector(".cart-container ul");

  const renderInventories = function (inventory) {
    console.log("Render inventories.");
    let temp = "";
    for (const inventoryItem of inventory) {
      const liTemp = Model.createInventoryLi(inventoryItem);
      temp += liTemp;
    }
    inventoryListEl.innerHTML = temp;
  }

  const renderCarts = function (cart) {
    console.log("Render carts.");
    let temp = "";
    for (const i in cart) {
      const cartItem = cart[i];
      const liTemp = Model.createCartLi(cartItem);
      temp += liTemp;
    }
    cartListEl.innerHTML = temp;
  }

  const getInventoryValue = (name) => { }
  const getCartValue = (name) => { }

  return {
    addToCartBtns,
    addBtns,
    reduceBtns,
    deleteBtns,
    checkOutBtn,
    inventoryListEl,
    cartListEl,
    renderCarts,
    renderInventories,
  };
})();

const Controller = ((model, view) => {
  const state = new model.State();

  const init = () => {
    model.getCart().then(data => state.cart = data);
    model.getInventory().then(data => state.inventory = data);
  };

  const handleUpdateAmount = () => {
    view.inventoryListEl.addEventListener("click", (event) => {
      if (event.target.className === "add-btn") {
        let id = event.target.parentNode.getAttribute("item-id");
        state.inventory.find(item => item.id == id).amount++;
        view.renderInventories(state.inventory);
      }
      else if (event.target.className === "reduce-btn") {
        let id = event.target.parentNode.getAttribute("item-id");
        let item = state.inventory.find(item => item.id == id);
        if (item.amount > 0) {
          item.amount--;
          view.renderInventories(state.inventory);
        }
      }
    });
  };

  const handleAddToCart = () => {
    view.inventoryListEl.addEventListener("click", (event) => {
      if (event.target.className !== "addToCart-btn") return;

      let id = event.target.parentNode.getAttribute("item-id");
      console.log('parent Id', id);

      // update state.cart
      let inventoryItem = state.inventory.find(item => item.id == id);
      if (inventoryItem.amount === 0) return;

      let cartItem = state.cart.find(item => item.id == id);
      if (cartItem) {
        cartItem.amount += inventoryItem.amount;
        model.updateCart(id, cartItem.amount);
      }
      else {
        cartItem = {...inventoryItem};
        state.cart.push(cartItem);
        model.addToCart(cartItem);
      }
      
      view.renderCarts(state.cart);
      inventoryItem.amount = 0;
      view.renderInventories(state.inventory);   
    });
  };

  const handleDelete = () => {
    view.cartListEl.addEventListener("click", (event) => {
      if (event.target.className !== "delete-btn") return;

      let id = event.target.parentNode.getAttribute("item-id");

      model.deleteFromCart(id).then(() => {
        for(const i in state.cart) {
          console.log(state.cart[i])
          if(state.cart[i].id == id) {
            state.cart.splice(i, 1);
            break;
          }
        }
        view.renderCarts(state.cart);
      })
    });
  };

  const handleCheckout = () => {
    view.checkOutBtn.addEventListener("click", (event) => {
      console.log("checkout");
      model.checkout().then(() => {
        state.cart = [];
      })
    })
  };

  const bootstrap = () => {
    handleUpdateAmount();
    handleAddToCart();
    handleDelete();
    handleCheckout();

    init();
    state.subscribe(() => {
      view.renderCarts(state.cart);
      view.renderInventories(state.inventory);
    });

  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
