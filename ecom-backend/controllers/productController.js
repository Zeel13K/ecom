const Product = require('../models/Product');

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    console.log(`Found ${products.length} products in database`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // For development - return mock data if database query fails
    if (process.env.NODE_ENV !== 'production') {
      console.log('DEVELOPMENT MODE: Returning mock product data');
      
      const mockProducts = [
        {
          _id: 'prod1',
          name: 'Premium Leather Wallet',
          price: 49.99,
          description: 'Handcrafted premium leather wallet with multiple card slots and cash compartment.',
          image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2FsbGV0fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
          category: 'Accessories',
          countInStock: 15,
          featured: true,
          createdAt: '2023-01-05T10:00:00Z'
        },
        {
          _id: 'prod2',
          name: 'Modern Minimalist Watch',
          price: 129.99,
          description: 'Sleek, minimalist design watch with Japanese movement and premium steel band.',
          image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHdhdGNofGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
          category: 'Watches',
          countInStock: 8,
          featured: true,
          createdAt: '2023-01-12T14:30:00Z'
        },
        {
          _id: 'prod3',
          name: 'Organic Cotton T-Shirt',
          price: 24.99,
          description: 'Soft, breathable organic cotton t-shirt in multiple colors. Sustainable and eco-friendly.',
          image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dHNoaXJ0fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
          category: 'Clothing',
          countInStock: 25,
          featured: false,
          createdAt: '2023-02-10T09:15:00Z'
        },
        {
          _id: 'prod4',
          name: 'Bluetooth Wireless Earbuds',
          price: 79.99,
          description: 'High-quality sound with noise cancellation. Long battery life and comfortable fit.',
          image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGVhcmJ1ZHN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
          category: 'Electronics',
          countInStock: 12,
          featured: true,
          createdAt: '2023-02-15T16:40:00Z'
        },
        {
          _id: 'prod5',
          name: 'Stainless Steel Water Bottle',
          price: 34.99,
          description: 'Double-wall insulated stainless steel water bottle. Keeps drinks cold for 24 hours or hot for 12 hours.',
          image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8d2F0ZXIlMjBib3R0bGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
          category: 'Home & Kitchen',
          countInStock: 18,
          featured: false,
          createdAt: '2023-03-01T11:20:00Z'
        },
        {
          _id: 'prod6',
          name: 'Leather Crossbody Bag',
          price: 89.99,
          description: 'Stylish and functional leather crossbody bag with adjustable strap and multiple compartments.',
          image: 'https://images.unsplash.com/photo-1559563458-527698bf5295?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGFuZGJhZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60',
          category: 'Accessories',
          countInStock: 7,
          featured: true,
          createdAt: '2023-03-10T13:45:00Z'
        }
      ];
      
      return res.json(mockProducts);
    }
    
    res.status(500).json({ 
      message: 'Server error while retrieving products', 
      error: error.message 
    });
  }
};

const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

const createProduct = async (req, res) => {
  const product = new Product({
    name: 'Sample name',
    price: 0,
    user: req.user._id,
    image: '/images/sample.jpg',
    category: 'Sample category',
    countInStock: 0,
    numReviews: 0,
    description: 'Sample description',
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
};

const updateProduct = async (req, res) => {
  const { name, price, description, image, category, countInStock } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use deleteOne instead of remove (which is deprecated)
    await Product.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Product removed successfully', id: req.params.id });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error during product deletion', error: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
