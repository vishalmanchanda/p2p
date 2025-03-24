document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const API_BASE_URL = '/api';
    const PROJECT_GEN_API = `${API_BASE_URL}/generate/project`;
    
    // State
    let currentStep = 1;
    let entityConfigsGenerated = false;
    let projectGenerated = false;
    let generatedProjectPath = '';
    let generatedProjectName = '';
    let entityConfigs = '';
    let detectedEntities = [];
    let scenarioGenerated = false;
    let generatedScenarioPath = '';
    let generatedScenarioFilename = '';
    let mockDataGenerated = false;
    
    // DOM Elements
    const steps = document.querySelectorAll('.step');
    const stepIndicators = document.querySelectorAll('.step-indicator-item');
    const progressBar = document.getElementById('progress-bar');
    
    // Step 1 Elements
    const projectNameInput = document.getElementById('project-name');
    const requirementsTextarea = document.getElementById('requirements-text');
    const portNumberInput = document.getElementById('port-number');
    const useLLMCheckbox = document.getElementById('use-llm');
    const testConnectionBtn = document.getElementById('test-connection-btn');
    const nextStep1Btn = document.getElementById('next-step1');
    
    // Step 2 Elements
    const entityConfigsEditor = document.getElementById('entity-configs-editor');
    const prevStep2Btn = document.getElementById('prev-step2');
    const generateEntityConfigsBtn = document.getElementById('generate-entity-configs');
    const generateEntityConfigsSpinner = document.getElementById('generate-entity-configs-spinner');
    const useLLMGenerateCheckbox = document.getElementById('use-llm-generate');
    const llmModelSelect = document.getElementById('llm-model-select');
    const nextStep2Btn = document.getElementById('next-step2');
    
    // Step 3 Elements
    const projectNameDisplay = document.getElementById('project-name-display');
    const portDisplay = document.getElementById('port-display');
    const entitiesDisplayContainer = document.getElementById('entities-display-container');
    const projectGenStatus = document.getElementById('project-gen-status');
    const prevStep3Btn = document.getElementById('prev-step3');
    const generateProjectBtn = document.getElementById('generate-project-btn');
    const generateProjectSpinner = document.getElementById('generate-project-spinner');
    const nextStep3Btn = document.getElementById('next-step3');
    
    // Step 4 Elements
    const projectPathDisplay = document.getElementById('project-path-display');
    const finalPortDisplay = document.getElementById('final-port-display');
    const prevStep4Btn = document.getElementById('prev-step4');
    const downloadZipBtn = document.getElementById('download-zip-btn');
    const nextStep4Btn = document.getElementById('next-step4');
    const useLLMMockCheckbox = document.getElementById('use-llm-mock');
    const mockDataLlmModelSelect = document.getElementById('mock-data-llm-model-select');
    const recordsPerEntityInput = document.getElementById('records-per-entity');
    const generateMockDataBtn = document.getElementById('generate-mock-data-btn');
    const generateMockDataSpinner = document.getElementById('generate-mock-data-spinner');
    const mockDataResult = document.getElementById('mock-data-result');
    const mockDataMessage = document.getElementById('mock-data-message');
    
    // Step 5 Elements
    const scenarioNameInput = document.getElementById('scenario-name');
    const scenarioDescriptionTextarea = document.getElementById('scenario-description');
    const scenarioEntitiesDisplay = document.getElementById('scenario-entities-display');
    const scenarioLlmModelSelect = document.getElementById('scenario-llm-model-select');
    const prevStep5Btn = document.getElementById('prev-step5');
    const generateScenarioBtn = document.getElementById('generate-scenario-btn');
    const generateScenarioSpinner = document.getElementById('generate-scenario-spinner');
    
    // Step 6 Elements
    const scenarioNameDisplay = document.getElementById('scenario-name-display');
    const scenarioFileDisplay = document.getElementById('scenario-file-display');
    const scenarioPortDisplay = document.getElementById('scenario-port-display');
    const prevStep6Btn = document.getElementById('prev-step6');
    const createAnotherScenarioBtn = document.getElementById('create-another-scenario-btn');
    const startOverBtn = document.getElementById('start-over-btn');
    
    // Help button
    const wizardHelp = document.querySelector('.wizard-help');
    
    // Notification
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    // Event Listeners
    testConnectionBtn.addEventListener('click', testConnection);
    nextStep1Btn.addEventListener('click', () => {
        if (validateStep1()) goToStep(2);
    });
    
    prevStep2Btn.addEventListener('click', () => goToStep(1));
    generateEntityConfigsBtn.addEventListener('click', generateEntityConfigs);
    nextStep2Btn.addEventListener('click', () => goToStep(3));
    
    prevStep3Btn.addEventListener('click', () => goToStep(2));
    generateProjectBtn.addEventListener('click', generateProject);
    nextStep3Btn.addEventListener('click', () => goToStep(4));
    
    prevStep4Btn.addEventListener('click', () => goToStep(3));
    downloadZipBtn.addEventListener('click', downloadProjectZip);
    generateMockDataBtn.addEventListener('click', generateMockData);
    nextStep4Btn.addEventListener('click', () => {
        if (projectGenerated) {
            // Update the entities display in the scenario step
            updateScenarioEntitiesDisplay();
            goToStep(5);
        } else {
            showNotification('Please generate the project first', 'error');
        }
    });
    
    prevStep5Btn.addEventListener('click', () => goToStep(4));
    generateScenarioBtn.addEventListener('click', generateScenario);
    
    prevStep6Btn.addEventListener('click', () => goToStep(5));
    createAnotherScenarioBtn.addEventListener('click', () => {
        // Reset scenario form fields
        scenarioNameInput.value = '';
        scenarioDescriptionTextarea.value = '';
        scenarioGenerated = false;
        generatedScenarioPath = '';
        generatedScenarioFilename = '';
        goToStep(5);
    });
    startOverBtn.addEventListener('click', startOver);
    
    // Add help tooltip
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    wizardHelp.addEventListener('click', showHelp);
    
    // Functions
    
    function goToStep(step) {
        // Hide all steps
        steps.forEach(s => s.classList.remove('active'));
        
        // Show the target step
        document.getElementById(`step${step}`).classList.add('active');
        
        // Update step indicators - Note: We only have 4 indicators but 6 steps
        // Steps 5 and 6 will use the same indicator as step 4
        const visibleSteps = Math.min(4, stepIndicators.length);
        const progressStep = Math.min(step, visibleSteps);
        
        stepIndicators.forEach(indicator => {
            const indicatorStep = parseInt(indicator.getAttribute('data-step'));
            
            indicator.classList.remove('active', 'completed');
            
            if (indicatorStep === progressStep) {
                indicator.classList.add('active');
            } else if (indicatorStep < progressStep) {
                indicator.classList.add('completed');
            }
        });
        
        // Update progress bar - Use the 4 visible steps for progress calculation
        const progressPercentage = ((progressStep - 1) / (visibleSteps - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        
        currentStep = step;
        
        // Prepare step data
        if (step === 3) {
            // Update project info display
            projectNameDisplay.textContent = projectNameInput.value;
            portDisplay.textContent = portNumberInput.value;
            finalPortDisplay.textContent = portNumberInput.value;
            
            // Display entities
            updateEntitiesDisplay();
        }
        
        if (step === 4) {
            // Update project path display
            projectPathDisplay.textContent = generatedProjectPath;
        }
        
        if (step === 5) {
            // Update scenario entities display
            updateScenarioEntitiesDisplay();
            scenarioPortDisplay.textContent = portNumberInput.value;
        }
        
        if (step === 6) {
            // Update scenario details display
            scenarioNameDisplay.textContent = scenarioNameInput.value;
            scenarioFileDisplay.textContent = generatedScenarioFilename;
            scenarioPortDisplay.textContent = portNumberInput.value;
        }
        
        // Scroll to top when changing steps
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function validateStep1() {
        const projectName = projectNameInput.value.trim();
        const requirements = requirementsTextarea.value.trim();
        const port = portNumberInput.value;
        
        if (!projectName) {
            showNotification('Project name is required', 'error');
            projectNameInput.focus();
            return false;
        }
        
        if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
            showNotification('Project name can only contain letters, numbers, hyphens, and underscores', 'error');
            projectNameInput.focus();
            return false;
        }
        
        if (!requirements) {
            showNotification('Requirements text is required', 'error');
            requirementsTextarea.focus();
            return false;
        }
        
        if (requirements.length < 10) {
            showNotification('Requirements text must be at least 10 characters', 'error');
            requirementsTextarea.focus();
            return false;
        }
        
        if (port < 1024 || port > 65535) {
            showNotification('Port must be between 1024 and 65535', 'error');
            portNumberInput.focus();
            return false;
        }
        
        return true;
    }
    
    async function testConnection() {
        try {
            showNotification('Testing connection...', 'info');
            
            const response = await fetch(`${PROJECT_GEN_API}/test`);
            const data = await response.json();
            
            if (data.success) {
                showNotification('Connection successful! API is working.', 'success');
            } else {
                showNotification('Connection test failed', 'error');
            }
        } catch (error) {
            console.error('Connection test error:', error);
            showNotification('Connection test failed: ' + error.message, 'error');
        }
    }
    
    function updateEntitiesDisplay() {
        // Clear previous content
        entitiesDisplayContainer.innerHTML = '';
        
        if (detectedEntities.length === 0) {
            entitiesDisplayContainer.innerHTML = '<span class="text-muted">None detected</span>';
            return;
        }
        
        // Create entity badges
        detectedEntities.forEach(entity => {
            const badge = document.createElement('span');
            badge.className = 'entity-badge';
            badge.innerHTML = `<i class="bi bi-table me-1"></i>${entity}`;
            entitiesDisplayContainer.appendChild(badge);
        });
    }
    
    async function generateEntityConfigs() {
        // Validate requirements text
        const requirementsText = requirementsTextarea.value.trim();
        if (!requirementsText) {
            showNotification('Please enter requirements text', 'error');
            return;
        }
        
        // Show loading state
        generateEntityConfigsBtn.disabled = true;
        generateEntityConfigsSpinner.classList.remove('d-none');
        entityConfigsEditor.value = 'Generating entity configurations...';
        
        try {
            // Get port and useLLM values
            const port = parseInt(portNumberInput.value) || 3002;
            const useLLM = useLLMGenerateCheckbox.checked;
            const llmModel = llmModelSelect.value;
            
            // Prepare the request data
            const requestData = {
                requirementsText,
                port,
                useLLM,
                llmModel
            };
            
            console.log('Sending entity configs request:', requestData);
            
            // Send the request to the API
            const response = await fetch(`${PROJECT_GEN_API}/entity-configs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate entity configurations');
            }
            
            // Update the editor with the generated configs
            entityConfigs = data.data.entityConfigs;
            entityConfigsEditor.value = entityConfigs;
            
            // Store detected entities
            detectedEntities = data.data.entities || [];
            
            // Set the flag
            entityConfigsGenerated = true;
            
            // Enable next button
            nextStep2Btn.disabled = false;
            
            showNotification('Entity configurations generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating entity configs:', error);
            entityConfigsEditor.value = '';
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            // Reset loading state
            generateEntityConfigsBtn.disabled = false;
            generateEntityConfigsSpinner.classList.add('d-none');
        }
    }
    
    async function generateProject() {
        if (!entityConfigsGenerated) {
            showNotification('Please generate entity configurations first', 'error');
            return;
        }
        
        const projectName = projectNameInput.value.trim();
        const requirements = requirementsTextarea.value.trim();
        const port = portNumberInput.value;
        
        // Debug the useLLM value
        console.log('useLLMCheckbox:', useLLMCheckbox);
        console.log('useLLMCheckbox checked:', useLLMCheckbox ? useLLMCheckbox.checked : 'checkbox not found');
        
        // Use the checkbox from step 1 for project generation
        const useLLM = Boolean(useLLMCheckbox && useLLMCheckbox.checked);
        console.log('Final useLLM value:', useLLM, typeof useLLM);
        
        // Show spinner and disable button
        generateProjectBtn.disabled = true;
        generateProjectSpinner.classList.remove('d-none');
        
        // Update status
        projectGenStatus.textContent = 'Generating project...';
        
        try {
            // Prepare the request payload
            const payload = {
                projectName,
                requirementsText: requirements,
                port: parseInt(port),
                host: 'localhost',
                staticFolder: 'static',
                useLLM: Boolean(useLLM)
            };
            
            console.log('Sending payload:', payload);
            
            // Call the API to generate the project
            const response = await fetch(PROJECT_GEN_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Project generated successfully
                generatedProjectPath = data.data.projectPath;
                generatedProjectName = data.data.projectName || projectName;
                projectGenerated = true;
                
                // Update status with success styling
                projectGenStatus.innerHTML = `<span class="text-success"><i class="bi bi-check-circle me-2"></i>Project generated successfully at: ${generatedProjectPath}</span>`;
                
                // Enable next button
                nextStep3Btn.disabled = false;
                
                showNotification('Project generated successfully!', 'success');
            } else {
                throw new Error(data.error?.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error generating project:', error);
            projectGenStatus.innerHTML = `<span class="text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error: ${error.message}</span>`;
            showNotification('Error generating project: ' + error.message, 'error');
        } finally {
            // Hide spinner and enable button
            generateProjectBtn.disabled = false;
            generateProjectSpinner.classList.add('d-none');
        }
    }
    
    async function downloadProjectZip() {
        if (!projectGenerated) {
            showNotification('Please generate the project first', 'error');
            return;
        }
        
        downloadZipBtn.disabled = true;
        downloadZipBtn.innerHTML = '<span class="loader"></span> Creating ZIP...';
        
        try {
            // In a real implementation, we would call an API endpoint to zip the project
            // For this demo, we'll create a mock endpoint
            const zipEndpoint = `${PROJECT_GEN_API}/download/${generatedProjectName}`;
            
            // Simulate download by redirecting to a hypothetical endpoint
            // In a real implementation, this would trigger a file download
            window.location.href = zipEndpoint;
            
            setTimeout(() => {
                showNotification('Project ZIP download started!', 'success');
                downloadZipBtn.disabled = false;
                downloadZipBtn.innerHTML = '<i class="bi bi-download me-1"></i> Download Project ZIP';
            }, 2000);
        } catch (error) {
            console.error('Error downloading project ZIP:', error);
            showNotification('Error downloading project ZIP: ' + error.message, 'error');
            downloadZipBtn.disabled = false;
            downloadZipBtn.innerHTML = '<i class="bi bi-download me-1"></i> Download Project ZIP';
        }
    }
    
    function updateScenarioEntitiesDisplay() {
        // Clear previous content
        scenarioEntitiesDisplay.innerHTML = '';
        
        if (detectedEntities.length === 0) {
            scenarioEntitiesDisplay.innerHTML = '<span class="text-muted">None detected</span>';
            return;
        }
        
        // Create entity badges
        detectedEntities.forEach(entity => {
            const badge = document.createElement('span');
            badge.className = 'entity-badge';
            badge.innerHTML = `<i class="bi bi-table me-1"></i>${entity}`;
            scenarioEntitiesDisplay.appendChild(badge);
        });
    }
    
    async function generateScenario() {
        if (!validateScenario()) {
            return;
        }
        
        // Show loading state
        generateScenarioBtn.disabled = true;
        generateScenarioSpinner.classList.remove('d-none');
        
        try {
            const scenarioName = scenarioNameInput.value.trim();
            const scenarioDescription = scenarioDescriptionTextarea.value.trim();
            const llmModel = scenarioLlmModelSelect.value;
            
            // Prepare the request data
            const requestData = {
                projectName: generatedProjectName,
                scenarioName,
                scenarioDescription,
                llmModel
            };
            
            console.log('Sending scenario generation request:', requestData);
            
            // Send the request to the API
            const response = await fetch(`${PROJECT_GEN_API}/scenario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate scenario');
            }
            
            // Update the scenario path
            generatedScenarioPath = data.data.scenarioPath;
            generatedScenarioFilename = data.data.scenarioFilename;
            scenarioGenerated = true;
            
            showNotification('Scenario generated successfully!', 'success');
            
            // Go to the next step
            goToStep(6);
        } catch (error) {
            console.error('Error generating scenario:', error);
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            // Reset loading state
            generateScenarioBtn.disabled = false;
            generateScenarioSpinner.classList.add('d-none');
        }
    }
    
    function validateScenario() {
        const scenarioName = scenarioNameInput.value.trim();
        const scenarioDescription = scenarioDescriptionTextarea.value.trim();
        
        if (!scenarioName) {
            showNotification('Scenario name is required', 'error');
            scenarioNameInput.focus();
            return false;
        }
        
        if (!/^[a-zA-Z0-9-_ ]+$/.test(scenarioName)) {
            showNotification('Scenario name can only contain letters, numbers, hyphens, underscores, and spaces', 'error');
            scenarioNameInput.focus();
            return false;
        }
        
        if (!scenarioDescription) {
            showNotification('Scenario description is required', 'error');
            scenarioDescriptionTextarea.focus();
            return false;
        }
        
        if (scenarioDescription.length < 10) {
            showNotification('Scenario description must be at least 10 characters', 'error');
            scenarioDescriptionTextarea.focus();
            return false;
        }
        
        return true;
    }
    
    function startOver() {
        // Reset state
        currentStep = 1;
        entityConfigsGenerated = false;
        projectGenerated = false;
        generatedProjectPath = '';
        generatedProjectName = '';
        entityConfigs = '';
        detectedEntities = [];
        scenarioGenerated = false;
        generatedScenarioPath = '';
        generatedScenarioFilename = '';
        mockDataGenerated = false;
        
        // Reset form fields
        projectNameInput.value = '';
        requirementsTextarea.value = '';
        portNumberInput.value = '3002';
        entityConfigsEditor.value = '';
        projectGenStatus.textContent = 'Ready to generate project...';
        scenarioNameInput.value = '';
        scenarioDescriptionTextarea.value = '';
        recordsPerEntityInput.value = '5';
        useLLMMockCheckbox.checked = true;
        mockDataResult.style.display = 'none';
        
        // Reset buttons
        nextStep2Btn.disabled = true;
        nextStep3Btn.disabled = true;
        
        // Go to first step
        goToStep(1);
        
        showNotification('Wizard has been reset. Start a new project.', 'info');
    }
    
    function showHelp() {
        // Create a Bootstrap modal with help information
        const modalHtml = `
        <div class="modal fade" id="helpModal" tabindex="-1" aria-labelledby="helpModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="helpModalLabel"><i class="bi bi-question-circle me-2"></i>Project Generator Wizard Help</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <h5><i class="bi bi-1-circle me-2"></i>Step 1: Define Project Requirements</h5>
                        <p>Enter your project details and requirements for the entities you want to create. Format your requirements as follows:</p>
                        <pre class="bg-light p-3">Create a project with User and Product entities.
User has fields: name, email, password.
Product has fields: title, price, description, category.</pre>
                        <hr>
                        
                        <h5><i class="bi bi-2-circle me-2"></i>Step 2: Entity Configurations</h5>
                        <p>Generate and review the entity configurations based on your requirements. You can edit these if needed.</p>
                        <hr>
                        
                        <h5><i class="bi bi-3-circle me-2"></i>Step 3: Generate Project</h5>
                        <p>Review your project details and generate the project structure. This will create all necessary files for your JSON-Server project.</p>
                        <hr>
                        
                        <h5><i class="bi bi-4-circle me-2"></i>Step 4: Download Project</h5>
                        <p>Download your generated project as a ZIP file. The project includes everything needed to run a JSON-Server based API with a CRUD UI.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Got it!</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Append modal to body if it doesn't exist
        if (!document.getElementById('helpModal')) {
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);
        }
        
        // Show the modal using Bootstrap
        if (typeof bootstrap !== 'undefined') {
            const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
            helpModal.show();
        } else {
            showNotification('Bootstrap library not loaded properly', 'error');
        }
    }
    
    function showNotification(message, type) {
        // Clear any existing timeout
        if (window.notificationTimeout) {
            clearTimeout(window.notificationTimeout);
        }
        
        // Set notification content and show it
        notificationMessage.textContent = message;
        notification.className = 'notification';
        notification.classList.add(type);
        notification.classList.add('show');
        
        // Hide notification after 5 seconds
        window.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    /**
     * Generate mock data for entities
     */
    async function generateMockData() {
        // Make sure we have a project
        if (!projectGenerated || !generatedProjectName) {
            showNotification('Please generate a project first', 'error');
            return;
        }
        
        // Show loading state
        generateMockDataBtn.disabled = true;
        generateMockDataSpinner.classList.remove('d-none');
        mockDataResult.classList.add('d-none');
        
        try {
            const recordsPerEntity = parseInt(recordsPerEntityInput.value) || 5;
            const useLLM = useLLMMockCheckbox.checked;
            const llmModel = mockDataLlmModelSelect.value;
            
            // Prepare the request data
            const requestData = {
                projectName: generatedProjectName,
                recordsPerEntity,
                useLLM,
                llmModel
            };
            
            console.log('Sending mock data generation request:', requestData);
            
            // Send the request to the API
            const response = await fetch(`${PROJECT_GEN_API}/mock-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate mock data');
            }
            
            // Display the results
            mockDataGenerated = true;
            mockDataResult.classList.remove('d-none');
            
            // Build entity information
            const entityInfo = data.data.entities.map(entity => 
                `${entity.name}: ${entity.count} records`
            ).join(', ');
            
            mockDataMessage.textContent = `Mock data generated for ${data.data.entities.length} entities (${entityInfo})`;
            
            showNotification('Mock data generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating mock data:', error);
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            // Reset loading state
            generateMockDataBtn.disabled = false;
            generateMockDataSpinner.classList.add('d-none');
        }
    }
}); 