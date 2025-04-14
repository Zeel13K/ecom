# E-Commerce Full Stack Application

A modern, responsive e-commerce application built with React frontend and Node.js backend, featuring both customer and admin interfaces for a complete online shopping experience.

## Frontend Overview

The frontend provides a seamless shopping experience with features such as product browsing, cart management, user authentication, checkout processing, and order tracking. It also includes an admin dashboard for managing products, orders, and customer messages.

### Frontend Features

#### Customer Features
- **User Authentication**: Register, login, and profile management
- **Product Browsing**: Browse products with filtering and search capabilities
- **Shopping Cart**: Add, remove, and update product quantities
- **Checkout Process**: Complete purchase with shipping and payment details
- **Order History**: View past orders and their status
- **Contact Support**: Send messages to the store administrators

#### Admin Features
- **Admin Dashboard**: Overview of store performance
- **Product Management**: Add, edit, and remove products
- **Order Management**: Process and update order status
- **Customer Messages**: Respond to customer inquiries

### Frontend Technology Stack

- **Frontend**: React 19.0.0
- **Routing**: React Router 7.4.1
- **State Management**: React Context API for auth and cart state
- **Build Tool**: Vite 6.2.0
- **Styling**: CSS with responsive design

## Backend Overview

The backend system powers the e-commerce platform and provides all necessary APIs for product management, user authentication, order processing, and admin functionality. It's built with Node.js, Express, and MongoDB, following RESTful API design principles.

### Backend Architecture

The backend follows a layered architecture:

1. **Routes Layer**: Handles HTTP requests and routes them to appropriate controllers
2. **Controller Layer**: Contains business logic and communicates with models
3. **Model Layer**: Defines database schemas and interacts with the MongoDB database
4. **Middleware Layer**: Handles cross-cutting concerns like authentication and file uploads

### Backend Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Password Encryption**: bcryptjs
- **File Upload**: Multer
- **Environment Variables**: dotenv
- **Cross-Origin Resource Sharing**: cors

## Project Structure

```
project-root/
├── frontend/       # React frontend application
│   ├── public/     # Static files
│   └── src/        
│       ├── assets/         # Static assets like images
│       ├── components/     # Reusable UI components
│       │   ├── Admin/      # Admin-specific components
│       │   ├── Cart.jsx    # Shopping cart component
│       │   ├── Header.jsx  # Navigation header
│       │   └── Footer.jsx  # Page footer
│       ├── context/        # React Context providers
│       │   ├── AuthContext.jsx  # Authentication state management
│       │   └── CartContext.jsx  # Shopping cart state management
│       ├── pages/          # Application pages
│       │   ├── Admin/      # Admin panel pages
│       │   ├── Home.jsx    # Landing page
│       │   ├── Shop.jsx    # Product listing
│       │   ├── Login.jsx   # User login
│       │   └── ...         # Other page components
│       ├── styles/         # CSS stylesheets
│       ├── App.jsx         # Main application component with routes
│       └── main.jsx        # Application entry point
│
├── backend/        # Node.js backend application
│   ├── config/         # Database configuration
│   │   └── db.js       # MongoDB connection setup
│   ├── controllers/    # Logic for API endpoints
│   │   ├── userController.js
│   │   ├── productController.js
│   │   └── orderController.js
│   ├── middleware/     # Authentication middleware and utilities
│   │   ├── auth.js     # JWT authentication
│   │   └── upload.js   # Image upload handling
│   ├── models/         # Database models
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/         # API routes
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   └── orderRoutes.js
│   ├── uploads/        # For storing product images
│   ├── .env            # Environment variables
│   └── server.js       # Entry point
```

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn package manager
- MongoDB (local or Atlas cloud instance)

### Installation

#### Frontend
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`

#### Backend
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the server:
   ```
   npm run dev
   ```
   The server will run on `http://localhost:5000`

## Frontend Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Backend Development Commands

```bash
# Install dependencies
npm install

# Start server in development mode
npm run dev

# Start server in production mode
npm start
```

## Authentication

### Frontend
The frontend application uses a client-side authentication mechanism that communicates with the backend API through JWT tokens.

### Backend
The system uses JSON Web Tokens (JWT) for authentication. When a user registers or logs in, they receive a token that must be included in the Authorization header for protected routes:

```
Authorization: Bearer <token>
```

Two middleware functions handle authentication:
- `protect`: Verifies the JWT token and attaches user data to the request
- `admin`: Checks if the authenticated user has admin privileges

## Backend API Endpoints

### User Management

| Method | Endpoint           | Description                | Access      |
|--------|-------------------|----------------------------|------------|
| POST   | /api/users        | Register a new user        | Public     |
| POST   | /api/users/login  | Login user & get token     | Public     |
| GET    | /api/users/profile | Get user profile          | Private    |
| PUT    | /api/users/profile | Update user profile       | Private    |

### Product Management

| Method | Endpoint           | Description                | Access      |
|--------|-------------------|----------------------------|------------|
| GET    | /api/products     | Get all products           | Public     |
| GET    | /api/products/:id | Get product by ID          | Public     |
| POST   | /api/products     | Create a new product       | Admin      |
| PUT    | /api/products/:id | Update product             | Admin      |
| DELETE | /api/products/:id | Delete product             | Admin      |

### Order Management

| Method | Endpoint                | Description                | Access      |
|--------|------------------------|----------------------------|------------|
| POST   | /api/orders            | Create a new order         | Private    |
| GET    | /api/orders            | Get all orders             | Admin      |
| GET    | /api/orders/myorders   | Get logged in user orders  | Private    |
| GET    | /api/orders/:id        | Get order by ID            | Private    |
| PUT    | /api/orders/:id/pay    | Update order to paid       | Private    |
| PUT    | /api/orders/:id/deliver | Update order to delivered | Admin      |

## Database Models

### User Model

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  isAdmin: Boolean,
  createdAt: Date
}
```

### Product Model

```javascript
{
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  countInStock: Number,
  createdAt: Date
}
```

### Order Model

```javascript
{
  user: ObjectId (ref: 'User'),
  orderItems: [
    {
      name: String,
      quantity: Number,
      image: String,
      price: Number,
      product: ObjectId (ref: 'Product')
    }
  ],
  shippingAddress: {
    address: String,
    city: String,
    postalCode: String,
    country: String
  },
  paymentMethod: String,
  totalPrice: Number,
  isPaid: Boolean,
  paidAt: Date,
  isDelivered: Boolean,
  deliveredAt: Date,
  createdAt: Date
}
```

## File Upload

Product images are uploaded using Multer middleware:
- Supported formats: JPEG, JPG, PNG, WEBP
- Maximum file size: 1MB
- Files are stored in the `/uploads` directory with unique filenames

## Error Handling

The API follows these error response patterns:

- **400 Bad Request**: Client-side errors like invalid data or duplicate entries
- **401 Unauthorized**: Authentication failures
- **404 Not Found**: Resource not found
- **500 Server Error**: Internal server errors

Error response format:
```json
{
  "message": "Error description"
}
```

## Deployment

### Frontend
The frontend application can be deployed on any static hosting service:

1. Build the application:
   ```
   npm run build
   ```
2. Deploy the contents of the `dist` directory to your hosting provider

### Backend
The backend requires a Node.js hosting environment with MongoDB access:

1. Deploy the backend code to a service like Heroku, DigitalOcean, or AWS
2. Set up the required environment variables on your hosting platform
3. Configure MongoDB Atlas for database access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
