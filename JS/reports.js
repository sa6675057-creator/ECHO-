

// =====================================
// ECHO - Reports & Analytics
// =====================================

const STORAGE_KEY = "echo_products";


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
        console.error("Could not read products:", error);
        return [];
    }
}


/* =====================================
   CALCULATE REMAINING DAYS
===================================== */

function getDaysLeft(expiryDate) {

    if (
        !expiryDate ||
        typeof expiryDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)
    ) {
        return null;
    }

    const [year, month, day] = expiryDate
        .split("-")
        .map(Number);

    // Create a local date to avoid UTC timezone issues
    const expiry = new Date(year, month - 1, day);

    // Validate the actual calendar date
    if (
        expiry.getFullYear() !== year ||
        expiry.getMonth() !== month - 1 ||
        expiry.getDate() !== day
    ) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.round(
        (expiry - today) / (1000 * 60 * 60 * 24)
    );
}


/* =====================================
   FORMAT MONEY
===================================== */

function formatMoney(value) {

    const amount = Number(value) || 0;

    return `${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} EGP`;
}


/* =====================================
   ANALYZE PRODUCTS
===================================== */

function analyzeProducts() {

    const products = getProducts();

    let safe = 0;
    let atRisk = 0;
    let expired = 0;
    let invalid = 0;

    let inventoryValue = 0;
    let wasteValue = 0;
    let potentialSavings = 0;

    const categories = {};

    products.forEach(product => {

        const price = Math.max(
            0,
            Number(product.price) || 0
        );

        const daysLeft = getDaysLeft(product.expiry);

        inventoryValue += price;

        const category = product.category || "Other";

        categories[category] =
            (categories[category] || 0) + 1;


        // Invalid or missing expiry date

        if (daysLeft === null) {

            invalid++;

        }

        // Expired products

        else if (daysLeft < 0) {

            expired++;
            wasteValue += price;

        }

        // Products expiring within 3 days

        else if (daysLeft <= 3) {

            atRisk++;
            potentialSavings += price;

        }

        // Safe products

        else {

            safe++;

        }

    });

    return {
        products,
        safe,
        atRisk,
        expired,
        invalid,
        inventoryValue,
        wasteValue,
        potentialSavings,
        categories
    };
}


/* =====================================
   UPDATE STATISTICS
===================================== */

function updateStatistics(data) {

    const elements = {
        reportTotalProducts: data.products.length,
        reportSafeProducts: data.safe,
        reportAtRiskProducts: data.atRisk,
        reportExpiredProducts: data.expired,
        reportInventoryValue: formatMoney(data.inventoryValue),
        reportWasteValue: formatMoney(data.wasteValue),
        reportPotentialSavings: formatMoney(data.potentialSavings)
    };

    Object.entries(elements).forEach(([id, value]) => {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }

    });

}


/* =====================================
   ESCAPE HTML
===================================== */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);

}


/* =====================================
   CATEGORY ANALYSIS
===================================== */

function renderCategoryChart(categories) {

    const container = document.getElementById("categoryChart");

    if (!container) return;

    const entries = Object.entries(categories);

    if (entries.length === 0) {

        container.innerHTML =
            "<p>No category data available yet.</p>";

        return;
    }

    const total = entries.reduce(
        (sum, item) => sum + item[1],
        0
    );

    // Display categories with the largest number of products first

    entries.sort((a, b) => b[1] - a[1]);

    container.innerHTML = entries.map(([category, count]) => {

        const percentage = total
            ? (count / total) * 100
            : 0;

        return `
            <div class="chart-item">

                <div class="chart-info">
                    <span>${escapeHTML(category)}</span>

                    <strong>
                        ${count} (${percentage.toFixed(0)}%)
                    </strong>
                </div>

                <div class="chart-track">
                    <div
                        class="chart-fill"
                        style="width: ${percentage}%">
                    </div>
                </div>

            </div>
        `;

    }).join("");

}


/* =====================================
   EXPIRY BREAKDOWN
===================================== */

function renderExpiryBreakdown(data) {

    const container = document.getElementById("expiryBreakdown");

    if (!container) return;

    if (data.products.length === 0) {

        container.innerHTML =
            "<p>No expiry data available yet.</p>";

        return;
    }

    container.innerHTML = `

        <div class="expiry-item">
            <span>Safe Products</span>
            <strong>${data.safe}</strong>
        </div>

        <div class="expiry-item">
            <span>Expiring Within 3 Days</span>
            <strong>${data.atRisk}</strong>
        </div>

        <div class="expiry-item">
            <span>Expired Products</span>
            <strong>${data.expired}</strong>
        </div>

        <div class="expiry-item">
            <span>Missing / Invalid Expiry Date</span>
            <strong>${data.invalid}</strong>
        </div>

        <div class="expiry-item">
            <span>Total Products</span>
            <strong>${data.products.length}</strong>
        </div>

    `;

}


/* =====================================
   SMART REPORT INSIGHTS
===================================== */

function renderInsights(data) {

    const container = document.getElementById("reportInsights");

    if (!container) return;

    const insights = [];

    if (data.products.length === 0) {

        container.innerHTML =
            "<p>Your insights will appear here when you add products.</p>";

        return;
    }


    // Expired products

    if (data.expired > 0) {

        insights.push(
            `You have ${data.expired} expired product(s). Review them and remove them from your usable inventory.`
        );

    } else {

        insights.push(
            "Great! You currently have no expired products."
        );

    }


    // At-risk products

    if (data.atRisk > 0) {

        insights.push(
            `${data.atRisk} product(s) are expiring within 3 days. Plan to use them before their expiry date.`
        );

    } else {

        insights.push(
            "No products are currently at risk of expiring within 3 days."
        );

    }


    // Invalid expiry dates

    if (data.invalid > 0) {

        insights.push(
            `${data.invalid} product(s) have missing or invalid expiry dates. Update their information for accurate analysis.`
        );

    }


    // Waste value

    if (data.wasteValue > 0) {

        insights.push(
            `Your recorded expired-product value is ${formatMoney(data.wasteValue)}.`
        );

    }


    // Potential savings

    if (data.potentialSavings > 0) {

        insights.push(
            `You could potentially protect ${formatMoney(data.potentialSavings)} by using at-risk products in time.`
        );

    }


    // Inventory overview

    insights.push(
        `Your current recorded inventory value is ${formatMoney(data.inventoryValue)}.`
    );


    container.innerHTML = insights.map(insight =>

        `<div class="insight-item">${escapeHTML(insight)}</div>`

    ).join("");

}


/* =====================================
   CSV EXPORT
===================================== */

function exportCSV() {

    const products = getProducts();

    if (products.length === 0) {

        alert("There are no products to export yet.");
        return;

    }

    const headers = [
        "Product Name",
        "Category",
        "Quantity",
        "Unit",
        "Expiry Date",
        "Price (EGP)",
        "Status"
    ];


    // Protect spreadsheet exports from formula injection

    function safeCSVValue(value) {

        let text = String(value ?? "");

        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return `"${text.replace(/"/g, '""')}"`;

    }


    const rows = products.map(product => {

        const daysLeft = getDaysLeft(product.expiry);

        let status;

        if (daysLeft === null) {
            status = "Unknown";
        } else if (daysLeft < 0) {
            status = "Expired";
        } else if (daysLeft <= 3) {
            status = "At Risk";
        } else {
            status = "Safe";
        }

        return [
            product.name || "",
            product.category || "",
            product.quantity ?? "",
            product.unit || "",
            product.expiry || "",
            product.price ?? "",
            status
        ];

    });


    const csvContent = [headers, ...rows]

        .map(row =>
            row.map(safeCSVValue).join(",")
        )

        .join("\r\n");


    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "ECHO-Inventory-Report.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);

}


/* =====================================
   GENERATE REPORT
===================================== */

function generateReport() {

    const data = analyzeProducts();

    updateStatistics(data);

    renderCategoryChart(data.categories);

    renderExpiryBreakdown(data);

    renderInsights(data);

}


/* =====================================
   LIVE DATA SYNCHRONIZATION
===================================== */

// Update when another tab changes pantry data

window.addEventListener("storage", function(event) {

    if (event.key === STORAGE_KEY || event.key === null) {
        generateReport();
    }

});


// Update when pantry data changes in the same document

window.addEventListener("echoProductsUpdated", function() {
    generateReport();
});


// Refresh when returning to the Reports page

window.addEventListener("focus", generateReport);


/* =====================================
   INITIALIZE
===================================== */

function initializeReports() {

    generateReport();

    const refreshButton =
        document.getElementById("refreshReportBtn");

    const exportButton =
        document.getElementById("exportCsvBtn");


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            generateReport
        );

    }


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportCSV
        );

    }

}


if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeReports,
        { once: true }
    );

} else {

    initializeReports();

}
