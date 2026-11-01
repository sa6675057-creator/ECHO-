

/* ==========================================
   ECHO - WASTE ANALYZER
   Smart Food Waste Intelligence
========================================== */

const STORAGE_KEY = "echo_products";

// DOM Elements
const totalWasteValue = document.getElementById("totalWasteValue");
const atRiskValue = document.getElementById("atRiskValue");
const wastedProducts = document.getElementById("wastedProducts");
const potentialSavings = document.getElementById("potentialSavings");

const categoryAnalysis = document.getElementById("categoryAnalysis");

const wasteScore = document.getElementById("wasteScore");
const scoreProgress = document.getElementById("scoreProgress");
const scoreMessage = document.getElementById("scoreMessage");

const recommendationsList = document.getElementById("recommendationsList");


/* ==========================================
   1. LOAD PANTRY DATA
========================================== */

function loadPantryProducts() {
    try {
        const storedProducts = localStorage.getItem(STORAGE_KEY);

        if (!storedProducts) return [];

        const products = JSON.parse(storedProducts);

        return Array.isArray(products) ? products : [];

    } catch (error) {
        console.error("Error loading pantry data:", error);
        return [];
    }
}


/* ==========================================
   2. EXPIRY STATUS
========================================== */

function getProductStatus(expiryDate) {

    if (!expiryDate) return "invalid";

    const expiry = new Date(expiryDate + "T00:00:00");

    if (Number.isNaN(expiry.getTime())) return "invalid";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysLeft = Math.round(
        (expiry - today) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) return "expired";

    if (daysLeft <= 3) return "at-risk";

    return "safe";
}


/* ==========================================
   3. FORMAT CURRENCY
========================================== */

function formatMoney(value) {

    return Number(value || 0).toLocaleString("en-EG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " EGP";

}


/* ==========================================
   4. CALCULATE WASTE STATISTICS
========================================== */

function calculateWaste(products) {

    let expiredValue = 0;
    let atRiskTotal = 0;
    let totalPantryValue = 0;

    let expiredCount = 0;

    const expiredCategories = {};

    products.forEach(product => {

        const price = Number(product.price);

        if (!Number.isFinite(price) || price < 0) return;

        const status = getProductStatus(product.expiry);

        totalPantryValue += price;

        if (status === "expired") {

            expiredValue += price;
            expiredCount++;

            const category = product.category || "Other";

            expiredCategories[category] =
                (expiredCategories[category] || 0) + price;

        }

        else if (status === "at-risk") {

            atRiskTotal += price;

        }

    });

    return {
        expiredValue,
        atRiskTotal,
        expiredCount,
        totalPantryValue,
        expiredCategories
    };

}


/* ==========================================
   5. UPDATE STATISTICS
========================================== */

function updateStatistics(data) {

    totalWasteValue.textContent =
        formatMoney(data.expiredValue);

    atRiskValue.textContent =
        formatMoney(data.atRiskTotal);

    wastedProducts.textContent =
        data.expiredCount;

    potentialSavings.textContent =
        formatMoney(data.atRiskTotal);

}


/* ==========================================
   6. CATEGORY ANALYSIS
========================================== */

function renderCategoryAnalysis(categories) {

    categoryAnalysis.replaceChildren();

    const entries = Object.entries(categories)
        .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {

        const empty = document.createElement("div");

        empty.className = "analytics-empty";

        empty.textContent =
            "No expired products found. Great job protecting your food!";

        categoryAnalysis.appendChild(empty);

        return;
    }

    const maxValue = Math.max(...entries.map(item => item[1]));

    entries.forEach(([category, value]) => {

        const percentage = (value / maxValue) * 100;

        const row = document.createElement("div");
        row.className = "category-row";

        const info = document.createElement("div");
        info.className = "category-info";

        const name = document.createElement("span");
        name.textContent = category;

        const amount = document.createElement("strong");
        amount.textContent = formatMoney(value);

        info.append(name, amount);

        const progress = document.createElement("div");
        progress.className = "category-progress";

        const bar = document.createElement("div");
        bar.className = "category-progress-bar";

        bar.style.width = percentage + "%";

        progress.appendChild(bar);

        row.append(info, progress);

        categoryAnalysis.appendChild(row);

    });

}


/* ==========================================
   7. FOOD WASTE INTELLIGENCE SCORE
   Same formula used in Dashboard
========================================== */

function calculateWasteScore(data, products) {

    if (products.length === 0) {

        return {
            score: 100,
            message: "Add products to start tracking your food management."
        };

    }

    const safe = products.filter(product =>
        getProductStatus(product.expiry) === "safe"
    ).length;

    const expiring = products.filter(product =>
        getProductStatus(product.expiry) === "at-risk"
    ).length;

    const expired = products.filter(product =>
        getProductStatus(product.expiry) === "expired"
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

    let message;

    if (score >= 80) {

        message = "Great! Your pantry is in good condition.";

    } else if (score >= 50) {

        message = "Good progress. Some products need your attention.";

    } else {

        message = "Your pantry needs attention to reduce food waste.";

    }

    return { score, message };

}


/* ==========================================
   8. DISPLAY INTELLIGENCE SCORE
========================================== */

function renderWasteScore(data, products) {

    const result = calculateWasteScore(data, products);

    wasteScore.textContent = result.score;

    scoreProgress.style.width = result.score + "%";

    scoreMessage.textContent = result.message;

}


/* ==========================================
   9. SMART RECOMMENDATIONS
========================================== */

function renderRecommendations(products) {

    recommendationsList.replaceChildren();

    if (products.length === 0) {

        addRecommendation(
            "🥗",
            "Start Your Food Journey",
            "Add your first food products to receive personalized recommendations."
        );

        return;
    }

    const expired = [];
    const atRisk = [];

    products.forEach(product => {

        const status = getProductStatus(product.expiry);

        if (status === "expired") {

            expired.push(product);

        }

        else if (status === "at-risk") {

            atRisk.push(product);

        }

    });


    // Expired products

    if (expired.length > 0) {

        addRecommendation(
            "⚠️",
            "Expired Products Detected",
            `You have ${expired.length} expired product(s). Review them and avoid consuming products past their expiry date.`
        );

    }


    // Products approaching expiry

    if (atRisk.length > 0) {

        const names = atRisk
            .slice(0, 3)
            .map(product => product.name || "Unnamed product")
            .join(", ");

        addRecommendation(
            "⏰",
            "Prioritize These Products",
            `${names} are approaching their expiry dates. Plan to use them before their expiry dates, following proper food storage guidance.`
        );

    }


    // Safe products

    const safeCount = products.filter(product =>
        getProductStatus(product.expiry) === "safe"
    ).length;

    if (safeCount > 0) {

        addRecommendation(
            "🌿",
            "Keep Up The Good Work",
            `${safeCount} product(s) are currently within their recorded expiry dates. Continue monitoring your pantry regularly.`
        );

    }


    // All products safe

    if (expired.length === 0 && atRisk.length === 0) {

        addRecommendation(
            "✨",
            "Your Pantry Looks Good",
            "No expired or soon-to-expire products were detected in your current inventory."
        );

    }

}


/* ==========================================
   10. CREATE RECOMMENDATION CARD
========================================== */

function addRecommendation(icon, title, description) {

    const card = document.createElement("div");

    card.className = "recommendation-card";

    const iconElement = document.createElement("div");

    iconElement.className = "recommendation-icon";

    iconElement.textContent = icon;

    const content = document.createElement("div");

    content.className = "recommendation-content";

    const heading = document.createElement("h3");

    heading.textContent = title;

    const paragraph = document.createElement("p");

    paragraph.textContent = description;

    content.append(heading, paragraph);

    card.append(iconElement, content);

    recommendationsList.appendChild(card);

}


/* ==========================================
   11. INITIALIZE WASTE ANALYZER
========================================== */

function initializeWasteAnalyzer() {

    const products = loadPantryProducts();

    const data = calculateWaste(products);

    updateStatistics(data);

    renderCategoryAnalysis(data.expiredCategories);

    renderWasteScore(data, products);

    renderRecommendations(products);

}


/* ==========================================
   12. LIVE DATA SYNC
========================================== */

// Update when products change in another browser tab
window.addEventListener("storage", function(event) {

    if (event.key === STORAGE_KEY || event.key === null) {

        initializeWasteAnalyzer();

        console.log("ECHO Waste Analyzer synchronized!");

    }

});


// Listen for updates from scripts in the same document
window.addEventListener("echoProductsUpdated", function() {

    initializeWasteAnalyzer();

    console.log("ECHO Waste Analyzer updated!");

});


/* ==========================================
   13. START APPLICATION
========================================== */

initializeWasteAnalyzer();
