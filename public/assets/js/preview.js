
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Preview page loaded');

    // Get proposal ID from URL path
    const pathParts = window.location.pathname.split('/');
    const proposalId = pathParts[pathParts.length - 1];

    let proposalData = null;

    // Try API first, then localStorage fallback
    if (proposalId && proposalId !== 'preview.html') {
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

    console.log('ID FROM URL:', proposalId);

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

    // Header section
    populate('p_no', `Proposal no : <div class="ms-1" style="font-weight: 700">${proposalData.proposal_no || 'N/A'}</div>`);
    populate('client_name', `Client Name : ${proposalData.client_name || 'N/A'}`);
    populate('address', `Address : ${proposalData.address || 'N/A'}`);
    populate('category', `Category : ${capitalize(proposalData.category || 'N/A')}`);

    // System details
    const systemEl = document.getElementById('system_details');
    if (systemEl) {
        systemEl.innerHTML = `${(proposalData.grid_type || '').toUpperCase()} ${proposalData.capacity || ''} ${proposalData.capacity_text || ''} (${capitalize(proposalData.brand || '')})`;
    }

    // Dates
    populate('proposal_date_text', formatDate(proposalData.proposal_date));
    populate('prepared_for', proposalData.client_name || 'N/A');

    // Capability text (all sections)
    document.querySelectorAll('.capablity_text').forEach(el => {
        el.innerHTML = `${proposalData.capacity || ''} ${proposalData.capacity_text || ''} ${proposalData.grid_type || ''} Proposal`;
    });

    // PANEL SECTION
    populate('panel_type_text', `<b style="font-weight: 600;">Type :</b> ${capitalize(proposalData.panel_type + '&nbspBifacial' || '')} (${proposalData.total_panel || 0} panels)`);
    populate('panel_capacity_text', `<b style="font-weight: 600;">Capacity :</b> ${proposalData.panel_capacity || 'N/A'}`);

    // INVERTER SECTION
    populate('inverter_type_text', `<b style="font-weight: 600;">Type :</b> ${capitalize(proposalData.inverter_type || '')} (1 inverter)`);
    populate('inverter_capacity_text', `<b style="font-weight: 600;">Capacity :</b> ${proposalData.inverter_capacity || 'N/A'} Kw`);
    populate('inverter_warranty_text', `<b style="font-weight: 600;">Warranty :</b> ${proposalData.inverter_warranty || 'N/A'} Years`);


    // =======================
    // CALCULATIONS
    // =======================

    // Residential Total = system cost - subsidy
    const resTotal = (proposalData.res_system_cost || 0) - (proposalData.subsidy || 0);

    // Other Total = system cost + geda fees
    const otherTotal = (proposalData.other_system_cost || 0) + (proposalData.geda_fees || 0);

    // =======================
    // DISPLAY (formatted)
    // =======================

    populate('res_total_payble', `Rs. ${formatNumber(resTotal)}`);
    populate('other_total_payble', `Rs. ${formatNumber(otherTotal)}`);

    // COST SECTION
    populateCostFields(proposalData);

    // BRAND LOGO
    updateBrandLogo(proposalData.brand);

    // Show correct cost table based on category
    toggleCostTables(proposalData.category);

    // Setup download
    setupAutoDownloads(proposalData);
});

function populate(id, content) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = content;
        console.log(`✅ Populated ${id}`);
    }
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
    // Residential costs
    populate('res_system_cost_text', `Rs. ${formatNumber(data.res_system_cost) || 0}`);
    populate('res_system_cost_text_two', `Rs. ${formatNumber(data.res_system_cost) || 0}`);
    populate('res_net_meter_charges_text', `Rs. ${formatNumber(data.res_net_meter_charges) || 0}`);
    populate('subsidy_text', `Rs. ${formatNumber(data.subsidy) || 0}`);

    // Other costs
    populate('other_system_cost_text', `Rs. ${formatNumber(data.other_system_cost) || 0}`);
    populate('other_system_cost_text_two', `Rs. ${formatNumber(data.other_system_cost) || 0}`);
    populate('other_net_meter_charges_text', `Rs. ${formatNumber(data.other_net_meter_charges) || 0}`);
    populate('geda_fees_text', `Rs. ${formatNumber(data.geda_fees) || 0}`);
}

function formatNumber(num) {
    return num ? parseFloat(num).toLocaleString('en-IN') : '0';
}

function updateBrandLogo(brand) {
    const container = document.getElementById('brand_logo');
    if (!container || !brand) return;

    const logos = {
        'adani': '../assets/images/Adani Logo.png',
        'goldi': '../assets/images/Goldi Logo.png',
        'tata': '../assets/images/Tata Logo.png',
        'waree': '../assets/images/Waree Logo.png'
    };

    const src = logos[brand.toLowerCase()];
    if (src) {
        container.innerHTML = `
            <div class="logo-item d-inline-flex">
                <img src="${src}" style="width:100%; padding: 0px 10px; margin: 10px 0px;">
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

function setupDownload() {
    const btn = document.getElementById('downloadBtn');
    if (!btn) return;

    btn.addEventListener('click', function () {
        console.log('📄 Generating PDF...');

        const element = document.getElementById('pdf-content');
        const opt = {
            margin: 0.5,
            filename: 'Solar_Proposal.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true
            },
            jsPDF: {
                unit: 'in',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        html2pdf().from(element).set(opt).save();
    });
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

async function downloadProposalsJSON() {
    try {
        const response = await fetch('/api/download-proposals');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'proposals.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('✅ proposals.json downloaded!');
    } catch (error) {
        console.error('JSON download failed:', error);
    }
}

function generatePDF(data) {
    const element = document.getElementById('pdf-content');

    if (!element) return;

    // ✅ Dynamic file name (client name)
    const clientName = (data.client_name || 'Proposal')
        .replace(/[^a-z0-9]/gi, '_') // clean name
        .toLowerCase();

    const fileName = `${clientName}_proposal.pdf`;

    if (typeof html2pdf !== 'undefined') {
      html2pdf()
  .from(element)
  .set({
    margin: 0,
    filename: fileName,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  })
  .save();
    } else {
        window.print();
    }
}