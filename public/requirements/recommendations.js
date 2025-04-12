class RecommendationsManager {
    constructor() {
        this.recommendationsContainer = document.getElementById('recommendationsContainer');
        this.generateRecommendationsBtn = document.getElementById('generateRecommendationsBtn');
        this.recommendationsSection = document.getElementById('recommendationsSection');
        this.recommendationsBtn = document.getElementById('recommendationsBtn');
        this.closeRecommendationsBtn = document.getElementById('closeRecommendationsBtn');
        
        if (!this.recommendationsContainer || !this.generateRecommendationsBtn || !this.recommendationsSection || 
            !this.recommendationsBtn || !this.closeRecommendationsBtn) {
            console.warn('Required elements not found. Recommendations functionality may not work properly.');
            return;
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Show recommendations section when recommendations button is clicked
        this.recommendationsBtn.addEventListener('click', () => {
            this.recommendationsSection.classList.remove('hidden');
            // Scroll to recommendations section
            this.recommendationsSection.scrollIntoView({ behavior: 'smooth' });
        });

        // Close recommendations section when close button is clicked
        this.closeRecommendationsBtn.addEventListener('click', () => {
            this.recommendationsSection.classList.add('hidden');
        });

        // Generate recommendations when button is clicked
        this.generateRecommendationsBtn.addEventListener('click', () => this.generateRecommendations());
    }

    async generateRecommendations() {
        try {
            if (!this.recommendationsContainer) {
                throw new Error('Recommendations container not found');
            }

            // Show loading state
            this.recommendationsContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Generating recommendations...</div>';
            
            // Validate requirements data
            if (!window.currentRequirements) {
                throw new Error('No requirements data available. Please generate or load requirements first.');
            }

            const response = await fetch('/api/generate/requirements/list-recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requirements: window.currentRequirements
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate recommendations');
            }

            const data = await response.json();
            this.displayRecommendations(data.data);
        } catch (error) {
            console.error('Error generating recommendations:', error);
            if (this.recommendationsContainer) {
                this.recommendationsContainer.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-circle"></i>
                        ${error.message}
                    </div>`;
            }
        }
    }

    displayRecommendations(recommendations) {
        if (!this.recommendationsContainer) {
            console.error('Recommendations container not found');
            return;
        }

        if (!recommendations || (!recommendations.pages && !recommendations.components && !recommendations.workflows)) {
            this.recommendationsContainer.innerHTML = `
                <div class="alert alert-info" role="alert">
                    <i class="fas fa-info-circle"></i>
                    No recommendations available at this time.
                </div>`;
            return;
        }

        let recommendationsHtml = '';

        // Helper function to safely render features
        const renderFeatures = (item) => {
            if (!item.features || !Array.isArray(item.features)) {
                return '';
            }
            return `
                <div class="mt-3">
                    <h6 class="font-semibold">Features:</h6>
                    <ul class="list-disc pl-5">
                        ${item.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
            `;
        };

        // Display pages
        if (recommendations.pages && recommendations.pages.length > 0) {
            recommendationsHtml += `
                <div class="mb-6">
                    <h3 class="text-xl font-semibold mb-4">Recommended Pages</h3>
                    ${recommendations.pages.map(page => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">${page.title || 'Untitled Page'}</h5>
                                <p class="card-text">${page.description || 'No description available'}</p>
                                ${renderFeatures(page)}
                                <p class="card-text mt-3"><small class="text-muted">Technology: ${page.technology || 'Not specified'}</small></p>
                                <button class="generate-code-btn mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        onclick="window.recommendationsManager.generateCode('page', ${JSON.stringify(page).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-code mr-2"></i>Generate Code
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }

        // Display components
        if (recommendations.components && recommendations.components.length > 0) {
            recommendationsHtml += `
                <div class="mb-6">
                    <h3 class="text-xl font-semibold mb-4">Recommended Components</h3>
                    ${recommendations.components.map(component => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">${component.title || 'Untitled Component'}</h5>
                                <p class="card-text">${component.description || 'No description available'}</p>
                                ${renderFeatures(component)}
                                <p class="card-text mt-3"><small class="text-muted">Technology: ${component.technology || 'Not specified'}</small></p>
                                <button class="generate-code-btn mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        onclick="window.recommendationsManager.generateCode('component', ${JSON.stringify(component).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-code mr-2"></i>Generate Code
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }

        // Display workflows
        if (recommendations.workflows && recommendations.workflows.length > 0) {
            recommendationsHtml += `
                <div class="mb-6">
                    <h3 class="text-xl font-semibold mb-4">Recommended Workflows</h3>
                    ${recommendations.workflows.map(workflow => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">${workflow.title || 'Untitled Workflow'}</h5>
                                <p class="card-text">${workflow.description || 'No description available'}</p>
                                ${renderFeatures(workflow)}
                                <p class="card-text mt-3"><small class="text-muted">Technology: ${workflow.technology || 'Not specified'}</small></p>
                                <button class="generate-code-btn mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        onclick="window.recommendationsManager.generateCode('workflow', ${JSON.stringify(workflow).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-code mr-2"></i>Generate Code
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }

        this.recommendationsContainer.innerHTML = recommendationsHtml;
    }

    async generateCode(type, recommendation) {
        try {
            const response = await fetch('/api/generate/requirements/code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    recommendation,
                    requirements: window.currentRequirements
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate code');
            }

            const data = await response.json();
            // Show the generated code in a modal or new section
            this.displayGeneratedCode(data.data);
        } catch (error) {
            console.error('Error generating code:', error);
            // Show error message
            alert(`Error generating code: ${error.message}`);
        }
    }

    displayGeneratedCode(codeData) {
        // Create a modal to display the code
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Generated Code</h2>
                    <button class="text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="bg-gray-100 p-4 rounded">
                    <pre class="whitespace-pre-wrap">${codeData.code}</pre>
                </div>
                <div class="mt-4 text-sm text-gray-600">
                    Recommended file extension: ${codeData.extension}
                </div>
                <div class="mt-6 flex justify-end">
                    <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-4" 
                            onclick="navigator.clipboard.writeText(${JSON.stringify(codeData.code)})">
                        <i class="fas fa-copy mr-2"></i>Copy Code
                    </button>
                    <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            onclick="this.parentElement.parentElement.parentElement.remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Initialize the recommendations manager after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all elements are properly loaded
    setTimeout(() => {
        window.recommendationsManager = new RecommendationsManager();
    }, 100);
});