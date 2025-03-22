/**
 * Enhanced CRUD Generator
 * This script provides CRUD functionality for entities with attributes.
 * Uses Bootstrap for UI components and offers a responsive, professional interface.
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
    this.formVisible = false; // Track form visibility
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
              <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="text-center text-muted">
                <div class="py-4">
                  <i class="fas fa-info-circle me-2"></i>
                  Data will load when tab is activated
                </div>
              </td>
            </tr>
          `;
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing CRUD generator:', error);
      this.showToast(`Initialization error: ${error.message}`, 'danger');
      
      // Ensure the table shows an error message
      const tableBody = document.getElementById(this.elementIds.tableBodyId);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="text-center text-danger">
              <div class="py-4">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Failed to initialize: ${error.message || 'Unknown error'}
              </div>
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
    const formContainerId = `${entityPrefix}-form-container`;
    const tableBodyId = `${entityPrefix}-crud-table-body`;
    const searchInputId = `${entityPrefix}-search-input`;
    const refreshBtnId = `${entityPrefix}-refresh-btn`;
    const loadingIndicatorId = `${entityPrefix}-loading-indicator`;
    const formTitleId = `${entityPrefix}-form-title`;
    const cancelBtnId = `${entityPrefix}-cancel-btn`;
    const addBtnId = `${entityPrefix}-add-btn`;
    const paginationIds = {
      prevPage: `${entityPrefix}-prev-page`,
      nextPage: `${entityPrefix}-next-page`,
      pageStart: `${entityPrefix}-page-start`,
      pageEnd: `${entityPrefix}-page-end`,
      totalItems: `${entityPrefix}-total-items`,
      pageNumbers: `${entityPrefix}-page-numbers`
    };
    
    // Store these IDs for later use
    this.elementIds = {
      formId,
      formContainerId,
      tableBodyId,
      searchInputId,
      refreshBtnId,
      loadingIndicatorId,
      formTitleId,
      cancelBtnId,
      addBtnId,
      paginationIds
    };
    
    this.container.innerHTML = `
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
          <h5 class="mb-0 text-primary">
            <i class="fas fa-table me-2"></i> ${this.config.title || this.config.entityName}
          </h5>
          <div class="d-flex align-items-center">
            <!-- Compact search input -->
            <div class="input-group input-group-sm me-2" style="width: 200px;">
              <input type="text" id="${searchInputId}" class="form-control" placeholder="Search...">
              <span class="input-group-text bg-white border-start-0">
                <i class="fas fa-search text-muted"></i>
              </span>
            </div>
            <button id="${addBtnId}" class="btn btn-primary btn-sm">
              <i class="fas fa-plus me-1"></i> Add New
            </button>
            <button id="${refreshBtnId}" class="btn btn-light btn-sm ms-2" title="Refresh">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
        
        <!-- Form container (initially hidden) -->
        <div id="${formContainerId}" class="card-body border-bottom bg-light d-none">
          <div class="row">
            <div class="col-lg-8 col-xl-6 mx-auto">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 id="${formTitleId}" class="mb-0">
                  <i class="fas fa-plus-circle me-2 text-primary"></i> Add ${this.config.entityName}
                </h6>
                 <button type="button" class="btn-close" id="${cancelBtnId}" aria-label="Close" data-bs-dismiss="modal">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <form id="${formId}" class="needs-validation">
                ${this.generateFormFields()}
                <div class="d-flex justify-content-end mt-4">
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save me-2"></i> Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Table section -->
        <div class="card-body p-0">
          <!-- Loading indicator -->
          <div id="${loadingIndicatorId}" class="text-center py-5 d-none">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 mb-0 text-muted">Loading data...</p>
          </div>
          
          <!-- Table container -->
          <div class="table-responsive">
            <table class="table table-hover table-striped mb-0">
              <thead class="table-light">
                <tr>
                  ${this.generateTableHeaders()}
                  <th class="text-end pe-4" width="120">Actions</th>
                </tr>
              </thead>
              <tbody id="${tableBodyId}">
                <tr>
                  <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="text-center text-muted py-5">
                    <div class="my-5">
                      <i class="fas fa-spinner fa-spin me-2"></i>Loading data...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <div class="d-flex justify-content-between align-items-center p-3 border-top">
            <div>
              <small class="text-muted">
                Showing <span id="${paginationIds.pageStart}">1</span> to <span id="${paginationIds.pageEnd}">10</span> of <span id="${paginationIds.totalItems}">0</span> results
              </small>
            </div>
            <nav aria-label="Page navigation">
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item">
                  <button id="${paginationIds.prevPage}" class="page-link" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                </li>
                <div id="${paginationIds.pageNumbers}" class="d-flex"></div>
                <li class="page-item">
                  <button id="${paginationIds.nextPage}" class="page-link" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <!-- Toast notifications container -->
      <div class="toast-container position-fixed bottom-0 end-0 p-3" id="${entityPrefix}-toast-container"></div>
    `;
  }
  
  generateFormFields() {
    return this.config.attributes.map(attr => {
      // Skip hidden fields
      if (attr.hidden) return '';
      
      return `
        <div class="mb-3">
          <label for="${attr.name}" class="form-label">
            ${attr.label || attr.name}
            ${attr.required ? '<span class="text-danger">*</span>' : ''}
          </label>
          ${this.generateInputField(attr)}
          ${attr.helpText ? `<div class="form-text text-muted small">${attr.helpText}</div>` : ''}
        </div>
      `;
    }).join('');
  }
  
  generateInputField(attr) {
    switch (attr.type) {
      case 'textarea':
        return `<textarea id="${attr.name}" name="${attr.name}" rows="3" 
          class="form-control form-control-sm" 
          ${attr.required ? 'required' : ''}></textarea>`;
      
      case 'select':
        return `
          <select id="${attr.name}" name="${attr.name}" 
            class="form-select form-select-sm"
            ${attr.required ? 'required' : ''}>
            <option value="">Select ${attr.label || attr.name}</option>
            ${attr.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        `;
      
      case 'checkbox':
        return `
          <div class="form-check">
            <input type="checkbox" id="${attr.name}" name="${attr.name}" class="form-check-input">
            <label class="form-check-label" for="${attr.name}">${attr.checkboxLabel || ''}</label>
          </div>
        `;
      
      case 'date':
        return `
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="fas fa-calendar-alt"></i></span>
            <input type="date" id="${attr.name}" name="${attr.name}" 
              class="form-control" 
              ${attr.required ? 'required' : ''}>
          </div>
        `;
      
      case 'number':
        return `
          <div class="input-group input-group-sm">
            ${attr.prefix ? `<span class="input-group-text">${attr.prefix}</span>` : ''}
            <input type="number" id="${attr.name}" name="${attr.name}" 
              class="form-control" 
              ${attr.min !== undefined ? `min="${attr.min}"` : ''} 
              ${attr.max !== undefined ? `max="${attr.max}"` : ''} 
              ${attr.step ? `step="${attr.step}"` : ''} 
              ${attr.required ? 'required' : ''}>
          </div>
        `;
      
      case 'email':
        return `
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="fas fa-envelope"></i></span>
            <input type="email" id="${attr.name}" name="${attr.name}" 
              class="form-control" 
              ${attr.required ? 'required' : ''}>
          </div>
        `;
      
      case 'password':
        return `
          <div class="input-group input-group-sm">
            <span class="input-group-text"><i class="fas fa-lock"></i></span>
            <input type="password" id="${attr.name}" name="${attr.name}" 
              class="form-control" 
              ${attr.required ? 'required' : ''}>
          </div>
        `;
      
      default:
        return `
          <input type="text" id="${attr.name}" name="${attr.name}" 
            class="form-control form-control-sm" 
            ${attr.required ? 'required' : ''}>
        `;
    }
  }
  
  generateTableHeaders() {
    return this.config.attributes
      .filter(attr => !attr.hideInTable)
      .map(attr => `
        <th class="cursor-pointer" data-field="${attr.name}">
          <div class="d-flex align-items-center">
            ${attr.label || attr.name}
            <span class="sort-icon ms-1">
              <i class="fas fa-sort text-muted opacity-50 small"></i>
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
          <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="text-center text-muted py-5">
            <div class="my-3">
              <i class="fas fa-database me-2"></i>
              No data available
            </div>
          </td>
        </tr>
      `;
    }
    
    return items.map(item => `
      <tr data-id="${item.id}">
        ${this.config.attributes
          .filter(attr => !attr.hideInTable)
          .map(attr => `
            <td>${this.formatCellValue(item[attr.name], attr)}</td>
          `)
          .join('')}
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary edit-btn" data-id="${item.id}" title="Edit">
              <i class="fas fa-edit me-1"></i> Edit
            </button>
            <button class="btn btn-outline-danger delete-btn" data-id="${item.id}" title="Delete">
              <i class="fas fa-trash-alt me-1"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  formatCellValue(value, attr) {
    if (value === undefined || value === null) return '<span class="text-muted">—</span>';
    
    switch (attr.type) {
      case 'checkbox':
        return value ? 
          '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Yes</span>' : 
          '<span class="badge bg-secondary"><i class="fas fa-times me-1"></i>No</span>';
      
      case 'select':
        if (attr.options) {
          const option = attr.options.find(opt => opt.value === value);
          return option ? `<span class="text-body">${option.label}</span>` : value;
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
          return `<span title="${value}">${value.substring(0, 50)}...</span>`;
        }
        return value;
    }
  }
  
  setupEventListeners() {
    const form = document.getElementById(this.elementIds.formId);
    const formContainer = document.getElementById(this.elementIds.formContainerId);
    const searchInput = document.getElementById(this.elementIds.searchInputId);
    const tableBody = document.getElementById(this.elementIds.tableBodyId);
    const cancelBtn = document.getElementById(this.elementIds.cancelBtnId);
    const addBtn = document.getElementById(this.elementIds.addBtnId);
    const refreshBtn = document.getElementById(this.elementIds.refreshBtnId);
    const prevPage = document.getElementById(this.elementIds.paginationIds.prevPage);
    const nextPage = document.getElementById(this.elementIds.paginationIds.nextPage);
    const tableHeaders = this.container.querySelectorAll('th[data-field]');

    if (form) form.addEventListener('submit', e => this.handleFormSubmit(e));
    if (searchInput) searchInput.addEventListener('input', e => this.handleSearch(e));
    if (tableBody) tableBody.addEventListener('click', e => this.handleTableClick(e));
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideForm());
    if (addBtn) addBtn.addEventListener('click', () => this.showForm());
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.fetchData());
    
    if (prevPage) prevPage.addEventListener('click', () => this.changePage(this.currentPage - 1));
    if (nextPage) nextPage.addEventListener('click', () => this.changePage(this.currentPage + 1));
    
    // Add sort functionality to table headers
    tableHeaders.forEach(header => {
      header.addEventListener('click', () => this.handleSort(header.dataset.field));
    });
  }
  
  // Show the form for adding a new item
  showForm() {
    const formContainer = document.getElementById(this.elementIds.formContainerId);
    const formTitle = document.getElementById(this.elementIds.formTitleId);
    
    if (formContainer) {
      formContainer.classList.remove('d-none');
      this.formVisible = true;
      
      // Reset the form if it's not in edit mode
      if (!this.editId) {
        document.getElementById(this.elementIds.formId).reset();
        formTitle.innerHTML = `<i class="fas fa-plus-circle me-2 text-primary"></i> Add ${this.config.entityName}`;
      }
      
      // Scroll to the form container
      formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  // Hide the form
  hideForm() {
    const formContainer = document.getElementById(this.elementIds.formContainerId);
    if (formContainer) {
      formContainer.classList.add('d-none');
      this.formVisible = false;
      this.cancelEdit();
    }
  }
  
  async handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const formValues = {};
    
    this.config.attributes.forEach(attr => {
      // Skip the id field for new records
      if (attr.name === 'id' && !this.editId) {
        return; // Let the server assign the ID
      }
      
      if (attr.type === 'checkbox') {
        formValues[attr.name] = document.getElementById(attr.name).checked;
      } else if (attr.type === 'number') {
        const value = formData.get(attr.name);
        formValues[attr.name] = value ? Number(value) : null;
      } 
      else if (attr.type === 'date') {
        formValues[attr.name] = formData.get(attr.name);
      } else if (attr.name === 'id' && this.editId) {
        // Only include ID if we're editing an existing record
        formValues[attr.name] = this.editId;
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
      this.hideForm();
      this.showToast(this.editId ? 'Item updated successfully' : 'Item added successfully', 'success');
    } catch (error) {
      console.error('Error submitting form:', error);
      this.showToast(`Error: ${error.message || 'Failed to save data'}`, 'danger');
    } finally {
      this.setLoading(false);
    }
  }
  
  async addItem(formValues) {
    // Remove any id property if it exists in formValues
    if (formValues.hasOwnProperty('id')) {
      delete formValues.id;
    }
    
    console.log('Adding new item:', formValues);
    
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
    
    // Get the newly created item with its server-assigned ID
    const newItem = await response.json();
    console.log('Server response for new item:', newItem);
    
    await this.fetchData();
  }
  
  async updateItem(formValues) {
    // Ensure ID is included and is the correct type
    if (this.editId) {
      formValues.id = this.editId;
    }
    
    console.log('Updating item:', formValues);
    
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
    // Show confirmation modal using Bootstrap
    const confirmed = window.confirm('Are you sure you want to delete this item? This action cannot be undone.');
    
    if (!confirmed) {
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
      this.showToast(`Error: ${error.message || 'Failed to delete item'}`, 'danger');
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
      document.getElementById(this.elementIds.formTitleId).innerHTML = `<i class="fas fa-edit me-2 text-primary"></i>Edit ${this.config.entityName}`;
      
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
      
      // Show the form after populating it
      this.showForm();
    } catch (error) {
      console.error('Error editing item:', error);
      this.showToast(`Error: ${error.message || 'Failed to load item data'}`, 'danger');
    } finally {
      this.setLoading(false);
    }
  }

  cancelEdit() {
    this.editId = null;
    document.getElementById(this.elementIds.formId).reset();
    document.getElementById(this.elementIds.formTitleId).innerHTML = `<i class="fas fa-plus-circle me-2 text-primary"></i>Add ${this.config.entityName}`;
  }

  handleSearch(e) {
    // Debounce search to avoid too many requests
    clearTimeout(this.searchTimeout);
    
    // Show a loading indicator in the search input
    const searchInput = document.getElementById(this.elementIds.searchInputId);
    const searchIcon = searchInput.nextElementSibling.querySelector('i');
    
    if (searchIcon) {
      searchIcon.className = 'fas fa-spinner fa-spin text-primary';
    }
    
    this.searchTimeout = setTimeout(() => {
      this.searchTerm = e.target.value.toLowerCase();
      console.log(`Searching for: "${this.searchTerm}"`); // Debug log
      this.currentPage = 1; // Reset to first page when searching
      
      // Remove the loading indicator
      if (searchIcon) {
        searchIcon.className = 'fas fa-search text-muted';
      }
      
      this.fetchData();
    }, 500); // Debounce delay
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
      icon.innerHTML = '<i class="fas fa-sort text-muted opacity-50 small"></i>';
    });
    
    const currentSortHeader = document.querySelector(`th[data-field="${field}"] .sort-icon`);
    if (currentSortHeader) {
      currentSortHeader.innerHTML = this.sortDirection === 'asc' 
        ? '<i class="fas fa-sort-up text-primary small"></i>' 
        : '<i class="fas fa-sort-down text-primary small"></i>';
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
      params.append('_page', this.currentPage);
      params.append('_per_page', this.itemsPerPage);
      
      // Sorting
      if (this.sortField) {
        params.append('_sort', this.sortField);
        params.append('_order', this.sortDirection);
      }
      
      // Search
      if (this.searchTerm) {
        params.append('q', this.searchTerm);
      }
      
      url = `${url}?${params.toString()}`;
      
      console.log(`Fetching data from: ${url}`); // Debug log
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      let responseData = await response.json();
      let totalCount = responseData.items || 0;
      
      // Handle different response formats
      let processedData;
      
      if (responseData.data && Array.isArray(responseData.data)) {
        processedData = responseData.data;
        totalCount = responseData.items || totalCount;
      } else if (Array.isArray(responseData)) {
        processedData = responseData;
      } else if (responseData && typeof responseData === 'object') {
        if (responseData.items) {
          processedData = responseData.data || [];
          totalCount = responseData.items || totalCount;
        } else {
          processedData = [responseData];
        }
      } else {
        processedData = [];
      }
      
      // If we still don't have a total count, use the array length
      if (totalCount === 0 && processedData.length > 0) {
        totalCount = processedData.length;
      }
      
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
            <td colspan="${this.config.attributes.filter(attr => !attr.hideInTable).length + 1}" class="text-center text-danger py-4">
              <div class="my-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error loading data: ${error.message || 'Unknown error'}
              </div>
            </td>
          </tr>
        `;
      }
      this.showToast(`Error: ${error.message || 'Failed to load data'}`, 'danger');
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
  }
  
  updatePagination(totalCount) {
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
      
      if (prevBtn) {
        prevBtn.disabled = true;
        prevBtn.parentElement.classList.add('disabled');
      }
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.parentElement.classList.add('disabled');
      }
      
      // Clear page numbers
      const pageNumbers = document.getElementById(this.elementIds.paginationIds.pageNumbers);
      if (pageNumbers) pageNumbers.innerHTML = '';
      return;
    }

    // Calculate page information
    const pageStart = Math.min(((this.currentPage - 1) * this.itemsPerPage) + 1, totalCount);
    const pageEnd = Math.min(pageStart + this.itemsPerPage - 1, totalCount);
    
    const pageStartEl = document.getElementById(this.elementIds.paginationIds.pageStart);
    const pageEndEl = document.getElementById(this.elementIds.paginationIds.pageEnd);
    const totalItemsEl = document.getElementById(this.elementIds.paginationIds.totalItems);
    
    if (pageStartEl) pageStartEl.textContent = pageStart;
    if (pageEndEl) pageEndEl.textContent = pageEnd;
    if (totalItemsEl) totalItemsEl.textContent = totalCount;
    
    // Update pagination buttons
    const prevBtn = document.getElementById(this.elementIds.paginationIds.prevPage);
    const nextBtn = document.getElementById(this.elementIds.paginationIds.nextPage);
    
    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
      const prevBtnParent = prevBtn.parentElement;
      if (prevBtnParent && prevBtnParent.classList.contains('page-item')) {
        prevBtnParent.classList.toggle('disabled', this.currentPage <= 1);
      }
    }
    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= this.totalPages;
      const nextBtnParent = nextBtn.parentElement;
      if (nextBtnParent && nextBtnParent.classList.contains('page-item')) {
        nextBtnParent.classList.toggle('disabled', this.currentPage >= this.totalPages);
      }
    }
    
    // Generate page number buttons
    const pageNumbers = document.getElementById(this.elementIds.paginationIds.pageNumbers);
    if (!pageNumbers) return;
    
    pageNumbers.innerHTML = '';
    
    // Determine which page numbers to show
    let startPage = Math.max(1, this.currentPage - 1);
    let endPage = Math.min(this.totalPages, startPage + 2);
    
    if (endPage - startPage < 2 && this.totalPages > 2) {
      startPage = Math.max(1, endPage - 2);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage;
      
      const pageItem = document.createElement('li');
      pageItem.className = `page-item ${isActive ? 'active' : ''}`;
      
      pageItem.innerHTML = `
        <button class="page-link" data-page="${i}">${i}</button>
      `;
      
      pageNumbers.appendChild(pageItem);
    }
    
    // Add event listeners to page number buttons
    pageNumbers.querySelectorAll('button[data-page]').forEach(button => {
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
        loadingIndicator.classList.remove('d-none');
      } else {
        loadingIndicator.classList.add('d-none');
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
    
    // Create Bootstrap 5 toast
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast align-items-center text-white bg-${type} border-0 my-1`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas ${this.getToastIcon(type)} me-2"></i> ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize Bootstrap toast (fallback to jQuery if needed)
    try {
      const bsToast = new bootstrap.Toast(toast, {
        delay: 5000,
        autohide: true
      });
      bsToast.show();
    } catch (e) {
      // Fallback to jQuery
      $(toast).toast({
        delay: 5000,
        autohide: true
      });
      $(toast).toast('show');
    }
    
    // Remove the toast element when hidden
    toast.addEventListener('hidden.bs.toast', function() {
      toast.remove();
    });
  }
  
  getToastIcon(type) {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'danger': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      default: return 'fa-info-circle';
    }
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
  // Initialize the CRUD generator
  const crudInstance = new EnhancedCrudGenerator(containerId, config, loadImmediately);
  return crudInstance;
}