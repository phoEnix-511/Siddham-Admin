import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useRouter } from 'next/router';

export default function ProductCard({ product }: { product: any }) {
  const { addItem, openCart } = useCart();
  const router = useRouter();
  const { catalogMode } = useSettings();
  const disc = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  return (
    <div className="product-card" key={product.id}>
      <Link href={`/products/${product.id}`}>
        <div className="product-card-image" style={{ width: '100%', aspectRatio: '1', backgroundColor: '#faf8f4' }}>
          <img
            src={(product.images && product.images.length > 0 && product.images[0]) ? product.images[0] : '/images/hair-oil.png'}
            alt={product.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              // If the network image fails, fallback to a local image
              (e.target as HTMLImageElement).src = '/images/supplements.png';
            }}
          />
          {disc > 0 && <div className="product-badge discount">{disc}% OFF</div>}
          {!product.isActive && <div className="product-badge out-of-stock">Unavailable</div>}
        </div>
      </Link>
      <div className="product-card-body">
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="product-name" style={{ 
            fontFamily: 'var(--font-sans)', 
            fontSize: '1.1rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            marginBottom: 'var(--space-1)',
            color: 'var(--color-forest-dark)'
          }}>
            {product.name}
          </h3>
          {product.description && (
            <p style={{ 
              fontSize: '0.85rem', 
              color: 'var(--color-gray-500)', 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden',
              marginBottom: 'var(--space-3)'
            }}>
              {product.description}
            </p>
          )}
        </Link>
        <div className="product-price-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="price-current" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.25rem' }}>₹{product.price}</span>
          {product.comparePrice && (
            <span className="price-compare" style={{ textDecoration: 'line-through', color: 'var(--color-gray-400)', fontSize: '0.9rem' }}>₹{product.comparePrice}</span>
          )}
        </div>
        {catalogMode ? (
          <button 
            className="btn btn-gold" 
            style={{ width: '100%', borderRadius: '9999px', fontSize: '0.9rem', padding: '12px 24px', fontWeight: 700, letterSpacing: '0.05em' }}
            onClick={(e) => {
              e.preventDefault();
              router.push(`/products/${product.id}`);
            }}
          >
            🔍 View Details
          </button>
        ) : (
          <button 
            className="btn btn-gold" 
            style={{ width: '100%', borderRadius: '9999px', fontSize: '0.9rem', padding: '12px 24px', fontWeight: 700, letterSpacing: '0.05em' }}
            disabled={!product.isActive}
            onClick={(e) => {
              e.preventDefault();
              addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || '',
                stock: product.stock ?? 10
              });
              openCart();
            }}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}