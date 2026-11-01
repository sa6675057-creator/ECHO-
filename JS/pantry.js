

// ========================================
// ECHO - Smart Pantry Management System
// ========================================

const STORAGE_KEY = "echo_products";

// DOM Elements
const productForm = document.getElementById("productForm");
const productFormCard = document.getElementById("productFormCard");
const productsGrid = document.getElementById("productsGrid");

const openFormBtn = document.getElementById("openFormBtn");
const closeFormBtn = document.getElementById("closeFormBtn");
const cancelFormBtn = document.getElementById("cancelFormBtn");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const formTitle = document.getElementById("formTitle");
const saveProductBtn = document.getElementById("saveProductBtn");

// Input Elements
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productQuantity = document.getElementById("productQuantity");
const productUnit = document.getElementById("productUnit");
const productExpiry = document.getElementById("productExpiry");
const productPrice = document.getElementById("productPrice");

// Application State
let products = loadProducts();
let editingId = null;


// ========================================
// 1. Load Products
// ========================================

function loadProducts() {
    try {
        const savedProducts = localStorage.getItem(STORAGE_KEY);

        if (!savedProducts) return [];

        const parsedProducts = JSON.parse(savedProducts);

        return Array.isArray(parsedProducts) ? parsedProducts : [];

    } catch (error) {
        console.error("Could not load products:", error);
        return [];
    }
}


// ========================================
// 2. Save Products + Notify Other Pages
// ========================================

function saveProducts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

        // Notify scripts running in this same page
        window.dispatchEvent(
            new CustomEvent("echoProductsUpdated", {
                detail: { products }
            })
        );

        // Other open tabs receive the native storage event
        return true;

    } catch (error) {
        console.error("Could not save products:", error);
        alert("Unable to save your data. Please check browser storage.");
        return false;
    }
}


// ========================================
// 3. Calculate Expiry Status
// ========================================

function getExpiryStatus(expiryDate) {

    if (!expiryDate) {
        return {
            label: "Unknown",
            className: "status-warning",
            daysLeft: null
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate + "T00:00:00");

    if (Number.isNaN(expiry.getTime())) {
        return {
            label: "Unknown",
            className: "status-warning",
            daysLeft: null
        };
    }

    const difference = expiry.getTime() - today.getTime();

    const daysLeft = Math.round(
        difference / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
        return {
            label: "Expired",
            className: "status-expired",
            daysLeft
        };
    }

    if (daysLeft <= 3) {
        return {
            label: daysLeft === 0 ? "Expires Today" : "Expiring Soon",
            className: "status-warning",
            daysLeft
        };
    }

    return {
        label: "Fresh",
        className: "status-safe",
        daysLeft
    };
}


// ========================================
// 4. Format Date
// ========================================

function formatDate(date) {

    return new Date(date + "T00:00:00").toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// ========================================
// 5. Update Statistics
// ========================================

function updateStatistics() {

    const total = products.length;

    const expiring = products.filter(product => {
        const status = getExpiryStatus(product.expiry);
        return status.daysLeft !== null &&
               status.daysLeft >= 0 &&
               status.daysLeft <= 3;
    }).length;

    const expired = products.filter(product => {
        const status = getExpiryStatus(product.expiry);
        return status.daysLeft !== null &&
               status.daysLeft < 0;
    }).length;

    document.getElementById("totalProducts").textContent = total;

    document.getElementById("expiringProducts").textContent = expiring;

    document.getElementById("expiredProducts").textContent = expired;
}


// ========================================
// 6. Create Product Card
// ========================================

function createProductCard(product) {

    const status = getExpiryStatus(product.expiry);

    const card = document.createElement("article");
    card.className = "product-card";

    const top = document.createElement("div");
    top.className = "product-card-top";

    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = product.category;

    const statusLabel = document.createElement("span");
    statusLabel.className = `product-status ${status.className}`;
    statusLabel.textContent = status.label;

    top.append(category, statusLabel);

    const name = document.createElement("h3");
    name.textContent = product.name;

    const info = document.createElement("div");
    info.className = "product-info";

    const details = [
        ["Quantity", `${product.quantity} ${product.unit}`],
        ["Expiry Date", formatDate(product.expiry)],
        ["Price", `${Number(product.price).toFixed(2)} EGP`]
    ];

    details.forEach(([label, value]) => {

        const row = document.createElement("p");

        const labelElement = document.createElement("span");
        labelElement.textContent = label;

        const valueElement = document.createElement("strong");
        valueElement.textContent = value;

        row.append(labelElement, valueElement);
        info.appendChild(row);

    });

    const actions = document.createElement("div");
    actions.className = "product-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-btn";
    editButton.textContent = "Edit";
    editButton.dataset.action = "edit";
    editButton.dataset.id = product.id;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = product.id;

    actions.append(editButton, deleteButton);

    card.append(top, name, info, actions);

    return card;
}


// ========================================
// 7. Display Products
// ========================================

function renderProducts() {

    productsGrid.replaceChildren();

    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredProducts = products.filter(product => {

        const matchesName = String(product.name || "")
            .toLowerCase()
            .includes(searchTerm);

        const matchesCategory =
            selectedCategory === "All" ||
            product.category === selectedCategory;

        return matchesName && matchesCategory;
    });

    if (filteredProducts.length === 0) {

        const empty = document.createElement("div");
        empty.className = "empty-products";

        const icon = document.createElement("div");
        icon.textContent = "🥗";

        const title = document.createElement("h3");
        title.textContent = products.length === 0
            ? "Your pantry is waiting!"
            : "No matching products found";

        const message = document.createElement("p");
        message.textContent = products.length === 0
            ? "Start by adding your first food product."
            : "Try another search or category.";

        empty.append(icon, title, message);
        productsGrid.appendChild(empty);

        return;
    }

    filteredProducts.forEach(product => {
        productsGrid.appendChild(createProductCard(product));
    });
}


// ========================================
// 8. Open Product Form
// ========================================

function openForm() {

    productFormCard.hidden = false;

    productFormCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    productName.focus();
}


// ========================================
// 9. Reset Form
// ========================================

function resetForm() {

    productForm.reset();

    editingId = null;

    formTitle.textContent = "Add New Product";
    saveProductBtn.textContent = "Save Product";

    productFormCard.hidden = true;
}


// ========================================
// 10. Add / Edit Product
// ========================================

productForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const productData = {
        name: productName.value.trim(),
        category: productCategory.value,
        quantity: Number(productQuantity.value),
        unit: productUnit.value,
        expiry: productExpiry.value,
        price: Number(productPrice.value)
    };

    if (
        !productData.name ||
        !productData.category ||
        !productData.expiry ||
        !Number.isFinite(productData.quantity) ||
        !Number.isFinite(productData.price) ||
        productData.quantity <= 0 ||
        productData.price < 0
    ) {
        alert("Please enter valid product information.");
        return;
    }

    const expiry = new Date(productData.expiry + "T00:00:00");

    if (Number.isNaN(expiry.getTime())) {
        alert("Please enter a valid expiry date.");
        return;
    }

    if (editingId === null) {

        const newProduct = {
            id: crypto.randomUUID(),
            ...productData
        };

        products.push(newProduct);

    } else {

        products = products.map(product =>
            product.id === editingId
                ? { ...product, ...productData }
                : product
        );

    }

    if (!saveProducts()) return;

    renderProducts();
    updateStatistics();
    resetForm();

});


// ========================================
// 11. Edit / Delete Products
// ========================================

productsGrid.addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    const product = products.find(item => item.id === id);

    if (!product) return;

    if (button.dataset.action === "edit") {

        editingId = id;

        productName.value = product.name;
        productCategory.value = product.category;
        productQuantity.value = product.quantity;
        productUnit.value = product.unit;
        productExpiry.value = product.expiry;
        productPrice.value = product.price;

        formTitle.textContent = "Edit Product";
        saveProductBtn.textContent = "Update Product";

        openForm();

    }

    if (button.dataset.action === "delete") {

        const confirmed = confirm(
            `Are you sure you want to delete ${product.name}?`
        );

        if (!confirmed) return;

        products = products.filter(item => item.id !== id);

        if (!saveProducts()) return;

        renderProducts();
        updateStatistics();
    }

});


// ========================================
// 12. Search and Filter
// ========================================

searchInput.addEventListener("input", renderProducts);

categoryFilter.addEventListener("change", renderProducts);


// ========================================
// 13. Form Controls
// ========================================

openFormBtn.addEventListener("click", () => {

    editingId = null;
    productForm.reset();

    formTitle.textContent = "Add New Product";
    saveProductBtn.textContent = "Save Product";

    openForm();
});

closeFormBtn.addEventListener("click", resetForm);

cancelFormBtn.addEventListener("click", resetForm);


// ========================================
// 14. Initialize Application
// ========================================

function initializePantry() {

    renderProducts();
    updateStatistics();

    console.log("ECHO Pantry System is ready!");

}

initializePantry();


// ========================================
// 15. Sync Products From Other Tabs
// ========================================

window.addEventListener("storage", function(event) {

    if (event.key !== STORAGE_KEY) return;

    products = loadProducts();

    renderProducts();
    updateStatistics();

});
