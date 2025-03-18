document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CRUD generators...'); // Debug log
    
    console.log(configuredEntities);
    
    // Store CRUD instances
    const crudInstances = {};
    
    // Generate tabs and tab content containers dynamically
    const tabsContainer = document.querySelector('.page-container nav');
    const tabContentArea = document.querySelector('.page-container');
    
    // Clear placeholder tabs and content
    tabsContainer.innerHTML = '';
    
    // Remove existing tab content divs
    document.querySelectorAll('.tab-content').forEach(el => el.remove());
    
    // Generate tabs and content containers for each entity
    configuredEntities.forEach((entity, index) => {
      const isActive = index === 0;
      
      // Create tab button
      const tabButton = document.createElement('button');
      tabButton.id = `${entity.name}-tab`;
      tabButton.className = `tab-btn ${isActive ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`;
      
      // Get icon based on entity name or use a default
      let iconClass = 'fas fa-cube';
      if (entity.name === 'user' || entity.name === 'users') iconClass = 'fas fa-users';
      if (entity.name === 'product' || entity.name === 'products') iconClass = 'fas fa-box';
      
      tabButton.innerHTML = `<i class="${iconClass} mr-2"></i>${entity.config.title || entity.name}`;
      tabsContainer.appendChild(tabButton);
      
      // Create tab content container
      const tabContent = document.createElement('div');
      tabContent.id = `${entity.name}-content`;
      tabContent.className = `tab-content ${isActive ? '' : 'hidden'}`;
      
      // Create entity container inside tab content
      const entityContainer = document.createElement('div');
      entityContainer.id = entity.name;
      tabContent.appendChild(entityContainer);
      
      // Add tab content after the tabs navigation
      tabContentArea.appendChild(tabContent);
      
      // Initialize CRUD generator for this entity
      console.log(`Initializing ${entity.name} CRUD...`); // Debug log
      crudInstances[entity.name] = initJsonServerCrud(
        entity.name, 
        entity.config, 
        isActive // Only load data for the first entity (which is active by default)
      );
    });

    // Make crudInstances available globally for debugging
    window.crudInstances = crudInstances;
    
    // Set up tab switching with data loading
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', async () => {
        console.log(`Tab clicked: ${button.id}`); // Debug log
        
        // Update active tab button
        tabButtons.forEach(btn => {
          btn.classList.remove('border-indigo-500', 'text-indigo-600');
          btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        });
        button.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        button.classList.add('border-indigo-500', 'text-indigo-600');
        
        // Show corresponding tab content
        const targetId = button.id.replace('-tab', '-content');
        console.log(`Showing content: ${targetId}`); // Debug log
        
        tabContents.forEach(content => {
          content.classList.add('hidden');
        });
        document.getElementById(targetId).classList.remove('hidden');
        
        // Load data for the activated tab
        try {
          const entityName = button.id.replace('-tab', '');
          if (crudInstances[entityName]) {
            console.log(`Loading ${entityName} data...`); // Debug log
            await crudInstances[entityName].loadDataIfNeeded();
          }
        } catch (error) {
          console.error('Error loading tab data:', error);
        }
      });
    });
  });