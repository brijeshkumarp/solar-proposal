document.addEventListener('DOMContentLoaded', function () {

   const tbody = document.getElementById('proposalTable');

    loadProposals();

    // ============================
    // LOAD PROPOSALS
    // ============================
    async function loadProposals() {
        try {
            const res = await fetch('/api/proposals');
            let proposals = await res.json();

            console.log("📊 RAW DATA:", proposals);

            if (!proposals || proposals.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">No proposals found</td>
                    </tr>
                `;
                return;
            }

            // ❗ REMOVE BROKEN DATA (no client_name)
            proposals = proposals.filter(p => p.client_name);

            // Latest first
            proposals.reverse();

            if (proposals.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-danger">
                            No valid proposals found
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = proposals.map(p => `
                <tr>
                    <td class="text-nowrap">${p.proposal_no || '-'}</td>
                    <td class="text-nowrap">${p.client_name || 'N/A'}</td>
                    <td class="text-nowrap">${capitalize(p.category)}</td>
                    <td class="text-nowrap">${capitalize(p.grid_type)}</td>
                    <td class="text-nowrap">${formatCapacity(p)}</td>
                    <td class="text-nowrap">${capitalize(p.brand)}</td>
                    <td class="text-nowrap">${formatDate(p.proposal_date)}</td>
                    
                    <td class="d-flex">
                        <a href="/preview/${p.id}" class="btn btn-sm btn-primary me-1">Preview</a>
                        <a href="/?edit=${p.id}" class="btn btn-sm btn-warning me-1">Edit</a>
                        <button class="btn btn-sm btn-danger" onclick="deleteProposal('${p.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error("❌ Error loading proposals:", error);
        }
    }

    // ============================
    // DELETE
    // ============================
    window.deleteProposal = async function (id) {
        const confirmDelete = confirm('Are you sure you want to delete this proposal?');

        if (!confirmDelete) return;

        try {
            await fetch(`/api/proposals/${id}`, {
                method: 'DELETE'
            });

            loadProposals();

        } catch (error) {
            console.error("❌ Delete failed:", error);
        }
    };

    // ============================
    // DOWNLOAD JSON BUTTON
    // ============================
   

});


// ============================
// HELPERS
// ============================

// Capitalize text
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : 'N/A';
}

// Format date
function formatDate(date) {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Format capacity nicely
function formatCapacity(p) {
    if (!p.capacity && !p.capacity_text) return '-';

    return `${p.capacity || ''} ${p.capacity_text || ''}`.trim();
}