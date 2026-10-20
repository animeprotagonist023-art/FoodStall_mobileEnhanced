import type { FoodCategory, MenuItem, Vendor } from '../types'

export const categories: { name: FoodCategory; icon: string; detail: string }[] = [
  { name: 'All', icon: 'sparkles', detail: 'A little bit of everything' },
  { name: 'Rice meals', icon: 'utensils', detail: 'Filling plates for busy days' },
  { name: 'Filipino', icon: 'heart', detail: 'Comfort-food favorites' },
  { name: 'Noodles', icon: 'soup', detail: 'Warm bowls, quick bites' },
  { name: 'Coffee & drinks', icon: 'coffee', detail: 'A sip between classes' },
  { name: 'Snacks', icon: 'cookie', detail: 'Small treats, big mood' },
  { name: 'Bakery', icon: 'croissant', detail: 'Fresh-baked picks' },
  { name: 'Budget meals', icon: 'wallet', detail: 'Easy on the allowance' },
]

export const initialVendors: Vendor[] = [
  { id: 'rice-shine', name: 'Rice & Shine', category: 'Rice meals · Silog', description: 'Hearty rice plates for early classes and long afternoons.', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=85', avatar: 'R', rating: '4.8', prepTime: '10–15 min', priceLabel: '₱49–₱109', isOpen: true, hours: '7:00 AM – 4:00 PM', acceptsPickup: true, acceptsDelivery: true, featured: true, location: 'Rice & Shine counter (demo point)' },
  { id: 'kusina-corner', name: 'Kusina Corner', category: 'Filipino comfort food', description: 'Home-style ulam, warm soup, and the rice that ties it together.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85', avatar: 'K', rating: '4.7', prepTime: '12–18 min', priceLabel: '₱55–₱120', isOpen: true, hours: '9:00 AM – 3:30 PM', acceptsPickup: true, acceptsDelivery: true, featured: true, location: 'Kusina Corner counter (demo point)' },
  { id: 'brew-bloom', name: 'Brew & Bloom', category: 'Coffee · Cold drinks', description: 'A small caffeine reset for your next big idea.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=85', avatar: 'B', rating: '4.9', prepTime: '5–8 min', priceLabel: '₱45–₱95', isOpen: true, hours: '7:30 AM – 5:00 PM', acceptsPickup: true, acceptsDelivery: true, featured: true, location: 'Brew & Bloom counter (demo point)' },
  { id: 'merienda-club', name: 'Merienda Club', category: 'Snacks · Merienda', description: 'Quick cravings, shareable snacks, and afternoon favorites.', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=85', avatar: 'M', rating: '4.6', prepTime: '6–10 min', priceLabel: '₱25–₱85', isOpen: true, hours: '10:00 AM – 5:00 PM', acceptsPickup: true, acceptsDelivery: false, location: 'Merienda Club counter (demo point)' },
  { id: 'pan-de-study', name: 'Pan de Study', category: 'Bakery · Pastries', description: 'Golden, flaky, freshly baked comfort for the walk to class.', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85', avatar: 'P', rating: '4.8', prepTime: '3–6 min', priceLabel: '₱18–₱75', isOpen: true, hours: '6:30 AM – 2:00 PM', acceptsPickup: true, acceptsDelivery: false, location: 'Pan de Study counter (demo point)' },
  { id: 'silog-society', name: 'Silog Society', category: 'Silog · Breakfast', description: 'Crispy edges, garlic rice, and all-day breakfast energy.', image: 'https://images.unsplash.com/photo-1513442542250-854d436a73f2?auto=format&fit=crop&w=1200&q=85', avatar: 'S', rating: '4.7', prepTime: '10–14 min', priceLabel: '₱59–₱99', isOpen: false, hours: '6:00 AM – 11:30 AM', acceptsPickup: true, acceptsDelivery: true, location: 'Silog Society counter (demo point)' },
  { id: 'noodle-nook', name: 'Noodle Nook', category: 'Noodles · Soup bowls', description: 'Slurpable comfort for rainy breaks and late study sessions.', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85', avatar: 'N', rating: '4.6', prepTime: '10–16 min', priceLabel: '₱45–₱89', isOpen: true, hours: '10:00 AM – 4:00 PM', acceptsPickup: true, acceptsDelivery: true, location: 'Noodle Nook counter (demo point)' },
  { id: 'budget-bowl', name: 'Budget Bowl', category: 'Budget meals', description: 'Everyday meals that leave room in your student budget.', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85', avatar: 'B', rating: '4.5', prepTime: '8–12 min', priceLabel: '₱39–₱69', isOpen: true, hours: '8:30 AM – 3:00 PM', acceptsPickup: true, acceptsDelivery: true, location: 'Budget Bowl counter (demo point)' },
  { id: 'timpla-tea', name: 'Timpla Tea Bar', category: 'Tea · Refreshers', description: 'Bright, chilled drinks for warm campus afternoons.', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=1200&q=85', avatar: 'T', rating: '4.5', prepTime: '4–7 min', priceLabel: '₱35–₱85', isOpen: true, hours: '9:00 AM – 4:30 PM', acceptsPickup: true, acceptsDelivery: true, location: 'Timpla Tea Bar counter (demo point)' },
  { id: 'snack-lab', name: 'Snack Lab', category: 'Quick bites · Snacks', description: 'Crunchy, cheesy, and made for sharing between lectures.', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=85', avatar: 'S', rating: '4.4', prepTime: '7–10 min', priceLabel: '₱30–₱79', isOpen: true, hours: '10:00 AM – 5:30 PM', acceptsPickup: true, acceptsDelivery: true, location: 'Snack Lab counter (demo point)' },
]

const img = {
  tapa: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=82',
  chicken: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=82',
  tocino: 'https://images.unsplash.com/photo-1513442542250-854d436a73f2?auto=format&fit=crop&w=900&q=82',
  adobo: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=82',
  bowl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=82',
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=82',
  coffee: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=82',
  iced: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=82',
  pastry: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=82',
  snack: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=82',
  fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=82',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=82',
}

export const initialMenu: MenuItem[] = [
  { id: 'silog-classic', vendorId: 'rice-shine', name: 'Classic Tapsilog', description: 'Savory beef tapa, garlic rice, and a sunny-side egg.', price: 89, category: 'Rice meals', image: img.tapa, available: true, popular: true, sizes: [{ name: 'Regular', priceDelta: 0 }, { name: 'Extra rice', priceDelta: 12 }], addons: [{ name: 'Extra egg', price: 12 }, { name: 'Atchara', price: 8 }], tags: ['Best seller'] },
  { id: 'chicken-inasal', vendorId: 'rice-shine', name: 'Chicken Inasal Rice', description: 'Grilled-style chicken over garlic rice with a tangy dip.', price: 79, category: 'Rice meals', image: img.chicken, available: true, addons: [{ name: 'Extra chicken', price: 28 }, { name: 'Extra rice', price: 12 }] },
  { id: 'tocilog', vendorId: 'rice-shine', name: 'Tocilog', description: 'Sweet-savory tocino, sinangag, and egg.', price: 75, category: 'Rice meals', image: img.tocino, available: true, addons: [{ name: 'Extra egg', price: 12 }, { name: 'Extra rice', price: 12 }] },
  { id: 'budget-tapa', vendorId: 'rice-shine', name: 'Mini Tapa Bowl', description: 'A satisfying smaller plate for lighter breaks.', price: 59, category: 'Budget meals', image: img.bowl, available: true },
  { id: 'adobo-rice', vendorId: 'kusina-corner', name: 'Chicken Adobo Plate', description: 'Tender chicken in a classic soy-vinegar sauce with rice.', price: 85, category: 'Filipino', image: img.adobo, available: true, popular: true, addons: [{ name: 'Extra rice', price: 12 }, { name: 'Extra sauce', price: 5 }] },
  { id: 'pork-sinigang', vendorId: 'kusina-corner', name: 'Sinigang Bowl', description: 'A comforting sour broth with vegetables and rice.', price: 95, category: 'Filipino', image: img.soup, available: true, sizes: [{ name: 'Solo', priceDelta: 0 }, { name: 'Big bowl', priceDelta: 25 }] },
  { id: 'crispy-chicken', vendorId: 'kusina-corner', name: 'Crispy Chicken Meal', description: 'Crispy golden chicken with rice and house gravy.', price: 89, category: 'Rice meals', image: img.chicken, available: true, addons: [{ name: 'Extra gravy', price: 5 }, { name: 'Extra rice', price: 12 }] },
  { id: 'veggie-bowl', vendorId: 'kusina-corner', name: 'Gulay & Rice Bowl', description: 'A colorful seasonal vegetable sauté served with rice.', price: 65, category: 'Filipino', image: img.bowl, available: true },
  { id: 'iced-latte', vendorId: 'brew-bloom', name: 'Iced Brown Sugar Latte', description: 'Espresso, milk, and a mellow brown-sugar swirl.', price: 85, category: 'Coffee & drinks', image: img.coffee, available: true, popular: true, sizes: [{ name: '12 oz', priceDelta: 0 }, { name: '16 oz', priceDelta: 15 }], addons: [{ name: 'Oat milk', price: 15 }, { name: 'Extra espresso', price: 20 }] },
  { id: 'spanish-latte', vendorId: 'brew-bloom', name: 'Spanish Latte', description: 'A creamy espresso favorite, served over ice.', price: 89, category: 'Coffee & drinks', image: img.coffee, available: true, sizes: [{ name: '12 oz', priceDelta: 0 }, { name: '16 oz', priceDelta: 15 }] },
  { id: 'matcha-cloud', vendorId: 'brew-bloom', name: 'Iced Matcha Cloud', description: 'Earthy matcha with a soft, creamy finish.', price: 95, category: 'Coffee & drinks', image: img.iced, available: true, sizes: [{ name: '12 oz', priceDelta: 0 }, { name: '16 oz', priceDelta: 10 }] },
  { id: 'cold-brew', vendorId: 'brew-bloom', name: 'Campus Cold Brew', description: 'Smooth, slow-steeped coffee over ice.', price: 69, category: 'Coffee & drinks', image: img.coffee, available: true },
  { id: 'banana-que', vendorId: 'merienda-club', name: 'Banana Cue Pair', description: 'Caramelized saba bananas with a crisp sugar coat.', price: 30, category: 'Snacks', image: img.snack, available: true },
  { id: 'lumpia', vendorId: 'merienda-club', name: 'Crispy Lumpia (4 pcs)', description: 'Golden vegetable rolls with a sweet dipping sauce.', price: 39, category: 'Snacks', image: img.snack, available: true, addons: [{ name: 'Extra sauce', price: 5 }] },
  { id: 'cheese-sticks', vendorId: 'merienda-club', name: 'Cheese Sticks (5 pcs)', description: 'Crunchy wrappers with a gooey cheese center.', price: 45, category: 'Snacks', image: img.fries, available: true },
  { id: 'pancit-cup', vendorId: 'merienda-club', name: 'Pancit Canton Cup', description: 'A quick noodle cup for the in-between moments.', price: 49, category: 'Noodles', image: img.noodles, available: true },
  { id: 'ensaymada', vendorId: 'pan-de-study', name: 'Classic Ensaymada', description: 'Soft, buttery bread topped with cheese and sugar.', price: 32, category: 'Bakery', image: img.pastry, available: true, popular: true },
  { id: 'pan-de-coco', vendorId: 'pan-de-study', name: 'Pan de Coco', description: 'Soft rolls with a sweet coconut filling.', price: 22, category: 'Bakery', image: img.pastry, available: true },
  { id: 'pandesal-pack', vendorId: 'pan-de-study', name: 'Pandesal (5 pcs)', description: 'A warm little pack of classic Filipino bread rolls.', price: 35, category: 'Bakery', image: img.pastry, available: true },
  { id: 'banana-bread', vendorId: 'pan-de-study', name: 'Banana Bread Slice', description: 'Moist banana bread, easy to take to class.', price: 38, category: 'Bakery', image: img.pastry, available: true },
  { id: 'longsilog', vendorId: 'silog-society', name: 'Longsilog', description: 'Garlicky longganisa, rice, egg, and vinegar dip.', price: 79, category: 'Rice meals', image: img.tocino, available: true },
  { id: 'hamsilog', vendorId: 'silog-society', name: 'Hamsilog', description: 'A simple ham, egg, and garlic-rice classic.', price: 69, category: 'Rice meals', image: img.tapa, available: true },
  { id: 'hotsilog', vendorId: 'silog-society', name: 'Hotsilog', description: 'A familiar hotdog, garlic rice, and egg plate.', price: 55, category: 'Budget meals', image: img.chicken, available: true },
  { id: 'bangsilog', vendorId: 'silog-society', name: 'Bangsilog', description: 'Milkfish, crisp garlic rice, egg, and a tangy dip.', price: 89, category: 'Rice meals', image: img.tapa, available: true },
  { id: 'beef-mami', vendorId: 'noodle-nook', name: 'Beef Mami Bowl', description: 'Warm broth, tender beef, noodles, and greens.', price: 79, category: 'Noodles', image: img.noodles, available: true, popular: true, sizes: [{ name: 'Regular', priceDelta: 0 }, { name: 'Large', priceDelta: 20 }] },
  { id: 'pancit-bihon', vendorId: 'noodle-nook', name: 'Pancit Bihon', description: 'Rice noodles tossed with vegetables and savory seasoning.', price: 59, category: 'Noodles', image: img.noodles, available: true },
  { id: 'spicy-noodles', vendorId: 'noodle-nook', name: 'Spicy Noodle Bowl', description: 'A warming noodle bowl with a gentle spicy kick.', price: 69, category: 'Noodles', image: img.soup, available: true, addons: [{ name: 'Extra chili', price: 0 }, { name: 'Extra egg', price: 12 }] },
  { id: 'chicken-pancit', vendorId: 'noodle-nook', name: 'Chicken Pancit Canton', description: 'Stir-fried egg noodles with chicken and vegetables.', price: 75, category: 'Noodles', image: img.noodles, available: true },
  { id: 'budget-chicken', vendorId: 'budget-bowl', name: 'Chicken Rice Saver', description: 'A no-fuss chicken and rice meal at a friendly price.', price: 59, category: 'Budget meals', image: img.chicken, available: true, popular: true },
  { id: 'budget-veggie', vendorId: 'budget-bowl', name: 'Veggie Gisa Bowl', description: 'Seasonal sautéed vegetables and rice, simply done.', price: 39, category: 'Budget meals', image: img.bowl, available: true },
  { id: 'budget-egg', vendorId: 'budget-bowl', name: 'Egg & Rice Plate', description: 'Garlic rice with two eggs and a tangy side.', price: 45, category: 'Budget meals', image: img.tapa, available: true, addons: [{ name: 'Extra egg', price: 12 }] },
  { id: 'budget-lumpia-rice', vendorId: 'budget-bowl', name: 'Lumpia Rice Combo', description: 'Crispy vegetable rolls with rice and dipping sauce.', price: 49, category: 'Budget meals', image: img.snack, available: true },
  { id: 'fruit-tea', vendorId: 'timpla-tea', name: 'Passion Fruit Tea', description: 'A bright, citrusy fruit tea served cold.', price: 55, category: 'Coffee & drinks', image: img.iced, available: true, sizes: [{ name: '12 oz', priceDelta: 0 }, { name: '16 oz', priceDelta: 10 }], addons: [{ name: 'Pearls', price: 10 }] },
  { id: 'wintermelon', vendorId: 'timpla-tea', name: 'Wintermelon Milk Tea', description: 'Toasty sweetness with milk and chewy pearls.', price: 65, category: 'Coffee & drinks', image: img.iced, available: true, sizes: [{ name: '12 oz', priceDelta: 0 }, { name: '16 oz', priceDelta: 10 }], addons: [{ name: 'Pearls', price: 10 }, { name: 'Less ice', price: 0 }] },
  { id: 'lemonade', vendorId: 'timpla-tea', name: 'Fresh Lemon Cooler', description: 'A refreshing lemon drink to brighten the afternoon.', price: 39, category: 'Coffee & drinks', image: img.iced, available: true },
  { id: 'lychee-soda', vendorId: 'timpla-tea', name: 'Lychee Sparkler', description: 'A lightly fizzy lychee refresher served cold.', price: 49, category: 'Coffee & drinks', image: img.iced, available: true },
  { id: 'loaded-fries', vendorId: 'snack-lab', name: 'Cheesy Loaded Fries', description: 'Crispy fries with a generous cheesy drizzle.', price: 65, category: 'Snacks', image: img.fries, available: true, addons: [{ name: 'Extra cheese', price: 10 }, { name: 'Spicy dust', price: 5 }] },
  { id: 'mozza-bites', vendorId: 'snack-lab', name: 'Mozzarella Bites', description: 'Crispy bites with a melty mozzarella center.', price: 59, category: 'Snacks', image: img.fries, available: false },
  { id: 'nachos', vendorId: 'snack-lab', name: 'Campus Nachos', description: 'Crunchy chips, cheese sauce, and a tangy salsa.', price: 49, category: 'Snacks', image: img.snack, available: true },
  { id: 'fishball-cup', vendorId: 'snack-lab', name: 'Fishball Cup', description: 'A classic quick snack with sweet-spicy sauce on the side.', price: 35, category: 'Snacks', image: img.snack, available: true },
]

export function cloneDemoData() {
  return { vendors: initialVendors.map((v) => ({ ...v })), menu: initialMenu.map((m) => ({ ...m, sizes: m.sizes?.map((s) => ({ ...s })), addons: m.addons?.map((a) => ({ ...a })) })) }
}
