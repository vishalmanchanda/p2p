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
                <div class="bg-white rounded-lg p-6 text-center">
                    <i class="fas fa-info-circle text-4xl text-blue-500 mb-4"></i>
                    <p class="text-gray-600">No recommendations available at this time.</p>
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
                    <h6 class="font-semibold text-gray-700 mb-2">Features:</h6>
                    <ul class="list-disc pl-5 space-y-1">
                        ${item.features.map(feature => `<li class="text-gray-600">${feature}</li>`).join('')}
                    </ul>
                </div>
            `;
        };

        // Display all recommendations in a grid
        const allRecommendations = [
            ...(recommendations.pages || []).map(item => ({ ...item, type: 'Page' })),
            ...(recommendations.components || []).map(item => ({ ...item, type: 'Component' })),
            ...(recommendations.workflows || []).map(item => ({ ...item, type: 'Workflow' }))
        ];

        if (allRecommendations.length > 0) {
            recommendationsHtml = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${allRecommendations.map(item => `
                        <div class="recommendation-item bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                            <div class="p-6">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex-1">
                                        <h4 class="text-lg font-semibold text-gray-800 mb-2">${item.title || 'Untitled'}</h4>
                                        <p class="text-gray-600 mb-4">${item.description || 'No description available'}</p>
                                        ${renderFeatures(item)}
                                    </div>
                                    <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600">${item.type}</span>
                                </div>
                                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div class="flex items-center space-x-2">
                                        <span class="px-3 py-1 bg-gray-50 rounded-md text-sm text-gray-600">${item.technology || 'Not specified'}</span>
                                    </div>
                                    <button class="generate-code-btn inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                                            onclick="window.recommendationsManager.generateCode('${item.type.toLowerCase()}', ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                                        <i class="fas fa-code mr-2"></i>Generate Code
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        this.recommendationsContainer.innerHTML = recommendationsHtml;
    }

    async generateCode(type, recommendation) {
        try {
            // Show loading state
            const button = event.target;
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
            button.disabled = true;

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
            
            // Create a modal to display the code
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] flex flex-col">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">Generated Code</h2>
                        <button class="text-gray-500 hover:text-gray-700 transition-colors duration-200" onclick="this.parentElement.parentElement.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto pr-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <pre class="whitespace-pre-wrap font-mono text-sm text-gray-800">${data.data.code}</pre>
                        </div>
                        <div class="mt-4 text-sm text-gray-600">
                            <p class="mb-2"><strong>File Extension:</strong> ${data.data.extension}</p>
                            <p><strong>Dependencies:</strong> ${data.data.dependencies?.join(', ') || 'None'}</p>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end space-x-4 pt-4 border-t">
                        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200" 
                                onclick="navigator.clipboard.writeText(${JSON.stringify(data.data.code)})">
                            <i class="fas fa-copy mr-2"></i>Copy Code
                        </button>
                        <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                onclick="this.parentElement.parentElement.parentElement.remove()">
                            Close
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Error generating code:', error);
            alert(`Error generating code: ${error.message}`);
        } finally {
            // Restore button state
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }
    }
}

// Initialize the recommendations manager after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all elements are properly loaded
    setTimeout(() => {
        window.recommendationsManager = new RecommendationsManager();
    }, 100);
});