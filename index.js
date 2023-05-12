const API = (() => {
  const URL = "http://localhost:3000";
  const CART = "/cart";
  const INVENTORY = "/inventory";

  const getCart = () => fetch(URL + CART).then((data) => data.json());
  const getInventory = () => fetch(URL + INVENTORY).then((data) => data.json());

  const addToCart = (inventoryItem) => {
    return fetch(URL + CART, {
      method: "POST",
      body: JSON.stringify(inventoryItem),
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
    #onChange;
    #inventory;
    #cart;
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
      this.#cart = {}
      newCart.forEach((cartItem) => {
        this.#cart[cartItem.id] = cartItem;
      })
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = {}
      newInventory.forEach((inventoryItem) => {
        inventoryItem.amount = 0;
        this.#inventory[inventoryItem.id] = inventoryItem;
      })
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
    for (const i in inventory) {
      const inventoryItem = inventory[i];
      const content = inventoryItem.content;
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
      const content = cartItem.content;
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
        state.inventory[id].amount += 1;
        view.renderInventories(state.inventory);
      }
      else if (event.target.className === "reduce-btn") {
        let id = event.target.parentNode.getAttribute("item-id");
        if (state.inventory[id].amount > 0) {
          state.inventory[id].amount -= 1;
          view.renderInventories(state.inventory);
        }
      }
    });
  };

  const handleAddToCart = () => {
    view.inventoryListEl.addEventListener("click", (event) => {
      if (event.target.className !== "addToCart-btn") return;

      let id = event.target.parentNode.getAttribute("item-id");

      // update state.cart
      if (state.inventory[id].amount === 0) return;

      if (state.cart[id]) {
        state.cart[id].amount += state.inventory[id].amount;
        model.updateCart(id, state.cart[id].amount);
      }
      else {
        state.cart[id] = new Object(state.inventory[id]);
        model.addToCart(state.cart[id]);
      }

      state.inventory[id].amount = 0;


      
      view.renderCarts(state.cart);
      view.renderInventories(state.inventory);
    });
  };

  const handleDelete = () => { };

  const handleCheckout = () => {
    view.inventoryListEl.addEventListener("click", (event) => {
      if (event.target.className !== "checkout-btn") return;

      model.checkout();
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
