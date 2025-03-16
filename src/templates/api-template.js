$(document).ready(function() {
    // Base URL for the JSON Server
    const baseUrl = 'http://localhost:3001';
  
    // Generic function to load and display entities
    function loadEntities(entityType, containerId, renderFunction) {
      $.ajax({
        url: `${baseUrl}/${entityType}`,
        method: 'GET',
        success: function(entities) {
          const container = $(`#${containerId}`);
          container.empty();
          
          if (entities.length === 0) {
            container.append(`
              <div class="flex items-center justify-center p-6 bg-gray-50 rounded-lg shadow-sm">
                <p class="text-gray-500 text-lg">No ${entityType} available.</p>
              </div>
            `);
            return;
          }
          
          entities.forEach(entity => {
            container.append(renderFunction(entity));
          });
        },
        error: function(error) {
          console.error(`Error loading ${entityType}:`, error);
          $('#error-message').html(`
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">Failed to load ${entityType}. Please try again.</p>
                </div>
              </div>
            </div>
          `);
        }
      });
    }
  
    // Generic function to load related items
    function loadRelatedItems(parentType, parentId, relatedType, containerId, renderFunction) {
      $.ajax({
        url: `${baseUrl}/${relatedType}?${parentType}Id=${parentId}`,
        method: 'GET',
        success: function(items) {
          const container = $(`#${containerId}`);
          container.empty();
          
          if (items.length === 0) {
            container.append(`
              <div class="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                <p class="text-gray-500">No ${relatedType} for this ${parentType} yet.</p>
              </div>
            `);
            return;
          }
          
          items.forEach(item => {
            container.append(renderFunction(item));
          });
          
          // Show the related items section with a smooth transition
          $(`#${relatedType}-section`).fadeIn(300);
        },
        error: function(error) {
          console.error(`Error loading ${relatedType}:`, error);
          $('#error-message').html(`
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">Failed to load ${relatedType}. Please try again.</p>
                </div>
              </div>
            </div>
          `);
        }
      });
    }
  
    // Generic function to add a new item
    function addItem(itemType, data, successCallback) {
      // Show loading indicator
      $('#submit-spinner').removeClass('hidden');
      
      $.ajax({
        url: `${baseUrl}/${itemType}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
          // Hide loading indicator
          $('#submit-spinner').addClass('hidden');
          
          // Show success message
          $('#success-message').html(`
            <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-green-700">${capitalizeFirstLetter(itemType)} added successfully!</p>
                </div>
              </div>
            </div>
          `).fadeIn().delay(3000).fadeOut();
          
          if (successCallback) {
            successCallback(response);
          }
        },
        error: function(error) {
          // Hide loading indicator
          $('#submit-spinner').addClass('hidden');
          
          console.error(`Error adding ${itemType}:`, error);
          $('#error-message').html(`
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">Failed to add ${itemType}. Please try again.</p>
                </div>
              </div>
            </div>
          `);
        }
      });
    }
  
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  
    // Entity-specific render functions with Tailwind CSS
    const renderFunctions = {
      blogs: function(blog) {
        return `
          <div class="blog-item bg-white rounded-lg shadow-md overflow-hidden mb-4 transition-all duration-300 hover:shadow-lg" data-id="${blog.id}">
            <div class="p-5">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">${blog.name}</h3>
              ${blog.description ? `<p class="text-gray-600 mb-3">${blog.description.substring(0, 100)}${blog.description.length > 100 ? '...' : ''}</p>` : ''}
              <div class="flex justify-between items-center">
                <button class="btn-view-comments inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
                  <svg class="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  View Comments
                </button>
                ${blog.createdAt ? `<span class="text-sm text-gray-500">${new Date(blog.createdAt).toLocaleDateString()}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      },
      authors: function(author) {
        return `
          <div class="author-item bg-white rounded-lg shadow-md overflow-hidden mb-4 transition-all duration-300 hover:shadow-lg" data-id="${author.id}">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span class="text-xl font-medium text-indigo-800">${author.name.charAt(0)}</span>
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-800">${author.name}</h3>
                  ${author.email ? `<p class="text-sm text-gray-500">${author.email}</p>` : ''}
                </div>
              </div>
              ${author.bio ? `<p class="mt-3 text-gray-600">${author.bio}</p>` : ''}
            </div>
          </div>
        `;
      },
      comments: function(comment) {
        return `
          <div class="comment-item bg-gray-50 rounded-lg p-4 mb-3 border-l-4 border-indigo-300" data-id="${comment.id}">
            <div class="flex items-start">
              <div class="flex-shrink-0 mr-3">
                <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg class="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <p class="text-gray-700">${comment.content}</p>
                ${comment.createdAt ? `<p class="text-xs text-gray-500 mt-1">${new Date(comment.createdAt).toLocaleString()}</p>` : ''}
              </div>
            </div>
          </div>
        `;
      }
    };
  
    // Initial load of entities
    function initializeApp(config) {
      // Load primary entities
      config.primaryEntities.forEach(entity => {
        loadEntities(entity.type, `${entity.type}-list`, renderFunctions[entity.type]);
      });
  
      // Set up event handlers
      setupEventHandlers(config);
      
      // Show default tab
      $(`.tab[data-tab="${config.defaultTab}"]`).click();
      
      // Hide related sections initially
      config.relatedSections.forEach(section => {
        $(`#${section}-section`).hide();
      });
      
      // Initialize tooltips, if any
      if (typeof tippy !== 'undefined') {
        tippy('[data-tippy-content]');
      }
    }
  
    // Set up event handlers
    function setupEventHandlers(config) {
      // Event delegation for viewing related items
      config.relationHandlers.forEach(handler => {
        $(`#${handler.parentContainer}`).on('click', handler.triggerClass, function() {
          const parentId = $(this).closest(`.${handler.parentType}-item`).data('id');
          $(`#current-${handler.parentType}-id`).val(parentId);
          
          // Show loading indicator
          $(`#${handler.relatedType}-loading`).removeClass('hidden');
          
          loadRelatedItems(
            handler.parentType, 
            parentId, 
            handler.relatedType, 
            `${handler.relatedType}-list`, 
            renderFunctions[handler.relatedType]
          );
          
          // Hide loading indicator after a short delay
          setTimeout(() => {
            $(`#${handler.relatedType}-loading`).addClass('hidden');
          }, 500);
          
          // Highlight the selected item
          $(`.${handler.parentType}-item`).removeClass('selected border-indigo-500').addClass('border-transparent');
          $(this).closest(`.${handler.parentType}-item`).addClass('selected border-indigo-500').removeClass('border-transparent');
        });
      });
  
      // Handle form submissions
      config.forms.forEach(form => {
        $(`#${form.id}`).on('submit', function(e) {
          e.preventDefault();
          
          const parentId = $(`#current-${form.parentType}-id`).val();
          const content = $(`#${form.contentField}`).val().trim();
          
          if (!parentId) {
            $('#error-message').html(`
              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-yellow-700">Please select a ${form.parentType} first.</p>
                  </div>
                </div>
              </div>
            `);
            return;
          }
          
          if (!content) {
            $('#error-message').html(`
              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-yellow-700">Please enter a ${form.itemType}.</p>
                  </div>
                </div>
              </div>
            `);
            return;
          }
          
          const data = {
            content: content,
            [`${form.parentType}Id`]: parseInt(parentId),
            createdAt: new Date().toISOString()
          };
          
          addItem(form.itemType, data, function() {
            // Reload related items for the current parent
            loadRelatedItems(
              form.parentType, 
              parentId, 
              form.itemType, 
              `${form.itemType}-list`, 
              renderFunctions[form.itemType]
            );
            // Clear the form
            $(`#${form.contentField}`).val('');
          });
        });
      });
  
      // Tab navigation
      $('.tab').on('click', function() {
        const tabId = $(this).data('tab');
        
        // Update active tab
        $('.tab').removeClass('active bg-white text-indigo-700').addClass('text-gray-500 hover:text-gray-700');
        $(this).addClass('active bg-white text-indigo-700').removeClass('text-gray-500 hover:text-gray-700');
        
        // Show the corresponding content with a fade effect
        $('.tab-content').fadeOut(200);
        setTimeout(() => {
          $(`#${tabId}`).fadeIn(200);
        }, 210);
      });
      
      // Search functionality (if configured)
      if (config.searchConfig) {
        config.searchConfig.forEach(search => {
          $(`#${search.inputId}`).on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            
            if (searchTerm.length < 2) {
              $(`.${search.itemClass}`).show();
              return;
            }
            
            $(`.${search.itemClass}`).each(function() {
              const text = $(this).text().toLowerCase();
              $(this).toggle(text.includes(searchTerm));
            });
          });
        });
      }
    }
  
    // Example configuration for the blog app
    const blogAppConfig = {
      primaryEntities: [
        { type: 'blogs' },
        { type: 'authors' }
      ],
      relationHandlers: [
        { 
          parentType: 'blog', 
          parentContainer: 'blogs-list', 
          triggerClass: '.btn-view-comments', 
          relatedType: 'comments' 
        }
      ],
      forms: [
        { 
          id: 'comment-form', 
          parentType: 'blog', 
          itemType: 'comments', 
          contentField: 'comment-content' 
        }
      ],
      searchConfig: [
        {
          inputId: 'search-blogs',
          itemClass: 'blog-item'
        },
        {
          inputId: 'search-authors',
          itemClass: 'author-item'
        }
      ],
      defaultTab: 'blogs-content',
      relatedSections: ['comments']
    };
  
    // Initialize the app with the configuration
    initializeApp(blogAppConfig);
  });