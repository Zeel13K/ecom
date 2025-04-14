import { useState } from "react";

const ProductCard = ({ product, updateCart }) => {
  const [quantity, setQuantity] = useState(1);
  const cart = JSON.parse(localStorage.getItem("cart")) || {};

  const addToCart = () => {
    cart[product.id] = quantity;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCart();
  };

  return (
    <div className="product-card">
      <img src={product.image} alt={product.title} className="product-image" />
      <div className="product-details">
        <div className="product-category">{product.category}</div>
        <h3 className="product-title">{product.title}</h3>
        <p className="product-description">{product.description.slice(0, 60)}...</p>
        <div className="product-price">${product.price.toFixed(2)}</div>
        <button className="add-to-cart" onClick={addToCart}>Add to Cart</button>
      </div>
    </div>
  );
};

export default ProductCard;
