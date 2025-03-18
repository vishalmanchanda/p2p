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

      const orderConfig = {
        entityName: 'orders',
        title: 'Order Management',
        apiBaseUrl: 'http://localhost:3002',
        itemsPerPage: 10,
        attributes: [
          {
            name: 'orderId',
            label: 'Order ID',
            type: 'text',
            required: true,
          },
          {
            name: 'customerName',
            label: 'Customer Name',
            type: 'text',
            required: true,
          },
          {
            name: 'orderDate',
            label: 'Order Date',
            type: 'date',
          }, 
          {
            name: 'totalAmount',
            label: 'Total Amount',
            type: 'number',
            required: true,
            prefix: '$',
          }
        ]
      }


      const configuredEntities = [{name: 'user', config: userConfig}, {name: 'product', config: productConfig}, {name: 'order', config: orderConfig}];

      // Add this for Node.js compatibility
      if (typeof module !== 'undefined' && module.exports) {
        module.exports = { configuredEntities, userConfig, productConfig, orderConfig };
      }

