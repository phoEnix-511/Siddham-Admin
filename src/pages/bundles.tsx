import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';

interface Product { id: string; name: string; price: number; images: string[]; category: { slug: string } }
interface Bundle { id: string; title: string; minItems: number; fixedPrice: number; description: string; }

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeBundle, setActiveBundle] = useState<Bundle | null>(null);
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const { addItem } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    fetch('/api/bundles').then(r => r.json()).then(d => {
      const active = d.bundles?.filter((b: Bundle) => (b as any).isActive !== false) || [];
      setBundles(active);
      if (active.length > 0) setActiveBundle(active[0]);
    });
    fetch('/api/products?limit=50').then(r => r.json()).then(d => setProducts(d.products || []));
  }, []);

  const toggleProduct = (p: Product) => {
    if (!activeBundle) return;
    if (selectedItems.find(item => item.id === p.id)) {
      setSelectedItems(selectedItems.filter(item => item.id !== p.id));
    } else {
      if (selectedItems.length < activeBundle.minItems) {
        setSelectedItems([...selectedItems, p]);
      } else {
        addToast(`You can only select ${activeBundle.minItems} items for this bundle`, 'error');
      }
    }
  };

  const addToCart = () => {
    if (!activeBundle || selectedItems.length < activeBundle.minItems) return;
    
    // Distribute the fixed price across the items to avoid complex cart discount logic
    const pricePerItem = Math.floor(activeBundle.fixedPrice / activeBundle.minItems);
    
    selectedItems.forEach(p => {
      addItem({
        productId: p.id,
        name: `[Bundle] ${p.name}`,
        price: pricePerItem,
        image: (p.images as any)?.[0]?.id ? `/api/products/images/${(p.images as any)[0].id}` : '',
        stock: 99
      });
    });
    
    addToast(`${activeBundle.title} added to cart!`, 'success');
    setSelectedItems([]);
  };

  return (
    <>
      <Head><title>Build Your Bundle - Siddham Wellness</title></Head>
      <Navbar />
      
      <div className="page-header" style={{ background: 'var(--color-forest)', color: 'white' }}>
        <div className="container">
          <h1 style={{ color: 'var(--color-saffron)' }}>Build Your Bundle</h1>
          <p>Mix and match your favorite products and save.</p>
        </div>
      </div>

      <div className="container section">
        <div className="grid-2">
          
          {/* Sidebar - Bundle Selector */}
          <div>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Select an Offer</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {bundles.map(b => (
                <div 
                  key={b.id} 
                  className="card"
                  style={{ 
                    cursor: 'pointer', 
                    border: activeBundle?.id === b.id ? '2px solid var(--color-saffron)' : '1px solid var(--color-parchment-dark)',
                    background: activeBundle?.id === b.id ? 'var(--color-parchment)' : 'white'
                  }}
                  onClick={() => { setActiveBundle(b); setSelectedItems([]); }}
                >
                  <h4 style={{ color: 'var(--color-forest)' }}>{b.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', margin: 'var(--space-2) 0' }}>{b.description}</p>
                  <div style={{ fontWeight: 700, color: 'var(--color-saffron)' }}>₹{b.fixedPrice}</div>
                </div>
              ))}
              {bundles.length === 0 && <div className="card">No bundle offers currently available.</div>}
            </div>

            {activeBundle && (
              <div className="card" style={{ marginTop: 'var(--space-6)', background: 'var(--color-forest-dark)', color: 'white' }}>
                <h4 style={{ color: 'var(--color-saffron-light)' }}>Your Box ({selectedItems.length}/{activeBundle.minItems})</h4>
                <div style={{ display: 'flex', gap: '8px', margin: 'var(--space-4) 0', flexWrap: 'wrap' }}>
                  {Array.from({ length: activeBundle.minItems }).map((_, i) => (
                    <div key={i} style={{ width: 60, height: 60, borderRadius: 8, border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                      {selectedItems[i] ? (
                        <img src={(selectedItems[i].images as any)?.[0]?.id ? `/api/products/images/${(selectedItems[i].images as any)[0].id}` : ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>+</span>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  className="btn btn-gold" 
                  style={{ width: '100%' }}
                  disabled={selectedItems.length < activeBundle.minItems}
                  onClick={addToCart}
                >
                  {selectedItems.length < activeBundle.minItems ? `Select ${activeBundle.minItems - selectedItems.length} more` : `Add Bundle to Cart - ₹${activeBundle.fixedPrice}`}
                </button>
              </div>
            )}
          </div>

          {/* Main - Product Grid */}
          <div>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Select Products</h3>
            <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
              {products.map(p => {
                const isSelected = selectedItems.find(item => item.id === p.id);
                return (
                  <div 
                    key={p.id} 
                    className="product-card"
                    style={{ border: isSelected ? '2px solid var(--color-saffron)' : '1px solid transparent', cursor: 'pointer' }}
                    onClick={() => toggleProduct(p)}
                  >
                    <div className="product-card-image" style={{ aspectRatio: '1', background: 'var(--color-parchment)', padding: 'var(--space-2)' }}>
                      {(p.images as any)?.[0]?.id ? (
                        <img src={`/api/products/images/${(p.images as any)[0].id}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🌿</div>
                      )}
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--color-saffron)', color: 'black', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          ✓
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 'var(--space-3)' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: 4 }}>{p.name}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>Regular: ₹{p.price}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
      <Footer />
    </>
  );
}