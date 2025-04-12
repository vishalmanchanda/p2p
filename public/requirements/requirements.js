document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startWithPromptBtn = document.getElementById('startWithPrompt');
    const startWithJsonBtn = document.getElementById('startWithJson');
    const promptSection = document.getElementById('promptSection');
    const jsonSection = document.getElementById('jsonSection');
    const saveSection = document.getElementById('saveSection');
    const resultsSection = document.getElementById('resultsSection');
    const cardViewBtn = document.getElementById('cardViewBtn');
    const jsonViewBtn = document.getElementById('jsonViewBtn');
    const cardView = document.getElementById('cardView');
    const jsonView = document.getElementById('jsonView');
    const jsonOutput = document.getElementById('jsonOutput');
    const addEntityBtn = document.getElementById('addEntityBtn');
    const entitiesList = document.getElementById('entitiesList');
    const saveJsonBtn = document.getElementById('saveJsonBtn');
    const fileNameInput = document.getElementById('fileName');

    // Templates
    const entityTemplate = document.getElementById('entityTemplate');
    const attributeTemplate = document.getElementById('attributeTemplate');

    let currentRequirements = {
        personas: [],
        goals: [],
        coreFeatures: [],
        keyData: {
            entities: []
        },
        workflows: [],
        constraints: []
    };

    // Add entity configs view button
    const entityConfigsViewBtn = document.createElement('button');
    entityConfigsViewBtn.id = 'entityConfigsViewBtn';
    entityConfigsViewBtn.className = 'px-4 py-2 rounded-lg bg-gray-200 text-gray-700';
    entityConfigsViewBtn.innerHTML = '<i class="fas fa-cogs mr-2"></i>Entity Configs';
    jsonViewBtn.parentNode.appendChild(entityConfigsViewBtn);

    // Add entity configs view section
    const entityConfigsView = document.createElement('div');
    entityConfigsView.id = 'entityConfigsView';
    entityConfigsView.className = 'hidden';
    const entityConfigsOutput = document.createElement('pre');
    entityConfigsOutput.className = 'whitespace-pre-wrap';
    entityConfigsView.appendChild(entityConfigsOutput);
    jsonView.parentNode.appendChild(entityConfigsView);

    // Helper function to normalize keyData format
    function normalizeKeyData(data) {
        if (Array.isArray(data)) {
            // Convert from array format to object format
            return {
                entities: data.map(item => ({
                    name: item.entity,
                    attributes: item.attributes.map(attr => ({
                        name: attr,
                        type: 'text'
                    })),
                    description: item.description
                }))
            };
        }
        return data;
    }

    // Event Listeners
    startWithPromptBtn.addEventListener('click', () => {
        const originalText = startWithPromptBtn.textContent;
        startWithPromptBtn.disabled = true;
        startWithPromptBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
        
        try {
            promptSection.classList.remove('hidden');
            jsonSection.classList.add('hidden');
            startWithPromptBtn.disabled = false;
            startWithPromptBtn.textContent = originalText;
        } catch (error) {
            console.error('Error switching to prompt view:', error);
            showNotification('Error switching to prompt view', 'error');
            startWithPromptBtn.disabled = false;
            startWithPromptBtn.textContent = originalText;
        }
    });

    startWithJsonBtn.addEventListener('click', () => {
        jsonSection.classList.remove('hidden');
        promptSection.classList.add('hidden');
    });

    document.getElementById('loadJsonBtn').addEventListener('click', () => {
        try {
            const jsonInput = document.getElementById('jsonInput').value.trim();
            if (!jsonInput) {
                showNotification('Please enter JSON data', 'error');
                return;
            }

            const parsedJson = JSON.parse(jsonInput);
            
            // Validate the structure
            if (!parsedJson.personas || !parsedJson.goals || !parsedJson.coreFeatures || 
                !parsedJson.keyData || !parsedJson.workflows) {
                showNotification('Invalid JSON structure. Required fields: personas, goals, coreFeatures, keyData, workflows', 'error');
                return;
            }

            // Normalize keyData format
            parsedJson.keyData = normalizeKeyData(parsedJson.keyData);

            currentRequirements = parsedJson;
            updateUI();
            resultsSection.classList.remove('hidden');
            saveSection.classList.remove('hidden');
            showNotification('JSON loaded successfully', 'success');
        } catch (error) {
            showNotification(`Invalid JSON format: ${error.message}`, 'error');
            console.error('Error loading JSON:', error);
        }
    });

    document.getElementById('generateBtn').addEventListener('click', async () => {
        const prompt = document.getElementById('requirementsPrompt').value.trim();
        if (!prompt) {
            showNotification('Please enter your requirements', 'error');
            return;
        }

        // Show loading state
        const generateBtn = document.getElementById('generateBtn');
        const originalText = generateBtn.textContent;
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
        showNotification('Generating requirements...', 'info');

        try {
            const response = await fetch('/api/generate/requirements/structured', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    basicRequirements: prompt,
                    modelName: 'deepseek-r1:8b'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to generate requirements');
            }

            currentRequirements = result.data;
            updateUI();
            resultsSection.classList.remove('hidden');
            saveSection.classList.remove('hidden');
            showNotification('Requirements generated successfully', 'success');
        } catch (error) {
            console.error('Error generating requirements:', error);
            showNotification(`Error generating requirements: ${error.message}`, 'error');
        } finally {
            // Reset button state
            generateBtn.disabled = false;
            generateBtn.textContent = originalText;
        }
    });

    // View Toggle Event Listeners
    if (cardViewBtn && jsonViewBtn && cardView && jsonView && entityConfigsView) {
        cardViewBtn.addEventListener('click', () => {
            cardView.classList.remove('hidden');
            jsonView.classList.add('hidden');
            entityConfigsView.classList.add('hidden');
            cardViewBtn.classList.add('bg-blue-500', 'text-white');
            cardViewBtn.classList.remove('bg-gray-200', 'text-gray-700');
            jsonViewBtn.classList.remove('bg-blue-500', 'text-white');
            jsonViewBtn.classList.add('bg-gray-200', 'text-gray-700');
            entityConfigsViewBtn.classList.remove('bg-blue-500', 'text-white');
            entityConfigsViewBtn.classList.add('bg-gray-200', 'text-gray-700');
        });

        jsonViewBtn.addEventListener('click', () => {
            jsonView.classList.remove('hidden');
            cardView.classList.add('hidden');
            entityConfigsView.classList.add('hidden');
            jsonViewBtn.classList.add('bg-blue-500', 'text-white');
            jsonViewBtn.classList.remove('bg-gray-200', 'text-gray-700');
            cardViewBtn.classList.remove('bg-blue-500', 'text-white');
            cardViewBtn.classList.add('bg-gray-200', 'text-gray-700');
            entityConfigsViewBtn.classList.remove('bg-blue-500', 'text-white');
            entityConfigsViewBtn.classList.add('bg-gray-200', 'text-gray-700');
            updateJsonView();
        });

        entityConfigsViewBtn.addEventListener('click', () => {
            entityConfigsView.classList.remove('hidden');
            cardView.classList.add('hidden');
            jsonView.classList.add('hidden');
            entityConfigsViewBtn.classList.add('bg-blue-500', 'text-white');
            entityConfigsViewBtn.classList.remove('bg-gray-200', 'text-gray-700');
            cardViewBtn.classList.remove('bg-blue-500', 'text-white');
            cardViewBtn.classList.add('bg-gray-200', 'text-gray-700');
            jsonViewBtn.classList.remove('bg-blue-500', 'text-white');
            jsonViewBtn.classList.add('bg-gray-200', 'text-gray-700');
            updateEntityConfigsView();
        });
    }

    // Entity Management
    addEntityBtn.addEventListener('click', () => {
        const entityElement = entityTemplate.content.cloneNode(true);
        const entityNode = setupEntityListeners(entityElement);
        entitiesList.appendChild(entityNode);
        updateRequirements();
    });

    // Save functionality
    saveJsonBtn.addEventListener('click', async () => {
        const fileName = fileNameInput.value.trim();
        if (!fileName) {
            showNotification('Please enter a file name', 'error');
            return;
        }

        const fullFileName = fileName + '.json';
        const jsonData = JSON.stringify(currentRequirements, null, 2);

        // Generate entity configurations
        const entityConfigs = generateEntityConfigs(currentRequirements.keyData);
        const entityConfigsData = `// Generated from ${fullFileName}\n\n${entityConfigs}`;

        // First try to save on server
        try {
            const response = await fetch('/api/save-requirements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileName: fullFileName,
                    requirements: currentRequirements,
                    entityConfigsFileName: fileName + '-entity-configs.js',
                    entityConfigs: entityConfigsData
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    showNotification('Requirements and entity configurations saved successfully on server', 'success');
                    return;
                }
            }
        } catch (error) {
            console.warn('Server save failed, falling back to download:', error);
        }

        // If server save fails or is not available, trigger downloads
        try {
            // Download requirements JSON
            const jsonBlob = new Blob([jsonData], { type: 'application/json' });
            const jsonUrl = window.URL.createObjectURL(jsonBlob);
            const jsonLink = document.createElement('a');
            jsonLink.style.display = 'none';
            jsonLink.href = jsonUrl;
            jsonLink.download = fullFileName;
            document.body.appendChild(jsonLink);
            jsonLink.click();
            window.URL.revokeObjectURL(jsonUrl);
            document.body.removeChild(jsonLink);

            // Download entity configurations
            const configBlob = new Blob([entityConfigsData], { type: 'application/javascript' });
            const configUrl = window.URL.createObjectURL(configBlob);
            const configLink = document.createElement('a');
            configLink.style.display = 'none';
            configLink.href = configUrl;
            configLink.download = fileName + '-entity-configs.js';
            document.body.appendChild(configLink);
            configLink.click();
            window.URL.revokeObjectURL(configUrl);
            document.body.removeChild(configLink);

            showNotification('Requirements and entity configurations downloaded successfully', 'success');
        } catch (error) {
            console.error('Error downloading files:', error);
            showNotification(`Error saving files: ${error.message}`, 'error');
        }
    });

    function generateEntityConfigs(keyData) {
        const entities = Array.isArray(keyData) ? keyData : (keyData.entities || []);
        const configs = entities.map(entity => {
            const entityName = (entity.entity || entity.name || '').toLowerCase();
            const attributes = (entity.attributes || []).map(attr => {
                const attrName = typeof attr === 'string' ? attr : attr.name;
                const attrType = typeof attr === 'string' ? inferType(attr) : (attr.type || 'text');
                
                return {
                    name: attrName.toLowerCase().replace(/\s+/g, ''),
                    label: formatLabel(attrName),
                    type: attrType,
                    required: isRequired(attrName),
                    ...getAdditionalProps(attrName, attrType)
                };
            });

            return {
                entityName: entityName + 's',
                title: formatLabel(entityName) + ' Management',
                apiBaseUrl: 'http://localhost:3005',
                itemsPerPage: 10,
                attributes
            };
        });

        const configsArray = configs.map((config, index) => {
            const varName = config.entityName.slice(0, -1) + 'Config';
            return `const ${varName} = ${JSON.stringify(config, null, 2)};`;
        }).join('\n\n');

        const exportNames = configs.map(config => config.entityName.slice(0, -1) + 'Config');
        const configuredEntities = configs.map(config => ({
            name: config.entityName.slice(0, -1),
            config: config.entityName.slice(0, -1) + 'Config'
        }));

        return `${configsArray}

const configuredEntities = [${configuredEntities.map(e => `{name: '${e.name}', config: ${e.config}}`).join(', ')}];

// Add this for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { configuredEntities, ${exportNames.join(', ')} };
}`;
    }

    function inferType(attrName) {
        const name = attrName.toLowerCase();
        if (name.includes('date')) return 'date';
        if (name.includes('email')) return 'email';
        if (name.includes('price') || name.includes('amount') || name.includes('cost')) return 'number';
        if (name.includes('description') || name.includes('notes')) return 'textarea';
        if (name.includes('status') || name.includes('active')) return 'checkbox';
        if (name.includes('type') || name.includes('category')) return 'select';
        return 'text';
    }

    function formatLabel(name) {
        return name
            .split(/(?=[A-Z])|[\s_-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    function isRequired(attrName) {
        const name = attrName.toLowerCase();
        return name.includes('id') || 
               name.includes('name') || 
               name.includes('email') ||
               name.includes('price') ||
               name.includes('amount');
    }

    function getAdditionalProps(attrName, type) {
        const name = attrName.toLowerCase();
        const props = {};

        if (type === 'number') {
            if (name.includes('price') || name.includes('amount') || name.includes('cost')) {
                props.prefix = '$';
                props.step = '0.01';
                props.min = 0;
            } else {
                props.min = 0;
            }
        }

        if (type === 'textarea') {
            props.hideInTable = true;
        }

        if (type === 'checkbox') {
            props.checkboxLabel = name.includes('active') ? 'Active' : 'Enabled';
        }

        if (type === 'select') {
            if (name.includes('status')) {
                props.options = [
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'pending', label: 'Pending' }
                ];
            } else if (name.includes('type') || name.includes('category')) {
                props.options = [
                    { value: 'type1', label: 'Type 1' },
                    { value: 'type2', label: 'Type 2' },
                    { value: 'type3', label: 'Type 3' }
                ];
            }
        }

        return props;
    }

    // Helper Functions
    function setupItemListeners(element, type) {
        const elementNode = document.importNode(element, true);
        const removeButton = elementNode.querySelector('.remove-item');
        const inputs = elementNode.querySelectorAll('input, select');
        
        removeButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove this item?')) {
                removeButton.closest('.persona-item, .goal-item, .feature-item, .workflow-item, .constraint-item').remove();
                updateRequirements();
            }
        });
        
        inputs.forEach(input => {
            input.addEventListener('change', updateRequirements);
        });

        return elementNode;
    }

    function setupStepListeners(stepElement, container) {
        const stepNode = document.importNode(stepElement, true);
        const removeButton = stepNode.querySelector('.remove-step');
        const input = stepNode.querySelector('input');
        
        removeButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove this step?')) {
                removeButton.closest('.step-item').remove();
                updateRequirements();
            }
        });
        
        input.addEventListener('change', updateRequirements);

        return stepNode;
    }

    function setupEntityListeners(entityElement) {
        const entityNode = document.importNode(entityElement, true);
        const removeButton = entityNode.querySelector('.remove-entity');
        const addAttributeButton = entityNode.querySelector('.add-attribute');
        const entityNameInput = entityNode.querySelector('.entity-name');
        const attributesList = entityNode.querySelector('.attributes-list');
        
        removeButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove this entity?')) {
                removeButton.closest('.entity-item').remove();
                updateRequirements();
            }
        });
        
        addAttributeButton.addEventListener('click', () => {
            const attrElement = attributeTemplate.content.cloneNode(true);
            const attrNode = setupAttributeListeners(attrElement);
            attributesList.appendChild(attrNode);
            updateRequirements();
        });
        
        entityNameInput.addEventListener('change', updateRequirements);

        return entityNode;
    }

    function setupAttributeListeners(attrElement) {
        const attrNode = document.importNode(attrElement, true);
        const removeButton = attrNode.querySelector('.remove-attribute');
        const inputs = attrNode.querySelectorAll('input, select');
        
        removeButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove this attribute?')) {
                removeButton.closest('.attribute-item').remove();
                updateRequirements();
            }
        });
        
        inputs.forEach(input => {
            input.addEventListener('change', updateRequirements);
        });

        return attrNode;
    }

    function updateRequirements() {
        try {
            // Update personas
            currentRequirements.personas = Array.from(document.getElementById('personasContent').children).map(element => {
                const inputs = element.querySelectorAll('input');
                return {
                    name: inputs[0].value,
                    description: inputs[1].value
                };
            }).filter(item => item.name);

            // Update goals
            currentRequirements.goals = Array.from(document.getElementById('goalsContent').children).map(element => {
                const inputs = element.querySelectorAll('input');
                return {
                    title: inputs[0].value,
                    description: inputs[1].value
                };
            }).filter(item => item.title);

            // Update core features
            currentRequirements.coreFeatures = Array.from(document.getElementById('coreFeaturesContent').children).map(element => {
                const inputs = element.querySelectorAll('input');
                const select = element.querySelector('select');
                return {
                    title: inputs[0].value,
                    description: inputs[1].value,
                    priority: select.value
                };
            }).filter(item => item.title);

            // Update workflows
            currentRequirements.workflows = Array.from(document.getElementById('workflowsContent').children).map(element => {
                const nameInput = element.querySelector('.workflow-name');
                const descriptionInput = element.querySelector('.workflow-description');
                const steps = Array.from(element.querySelectorAll('.step-item input')).map(input => input.value);
                return {
                    name: nameInput.value,
                    description: descriptionInput.value,
                    steps: steps.filter(Boolean)
                };
            }).filter(item => item.name);

            // Update constraints
            currentRequirements.constraints = Array.from(document.getElementById('constraintsContent').children).map(element => {
                const select = element.querySelector('select');
                const input = element.querySelector('input');
                return {
                    type: select.value,
                    description: input.value
                };
            }).filter(item => item.description);

            // Update entities
            currentRequirements.keyData.entities = Array.from(document.getElementById('entitiesList').children).map(entityElement => {
                const name = entityElement.querySelector('.entity-name').value;
                const attributes = Array.from(entityElement.querySelectorAll('.attribute-item')).map(attrElement => ({
                    name: attrElement.querySelector('.attribute-name').value,
                    type: attrElement.querySelector('.attribute-type').value
                })).filter(attr => attr.name && attr.type);

                return { name, attributes };
            }).filter(entity => entity.name);

            updateJsonView();
        } catch (error) {
            console.error('Error updating requirements:', error);
            showNotification('Error updating requirements: ' + error.message, 'error');
        }
    }

    function updateUI() {
        try {
            // Show the results section
            if (resultsSection) {
                resultsSection.classList.remove('hidden');
            }
            
            // Show card view by default
            if (cardView && jsonView && entityConfigsView) {
                cardView.classList.remove('hidden');
                jsonView.classList.add('hidden');
                entityConfigsView.classList.add('hidden');
                if (cardViewBtn && jsonViewBtn && entityConfigsViewBtn) {
                    cardViewBtn.classList.add('bg-blue-500', 'text-white');
                    cardViewBtn.classList.remove('bg-gray-200', 'text-gray-700');
                    jsonViewBtn.classList.remove('bg-blue-500', 'text-white');
                    jsonViewBtn.classList.add('bg-gray-200', 'text-gray-700');
                    entityConfigsViewBtn.classList.remove('bg-blue-500', 'text-white');
                    entityConfigsViewBtn.classList.add('bg-gray-200', 'text-gray-700');
                }
            }

            // Update personas
            const personasContent = document.getElementById('personasContent');
            personasContent.innerHTML = '';
            if (currentRequirements.personas && Array.isArray(currentRequirements.personas)) {
                currentRequirements.personas.forEach(persona => {
                    const personaElement = document.getElementById('personaTemplate').content.cloneNode(true);
                    const inputs = personaElement.querySelectorAll('input');
                    if (typeof persona === 'object') {
                        inputs[0].value = persona.name || '';
                        inputs[1].value = persona.description || '';
                    } else {
                        inputs[0].value = persona;
                        inputs[1].value = '';
                    }
                    const personaNode = setupItemListeners(personaElement, 'personas');
                    personasContent.appendChild(personaNode);
                });
            }

            // Update goals
            const goalsContent = document.getElementById('goalsContent');
            goalsContent.innerHTML = '';
            if (currentRequirements.goals && Array.isArray(currentRequirements.goals)) {
                currentRequirements.goals.forEach(goal => {
                    const goalElement = document.getElementById('goalTemplate').content.cloneNode(true);
                    const inputs = goalElement.querySelectorAll('input');
                    if (typeof goal === 'object') {
                        inputs[0].value = goal.title || '';
                        inputs[1].value = goal.description || '';
                    } else {
                        inputs[0].value = goal;
                        inputs[1].value = '';
                    }
                    const goalNode = setupItemListeners(goalElement, 'goals');
                    goalsContent.appendChild(goalNode);
                });
            }

            // Update core features
            const coreFeaturesContent = document.getElementById('coreFeaturesContent');
            coreFeaturesContent.innerHTML = '';
            if (currentRequirements.coreFeatures && Array.isArray(currentRequirements.coreFeatures)) {
                currentRequirements.coreFeatures.forEach(feature => {
                    const featureElement = document.getElementById('featureTemplate').content.cloneNode(true);
                    const inputs = featureElement.querySelectorAll('input');
                    const select = featureElement.querySelector('select');
                    if (typeof feature === 'object') {
                        inputs[0].value = feature.title || '';
                        inputs[1].value = feature.description || '';
                        select.value = feature.priority || 'Medium';
                    } else {
                        inputs[0].value = feature;
                        inputs[1].value = '';
                        select.value = 'Medium';
                    }
                    const featureNode = setupItemListeners(featureElement, 'coreFeatures');
                    coreFeaturesContent.appendChild(featureNode);
                });
            }

            // Update workflows
            const workflowsContent = document.getElementById('workflowsContent');
            workflowsContent.innerHTML = '';
            if (currentRequirements.workflows && Array.isArray(currentRequirements.workflows)) {
                currentRequirements.workflows.forEach(workflow => {
                    const workflowElement = document.getElementById('workflowTemplate').content.cloneNode(true);
                    const nameInput = workflowElement.querySelector('.workflow-name');
                    const descriptionInput = workflowElement.querySelector('.workflow-description');
                    const stepsContainer = workflowElement.querySelector('.steps-container');
                    
                    if (typeof workflow === 'object') {
                        nameInput.value = workflow.name || '';
                        descriptionInput.value = workflow.description || '';
                        
                        if (Array.isArray(workflow.steps)) {
                            workflow.steps.forEach(step => {
                                const stepElement = document.getElementById('stepTemplate').content.cloneNode(true);
                                const stepInput = stepElement.querySelector('input');
                                stepInput.value = step;
                                const stepNode = setupStepListeners(stepElement, stepsContainer);
                                stepsContainer.appendChild(stepNode);
                            });
                        }
                    } else {
                        nameInput.value = workflow;
                        descriptionInput.value = '';
                    }
                    
                    const workflowNode = setupItemListeners(workflowElement, 'workflows');
                    workflowsContent.appendChild(workflowNode);
                });
            }

            // Update constraints
            const constraintsContent = document.getElementById('constraintsContent');
            constraintsContent.innerHTML = '';
            if (currentRequirements.constraints && Array.isArray(currentRequirements.constraints)) {
                currentRequirements.constraints.forEach(constraint => {
                    const constraintElement = document.getElementById('constraintTemplate').content.cloneNode(true);
                    const select = constraintElement.querySelector('select');
                    const input = constraintElement.querySelector('input');
                    if (typeof constraint === 'object') {
                        select.value = constraint.type || 'Technical';
                        input.value = constraint.description || '';
                    } else {
                        select.value = 'Technical';
                        input.value = constraint;
                    }
                    const constraintNode = setupItemListeners(constraintElement, 'constraints');
                    constraintsContent.appendChild(constraintNode);
                });
            }

            // Update entities
            const entitiesList = document.getElementById('entitiesList');
            entitiesList.innerHTML = '';
            if (currentRequirements.keyData && currentRequirements.keyData.entities && Array.isArray(currentRequirements.keyData.entities)) {
                currentRequirements.keyData.entities.forEach(entity => {
                    const entityElement = entityTemplate.content.cloneNode(true);
                    const entityNode = setupEntityListeners(entityElement);
                    const entityNameInput = entityNode.querySelector('.entity-name');
                    const attributesList = entityNode.querySelector('.attributes-list');
                    
                    entityNameInput.value = entity.name || '';
                    
                    if (Array.isArray(entity.attributes)) {
                        entity.attributes.forEach(attr => {
                            const attrElement = attributeTemplate.content.cloneNode(true);
                            const attrNode = setupAttributeListeners(attrElement);
                            const attrNameInput = attrNode.querySelector('.attribute-name');
                            const attrTypeInput = attrNode.querySelector('.attribute-type');
                            
                            if (typeof attr === 'object') {
                                attrNameInput.value = attr.name || '';
                                attrTypeInput.value = attr.type || 'text';
                            } else {
                                attrNameInput.value = attr;
                                attrTypeInput.value = 'text';
                            }
                            
                            attributesList.appendChild(attrNode);
                        });
                    }
                    
                    entitiesList.appendChild(entityNode);
                });
            }

            updateJsonView();
        } catch (error) {
            console.error('Error updating UI:', error);
            showNotification('Error updating UI: ' + error.message, 'error');
        }
    }

    function updateJsonView() {
        try {
            if (jsonOutput) {
                jsonOutput.textContent = JSON.stringify(currentRequirements, null, 2);
            }
        } catch (error) {
            console.error('Error updating JSON view:', error);
            showNotification('Error updating JSON view: ' + error.message, 'error');
        }
    }

    function updateEntityConfigsView() {
        try {
            if (entityConfigsOutput) {
                const entityConfigs = generateEntityConfigs(currentRequirements.keyData);
                entityConfigsOutput.textContent = entityConfigs;
            }
        } catch (error) {
            console.error('Error updating entity configs view:', error);
            showNotification('Error updating entity configs view: ' + error.message, 'error');
        }
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white ${
            type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 
            'bg-blue-500'
        }`;
        notification.textContent = message;

        // Add to document
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Initialize
    cardViewBtn.classList.add('bg-blue-500', 'text-white');
    jsonViewBtn.classList.add('bg-gray-200', 'text-gray-700');
}); 