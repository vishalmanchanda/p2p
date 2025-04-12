document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const API_BASE_URL = '/api';
    const REQUIREMENTS_API = `${API_BASE_URL}/generate/requirements`;
    
    // State
    let currentStructuredRequirements = null;
    let currentView = 'card'; // 'card' or 'json'
    
    // DOM Elements
    const requirementsEditor = document.getElementById('requirements-editor');
    const llmModelSelect = document.getElementById('llm-model-select');
    const generateRequirementsBtn = document.getElementById('generate-requirements-btn');
    const generateRequirementsSpinner = document.getElementById('generate-requirements-spinner');
    
    const structuredRequirementsContainer = document.getElementById('structured-requirements-container');
    const structuredRequirementsCards = document.getElementById('structured-requirements-cards');
    const structuredRequirementsJson = document.getElementById('structured-requirements-json');
    const jsonDisplay = document.getElementById('json-display');
    
    const jsonViewBtn = document.getElementById('json-view-btn');
    const cardViewBtn = document.getElementById('card-view-btn');
    
    const enhancementInput = document.getElementById('enhancement-input');
    const enhanceRequirementsBtn = document.getElementById('enhance-requirements-btn');
    const enhanceRequirementsSpinner = document.getElementById('enhance-requirements-spinner');
    
    const startOverBtn = document.getElementById('start-over-btn');
    const copyToClipboardBtn = document.getElementById('copy-to-clipboard-btn');
    
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    // Event Listeners
    generateRequirementsBtn.addEventListener('click', generateStructuredRequirements);
    enhanceRequirementsBtn.addEventListener('click', enhanceStructuredRequirements);
    jsonViewBtn.addEventListener('click', () => switchView('json'));
    cardViewBtn.addEventListener('click', () => switchView('card'));
    startOverBtn.addEventListener('click', startOver);
    copyToClipboardBtn.addEventListener('click', copyToClipboard);
    
    // Functions
    async function generateStructuredRequirements() {
        const basicRequirements = requirementsEditor.value.trim();
        if (!basicRequirements) {
            showNotification('Please enter your basic requirements', 'error');
            return;
        }
        
        // Show loading state
        generateRequirementsBtn.disabled = true;
        generateRequirementsSpinner.classList.remove('hidden');
        
        try {
            const modelName = llmModelSelect.value;
            
            const response = await fetch(`${REQUIREMENTS_API}/structured`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    basicRequirements,
                    modelName
                })
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error?.message || 'Failed to generate structured requirements');
            }
            
            // Store the generated requirements
            currentStructuredRequirements = result.data;
            
            // Display the structured requirements
            renderStructuredRequirements(currentStructuredRequirements);
            structuredRequirementsContainer.classList.remove('hidden');
            
            showNotification('Structured requirements generated successfully', 'success');
        } catch (error) {
            console.error('Error generating structured requirements:', error);
            showNotification(error.message || 'Failed to generate structured requirements', 'error');
        } finally {
            // Hide loading state
            generateRequirementsBtn.disabled = false;
            generateRequirementsSpinner.classList.add('hidden');
        }
    }
    
    async function enhanceStructuredRequirements() {
        const enhancementText = enhancementInput.value.trim();
        if (!enhancementText) {
            showNotification('Please enter your enhancement request', 'error');
            return;
        }
        
        if (!currentStructuredRequirements) {
            showNotification('No structured requirements to enhance', 'error');
            return;
        }
        
        // Show loading state
        enhanceRequirementsBtn.disabled = true;
        enhanceRequirementsSpinner.classList.remove('hidden');
        
        try {
            const modelName = llmModelSelect.value;
            
            const response = await fetch(`${REQUIREMENTS_API}/enhance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    structuredRequirements: currentStructuredRequirements,
                    enhancementPrompt: enhancementText,
                    modelName
                })
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error?.message || 'Failed to enhance structured requirements');
            }
            
            // Update the structured requirements
            currentStructuredRequirements = result.data;
            
            // Display the enhanced requirements
            renderStructuredRequirements(currentStructuredRequirements);
            
            // Clear the enhancement input
            enhancementInput.value = '';
            
            showNotification('Requirements enhanced successfully', 'success');
        } catch (error) {
            console.error('Error enhancing structured requirements:', error);
            showNotification(error.message || 'Failed to enhance structured requirements', 'error');
        } finally {
            // Hide loading state
            enhanceRequirementsBtn.disabled = false;
            enhanceRequirementsSpinner.classList.add('hidden');
        }
    }
    
    function renderStructuredRequirements(requirements) {
        // Update JSON view
        jsonDisplay.textContent = JSON.stringify(requirements, null, 2);
        
        // Update card view
        structuredRequirementsCards.innerHTML = '';
        
        // Personas section
        if (requirements.personas && requirements.personas.length > 0) {
            const personasCard = createSectionCard('Personas', requirements.personas.map(persona => ({
                title: persona.name,
                content: persona.description
            })));
            structuredRequirementsCards.appendChild(personasCard);
        }
        
        // Goals section
        if (requirements.goals && requirements.goals.length > 0) {
            const goalsCard = createSectionCard('Goals', requirements.goals.map(goal => ({
                title: goal.title,
                content: goal.description
            })));
            structuredRequirementsCards.appendChild(goalsCard);
        }
        
        // Core Features section
        if (requirements.coreFeatures && requirements.coreFeatures.length > 0) {
            const featuresCard = createSectionCard('Core Features', requirements.coreFeatures.map(feature => ({
                title: `${feature.title} (${feature.priority})`,
                content: feature.description
            })));
            structuredRequirementsCards.appendChild(featuresCard);
        }
        
        // Key Data section
        if (requirements.keyData && requirements.keyData.length > 0) {
            const dataCard = createSectionCard('Key Data', requirements.keyData.map(data => ({
                title: data.entity,
                content: `${data.description}<br><strong>Attributes:</strong> ${data.attributes.join(', ')}`
            })));
            structuredRequirementsCards.appendChild(dataCard);
        }
        
        // Workflows section
        if (requirements.workflows && requirements.workflows.length > 0) {
            const workflowsCard = createSectionCard('Workflows', requirements.workflows.map(workflow => ({
                title: workflow.name,
                content: `${workflow.description}<br><strong>Steps:</strong><ol>${workflow.steps.map(step => `<li>${step}</li>`).join('')}</ol>`
            })));
            structuredRequirementsCards.appendChild(workflowsCard);
        }
        
        // Constraints section
        if (requirements.constraints && requirements.constraints.length > 0) {
            const constraintsCard = createSectionCard('Constraints', requirements.constraints.map(constraint => ({
                title: constraint.type,
                content: constraint.description
            })));
            structuredRequirementsCards.appendChild(constraintsCard);
        }
        
        // Show the current view
        switchView(currentView);
    }
    
    function createSectionCard(title, items) {
        const card = document.createElement('div');
        card.className = 'card mb-4';
        
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header bg-primary text-white';
        cardHeader.textContent = title;
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-3';
        
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'mb-3 pb-3 border-bottom';
            
            const itemTitle = document.createElement('h6');
            itemTitle.className = 'font-weight-bold';
            itemTitle.textContent = item.title;
            
            const itemContent = document.createElement('div');
            itemContent.className = 'text-muted small';
            itemContent.innerHTML = item.content;
            
            itemDiv.appendChild(itemTitle);
            itemDiv.appendChild(itemContent);
            cardBody.appendChild(itemDiv);
        });
        
        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        
        return card;
    }
    
    function switchView(view) {
        currentView = view;
        
        if (view === 'json') {
            structuredRequirementsCards.classList.add('hidden');
            structuredRequirementsJson.classList.remove('hidden');
            jsonViewBtn.classList.add('btn-primary');
            jsonViewBtn.classList.remove('btn-outline-secondary');
            cardViewBtn.classList.add('btn-outline-secondary');
            cardViewBtn.classList.remove('btn-primary');
        } else {
            structuredRequirementsCards.classList.remove('hidden');
            structuredRequirementsJson.classList.add('hidden');
            cardViewBtn.classList.add('btn-primary');
            cardViewBtn.classList.remove('btn-outline-secondary');
            jsonViewBtn.classList.add('btn-outline-secondary');
            jsonViewBtn.classList.remove('btn-primary');
        }
    }
    
    function startOver() {
        requirementsEditor.value = '';
        enhancementInput.value = '';
        currentStructuredRequirements = null;
        structuredRequirementsContainer.classList.add('hidden');
        structuredRequirementsCards.innerHTML = '';
        jsonDisplay.textContent = '';
    }
    
    async function copyToClipboard() {
        if (!currentStructuredRequirements) {
            showNotification('No requirements to copy', 'error');
            return;
        }
        
        try {
            const text = JSON.stringify(currentStructuredRequirements, null, 2);
            await navigator.clipboard.writeText(text);
            showNotification('Requirements copied to clipboard', 'success');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            showNotification('Failed to copy to clipboard', 'error');
        }
    }
    
    function showNotification(message, type) {
        notification.className = 'notification';
        notification.classList.add(type);
        notificationMessage.textContent = message;
        
        // Show the notification
        notification.classList.add('show');
        
        // Hide the notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}); 