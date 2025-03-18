// Blog Post configuration
const postConfig = {
    entityName: 'posts',
    title: 'Blog Post Management',
    apiBaseUrl: 'http://localhost:3002',
    itemsPerPage: 10,
    attributes: [
      { 
        name: 'title', 
        label: 'Post Title', 
        type: 'text', 
        required: true,
        helpText: 'Enter the title of your blog post'
      },
      { 
        name: 'slug', 
        label: 'URL Slug', 
        type: 'text', 
        required: true,
        helpText: 'URL-friendly version of the title'
      },
      { 
        name: 'author', 
        label: 'Author', 
        type: 'select', 
        required: true,
        options: [
          { value: 'admin', label: 'Admin' },
          { value: 'editor', label: 'Editor' },
          { value: 'contributor', label: 'Contributor' }
        ]
      },
      { 
        name: 'content', 
        label: 'Content', 
        type: 'textarea', 
        required: true,
        hideInTable: true
      },
      { 
        name: 'excerpt', 
        label: 'Excerpt', 
        type: 'textarea',
        helpText: 'A short summary of the post'
      },
      { 
        name: 'category', 
        label: 'Category', 
        type: 'select', 
        required: true,
        options: [
          { value: 'technology', label: 'Technology' },
          { value: 'lifestyle', label: 'Lifestyle' },
          { value: 'business', label: 'Business' },
          { value: 'health', label: 'Health & Wellness' },
          { value: 'other', label: 'Other' }
        ]
      },
      { 
        name: 'tags', 
        label: 'Tags', 
        type: 'text',
        helpText: 'Comma-separated list of tags'
      },
      { 
        name: 'publishDate', 
        label: 'Publish Date', 
        type: 'date',
        required: true
      },
      { 
        name: 'featuredImage', 
        label: 'Featured Image URL', 
        type: 'text'
      },
      { 
        name: 'status', 
        label: 'Status', 
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' }
        ]
      },
      { 
        name: 'allowComments', 
        label: 'Comments', 
        type: 'checkbox',
        checkboxLabel: 'Allow Comments'
      }
    ]
  };
  
  // Comment configuration
  const commentConfig = {
    entityName: 'comments',
    title: 'Comment Management',
    apiBaseUrl: 'http://localhost:3002',
    itemsPerPage: 15,
    attributes: [
      { 
        name: 'postId', 
        label: 'Post ID', 
        type: 'text', 
        required: true
      },
      { 
        name: 'author', 
        label: 'Author Name', 
        type: 'text', 
        required: true
      },
      { 
        name: 'email', 
        label: 'Email', 
        type: 'email', 
        required: true
      },
      { 
        name: 'website', 
        label: 'Website', 
        type: 'text'
      },
      { 
        name: 'content', 
        label: 'Comment', 
        type: 'textarea', 
        required: true
      },
      { 
        name: 'datePosted', 
        label: 'Date Posted', 
        type: 'date',
        required: true
      },
      { 
        name: 'status', 
        label: 'Status', 
        type: 'select',
        required: true,
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'spam', label: 'Spam' }
        ]
      },
      { 
        name: 'ipAddress', 
        label: 'IP Address', 
        type: 'text',
        hideInTable: true
      }
    ]
  };
  
  // Category configuration
  const categoryConfig = {
    entityName: 'categories',
    title: 'Category Management',
    apiBaseUrl: 'http://localhost:3002',
    itemsPerPage: 10,
    attributes: [
      { 
        name: 'name', 
        label: 'Category Name', 
        type: 'text', 
        required: true
      },
      { 
        name: 'slug', 
        label: 'URL Slug', 
        type: 'text', 
        required: true,
        helpText: 'URL-friendly version of the category name'
      },
      { 
        name: 'description', 
        label: 'Description', 
        type: 'textarea'
      },
      { 
        name: 'parentCategory', 
        label: 'Parent Category', 
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'technology', label: 'Technology' },
          { value: 'lifestyle', label: 'Lifestyle' },
          { value: 'business', label: 'Business' }
        ]
      },
      { 
        name: 'displayOrder', 
        label: 'Display Order', 
        type: 'number',
        min: 0
      },
      { 
        name: 'isActive', 
        label: 'Status', 
        type: 'checkbox',
        checkboxLabel: 'Active Category'
      }
    ]
  };
  
  // User configuration
  const userConfig = {
    entityName: 'users',
    title: 'User Management',
    apiBaseUrl: 'http://localhost:3002',
    itemsPerPage: 10,
    attributes: [
      { 
        name: 'username', 
        label: 'Username', 
        type: 'text', 
        required: true
      },
      { 
        name: 'email', 
        label: 'Email Address', 
        type: 'email', 
        required: true
      },
      { 
        name: 'firstName', 
        label: 'First Name', 
        type: 'text', 
        required: true
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        type: 'text', 
        required: true
      },
      { 
        name: 'role', 
        label: 'Role', 
        type: 'select', 
        required: true,
        options: [
          { value: 'admin', label: 'Administrator' },
          { value: 'editor', label: 'Editor' },
          { value: 'author', label: 'Author' },
          { value: 'contributor', label: 'Contributor' },
          { value: 'subscriber', label: 'Subscriber' }
        ]
      },
      { 
        name: 'bio', 
        label: 'Biography', 
        type: 'textarea',
        hideInTable: true
      },
      { 
        name: 'avatar', 
        label: 'Avatar URL', 
        type: 'text'
      },
      { 
        name: 'registrationDate', 
        label: 'Registration Date', 
        type: 'date'
      },
      { 
        name: 'lastLogin', 
        label: 'Last Login', 
        type: 'date'
      },
      { 
        name: 'isActive', 
        label: 'Status', 
        type: 'checkbox',
        checkboxLabel: 'Active Account'
      }
    ]
  };
  
  // Media configuration
  const mediaConfig = {
    entityName: 'media',
    title: 'Media Library',
    apiBaseUrl: 'http://localhost:3002',
    itemsPerPage: 12,
    attributes: [
      { 
        name: 'fileName', 
        label: 'File Name', 
        type: 'text', 
        required: true
      },
      { 
        name: 'fileUrl', 
        label: 'File URL', 
        type: 'text', 
        required: true
      },
      { 
        name: 'fileType', 
        label: 'File Type', 
        type: 'select',
        required: true,
        options: [
          { value: 'image', label: 'Image' },
          { value: 'video', label: 'Video' },
          { value: 'document', label: 'Document' },
          { value: 'audio', label: 'Audio' }
        ]
      },
      { 
        name: 'fileSize', 
        label: 'File Size (KB)', 
        type: 'number',
        required: true
      },
      { 
        name: 'uploadDate', 
        label: 'Upload Date', 
        type: 'date',
        required: true
      },
      { 
        name: 'uploadedBy', 
        label: 'Uploaded By', 
        type: 'text',
        required: true
      },
      { 
        name: 'altText', 
        label: 'Alt Text', 
        type: 'text',
        helpText: 'Alternative text for accessibility'
      },
      { 
        name: 'caption', 
        label: 'Caption', 
        type: 'textarea'
      }
    ]
  };
  
  // Final configuration array
  const configuredEntities = [
    {name: 'post', config: postConfig}, 
    {name: 'comment', config: commentConfig}, 
    {name: 'categories', config: categoryConfig},
    {name: 'user', config: userConfig},
    {name: 'media', config: mediaConfig}
  ];