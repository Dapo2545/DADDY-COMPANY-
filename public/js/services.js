/**
 * Service card data and renderer.
 * Eliminates the 3x duplicated card HTML structure in index.html.
 * To add/remove a service, just edit the SERVICES array — no HTML changes needed.
 */

const SERVICES = [
    {
        id: '01',
        title: 'Technical Operations',
        description:
            'Customized technical engineering designed around absolute workplace efficiency and equipment compliance profiles.',
    },
    {
        id: '02',
        title: 'Structural Engineering',
        description:
            'Precision architecture modeling, testing frameworks, and premium asset installations constructed by top field technicians.',
    },
    {
        id: '03',
        title: 'Corporate Consulting',
        description:
            'Dedicated corporate auditing, logistics tracking data, and continuous asset monitoring pathways for enterprise scale operations.',
    },
];

/**
 * Renders a single service card element.
 * @param {{ id: string, title: string, description: string }} service
 * @returns {string} HTML string for one card
 */
function renderServiceCard(service) {
    return `
        <div class="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm transition-all hover:shadow-md">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-900 text-xl font-bold mb-6">
                ${service.id}
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">${service.title}</h3>
            <p class="text-slate-500 text-xs leading-relaxed font-light">${service.description}</p>
        </div>
    `;
}

/**
 * Renders all service cards into the target container.
 * @param {string} containerId - The DOM element ID to populate.
 */
function renderAllServices(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = SERVICES.map(renderServiceCard).join('');
}

/**
 * Populates the service <select> dropdown options from the same data source.
 * Ensures service names stay in sync between the cards and the contact form.
 * @param {string} selectId - The <select> element ID.
 */
function populateServiceDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = SERVICES.map(
        (s) => `<option value="${s.title}">${s.title}</option>`
    ).join('');
}
