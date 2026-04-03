class ProposalManager {
    constructor() {
        this.init();
    }

    async init() {
        this.setDefaultDate();
        await this.loadEditData();
        this.bindEvents();
        this.toggleCostSections();
    }

    // ✅ Auto set today's date
    setDefaultDate() {
        const dateInput = document.getElementById("proposal_date");
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    // ✅ Load edit data if exists
    async loadEditData() {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');

        if (editId) {
            try {
                console.log("✏️ Editing ID:", editId);

                const response = await fetch(`/api/proposals/${editId}`);
                if (!response.ok) throw new Error("Failed to fetch proposal");

                const data = await response.json();
                this.populateForm(data);

            } catch (error) {
                console.error('❌ Failed to load edit data:', error);
                alert('Failed to load proposal for editing');
            }
        }
    }

    // ✅ Fill form fields
    populateForm(data) {
        Object.entries(data).forEach(([key, value]) => {
            const el = document.getElementById(key);
            if (el) {
                el.value = value || '';
            }
        });
    }

    // ✅ Bind events
    bindEvents() {
        const form = document.getElementById("proposalForm");

        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }

        const category = document.getElementById("category");
        if (category) {
            category.addEventListener("change", () => {
                this.toggleCostSections();
            });
        }
    }

    // ✅ Submit form (CREATE + UPDATE)
    async submitForm() {
        const formData = this.collectFormData();

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const editId = urlParams.get('edit');

            let response;

            if (editId) {
                // UPDATE
                response = await fetch(`/api/proposals/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // CREATE
                response = await fetch('/api/proposals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            if (!response.ok) {
                throw new Error("Server error while saving");
            }

            const result = await response.json();

            console.log("✅ Saved:", result);

            if (result.success && result.proposal) {
                // Save for preview fallback
                localStorage.setItem('currentProposal', JSON.stringify(result.proposal));

                // Redirect to preview
                window.location.href = `/preview/${result.proposal.id}`;
            } else {
                throw new Error("Invalid server response");
            }

        } catch (error) {
            console.error("❌ Submit Error:", error);
            alert("Error saving proposal: " + error.message);
        }
    }

    // ✅ Collect form data
    collectFormData() {
        const form = document.getElementById("proposalForm");
        const formData = new FormData(form);

        const data = Object.fromEntries(formData.entries());

        // Convert numbers properly
        [
            "capacity",
            "total_panel",
            "panel_capacity",
            "inverter_capacity",
            "res_system_cost",
            "res_net_meter_charges",
            "subsidy",
            "other_system_cost",
            "other_net_meter_charges",
            "geda_fees"
        ].forEach(field => {
            if (data[field]) {
                data[field] = Number(data[field]);
            }
        });

        return data;
    }

    // ✅ Toggle cost sections
    toggleCostSections() {
        const category = document.getElementById("category")?.value;

        const residentialSection = document.getElementById("residential_cost_section");
        const otherSection = document.getElementById("other_cost_section");

        if (!residentialSection || !otherSection) return;

        if (category === "residential") {
            residentialSection.style.display = "block";
            otherSection.style.display = "none";

            document.body.classList.add("is-residential");
            document.body.classList.remove("is-other");

        } else {
            residentialSection.style.display = "none";
            otherSection.style.display = "block";

            document.body.classList.add("is-other");
            document.body.classList.remove("is-residential");
        }
    }
}

// ✅ INIT APP
document.addEventListener('DOMContentLoaded', () => {
    new ProposalManager();
});