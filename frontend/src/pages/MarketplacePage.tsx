import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { MarketplaceListing } from '../types';
import { 
  ShoppingBag, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowRight,
  Heart
} from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const { t } = useTranslation();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/marketplace/listings')
      .then(res => res.json())
      .then(data => setListings(data.listings || []))
      .catch(() => {
        // Fallback demonstration listings
        setListings([
          {
            id: '1',
            seller_partner_id: 'p1',
            title: 'Dell Latitude 7490 (Intel Core i7 8th Gen, 16GB RAM, 512GB NVMe SSD)',
            category: 'Laptop',
            description: 'Professionally sanitized, thermal paste renewed, Grade A condition with 6 months warranty.',
            condition_grade: 'Refurbished Grade A',
            price_inr: 24500.0,
            warranty_months: 6,
            status: 'available',
            image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
            created_at: '2026-10-15'
          },
          {
            id: '2',
            seller_partner_id: 'p1',
            title: 'HP EliteDisplay E243 23.8-inch IPS Full HD Monitor',
            category: 'Monitor',
            description: 'Zero dead pixels, micro-edge bezel, HDMI/DisplayPort/VGA ports. Power cord included.',
            condition_grade: 'Refurbished Grade A',
            price_inr: 6200.0,
            warranty_months: 3,
            status: 'available',
            image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
            created_at: '2026-10-15'
          },
          {
            id: '3',
            seller_partner_id: 'p1',
            title: 'Lenovo ThinkCentre M720q Tiny Desktop (Core i5, 8GB RAM, 256GB SSD)',
            category: 'Desktop Computer',
            description: 'Ultra-compact workstation ideal for student coding, home offices, and web development.',
            condition_grade: 'Refurbished Grade A',
            price_inr: 14800.0,
            warranty_months: 6,
            status: 'available',
            image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=600&q=80',
            created_at: '2026-10-15'
          }
        ]);
      });
  }, []);

  const filteredListings = listings.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleInquiry = (itemTitle: string) => {
    setInquirySuccess(`Inquiry submitted for "${itemTitle}". The verified refurbishment facility will contact you within 24 hours.`);
    setTimeout(() => setInquirySuccess(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Circular Electronics Secondary Economy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
          {t.market_title}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {t.market_subtitle}
        </p>
      </div>

      {inquirySuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{inquirySuccess}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl glass-panel border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['all', 'Laptop', 'Monitor', 'Desktop Computer'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All Devices' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search refurbished models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredListings.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl glass-panel overflow-hidden border border-gray-200/80 dark:border-gray-800/80 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
          >
            {/* Image & Badges */}
            <div className="relative h-52 overflow-hidden bg-gray-100 dark:bg-charcoal-900">
              <img
                src={item.image_url || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80'}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-md">
                  {item.condition_grade}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-md">
                  {item.warranty_months} {t.market_warranty}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                  {item.description}
                </p>

                <div className="mt-4 flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Certified Refurbishment</span>
                </div>
              </div>

              {/* Price & Inquire */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Refurbished Price</span>
                  <span className="text-xl font-black text-gray-900 dark:text-white">
                    ₹{item.price_inr.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleInquiry(item.title)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors"
                >
                  {t.btn_inquire}
                </button>
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
