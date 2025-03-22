document.addEventListener('DOMContentLoaded', function() {
  // First load the navbar HTML template
  fetch('includes/navbar.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('navbar-container').innerHTML = data;
      
      // Now load the navbar configuration
      return fetch('config/navbar-config.json');
    })
    .then(response => response.json())
    .then(config => {
      // Configure the navbar based on the JSON config
      configureNavbar(config);
    })
    .catch(error => {
      console.error('Error setting up navbar:', error);
      // Create a fallback navbar in case of error
      createFallbackNavbar();
    });
});

function configureNavbar(config) {
  // Set the brand/logo
  const brandElement = document.getElementById('navbar-brand');
  if (brandElement) {
    brandElement.innerHTML = `<a class="navbar-brand" href="${config.brand.url}"><img src="${config.brand.logo}" alt="${config.brand.alt}"></a>`;
  }
  
  // Get the current page path
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';
  
  console.log('Current page:', currentPage);
  
  // Build the menu
  const menuElement = document.getElementById('navbar-menu');
  if (!menuElement) return;
  
  // Clear existing menu items if any
  menuElement.innerHTML = '';
  
  config.menus.forEach(menuItem => {
    const li = document.createElement('li');
    
    // Determine if this menu item corresponds to the current page
    const isCurrentPage = isActivePage(currentPage, menuItem);
    const hasActiveSubmenu = menuItem.submenus && menuItem.submenus.some(submenu => isActivePage(currentPage, submenu));
    
    li.className = `nav-item ${menuItem.isDropdown ? 'dropdown' : ''} ${(isCurrentPage || hasActiveSubmenu) ? 'active' : ''} ${menuItem.varname ? menuItem.varname : ''}`;
    
    // Create the menu link
    let menuLink = `<a class="nav-link ${menuItem.isDropdown ? 'dropdown-toggle' : ''}" href="${menuItem.url}"`;
    
    if (menuItem.isDropdown) {
      menuLink += ` data-toggle="dropdown">${menuItem.title}<span><i class="${menuItem.icon}"></i></span></a>`;
    } else {
      menuLink += `>${menuItem.title}</a>`;
    }
    
    li.innerHTML = menuLink;
    
    // If this is a dropdown menu, add the submenu items
    if (menuItem.isDropdown && menuItem.submenus) {
      const submenuUl = document.createElement('ul');
      submenuUl.className = 'dropdown-menu';
      
      menuItem.submenus.forEach(submenu => {
        let submenuLi;
        
        if (submenu.isSubmenu) {
          // This is a nested submenu (dropdown within dropdown)
          submenuLi = createNestedSubmenu(submenu, currentPage);
        } else {
          // Regular submenu item
          submenuLi = document.createElement('li');
          const isActive = isActivePage(currentPage, submenu);
          submenuLi.innerHTML = `<a class="dropdown-item ${isActive ? 'active' : ''}" ${submenu.id ? `id="${submenu.id}"` : ''} href="${submenu.url}">${submenu.title}</a>`;
        }
        
        submenuUl.appendChild(submenuLi);
      });
      
      li.appendChild(submenuUl);
    }
    
    menuElement.appendChild(li);
  });
  
  // Add event listeners to handle active class on click
  addNavClickHandlers();
}

function createNestedSubmenu(submenu, currentPage) {
  const li = document.createElement('li');
  li.className = 'dropdown dropdown-submenu dropright';
  
  const isActive = isActivePage(currentPage, submenu);
  const hasActiveSubmenu = submenu.submenus && submenu.submenus.some(sub => isActivePage(currentPage, sub));
  
  if (isActive || hasActiveSubmenu) {
    li.classList.add('active');
  }
  
  li.innerHTML = `
    <a class="dropdown-item dropdown-toggle ${isActive ? 'active' : ''}" href="${submenu.url}" id="${submenu.id || ''}" role="button" 
       data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${submenu.title}</a>
  `;
  
  if (submenu.submenus && submenu.submenus.length > 0) {
    const nestedUl = document.createElement('ul');
    nestedUl.className = 'dropdown-menu';
    if (submenu.id) {
      nestedUl.setAttribute('aria-labelledby', submenu.id);
    }
    
    submenu.submenus.forEach(nestedItem => {
      const nestedLi = document.createElement('li');
      const isNestedActive = isActivePage(currentPage, nestedItem);
      nestedLi.innerHTML = `<a class="dropdown-item ${isNestedActive ? 'active' : ''}" href="${nestedItem.url}">${nestedItem.title}</a>`;
      nestedUl.appendChild(nestedLi);
    });
    
    li.appendChild(nestedUl);
  }
  
  return li;
}

// Helper function to check if a menu item corresponds to the current page
function isActivePage(currentPage, menuItem) {
  // Special case for home page
  if (currentPage === '' && menuItem.url === 'index.html') {
    return true;
  }

  // Direct URL match
  if (menuItem.url === currentPage) {
    return true;
  }
  
  // Special case for the Entities menu and crud.html
  if (currentPage === 'crud.html' && menuItem.varname === 'entities') {
    return true;
  }
  
  // Check if URL ends with the current page (for subdirectory cases)
  if (menuItem.url && menuItem.url.endsWith(`/${currentPage}`)) {
    return true;
  }
  
  return false;
}

function addNavClickHandlers() {
  // Add click handlers to update active state when menu items are clicked
  const navLinks = document.querySelectorAll('#navbar-menu .nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // If this is a dropdown toggle, don't set active yet
      if (this.classList.contains('dropdown-toggle')) {
        return;
      }
      
      // Remove active class from all nav items
      document.querySelectorAll('#navbar-menu .nav-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to parent nav-item
      let parentItem = this.closest('.nav-item');
      if (parentItem) {
        parentItem.classList.add('active');
      }
    });
  });
  
  // Handle dropdown menu items separately
  const dropdownItems = document.querySelectorAll('#navbar-menu .dropdown-item');
  
  dropdownItems.forEach(item => {
    item.addEventListener('click', function(e) {
      // Don't process dropdown toggles
      if (this.classList.contains('dropdown-toggle')) {
        return;
      }
      
      // Remove active class from all items
      document.querySelectorAll('#navbar-menu .nav-item, #navbar-menu .dropdown-item').forEach(menuItem => {
        menuItem.classList.remove('active');
      });
      
      // Add active class to this item
      this.classList.add('active');
      
      // Add active class to all parent dropdown items
      let parent = this.closest('.dropdown');
      while (parent) {
        parent.classList.add('active');
        parent = parent.parentElement.closest('.dropdown');
      }
    });
  });
}

function createFallbackNavbar() {
  const container = document.getElementById('navbar-container');
  if (!container) return;
  
  container.innerHTML = `
    <nav class="navbar main-nav navbar-expand-lg px-2 px-sm-0 py-2 py-lg-0">
      <div class="container">
        <a class="navbar-brand" href="index.html">Menu</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav"
          aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="ti-menu"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ml-auto">
            <li class="nav-item active">
              <a class="nav-link" href="index.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="crud.html">Entities</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `;
} 