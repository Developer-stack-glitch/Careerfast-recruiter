'use client';
import React, { useEffect, useState } from "react";
import axios from "axios";

function Dummy() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios
      .get("https://dummyjson.com/products")
      .then((response) => setProducts(response.data.products));
  }, []);
  return (
    <>
      {products.map((product, index) => (
        <div key={index}>
          <h3>
            {product.title} - ${product.price}
          </h3>
          <p>{product.description}</p>
          <h6>{product.tags}</h6>
        </div>
      ))}
    </>
  );
}

export default Dummy;

