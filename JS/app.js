
const STORAGE_KEY = "echo_products";

// ========================================
// 1. GET SAVED PRODUCTS
// ========================================

function getDashboardProducts() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const products = data ? JSON.parse(data) : [];

        return Array.isArray(products) ? products : [];

    } catch (error) {
        console.error("Dashboard data error:", error);
        return [];
    }
}


// ========================================
// 2. CALCULATE EXPIRY STATUS
// ========================================

function calculateStatus(expiryDate) {

    if (!expiryDate) return "unknown";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate + "T00:00:00");

    if (Number.isNaN(expiry.getTime())) return "unknown";

    const daysLeft = Math.round(
        (expiry - today) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) return "expired";

    if (daysLeft <= 3) return "expiring";

    return "safe";
}


// ========================================
// 3. CALCULATE DAYS REMAINING
// ========================================

function getDaysRemaining(expiryDate) {

    if (!expiryDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate + "T00:00:00");

    if (Number.isNaN(expiry.getTime())) return null;

    return Math.round(
        (expiry - today) / (1000 * 60 * 60 * 24)
    );
}


// ========================================
// 4. DISPLAY EARLY EXPIRY WARNING
// ========================================

function displayExpiryOverview(products) {

    const container = document.getElementById("dashboardExpiryList");

    if (!container) return;

    const upcomingProducts = products
        .filter(product => {

            const daysLeft = getDaysRemaining(product.expiry);

            return daysLeft !== null &&
                   daysLeft >= 0 &&
                   daysLeft <= 7;

        })
        .sort((a, b) =>
            getDaysRemaining(a.expiry) -
            getDaysRemaining(b.expiry)
        )
        .slice(0, 4);

    if (upcomingProducts.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">◷</div>
                <h3>No upcoming expiry products</h3>
                <p>Products expiring within the next 7 days will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = upcomingProducts.map(product => {

        const daysLeft = getDaysRemaining(product.expiry);

        let expiryText;

        if (daysLeft === 0) {
            expiryText = "Expires today";
        } else if (daysLeft === 1) {
            expiryText = "1 day left";
        } else {
            expiryText = `${daysLeft} days left`;
        }

        return `
            <div class="expiry-item">
                <div class="expiry-product-info">
                    <strong>${escapeHTML(product.name || "Unnamed product")}</strong>
                    <span>${escapeHTML(product.category || "Uncategorized")}</span>
                </div>

                <span class="expiry-badge">${expiryText}</span>
            </div>
        `;

    }).join("");
}


// ========================================
// 5. ESCAPE HTML
// ========================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);

}


// ========================================
// 6. CALCULATE INTELLIGENCE SCORE
// ========================================

function calculateIntelligenceScore(products) {

    if (products.length === 0) return 100;

    const safe = products.filter(product =>
        calculateStatus(product.expiry) === "safe"
    ).length;

    const expiring = products.filter(product =>
        calculateStatus(product.expiry) === "expiring"
    ).length;

    const expired = products.filter(product =>
        calculateStatus(product.expiry) === "expired"
    ).length;

    const unknown = products.length - safe - expiring - expired;

    const score = Math.round(
        (
            (safe * 100) +
            (expiring * 50) +
            (expired * 0) +
            (unknown * 25)
        ) / products.length
    );

    return score;
}


// ========================================
// 7. DISPLAY INTELLIGENCE SCORE
// ========================================

function displayIntelligenceScore(products) {

    const score = calculateIntelligenceScore(products);

    const scoreElement = document.getElementById("dashboardScore");
    const scoreBar = document.getElementById("dashboardScoreBar");
    const scoreMessage = document.getElementById("dashboardScoreMessage");

    if (!scoreElement || !scoreBar || !scoreMessage) return;

    scoreElement.textContent = score;

    scoreBar.style.width = score + "%";

    let message;

    if (products.length === 0) {

        message = "Add products to start tracking your food management.";

    } else if (score >= 80) {

        message = "Great! Your pantry is in good condition.";

    } else if (score >= 50) {

        message = "Good progress. Some products need your attention.";

    } else {

        message = "Your pantry needs attention to reduce food waste.";

    }

    scoreMessage.textContent = message;
}


// ========================================
// 8. UPDATE DASHBOARD
// ========================================

function updateDashboard() {

    const products = getDashboardProducts();

    const total = products.length;

    // Products expiring within 3 days
    const expiring = products.filter(product =>
        calculateStatus(product.expiry) === "expiring"
    );

    // Expired products
    const expired = products.filter(product =>
        calculateStatus(product.expiry) === "expired"
    );

    // Calculate potential waste
    const potentialWaste = expired.reduce(
        (sum, product) => {

            const price = Number(product.price);

            return sum + (
                Number.isFinite(price) && price > 0
                    ? price
                    : 0
            );

        },
        0
    );

    // Update statistics
    document.getElementById("dashboardTotal").textContent = total;

    document.getElementById("dashboardExpiring").textContent =
        expiring.length;

    document.getElementById("dashboardExpired").textContent =
        expired.length;

    document.getElementById("dashboardWaste").textContent =
        potentialWaste.toFixed(2) + " EGP";

    // Update dashboard sections
    displayExpiryOverview(products);
    displayIntelligenceScore(products);

}


// ========================================
// 9. LIVE DATA SYNC
// ========================================

// Receive updates from other browser tabs
window.addEventListener("storage", function(event) {

    if (event.key === STORAGE_KEY) {
        updateDashboard();
        console.log("ECHO Dashboard synchronized!");
    }

});


// Receive updates from scripts in the same page
window.addEventListener("echoProductsUpdated", function() {

    updateDashboard();

});


// ========================================
// 10. START DASHBOARD
// ========================================

document.addEventListener("DOMContentLoaded", updateDashboard);

