import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product }: { product: any }) {
  const { addItem } = useCart();
  const disc = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  return (
    <div className="product-card" key={product.id}>
      <Link href={`/products/${product.id}`}>
        <div className="product-card-image">
          {product.images && product.images.length > 0 && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                const fallback = parent?.querySelector('.fallback-placeholder');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="img-placeholder fallback-placeholder"
            style={{
              display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex'
            }}
          >
            {/* Fallback emoji logic based on category slug if possible, or default */}
            <span style={{ fontSize: '3rem' }}>🌿</span>
          </div>
          {disc > 0 && <div className="product-badge discount">{disc}% OFF</div>}
          {!product.isActive && <div className="product-badge out-of-stock">Unavailable</div>}
        </div>
      </Link>
      <div className="product-card-content">
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="product-title">{product.name}</h3>
        </Link>
        <div className="product-price-row">
          <span className="price-main">₹{product.price}</span>
          {product.comparePrice && (
            <span className="price-compare">₹{product.comparePrice}</span>
          )}
        </div>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          disabled={!product.isActive}
          onClick={(e) => {
            e.preventDefault();
            addItem({
              productId: product.id,
              name: product.name,
              price: product.price,
              image: product.images?.[0] || '',
              stock: product.stockQuantity || 10
            });
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}