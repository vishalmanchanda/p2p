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
    
    // Generate Bootstrap nav tabs
    const navTabs = document.createElement('ul');
    navTabs.className = 'nav nav-tabs mb-4';
    navTabs.id = 'entityTabs';
    navTabs.setAttribute('role', 'tablist');
    tabsContainer.appendChild(navTabs);
    
    // Create tab content container
    const tabContentDiv = document.createElement('div');
    tabContentDiv.className = 'tab-content';
    tabContentDiv.id = 'entityTabContent';
    tabContentArea.appendChild(tabContentDiv);
    
    // Generate tabs and content containers for each entity
    configuredEntities.forEach((entity, index) => {
      const isActive = index === 0;
      const entityId = entity.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Create tab button
      const tabItem = document.createElement('li');
      tabItem.className = 'nav-item';
      tabItem.role = 'presentation';
      
      // Get icon based on entity name or use a default
      let iconClass = 'fas fa-cube';
      if (entity.name.toLowerCase().includes('user')) iconClass = 'fas fa-users';
      if (entity.name.toLowerCase().includes('product')) iconClass = 'fas fa-box';
      if (entity.name.toLowerCase().includes('order')) iconClass = 'fas fa-shopping-cart';
      if (entity.name.toLowerCase().includes('category')) iconClass = 'fas fa-tags';
      if (entity.name.toLowerCase().includes('comment')) iconClass = 'fas fa-comments';
      
      tabItem.innerHTML = `
        <button class="nav-link ${isActive ? 'active' : ''}" 
           id="${entityId}-tab" 
           data-bs-toggle="tab" 
           data-bs-target="#${entityId}-content" 
           type="button"
           role="tab" 
           aria-controls="${entityId}-content" 
           aria-selected="${isActive ? 'true' : 'false'}">
          <i class="${iconClass} me-2"></i> ${entity.config.title || entity.name}
        </button>
      `;
      navTabs.appendChild(tabItem);
      
      // Create tab content container
      const tabContent = document.createElement('div');
      tabContent.className = `tab-pane fade ${isActive ? 'show active' : ''}`;
      tabContent.id = `${entityId}-content`;
      tabContent.setAttribute('role', 'tabpanel');
      tabContent.setAttribute('aria-labelledby', `${entityId}-tab`);
      
      // Create entity container inside tab content
      const entityContainer = document.createElement('div');
      entityContainer.id = entity.name;
      tabContent.appendChild(entityContainer);
      
      // Add tab content to the tab content container
      tabContentDiv.appendChild(tabContent);
      
      // Initialize CRUD generator for this entity
      console.log(`Initializing ${entity.name} CRUD...`);
      crudInstances[entity.name] = initJsonServerCrud(
        entity.name, 
        entity.config, 
        isActive // Only load data for the first entity (which is active by default)
      );
    });

    // Make crudInstances available globally for debugging
    window.crudInstances = crudInstances;
    
    // Set up tab activation event listeners using jQuery - more reliable with Bootstrap
    $(document).on('click', '#entityTabs button[data-bs-toggle="tab"]', function(event) {
      // Prevent default action
      event.preventDefault();
      
      // Get target tab content ID
      const targetId = $(this).attr('data-bs-target');
      
      // Deactivate all tabs
      $('#entityTabs button').removeClass('active').attr('aria-selected', 'false');
      $('#entityTabContent .tab-pane').removeClass('show active');
      
      // Activate the selected tab and content
      $(this).addClass('active').attr('aria-selected', 'true');
      $(targetId).addClass('show active');
      
      // Get entity name from tab ID
      const tabId = $(this).attr('id');
      const entityName = tabId.replace('-tab', '');
      
      // Find the corresponding entity
      const matchedEntity = configuredEntities.find(entity => 
        entity.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === entityName
      );
      
      if (matchedEntity && crudInstances[matchedEntity.name]) {
        // Load data for the activated tab
        console.log(`Tab activated: ${matchedEntity.name}`);
        crudInstances[matchedEntity.name].loadDataIfNeeded();
      } else {
        console.error(`Could not find CRUD instance for tab ${tabId}`);
      }
    });
    
    // Log that initialization is complete
    console.log('Entity tabs initialized');
  });