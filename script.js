
const API = "/api/complaints";

let complaints = [];

const pages = document.querySelectorAll(".page");
const buttons = document.querySelectorAll("nav button");

function showPage(name) {
    pages.forEach(page => page.classList.remove("active"));

    document.getElementById(name).classList.add("active");

    buttons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === name
        );
    });

    const titles = {
        dashboard: "Dashboard",
        complaints: "All Complaints",
        submit: "Submit Complaint"
    };

    document.getElementById("page-title").textContent = titles[name];
}

buttons.forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.goto);
    });
});

async function loadComplaints() {
    try {
        const response = await fetch(API);

        if (!response.ok) {
            throw new Error("Unable to load complaints");
        }

        complaints = await response.json();

        updateDashboard();
        renderComplaints();

    } catch (error) {
        document.getElementById("recent-list").innerHTML =
            '<p class="empty-message">Server connection failed. Start Python server.</p>';
    }
}

function updateDashboard() {
    document.getElementById("total-count").textContent =
        complaints.length;

    document.getElementById("pending-count").textContent =
        complaints.filter(c => c.status === "Pending").length;

    document.getElementById("progress-count").textContent =
        complaints.filter(c => c.status === "In Progress").length;

    document.getElementById("resolved-count").textContent =
        complaints.filter(c => c.status === "Resolved").length;
}

function createCard(c) {
    const card = document.createElement("div");
    card.className = "complaint-card";

    const top = document.createElement("div");
    top.className = "complaint-top";

    const heading = document.createElement("h3");
    heading.textContent = c.category;

    const status = document.createElement("span");
    status.className = "status " + c.status.replaceAll(" ", "-");
    status.textContent = c.status;

    top.append(heading, status);

    const desc = document.createElement("p");
    desc.textContent = c.description;

    const meta = document.createElement("div");
    meta.className = "complaint-meta";
    meta.textContent =
        "Complaint #" + c.id + " | " +
        c.student_name + " | " + c.student_class;

    card.append(top, desc, meta);

    return card;
}

function renderComplaints() {
    const recent = document.getElementById("recent-list");
    const all = document.getElementById("all-list");

    recent.replaceChildren();
    all.replaceChildren();

    const latest = complaints.slice(0, 4);

    if (latest.length === 0) {
        recent.innerHTML =
            '<p class="empty-message">No complaints yet.</p>';
    }

    latest.forEach(c => recent.appendChild(createCard(c)));

    const filter = document.getElementById("filter-status").value;

    const filtered = complaints.filter(c =>
        filter === "All" || c.status === filter
    );

    if (filtered.length === 0) {
        all.innerHTML =
            '<p class="empty-message">No complaints found.</p>';
    }

    filtered.forEach(c => all.appendChild(createCard(c)));
}

document.getElementById("filter-status")
.addEventListener("change", renderComplaints);

document.getElementById("complaint-form")
.addEventListener("submit", async function(e) {

    e.preventDefault();

    const data = {
        student_name: document.getElementById("student-name").value.trim(),
        student_class: document.getElementById("student-class").value.trim(),
        category: document.getElementById("category").value,
        description: document.getElementById("description").value.trim()
    };

    const message = document.getElementById("form-message");
    const submitButton = this.querySelector(".submit-btn");

    if (!data.student_name || !data.student_class ||
        !data.category || !data.description) {
        message.textContent = "Please fill all fields.";
        message.style.color = "red";
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        const response = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Submission failed");
        }

        message.textContent =
            "Complaint submitted! Your ID is: " + result.id;

        message.style.color = "green";

        this.reset();

        await loadComplaints();

        setTimeout(() => showPage("dashboard"), 1800);

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Complaint";
    }
});

loadComplaints();