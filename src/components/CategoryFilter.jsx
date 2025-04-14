const CategoryFilter = ({ categories, setCategory }) => {
    return (
      <aside className="category-sidebar">
        <div className="category-box">
          <h2>Filter by Category</h2>
          <div className="category-list">
            <div className="category-item" onClick={() => setCategory("all")}>All Products</div>
            {categories.map(category => (
              <div key={category} className="category-item" onClick={() => setCategory(category)}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  };
  
  export default CategoryFilter;
  