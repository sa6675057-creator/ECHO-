
const STORAGE_KEY = "echo_products";

const expiryProducts = document.getElementById("expiryProducts");

let currentFilter = "all";

function getProducts() {

    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        const products = saved ? JSON.parse(saved) : [];

        return Array.isArray(products) ? products : [];

    } catch (error) {
        console.error("Unable to read pantry:", error);
        return [];
    }
}


// Calculate remaining days

function getDaysLeft(date) {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(date + "T00:00:00");

    if (Number.isNaN(expiry.getTime())) {
        return null;
    }

    return Math.round(
        (expiry - today) / (1000 * 60 * 60 * 24)
    );
}


// Determine product status

function getStatus(days) {

    if (days === null) return "invalid";

    if (days < 0) return "expired";

    if (days <= 3) return "expiring";

    return "safe";
}


// Format dates

function formatExpiryDate(date) {

    const parsedDate = new Date(date + "T00:00:00");

    if (Number.isNaN(parsedDate.getTime())) {
        return "Invalid date";
    }

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// Update statistics

function updateExpiryStats(products) {

    let expiring = 0;
    let expired = 0;
    let safe = 0;

    products.forEach(product => {

        const status = getStatus(
            getDaysLeft(product.expiry)
        );

        if (status === "expiring") expiring++;

        if (status === "expired") expired++;

        if (status === "safe") safe++;

    });

    document.getElementById("expiryTotal").textContent =
        products.length;

    document.getElementById("expirySoon").textContent =
        expiring;

    document.getElementById("expiryExpired").textContent =
        expired;

    document.getElementById("expirySafe").textContent =
        safe;
}


// Create product card

function createExpiryCard(product) {

    const days = getDaysLeft(product.expiry);

    const status = getStatus(days);

    const labels = {
        safe: "Safe",
        expiring: "Expiring Soon",
        expired: "Expired",
        invalid: "Invalid Date"
    };

    const card = document.createElement("article");

    card.className = "expiry-product-card";

    const top = document.createElement("div");
    top.className = "expiry-card-top";

    const category = document.createElement("span");
    category.className = "expiry-category";
    category.textContent = product.category || "Other";

    const badge = document.createElement("span");
    badge.className = `expiry-status ${status}`;
    badge.textContent = labels[status];

    top.append(category, badge);

    const name = document.createElement("h3");
    name.textContent = product.name;

    const details = document.createElement("div");
    details.className = "expiry-details";

    const rows = [
        ["Quantity", `${product.quantity} ${product.unit}`],
        ["Expiry Date", formatExpiryDate(product.expiry)],
        ["Price", `${Number(product.price || 0).toFixed(2)} EGP`]
    ];

    rows.forEach(([label, value]) => {

        const row = document.createElement("p");

        const labelElement = document.createElement("span");
        labelElement.textContent = label;

        const valueElement = document.createElement("strong");
        valueElement.textContent = value;

        row.append(labelElement, valueElement);

        details.appendChild(row);

    });

    const countdown = document.createElement("div");

    countdown.className = `expiry-countdown ${status}`;

    if (status === "expired") {

        countdown.textContent =
            `Expired ${Math.abs(days)} day(s) ago`;

    } else if (status === "expiring") {

        countdown.textContent = days === 0
            ? "Expires today"
            : `${days} day(s) remaining`;

    } else if (status === "safe") {

        countdown.textContent =
            `${days} days remaining`;

    } else {

        countdown.textContent = "Check expiry date";

    }

    card.append(top, name, details, countdown);

    return card;
}


// Render products

function renderExpiryProducts() {

    const products = getProducts();

    expiryProducts.replaceChildren();

    const validProducts = products
        .map(product => ({
            ...product,
            daysLeft: getDaysLeft(product.expiry)
        }))
        .filter(product => product.daysLeft !== null)
        .sort((a, b) => a.daysLeft - b.daysLeft);

    const filteredProducts = validProducts.filter(product => {

        const status = getStatus(product.daysLeft);

        return currentFilter === "all" ||
            status === currentFilter;

    });

    if (filteredProducts.length === 0) {

        const empty = document.createElement("div");

        empty.className = "expiry-empty";

        const icon = document.createElement("div");
        icon.textContent = "🌿";

        const title = document.createElement("h3");
        title.textContent = products.length === 0
            ? "Your pantry is empty"
            : "No products found";

        const message = document.createElement("p");
        message.textContent = products.length === 0
            ? "Add products to My Pantry to track their expiry dates."
            : "There are no products in this category.";

        empty.append(icon, title, message);

        expiryProducts.appendChild(empty);

        return;
    }

    filteredProducts.forEach(product => {

        expiryProducts.appendChild(
            createExpiryCard(product)
        );

    });

}


// Filter buttons

document.querySelectorAll(".expiry-filter").forEach(button => {

    button.addEventListener("click", () => {

        currentFilter = button.dataset.filter;

        document.querySelectorAll(".expiry-filter").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        renderExpiryProducts();

    });

});


// Initialize

function initializeExpiryTracker() {

    const products = getProducts();

    updateExpiryStats(products);

    renderExpiryProducts();

    console.log("ECHO Expiry Tracker is ready!");

}

initializeExpiryTracker();
