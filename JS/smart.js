
/* =====================================
   ECHO - SMART SUGGESTIONS ENGINE
===================================== */

const STORAGE_KEY = "echo_products";

// HTML Elements
const suggestionsList = document.getElementById("suggestionsList");

const analyzedCount = document.getElementById("analyzedCount");
const priorityCount = document.getElementById("priorityCount");
const savingsValue = document.getElementById("savingsValue");

const refreshButton = document.getElementById("refreshSuggestions");


/* =====================================
   GET PRODUCTS
===================================== */

function getProducts() {
    try {
        const products = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        return Array.isArray(products) ? products : [];

    } catch (error) {
        console.error("Unable to read pantry data:", error);
        return [];
    }
}


/* =====================================
   CALCULATE REMAINING DAYS
===================================== */

function getDaysLeft(expiryDate) {

    if (!expiryDate || typeof expiryDate !== "string") {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate + "T00:00:00");

    if (isNaN(expiry.getTime())) {
        return null;
    }

    return Math.round(
        (expiry - today) / (1000 * 60 * 60 * 24)
    );
}


/* =====================================
   CREATE SUGGESTION CARD
===================================== */

function createSuggestion(icon, title, description, status) {

    const card = document.createElement("article");
    card.className = "suggestion-card";

    const content = document.createElement("div");
    content.className = "suggestion-content";

    const iconElement = document.createElement("div");
    iconElement.className = "suggestion-icon";
    iconElement.textContent = icon;

    const textContainer = document.createElement("div");
    textContainer.className = "suggestion-text";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    textContainer.append(heading, paragraph);
    content.append(iconElement, textContainer);

    const badge = document.createElement("span");
    badge.className = "suggestion-status " + status.className;
    badge.textContent = status.label;

    card.append(content, badge);

    return card;
}


/* =====================================
   EMPTY STATE
===================================== */

function showEmptyState(title, description, icon = "✧") {

    suggestionsList.innerHTML = "";

    const empty = document.createElement("div");
    empty.className = "suggestion-empty";

    const emptyIcon = document.createElement("div");
    emptyIcon.textContent = icon;

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    empty.append(emptyIcon, heading, paragraph);

    suggestionsList.appendChild(empty);
}


/* =====================================
   GENERATE SMART RECOMMENDATIONS
===================================== */

function generateSuggestions() {

    if (!suggestionsList) return;

    const products = getProducts();

    suggestionsList.innerHTML = "";

    let priorityProducts = 0;
    let potentialSavings = 0;

    if (analyzedCount) {
        analyzedCount.textContent = products.length;
    }

    if (products.length === 0) {

        if (priorityCount) {
            priorityCount.textContent = "0";
        }

        if (savingsValue) {
            savingsValue.textContent = "0.00 EGP";
        }

        showEmptyState(
            "Your pantry is waiting!",
            "Add food products to receive personalized suggestions."
        );

        return;
    }

    const recommendations = [];

    products.forEach(product => {

        const daysLeft = getDaysLeft(product.expiry);

        const name = product.name || "Unnamed Product";
        const category = product.category || "Other";
        const price = Math.max(0, Number(product.price) || 0);

        let recommendation = null;

        /* Expired products */

        if (daysLeft !== null && daysLeft < 0) {

            priorityProducts++;

            recommendation = {
                priority: 1,
                icon: "⚠️",
                title: name,
                description:
                    "This product is past its expiry date. Do not consume it. Remove it from your inventory and follow appropriate disposal guidance.",
                status: {
                    label: "Expired",
                    className: "status-high"
                }
            };

        }

        /* Products expiring today */

        else if (daysLeft === 0) {

            priorityProducts++;
            potentialSavings += price;

            recommendation = {
                priority: 2,
                icon: "⏰",
                title: name,
                description:
                    "This product expires today. Check its condition and storage instructions, and follow food safety guidance before deciding whether it can be used.",
                status: {
                    label: "Urgent",
                    className: "status-high"
                }
            };

        }

        /* Products expiring within 3 days */

        else if (daysLeft !== null && daysLeft <= 3) {

            priorityProducts++;
            potentialSavings += price;

            recommendation = {
                priority: 3,
                icon: "🥛",
                title: name,
                description:
                    "This product expires in " + daysLeft +
                    " day(s). Plan to use it before its expiry date and follow its storage instructions.",
                status: {
                    label: "High Priority",
                    className: "status-high"
                }
            };

        }

        /* Products expiring within 7 days */

        else if (daysLeft !== null && daysLeft <= 7) {

            recommendation = {
                priority: 4,
                icon: "📅",
                title: name,
                description:
                    "This product expires in " + daysLeft +
                    " days. Include it in your upcoming meal plan.",
                status: {
                    label: "Medium Priority",
                    className: "status-medium"
                }
            };

        }

        /* Invalid or missing expiry date */

        else if (daysLeft === null) {

            priorityProducts++;

            recommendation = {
                priority: 5,
                icon: "📋",
                title: name,
                description:
                    "The expiry date is missing or invalid. Update the product information so ECHO can analyze it correctly.",
                status: {
                    label: "Check Date",
                    className: "status-medium"
                }
            };

        }

        /* Safe products */

        else {

            const tips = {

                Dairy:
                    "Keep this product refrigerated according to its label and check its storage instructions.",

                Vegetables:
                    "Store this product under suitable conditions to maintain freshness and reduce spoilage.",

                Fruits:
                    "Check the best storage conditions for this fruit and organize it by ripeness.",

                Meat:
                    "Follow the recommended refrigeration or freezing instructions and avoid unsafe storage.",

                Grains:
                    "Keep this product in a cool, dry and sealed storage area.",

                Other:
                    "Keep this product properly stored and monitor its expiry date."
            };

            recommendation = {
                priority: 6,
                icon: "🌿",
                title: name,
                description: tips[category] || tips.Other,
                status: {
                    label: "Safe",
                    className: "status-low"
                }
            };
        }

        if (recommendation) {
            recommendations.push(recommendation);
        }

    });


    /* Sort recommendations by priority */

    recommendations.sort((a, b) => a.priority - b.priority);


    /* Display recommendations */

    recommendations.forEach(item => {

        const card = createSuggestion(
            item.icon,
            item.title,
            item.description,
            item.status
        );

        suggestionsList.appendChild(card);

    });


    /* Update statistics */

    if (priorityCount) {
        priorityCount.textContent = priorityProducts;
    }

    if (savingsValue) {
        savingsValue.textContent =
            potentialSavings.toFixed(2) + " EGP";
    }

}


/* =====================================
   REFRESH BUTTON
===================================== */

if (refreshButton) {

    refreshButton.addEventListener("click", () => {

        generateSuggestions();

        refreshButton.textContent = "✓ Updated";
        refreshButton.disabled = true;

        setTimeout(() => {
            refreshButton.textContent = "↻ Refresh";
            refreshButton.disabled = false;
        }, 1500);

    });

}


/* =====================================
   LIVE DATA SYNCHRONIZATION
===================================== */

// Updates when another tab changes pantry data
window.addEventListener("storage", function(event) {

    if (event.key === STORAGE_KEY || event.key === null) {
        generateSuggestions();
    }

});

// Updates when pantry data changes in the same page
window.addEventListener("echoProductsUpdated", function() {
    generateSuggestions();
});

// Refresh when the user returns to this page
window.addEventListener("focus", generateSuggestions);


/* =====================================
   INITIALIZE
===================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        generateSuggestions,
        { once: true }
    );

} else {

    generateSuggestions();

}
