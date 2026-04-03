document.addEventListener('DOMContentLoaded', async function () {
    console.log('Preview page loaded');


    // ✅ FIX: Get ID from query param
    const urlParams = new URLSearchParams(window.location.search);
    const proposalId = urlParams.get('id');

    let proposalData = null;

    // Try API first
    if (proposalId) {
        try {
            console.log('Loading from API:', proposalId);
            const response = await fetch(`/api/proposals/${proposalId}`);
            if (response.ok) {
                proposalData = await response.json();
                localStorage.setItem('currentProposal', JSON.stringify(proposalData));
            }
        } catch (error) {
            console.error('API failed:', error);
        }
    }

    // Fallback to localStorage
    if (!proposalData) {
        proposalData = JSON.parse(localStorage.getItem('currentProposal'));
    }

    if (!proposalData) {
        alert('❌ No proposal data found! Go back and create a proposal first.');
        return;
    }

    console.log('API RESPONSE:', proposalData);

    // ========================================
    // POPULATE ALL FIELDS
    // ========================================

    populate('p_no', `Proposal no : <div class="ms-1" style="font-weight: 700">${proposalData.proposal_no || 'N/A'}</div>`);
    populate('client_name', `Client Name : ${proposalData.client_name || 'N/A'}`);
    populate('address', `Address : ${proposalData.address || 'N/A'}`);
    populate('category', `Category : ${capitalize(proposalData.category || 'N/A')}`);

    const systemEl = document.getElementById('system_details');
    if (systemEl) {
        systemEl.innerHTML = `${(proposalData.grid_type || '').toUpperCase()} ${proposalData.capacity || ''} ${proposalData.capacity_text || ''} (${capitalize(proposalData.brand || '')})`;
    }

    populate('proposal_date_text', formatDate(proposalData.proposal_date));
    populate('prepared_for', proposalData.client_name || 'N/A');

    document.querySelectorAll('.capablity_text').forEach(el => {
        el.innerHTML = `${proposalData.capacity || ''} ${proposalData.capacity_text || ''} ${proposalData.grid_type || ''} Proposal`;
    });

    // PANEL
    populate('panel_type_text', `<b>Type :</b> ${capitalize(proposalData.panel_type || '')} (${proposalData.total_panel || 0} panels)`);
    populate('panel_capacity_text', `<b>Capacity :</b> ${proposalData.panel_capacity || 'N/A'}`);

    // INVERTER
    populate('inverter_type_text', `<b>Type :</b> ${capitalize(proposalData.inverter_type || '')}`);
    populate('inverter_capacity_text', `<b>Capacity :</b> ${proposalData.inverter_capacity || 'N/A'} Kw`);
    populate('inverter_warranty_text', `<b>Warranty :</b> ${proposalData.inverter_warranty || 'N/A'} Years`);

    // CALCULATIONS
    const resTotal = (proposalData.res_system_cost || 0) - (proposalData.subsidy || 0);
    const otherTotal = (proposalData.other_system_cost || 0) + (proposalData.geda_fees || 0);

    populate('res_total_payble', `Rs. ${formatNumber(resTotal)}`);
    populate('other_total_payble', `Rs. ${formatNumber(otherTotal)}`);

    populateCostFields(proposalData);
    updateBrandLogo(proposalData.brand);
    toggleCostTables(proposalData.category);
    setupAutoDownloads(proposalData);


});

function populate(id, content) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = content;
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${day}, ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

function populateCostFields(data) {
    populate('res_system_cost_text', `Rs. ${formatNumber(data.res_system_cost)}`);
    populate('res_system_cost_text_two', `Rs. ${formatNumber(data.res_system_cost)}`);
    populate('res_net_meter_charges_text', `Rs. ${formatNumber(data.res_net_meter_charges)}`);
    populate('subsidy_text', `Rs. ${formatNumber(data.subsidy)}`);


    populate('other_system_cost_text', `Rs. ${formatNumber(data.other_system_cost)}`);
    populate('other_system_cost_text_two', `Rs. ${formatNumber(data.other_system_cost)}`);
    populate('other_net_meter_charges_text', `Rs. ${formatNumber(data.other_net_meter_charges)}`);
    populate('geda_fees_text', `Rs. ${formatNumber(data.geda_fees)}`);


}

function formatNumber(num) {
    return num ? parseFloat(num).toLocaleString('en-IN') : '0';
}

// ✅ FIXED PATHS (IMPORTANT)
function updateBrandLogo(brand) {
    const container = document.getElementById('brand_logo');
    if (!container || !brand) return;


    const logos = {
        'adani': '/assets/images/Adani Logo.png',
        'goldi': '/assets/images/Goldi Logo.png',
        'tata': '/assets/images/Tata Logo.png',
        'waree': '/assets/images/Waree Logo.png'
    };

    const src = logos[brand.toLowerCase()];
    if (src) {
        container.innerHTML = `
        <div class="logo-item d-inline-flex">
            <img src="${src}" style="width:100%; padding:10px;">
        </div>
    `;
    }


}

function toggleCostTables(category) {
    const resTable = document.querySelector('.fetched-class-is-residential');
    const otherTable = document.querySelector('.fetched-class-is-other');


    if (resTable && otherTable) {
        if (category === 'residential') {
            resTable.classList.remove('d-none');
            otherTable.classList.add('d-none');
        } else {
            resTable.classList.add('d-none');
            otherTable.classList.remove('d-none');
        }
    }


}

function setupAutoDownloads(data) {
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.innerHTML = '📄 DOWNLOAD PDF';
        downloadBtn.onclick = function () {
            generatePDF(data);
        };
    }
}

function generatePDF(data) {
    const element = document.getElementById('pdf-content');
    if (!element) return;


    const fileName = `${(data.client_name || 'proposal')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}.pdf`;

    if (typeof html2pdf !== 'undefined') {
        html2pdf().from(element).set({
            margin: 0,
            filename: fileName,
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save();
    } else {
        window.print();
    }

}
