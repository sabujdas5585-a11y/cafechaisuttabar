import { MenuItem, Ingredient, Testimonial, Booking } from '../types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Adrak Elaichi Kulhad Chai',
    description: 'Aromatic traditional Indian tea infused with fresh crushed ginger and green cardamom, served sizzling hot in an eco-friendly clay kulhad cup.',
    price: 30,
    category: 'chai',
    imageUrls: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=600',
      'https://images.unsplash.com/photo-1598880940375-4a4eb1ee0dd9?q=80&w=600'
    ],
    isAvailable: true,
    isPopular: true
  },
  {
    id: 'm2',
    name: 'Chocolate Kulhad Chai',
    description: 'A delightful fusion of premium Assam CTC essence blended with high-grade dark chocolate solids and velvety frothy milk, in a hand-baked clay pot.',
    price: 45,
    category: 'chai',
    imageUrls: [
      'https://images.unsplash.com/photo-1563887530-6893dd0f177c?q=80&w=600',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=600'
    ],
    isAvailable: true,
    isPopular: true
  },
  {
    id: 'm3',
    name: 'Tulsi Green Sutta',
    description: '100% tobacco-free and nicotine-free therapeutic herbal stick rolled with holy basil, green tea leaves, and wild spearmint for a stress-relieving puff.',
    price: 20,
    category: 'sutta',
    imageUrls: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600'
    ],
    isAvailable: true
  },
  {
    id: 'm4',
    name: 'Mint Spearmint Sutta',
    description: 'Nicotine-free aromatic herbal formula enriched with refreshingly cool peppermint extracts and lemon balm leaves to accompany your hot chai cup.',
    price: 20,
    category: 'sutta',
    imageUrls: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600'
    ],
    isAvailable: true,
    isPopular: false
  },
  {
    id: 'm5',
    name: 'Double Masala Cheese Maggi',
    description: 'Perfectly cooked instant ramen laden with double spice sachet seasoning, melted cheddar cream cheese shreds, diced carrots, and spring peas.',
    price: 90,
    category: 'snacks',
    imageUrls: [
      'https://images.unsplash.com/photo-1612927601601-6638404737ce?q=80&w=600',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=600'
    ],
    isAvailable: true,
    isPopular: true
  },
  {
    id: 'm6',
    name: 'Classic Bun Maska',
    description: 'Super soft, pillow-like sweet buns sliced and slathered with a highly generous wedge of creamy Amul salted butter. Ideal for dipping directly in chai!',
    price: 40,
    category: 'snacks',
    imageUrls: [
      'https://images.unsplash.com/photo-1600431521340-491dea880813?q=80&w=600'
    ],
    isAvailable: true
  },
  {
    id: 'm7',
    name: 'Paneer Cheese Burst Burger',
    description: 'Crispy deep-fried Paneer patty topped with liquid jalapeno cheese sauce, fresh lettuce, sliced tomatoes, and spicy chipotle mayo in a sesame bun.',
    price: 130,
    category: 'fast_food',
    imageUrls: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600'
    ],
    isAvailable: true,
    isPopular: true
  },
  {
    id: 'm8',
    name: 'Crispy Peri Peri Fries',
    description: 'Thick cut golden Idaho potatoes tossed in fiery South African wild chili dust, rock salt, and tangential citric powders.',
    price: 80,
    category: 'fast_food',
    imageUrls: [
      'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=600'
    ],
    isAvailable: true
  },
  {
    id: 'm9',
    name: 'Cool Virgin Mint Mojito',
    description: 'Muddled garden lime wedges, crushed spearmint foliage, high-fizz tonic water, and simple sugarcane syrup poured over shaved glacier ice crystals.',
    price: 80,
    category: 'beverages',
    imageUrls: [
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600'
    ],
    isAvailable: true
  }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Fresh Milk', currentQty: 45, minQty: 15, unit: 'Liters', category: 'dairy' },
  { id: 'i2', name: 'Premium Assam Chai Patti', currentQty: 12, minQty: 4, unit: 'Kgs', category: 'dry' },
  { id: 'i3', name: 'Elaichi & Ginger', currentQty: 2.2, minQty: 0.8, unit: 'Kgs', category: 'dry' },
  { id: 'i4', name: 'Organic Fine Sugar', currentQty: 18, minQty: 5, unit: 'Kgs', category: 'dry' },
  { id: 'i5', name: 'Soft Sweet Buns', currentQty: 32, minQty: 10, unit: 'Pcs', category: 'fresh' },
  { id: 'i6', name: 'Maggi Noodles Pack', currentQty: 58, minQty: 15, unit: 'Pcs', category: 'dry' },
  { id: 'i7', name: 'Clay Kulhad Pots', currentQty: 180, minQty: 50, unit: 'Pcs', category: 'packaging' },
  { id: 'i8', name: 'Amul Butter Blocks', currentQty: 8, minQty: 3, unit: 'Kgs', category: 'dairy' },
  { id: 'i9', name: 'Paneer Slabs & Veggies', currentQty: 5, minQty: 2, unit: 'Kgs', category: 'fresh' }
];

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Siddharth Mukherjee',
    rating: 5,
    text: 'Best hanging spot in Jhargram! The Adrak Elaichi Kulhad Chai is absolutely divine, and paired with Bun Maska, there is no better combination in the evening. Extremely cozy vibrations!',
    date: '2026-05-18'
  },
  {
    id: 't2',
    name: 'Priyanka Das',
    rating: 5,
    text: 'The food is very reasonable and delicious! Paneer Cheese Burger is filled with delicious creamy cheese and peri peri fries are hot and super crispy. The mobile-friendly site let me order in seconds on my way to the cafe.',
    date: '2026-05-29'
  },
  {
    id: 't3',
    name: 'Rajesh Sen',
    rating: 4,
    text: 'Beautiful environment, very close to Madhuban More. The herbal mint suttas are highly soothing and unique. Staff behavior is extremely top notch and reservation was confirmed with push notification tracking immediately!',
    date: '2026-06-02'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    customerName: 'Aritra Banerjee',
    email: 'aritra@gmail.com',
    phone: '0987654321',
    date: '2026-06-05',
    time: '18:00',
    guests: 4,
    status: 'confirmed',
    tableNo: 'Table 4',
    notes: 'Near the corner window with lights if possible, celebration for friend\'s birthday.',
    createdAt: '2026-06-04T08:12:00Z'
  },
  {
    id: 'b2',
    customerName: 'Anindita Roy',
    email: 'anindita22@yahoo.com',
    phone: '0812345678',
    date: '2026-06-06',
    time: '19:30',
    guests: 2,
    status: 'pending',
    notes: 'No special requests.',
    createdAt: '2026-06-04T09:20:00Z'
  }
];

export const CAFE_GALLERY_IMAGES = [
  {
    id: 'g1',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800',
    caption: 'Cozy indoor lighting & comfortable seating corners'
  },
  {
    id: 'g2',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800',
    caption: 'Gathering with friends & hot brewing chai chats'
  },
  {
    id: 'g3',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800',
    caption: 'Signature freshly toasted Bun Maskas & kulhad assortments'
  },
  {
    id: 'g4',
    url: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=800',
    caption: 'Aesthetic windows looking out to vibrant street moments'
  }
];
