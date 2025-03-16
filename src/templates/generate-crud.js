/**
 * Enhanced CRUD Generator
 * This script provides CRUD functionality for entities with attributes.
 * It dynamically generates forms and tables based on the entity configuration.
 * Uses JSON Server for backend API and Tailwind CSS + Font Awesome for UI.
 */

class EnhancedCrudGenerator {
  constructor(containerId, config, loadImmediately = false) {
    this.container = document.getElementById(containerId);
    this.config = config;
    this.data = [];
    this.currentPage = 1;
    this.itemsPerPage = config.itemsPerPage || 10;
    this.totalPages = 1;
    this.editId = null;
    this.baseUrl = config.apiBaseUrl || 'http://localhost:3002';
    this.entityEndpoint = `${this.baseUrl}/${config.entityName}`;
    this.isLoading = false;
    this.sortField = null;
    this.sortDirection = 'asc';
    this.searchTerm = '';
    this.searchTimeout = null;
    this.initialized = false;
    this.init(loadImmediately);
  }
  
  async init(loadImmediately = false) {
    try {
      this.render();
      this.setupEventListeners();
      
      // Only fetch data if loadImmediately is true
      if (loadImmediately) {
        await this.fetchData();
      } else {
        // Show a placeholder message instead
        const tableBody = document.getElementById(this.elementIds.tableBodyId);
        if (tableBody) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="px-6 py-4 text-center text-sm text-gray-500">
                <i class="fas fa-info-circle mr-2"></i>
                Data will load when tab is activated
              </td>
            </tr>
          `;
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing CRUD generator:', error);
      this.showToast(`Initialization error: ${error.message}`, 'error');
      
      // Ensure the table shows an error message
      const tableBody = document.getElementById(this.elementIds.tableBodyId);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="px-6 py-4 text-center text-sm text-red-500">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              Failed to initialize: ${error.message || 'Unknown error'}
            </td>
          </tr>
        `;
      }
    }
  }
  
  render() {
    // Generate unique IDs for this entity's elements
    const entityPrefix = this.config.entityName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const formId = `${entityPrefix}-crud-form`;
    const tableBodyId = `${entityPrefix}-crud-table-body`;
    const searchInputId = `${entityPrefix}-search-input`;
    const refreshBtnId = `${entityPrefix}-refresh-btn`;
    const loadingIndicatorId = `${entityPrefix}-loading-indicator`;
    const formTitleId = `${entityPrefix}-form-title`;
    const cancelBtnId = `${entityPrefix}-cancel-btn`;
    const paginationIds = {
      prevPage: `${entityPrefix}-prev-page`,
      nextPage: `${entityPrefix}-next-page`,
      prevPageMobile: `${entityPrefix}-prev-page-mobile`,
      nextPageMobile: `${entityPrefix}-next-page-mobile`,
      pageStart: `${entityPrefix}-page-start`,
      pageEnd: `${entityPrefix}-page-end`,
      totalItems: `${entityPrefix}-total-items`,
      pageNumbers: `${entityPrefix}-page-numbers`
    };
    
    // Store these IDs for later use
    this.elementIds = {
      formId,
      tableBodyId,
      searchInputId,
      refreshBtnId,
      loadingIndicatorId,
      formTitleId,
      cancelBtnId,
      paginationIds
    };
    
    this.container.innerHTML = `
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <!-- Header with title and search -->
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-800">${this.config.title || this.config.entityName}</h2>
          <div class="mt-3 md:mt-0 relative w-full md:w-64">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="fas fa-search text-gray-400"></i>
            </span>
            <input type="text" id="${searchInputId}" placeholder="Search..." 
              class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          </div>
        </div>

        <!-- Main content area -->
        <div class="flex flex-col lg:flex-row">
          <!-- Form section -->
          <div class="w-full lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
            <div class="bg-white rounded-lg">
              <h3 id="${formTitleId}" class="text-lg font-medium text-gray-800 mb-4">
                <i class="fas fa-plus-circle mr-2 text-indigo-600"></i>
                Add ${this.config.entityName}
              </h3>
              <form id="${formId}" class="space-y-4">
                ${this.generateFormFields()}
                <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button type="button" id="${cancelBtnId}" class="hidden px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                    <i class="fas fa-times mr-2"></i>Cancel
                  </button>
                  <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
                    <i class="fas fa-save mr-2"></i>Save
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Table section -->
          <div class="w-full lg:w-2/3 p-6">
            <div class="bg-white rounded-lg">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-800">
                  <i class="fas fa-list mr-2 text-indigo-600"></i>
                  List of ${this.config.entityName}s
                </h3>
                <button id="${refreshBtnId}" class="p-2 text-indigo-600 hover:text-indigo-800 focus:outline-none">
                  <i class="fas fa-sync-alt"></i>
                </button>
              </div>
              
              <!-- Loading indicator -->
              <div id="${loadingIndicatorId}" class="hidden flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
              
              <!-- Table container -->
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      ${this.generateTableHeaders()}
                      <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody id="${tableBodyId}" class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="px-6 py-4 text-center text-sm text-gray-500">
                        Loading data...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Pagination -->
              <div id="pagination" class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div class="flex-1 flex justify-between sm:hidden">
                  <button id="${paginationIds.prevPageMobile}" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Previous
                  </button>
                  <button id="${paginationIds.nextPageMobile}" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Next
                  </button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p class="text-sm text-gray-700">
                      Showing <span id="${paginationIds.pageStart}">1</span> to <span id="${paginationIds.pageEnd}">10</span> of <span id="${paginationIds.totalItems}">0</span> results
                    </p>
                  </div>
                  <div>
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button id="${paginationIds.prevPage}" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span class="sr-only">Previous</span>
                        <i class="fas fa-chevron-left"></i>
                      </button>
                      <div id="${paginationIds.pageNumbers}" class="flex"></div>
                      <button id="${paginationIds.nextPage}" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span class="sr-only">Next</span>
                        <i class="fas fa-chevron-right"></i>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast notifications -->
      <div id="${entityPrefix}-toast-container" class="fixed bottom-4 right-4 z-50"></div>
    `;
  }
  
  generateFormFields() {
    return this.config.attributes.map(attr => `
      <div class="form-group">
        <label for="${attr.name}" class="block text-sm font-medium text-gray-700 mb-1">
          ${attr.label || attr.name}
          ${attr.required ? '<span class="text-red-500 ml-1">*</span>' : ''}
        </label>
        ${this.generateInputField(attr)}
        ${attr.helpText ? `<p class="mt-1 text-xs text-gray-500">${attr.helpText}</p>` : ''}
      </div>
    `).join('');
  }
  
  generateInputField(attr) {
    switch (attr.type) {
      case 'textarea':
        return `<textarea id="${attr.name}" name="${attr.name}" rows="3" 
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
          ${attr.required ? 'required' : ''}></textarea>`;
      
      case 'select':
        return `
          <select id="${attr.name}" name="${attr.name}" 
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            ${attr.required ? 'required' : ''}>
            <option value="">Select ${attr.label || attr.name}</option>
            ${attr.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        `;
      
      case 'checkbox':
        return `
          <div class="flex items-center h-5">
            <input type="checkbox" id="${attr.name}" name="${attr.name}"
              class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
            <span class="ml-2 text-sm text-gray-600">${attr.checkboxLabel || ''}</span>
          </div>
        `;
      
      case 'date':
        return `
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="fas fa-calendar-alt text-gray-400"></i>
            </div>
            <input type="date" id="${attr.name}" name="${attr.name}" 
              class="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              ${attr.required ? 'required' : ''}>
          </div>
        `;
      
      case 'number':
        return `
          <div class="relative rounded-md shadow-sm">
            ${attr.prefix ? `<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500 sm:text-sm">${attr.prefix}</span>
            </div>` : ''}
            <input type="number" id="${attr.name}" name="${attr.name}" 
              class="${attr.prefix ? 'pl-7' : ''} focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              ${attr.min !== undefined ? `min="${attr.min}"` : ''} 
              ${attr.max !== undefined ? `max="${attr.max}"` : ''} 
              ${attr.step ? `step="${attr.step}"` : ''} 
              ${attr.required ? 'required' : ''}>
          </div>
        `;
      
      case 'email':
        return `
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="fas fa-envelope text-gray-400"></i>
            </div>
            <input type="email" id="${attr.name}" name="${attr.name}" 
              class="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              ${attr.required ? 'required' : ''}>
          </div>
        `;
      
      case 'password':
        return `
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="fas fa-lock text-gray-400"></i>
            </div>
            <input type="password" id="${attr.name}" name="${attr.name}" 
              class="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              ${attr.required ? 'required' : ''}>
          </div>
        `;
      
      default:
        return `
          <input type="text" id="${attr.name}" name="${attr.name}" 
            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
            ${attr.required ? 'required' : ''}>
        `;
    }
  }
  
  generateTableHeaders() {
    return this.config.attributes
      .filter(attr => !attr.hideInTable)
      .map(attr => `
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" data-field="${attr.name}">
          <div class="flex items-center">
            ${attr.label || attr.name}
            <span class="sort-icon ml-1">
              <i class="fas fa-sort text-gray-300"></i>
            </span>
          </div>
        </th>
      `)
      .join('');
  }
  
  generateTableRows(items) {
    // Ensure items is an array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return `
        <tr>
          <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="px-6 py-4 text-center text-sm text-gray-500">
            No data available
          </td>
        </tr>
      `;
    }
    
    return items.map(item => `
      <tr class="hover:bg-gray-50" data-id="${item.id}">
        ${this.config.attributes
          .filter(attr => !attr.hideInTable)
          .map(attr => `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              ${this.formatCellValue(item[attr.name], attr)}
            </td>
          `)
          .join('')}
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="edit-btn text-indigo-600 hover:text-indigo-900 mr-3" data-id="${item.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn text-red-600 hover:text-red-900" data-id="${item.id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  formatCellValue(value, attr) {
    if (value === undefined || value === null) return '-';
    
    switch (attr.type) {
      case 'checkbox':
        return value ? 
          '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"><i class="fas fa-check mr-1"></i>Yes</span>' : 
          '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800"><i class="fas fa-times mr-1"></i>No</span>';
      
      case 'select':
        if (attr.options) {
          const option = attr.options.find(opt => opt.value === value);
          return option ? option.label : value;
        }
        return value;
      
      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch (e) {
          return value;
        }
      
      case 'number':
        if (attr.prefix) {
          return `${attr.prefix}${value}`;
        }
        return value;
      
      default:
        // Truncate long text
        if (typeof value === 'string' && value.length > 50) {
          return `${value.substring(0, 50)}...`;
        }
        return value;
    }
  }
  
  setupEventListeners() {
    const form = document.getElementById(this.elementIds.formId);
    const searchInput = document.getElementById(this.elementIds.searchInputId);
    const tableBody = document.getElementById(this.elementIds.tableBodyId);
    const cancelBtn = document.getElementById(this.elementIds.cancelBtnId);
    const refreshBtn = document.getElementById(this.elementIds.refreshBtnId);
    const prevPage = document.getElementById(this.elementIds.paginationIds.prevPage);
    const nextPage = document.getElementById(this.elementIds.paginationIds.nextPage);
    const prevPageMobile = document.getElementById(this.elementIds.paginationIds.prevPageMobile);
    const nextPageMobile = document.getElementById(this.elementIds.paginationIds.nextPageMobile);
    const tableHeaders = this.container.querySelectorAll('th[data-field]');

    if (form) form.addEventListener('submit', e => this.handleFormSubmit(e));
    if (searchInput) searchInput.addEventListener('input', e => this.handleSearch(e));
    if (tableBody) tableBody.addEventListener('click', e => this.handleTableClick(e));
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelEdit());
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.fetchData());
    
    if (prevPage) prevPage.addEventListener('click', () => this.changePage(this.currentPage - 1));
    if (nextPage) nextPage.addEventListener('click', () => this.changePage(this.currentPage + 1));
    if (prevPageMobile) prevPageMobile.addEventListener('click', () => this.changePage(this.currentPage - 1));
    if (nextPageMobile) nextPageMobile.addEventListener('click', () => this.changePage(this.currentPage + 1));
    
    // Add sort functionality to table headers
    tableHeaders.forEach(header => {
      header.addEventListener('click', () => this.handleSort(header.dataset.field));
    });
  }
  
  async handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const formValues = {};
    
    this.config.attributes.forEach(attr => {
      if (attr.type === 'checkbox') {
        formValues[attr.name] = document.getElementById(attr.name).checked;
      } else if (attr.type === 'number') {
        const value = formData.get(attr.name);
        formValues[attr.name] = value ? Number(value) : null;
      } 
      else if (attr.type === 'date') {
        formValues[attr.name] = formData.get(attr.name);
      } else if (attr.name === 'id' ) {
        formValues[attr.name] = this.editId || this.data.length + 1;
      } else {
        formValues[attr.name] = formData.get(attr.name);
      }
    });
  
    try {
      this.setLoading(true);
      
      if (this.editId) {
        await this.updateItem(formValues);
      } else {
        await this.addItem(formValues);
      }
      
      e.target.reset();
      this.showToast(this.editId ? 'Item updated successfully' : 'Item added successfully', 'success');
    } catch (error) {
      console.error('Error submitting form:', error);
      this.showToast(`Error: ${error.message || 'Failed to save data'}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }
  
  async addItem(formValues) {
    const response = await fetch(this.entityEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formValues)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add item: ${response.statusText}`);
    }
    
    await this.fetchData();
  }
  
    async updateItem(formValues) {
      const response = await fetch(`${this.entityEndpoint}/${this.editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formValues)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update item: ${response.statusText}`);
      }
      
      await this.fetchData();
      this.cancelEdit();
    }
  
    async deleteItem(id) {
      // Show confirmation dialog
      if (!confirm('Are you sure you want to delete this item?')) {
        return;
      }
      
      try {
        this.setLoading(true);
        
        // Ensure ID is treated as a number
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          throw new Error('Invalid ID format');
        }
        
        const response = await fetch(`${this.entityEndpoint}/${numericId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete item: ${response.statusText}`);
        }
        
        await this.fetchData();
        this.showToast('Item deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting item:', error);
        this.showToast(`Error: ${error.message || 'Failed to delete item'}`, 'error');
      } finally {
        this.setLoading(false);
      }
    }
  
    async editItem(id) {
      try {
        this.setLoading(true);
        
        // Ensure ID is treated as a number
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          throw new Error('Invalid ID format');
        }
        
        const response = await fetch(`${this.entityEndpoint}/${numericId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch item: ${response.statusText}`);
        }
        
        const item = await response.json();
        
        this.editId = numericId; // Store as number
        const form = document.getElementById(this.elementIds.formId);
        document.getElementById(this.elementIds.formTitleId).innerHTML = `<i class="fas fa-edit mr-2 text-indigo-600"></i>Edit ${this.config.entityName}`;
        document.getElementById(this.elementIds.cancelBtnId).classList.remove('hidden');
        
        this.config.attributes.forEach(attr => {
          const field = document.getElementById(attr.name);
          if (field) {
            if (attr.type === 'checkbox') {
              field.checked = item[attr.name];
            } else if (attr.type === 'date' && item[attr.name]) {
              // Format date values properly for date inputs (YYYY-MM-DD)
              try {
                const date = new Date(item[attr.name]);
                if (!isNaN(date.getTime())) {
                  field.value = date.toISOString().split('T')[0];
                } else {
                  field.value = item[attr.name] || '';
                }
              } catch (e) {
                field.value = item[attr.name] || '';
              }
            } else {
              field.value = item[attr.name] !== undefined ? item[attr.name] : '';
            }
          }
        });
      } catch (error) {
        console.error('Error editing item:', error);
        this.showToast(`Error: ${error.message || 'Failed to load item data'}`, 'error');
      } finally {
        this.setLoading(false);
      }
    }
  
    cancelEdit() {
      this.editId = null;
      document.getElementById(this.elementIds.formId).reset();
      document.getElementById(this.elementIds.formTitleId).innerHTML = `<i class="fas fa-plus-circle mr-2 text-indigo-600"></i>Add ${this.config.entityName}`;
      document.getElementById(this.elementIds.cancelBtnId).classList.add('hidden');
    }
  
    handleSearch(e) {
      // Debounce search to avoid too many requests
      clearTimeout(this.searchTimeout);
      
      // Show a loading indicator in the search input
      const searchInput = document.getElementById(this.elementIds.searchInputId);
      if (searchInput) {
        searchInput.classList.add('bg-gray-50');
        searchInput.classList.add('animate-pulse');
      }
      
      this.searchTimeout = setTimeout(() => {
        this.searchTerm = e.target.value.toLowerCase();
        console.log(`Searching for: "${this.searchTerm}"`); // Debug log
        this.currentPage = 1; // Reset to first page when searching
        
        // Remove the loading indicator
        if (searchInput) {
          searchInput.classList.remove('bg-gray-50');
          searchInput.classList.remove('animate-pulse');
        }
        
        this.fetchData();
      }, 500); // Increased to 500ms for better debounce
    }
  
    handleTableClick(e) {
      const editBtn = e.target.closest('.edit-btn');
      const deleteBtn = e.target.closest('.delete-btn');
      
      if (editBtn) {
        const id = parseInt(editBtn.getAttribute('data-id'), 10);
        if (!isNaN(id)) {
          this.editItem(id);
        }
      } else if (deleteBtn) {
        const id = parseInt(deleteBtn.getAttribute('data-id'), 10);
        if (!isNaN(id)) {
          this.deleteItem(id);
        }
      }
    }
  
    handleSort(field) {
      if (this.sortField === field) {
        // Toggle direction if already sorting by this field
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        // New sort field
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      
      // Update sort icons
      document.querySelectorAll('th[data-field] .sort-icon').forEach(icon => {
        icon.innerHTML = '<i class="fas fa-sort text-gray-300"></i>';
      });
      
      const currentSortHeader = document.querySelector(`th[data-field="${field}"] .sort-icon`);
      if (currentSortHeader) {
        currentSortHeader.innerHTML = this.sortDirection === 'asc' 
          ? '<i class="fas fa-sort-up text-indigo-600"></i>' 
          : '<i class="fas fa-sort-down text-indigo-600"></i>';
      }
      
      this.fetchData();
    }
  
    async fetchData() {
      try {
        this.setLoading(true);
        
        // Build query parameters
        let url = this.entityEndpoint;
        const params = new URLSearchParams();
        
        // Pagination - use the correct parameter names for your JSON Server
        // Some JSON Servers use _page and _limit, others use page and per_page
        params.append('_page', this.currentPage);
        params.append('_per_page', this.itemsPerPage);
        
        // Sorting
        if (this.sortField) {
          params.append('_sort', this.sortField);
          // params.append('_order', this.sortDirection);
        }
        
        // Improved searching - search across multiple fields
        // if (this.searchTerm) {
        //   // For JSON Server, we need a more comprehensive search approach
        //   params.append('q', this.searchTerm);
        // }
        
        url = `${url}?${params.toString()}`;
        
        console.log(`Fetching data from: ${url}`); // Debug log
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        
        // Get total count from headers
        
        let responseData = await response.json();
        let totalCount = responseData.items;
        console.log('API Response:', responseData); // Debug log
        
        // Handle different response formats
        let processedData;
        
        if (responseData.data && Array.isArray(responseData.data)) {
          // Format: { data: [...], pagination: { ... } }
          processedData = responseData.data;
          
          totalCount = responseData.items;
        } else if (Array.isArray(responseData)) {
          // Format: [...]
          processedData = responseData;
        } else if (responseData && typeof responseData === 'object') {
          // Format: { ... } (single object or object with items array)
          if (responseData.items) {
            processedData = responseData;
            totalCount = responseData.items || totalCount;
          } else {
            processedData = [responseData];
          }
        } else {
          // Fallback to empty array
          processedData = [];
        }
        
        // If we still don't have a total count, use the array length
        if (totalCount === 0 && processedData.length > 0) {
          totalCount = processedData.length;
        }
        
        console.log('Processed data:', processedData); // Debug log
        console.log('Total count:', totalCount); // Debug log
        
        this.data = processedData;
        this.totalPages = Math.max(1, Math.ceil(totalCount / this.itemsPerPage));
        
        this.updateTable();
        this.updatePagination(totalCount);
      } catch (error) {
        console.error('Error fetching data:', error);
        const tableBody = document.getElementById(this.elementIds.tableBodyId);
        if (tableBody) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="px-6 py-4 text-center text-sm text-red-500">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Error loading data: ${error.message || 'Unknown error'}
              </td>
            </tr>
          `;
        }
        this.showToast(`Error: ${error.message || 'Failed to load data'}`, 'error');
      } finally {
        this.setLoading(false);
      }
    }
  
    updateTable() {
      const tableBody = document.getElementById(this.elementIds.tableBodyId);
      
      if (!tableBody) {
        console.error(`Table body element not found for ${this.config.entityName}`);
        return;
      }
      
      console.log(`Updating table for ${this.config.entityName} with ${this.data.length} items`);
      tableBody.innerHTML = this.generateTableRows(this.data);
      console.log(`Table updated for ${this.config.entityName}`);
    }
  
    updatePagination(totalCount) {
      console.log(`Updating pagination with total count: ${totalCount}`); // Debug log
      
      // Ensure totalCount is a number and not NaN
      totalCount = parseInt(totalCount) || 0;
      
      // If there's no data, handle pagination display appropriately
      if (totalCount === 0) {
        const pageStart = document.getElementById(this.elementIds.paginationIds.pageStart);
        const pageEnd = document.getElementById(this.elementIds.paginationIds.pageEnd);
        const totalItems = document.getElementById(this.elementIds.paginationIds.totalItems);
        
        if (pageStart) pageStart.textContent = 0;
        if (pageEnd) pageEnd.textContent = 0;
        if (totalItems) totalItems.textContent = 0;
        
        // Disable pagination buttons
        const prevBtn = document.getElementById(this.elementIds.paginationIds.prevPage);
        const nextBtn = document.getElementById(this.elementIds.paginationIds.nextPage);
        const prevBtnMobile = document.getElementById(this.elementIds.paginationIds.prevPageMobile);
        const nextBtnMobile = document.getElementById(this.elementIds.paginationIds.nextPageMobile);
        
        if (prevBtn) {
          prevBtn.disabled = true;
          prevBtn.classList.add('opacity-50');
        }
        if (nextBtn) {
          nextBtn.disabled = true;
          nextBtn.classList.add('opacity-50');
        }
        if (prevBtnMobile) {
          prevBtnMobile.disabled = true;
          prevBtnMobile.classList.add('opacity-50');
        }
        if (nextBtnMobile) {
          nextBtnMobile.disabled = true;
          nextBtnMobile.classList.add('opacity-50');
        }
        
        // Clear page numbers
        const pageNumbers = document.getElementById(this.elementIds.paginationIds.pageNumbers);
        if (pageNumbers) pageNumbers.innerHTML = '';
        return;
      }
  
      // Calculate page information
      const pageStart = Math.min(((this.currentPage - 1) * this.itemsPerPage) + 1, totalCount);
      const pageEnd = Math.min(pageStart + this.itemsPerPage - 1, totalCount);
      
      console.log(`Page info: ${pageStart} to ${pageEnd} of ${totalCount}`); // Debug log
      
      const pageStartEl = document.getElementById(this.elementIds.paginationIds.pageStart);
      const pageEndEl = document.getElementById(this.elementIds.paginationIds.pageEnd);
      const totalItemsEl = document.getElementById(this.elementIds.paginationIds.totalItems);
      
      if (pageStartEl) pageStartEl.textContent = pageStart;
      if (pageEndEl) pageEndEl.textContent = pageEnd;
      if (totalItemsEl) totalItemsEl.textContent = totalCount;
      
      // Update pagination buttons
      const prevBtn = document.getElementById(this.elementIds.paginationIds.prevPage);
      const nextBtn = document.getElementById(this.elementIds.paginationIds.nextPage);
      const prevBtnMobile = document.getElementById(this.elementIds.paginationIds.prevPageMobile);
      const nextBtnMobile = document.getElementById(this.elementIds.paginationIds.nextPageMobile);
      
      if (prevBtn) {
        prevBtn.disabled = this.currentPage <= 1;
        prevBtn.classList.toggle('opacity-50', this.currentPage <= 1);
      }
      if (nextBtn) {
        nextBtn.disabled = this.currentPage >= this.totalPages;
        nextBtn.classList.toggle('opacity-50', this.currentPage >= this.totalPages);
      }
      if (prevBtnMobile) {
        prevBtnMobile.disabled = this.currentPage <= 1;
        prevBtnMobile.classList.toggle('opacity-50', this.currentPage <= 1);
      }
      if (nextBtnMobile) {
        nextBtnMobile.disabled = this.currentPage >= this.totalPages;
        nextBtnMobile.classList.toggle('opacity-50', this.currentPage >= this.totalPages);
      }
      
      // Generate page number buttons
      const pageNumbers = document.getElementById(this.elementIds.paginationIds.pageNumbers);
      if (!pageNumbers) return;
      
      pageNumbers.innerHTML = '';
      
      // Determine which page numbers to show
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, startPage + 4);
      
      if (endPage - startPage < 4 && this.totalPages > 4) {
        startPage = Math.max(1, endPage - 4);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        const isActive = i === this.currentPage;
        pageNumbers.innerHTML += `
          <button data-page="${i}" class="relative inline-flex items-center px-4 py-2 border ${isActive ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-300 bg-white text-gray-700'} text-sm font-medium hover:bg-gray-50">
            ${i}
          </button>
        `;
      }
      
      // Add event listeners to page number buttons
      pageNumbers.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
          this.changePage(parseInt(button.dataset.page, 10));
        });
      });
    }
  
    changePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return;
      }
      
      this.currentPage = page;
      this.fetchData();
    }
  
    setLoading(isLoading) {
      this.isLoading = isLoading;
      const loadingIndicator = document.getElementById(this.elementIds.loadingIndicatorId);
      
      if (loadingIndicator) {
        if (isLoading) {
          loadingIndicator.classList.remove('hidden');
        } else {
          loadingIndicator.classList.add('hidden');
        }
      }
    }
  
    showToast(message, type = 'info') {
      // Get the entity prefix from the element IDs
      const entityPrefix = this.config.entityName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const toastContainerId = `${entityPrefix}-toast-container`;
      const toastContainer = document.getElementById(toastContainerId);
      
      if (!toastContainer) {
        console.error(`Toast container not found: ${toastContainerId}`);
        return;
      }
      
      const id = `toast-${Date.now()}`;
      
      let bgColor, icon;
      switch (type) {
        case 'success':
          bgColor = 'bg-green-500';
          icon = '<i class="fas fa-check-circle mr-2"></i>';
          break;
        case 'error':
          bgColor = 'bg-red-500';
          icon = '<i class="fas fa-exclamation-circle mr-2"></i>';
          break;
        case 'warning':
          bgColor = 'bg-yellow-500';
          icon = '<i class="fas fa-exclamation-triangle mr-2"></i>';
          break;
        default:
          bgColor = 'bg-indigo-500';
          icon = '<i class="fas fa-info-circle mr-2"></i>';
      }
      
      const toast = document.createElement('div');
      toast.id = id;
      toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-md flex items-center mb-3 transform transition-all duration-300 ease-in-out translate-x-full`;
      toast.innerHTML = `
        ${icon}
        <div class="flex-1">${message}</div>
        <button class="ml-4 text-white focus:outline-none">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      toastContainer.appendChild(toast);
      
      // Animate in
      setTimeout(() => {
        toast.classList.remove('translate-x-full');
      }, 10);
      
      // Auto dismiss
      const dismissTimeout = setTimeout(() => {
        this.dismissToast(id);
      }, 5000);
      
      // Dismiss on click
      toast.querySelector('button').addEventListener('click', () => {
        clearTimeout(dismissTimeout);
        this.dismissToast(id);
      });
      
      console.log(`Toast shown: ${message}`); // Debug log
    }
    
    dismissToast(id) {
      const toast = document.getElementById(id);
      if (!toast) return;
      
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }
  
    // Add a method to load data if not already loaded
    async loadDataIfNeeded() {
      console.log(`Loading data for ${this.config.entityName} if needed. Current data length: ${this.data.length}`);
      
      if (this.initialized) {
        // Always fetch fresh data when tab is activated
        await this.fetchData();
        console.log(`Data loaded for ${this.config.entityName}. New data length: ${this.data.length}`);
      } else {
        console.warn(`CRUD generator for ${this.config.entityName} is not initialized yet`);
      }
    }
  }
  
  /**
   * Initialize the CRUD generator with JSON Server
   * @param {string} containerId - ID of the container element
   * @param {Object} config - Configuration object
   * @param {boolean} loadImmediately - Whether to load data immediately or defer
   */
  function initJsonServerCrud(containerId, config, loadImmediately = false) {
    // Ensure required Font Awesome and Tailwind CSS are loaded
    ensureStylesLoaded();
    
    // Initialize the CRUD generator
    const crudInstance = new EnhancedCrudGenerator(containerId, config, loadImmediately);
    return crudInstance;
  }
  
  /**
   * Ensure required styles are loaded
   */
  function ensureStylesLoaded() {
    // Check if Font Awesome is loaded
    if (!document.querySelector('link[href*="fontawesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      document.head.appendChild(fontAwesome);
    }
    
    // Check if Tailwind CSS is loaded
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const tailwind = document.createElement('script');
      tailwind.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(tailwind);
    }
    
    // Add custom styles for form elements
    if (!document.getElementById('crud-custom-styles')) {
      const style = document.createElement('style');
      style.id = 'crud-custom-styles';
      style.textContent = `
        /* Custom form styles to match Tailwind's forms plugin */
        input[type="text"], input[type="email"], input[type="password"], 
        input[type="number"], input[type="date"], textarea, select {
          width: 100%;
          border-radius: 0.375rem;
          border-color: #D1D5DB;
          padding: 0.5rem 0.75rem;
          line-height: 1.25;
        }
        
        input[type="text"]:focus, input[type="email"]:focus, input[type="password"]:focus,
        input[type="number"]:focus, input[type="date"]:focus, textarea:focus, select:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          --tw-ring-color: rgba(79, 70, 229, 0.2);
          --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
          --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
          box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
          border-color: #6366F1;
        }
        
        /* Transition effects */
        .form-group {
          transition: all 0.3s ease;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .crud-container {
            flex-direction: column;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Example usage
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CRUD generators...'); // Debug log
    
    // User configuration
    const userConfig = {
      entityName: 'users',
      title: 'User Management',
      apiBaseUrl: 'http://localhost:3002',
      itemsPerPage: 5,
      attributes: [
        { 
          name: 'name', 
          label: 'Full Name', 
          type: 'text', 
          required: true,
          helpText: 'Enter the user\'s full name'
        },
        { 
          name: 'email', 
          label: 'Email Address', 
          type: 'email', 
          required: true 
        },
        { 
          name: 'age', 
          label: 'Age', 
          type: 'number',
          min: 18,
          max: 100
        },
        { 
          name: 'salary', 
          label: 'Salary', 
          type: 'number',
          prefix: '$',
          step: '0.01'
        },
        { 
          name: 'role', 
          label: 'Role', 
          type: 'select', 
          required: true, 
          options: [
            { value: 'admin', label: 'Administrator' },
            { value: 'user', label: 'Regular User' },
            { value: 'guest', label: 'Guest' }
          ]
        },
        { 
          name: 'hireDate', 
          label: 'Hire Date', 
          type: 'date' 
        },
        { 
          name: 'notes', 
          label: 'Notes', 
          type: 'textarea', 
          hideInTable: true,
          helpText: 'Additional information about the user'
        },
        { 
          name: 'active', 
          label: 'Status', 
          type: 'checkbox',
          checkboxLabel: 'Active account'
        }
      ]
    };
    
    // Product configuration
    const productConfig = {
      entityName: 'products',
      title: 'Product Inventory',
      apiBaseUrl: 'http://localhost:3002',
      itemsPerPage: 8,
      attributes: [
        { 
          name: 'productName', 
          label: 'Product Name', 
          type: 'text', 
          required: true 
        },
        { 
          name: 'price', 
          label: 'Price', 
          type: 'number', 
          required: true,
          prefix: '$',
          step: '0.01',
          min: 0
        },
        { 
          name: 'category', 
          label: 'Category', 
          type: 'select', 
          options: [
            { value: 'electronics', label: 'Electronics' },
            { value: 'clothing', label: 'Clothing' },
            { value: 'food', label: 'Food & Beverages' },
            { value: 'other', label: 'Other' }
          ]
        },
        { 
          name: 'inStock', 
          label: 'Availability', 
          type: 'checkbox',
          checkboxLabel: 'In Stock'
        },
        { 
          name: 'quantity', 
          label: 'Quantity', 
          type: 'number',
          min: 0
        },
        { 
          name: 'dateAdded', 
          label: 'Date Added', 
          type: 'date' 
        },
        { 
          name: 'description', 
          label: 'Description', 
          type: 'textarea', 
          hideInTable: true 
        }
      ]
    };
    
    // Store CRUD instances
    const crudInstances = {};
    
    // Initialize CRUD generators
    if (document.getElementById('user-crud')) {
      console.log('Initializing users CRUD...'); // Debug log
      // Only load data for the first tab (which is active by default)
      crudInstances.users = initJsonServerCrud('user-crud', userConfig, true);
    }
    
    if (document.getElementById('product-crud')) {
      console.log('Initializing products CRUD...'); // Debug log
      // Don't load data for inactive tabs
      crudInstances.products = initJsonServerCrud('product-crud', productConfig, false);
    }
    
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
          if (button.id === 'users-tab' && crudInstances.users) {
            console.log('Loading users data...'); // Debug log
            await crudInstances.users.loadDataIfNeeded();
          } else if (button.id === 'products-tab' && crudInstances.products) {
            console.log('Loading products data...'); // Debug log
            await crudInstances.products.loadDataIfNeeded();
          }
        } catch (error) {
          console.error('Error loading tab data:', error);
        }
      });
    });
  });
  