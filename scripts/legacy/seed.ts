import { db } from "./db";
import { categories, products, subcategories } from "../../shared/schema";
import { count } from "drizzle-orm";

export async function checkAndSeed() {
  try {
    // Check if categories already exist
    const [categoryCount] = await db.select({ count: count() }).from(categories);
    
    if (categoryCount.count > 0) {
      console.log(`Database already seeded with ${categoryCount.count} categories`);
      return;
    }
    
    console.log("Database is empty, seeding with categories and products...");
    await seed();
  } catch (error) {
    console.error("Error checking/seeding database:", error);
  }
}

async function seed() {
  console.log("Seeding database...");

  // Insert categories
  const categoryData = [
    { name: "Dining Tables", description: "Premium teak dining tables for your family" },
    { name: "Chairs", description: "Comfortable and elegant teak chairs" },
    { name: "Wardrobes", description: "Spacious teak wardrobes for storage" },
    { name: "Beds", description: "Luxurious teak beds for ultimate comfort" },
    { name: "Sofas", description: "Stylish teak sofas for your living room" },
    { name: "Cabinets", description: "Functional teak cabinets for organization" },
  ];

  const insertedCategories = await db.insert(categories).values(categoryData).returning();
  console.log("Categories inserted:", insertedCategories.length);

  // Insert subcategories for each category with image URLs
  const subcategoryData = [
    // Dining Tables subcategories
    { name: "4-Seater Tables", categoryId: insertedCategories[0].id, description: "Perfect for small families", imageUrl: "/images/dining-table.webp" },
    { name: "6-Seater Tables", categoryId: insertedCategories[0].id, description: "Ideal for medium families", imageUrl: "/images/dining-table.webp" },
    { name: "8-Seater Tables", categoryId: insertedCategories[0].id, description: "Great for large families", imageUrl: "/images/dining-table.webp" },
    { name: "Round Tables", categoryId: insertedCategories[0].id, description: "Classic round dining tables", imageUrl: "/images/dining-table.webp" },
    { name: "Rectangular Tables", categoryId: insertedCategories[0].id, description: "Traditional rectangular designs", imageUrl: "/images/dining-table.webp" },

    // Chairs subcategories
    { name: "Dining Chairs", categoryId: insertedCategories[1].id, description: "Comfortable dining chairs", imageUrl: "/images/chair-set.jpg" },
    { name: "Office Chairs", categoryId: insertedCategories[1].id, description: "Ergonomic office chairs", imageUrl: "/images/chair-set.jpg" },
    { name: "Lounge Chairs", categoryId: insertedCategories[1].id, description: "Relaxing lounge chairs", imageUrl: "/images/chair-set.jpg" },
    { name: "Bar Stools", categoryId: insertedCategories[1].id, description: "Stylish bar stools", imageUrl: "/images/modern-chairs.webp" },
    { name: "Rocking Chairs", categoryId: insertedCategories[1].id, description: "Traditional rocking chairs", imageUrl: "/images/chair-set.jpg" },

    // Wardrobes subcategories
    { name: "2-Door Wardrobes", categoryId: insertedCategories[2].id, description: "Compact 2-door designs", imageUrl: "/images/wardrobe.webp" },
    { name: "3-Door Wardrobes", categoryId: insertedCategories[2].id, description: "Medium 3-door wardrobes", imageUrl: "/images/wardrobe.webp" },
    { name: "4-Door Wardrobes", categoryId: insertedCategories[2].id, description: "Large 4-door wardrobes", imageUrl: "/images/wardrobe.webp" },
    { name: "Walk-in Closets", categoryId: insertedCategories[2].id, description: "Luxury walk-in wardrobes", imageUrl: "/images/wardrobe.webp" },
    { name: "Kids Wardrobes", categoryId: insertedCategories[2].id, description: "Child-friendly designs", imageUrl: "/images/wardrobe.webp" },

    // Beds subcategories
    { name: "Single Beds", categoryId: insertedCategories[3].id, description: "Compact single beds", imageUrl: "/images/bed.jpg" },
    { name: "Double Beds", categoryId: insertedCategories[3].id, description: "Comfortable double beds", imageUrl: "/images/bed.jpg" },
    { name: "Queen Size", categoryId: insertedCategories[3].id, description: "Spacious queen beds", imageUrl: "/images/bed.jpg" },
    { name: "King Size", categoryId: insertedCategories[3].id, description: "Luxurious king beds", imageUrl: "/images/bed.jpg" },
    { name: "Storage Beds", categoryId: insertedCategories[3].id, description: "Beds with storage", imageUrl: "/images/bed.jpg" },

    // Sofas subcategories
    { name: "2-Seater Sofas", categoryId: insertedCategories[4].id, description: "Compact 2-seater sofas", imageUrl: "/images/sofa.jpg" },
    { name: "3-Seater Sofas", categoryId: insertedCategories[4].id, description: "Standard 3-seater sofas", imageUrl: "/images/sofa.jpg" },
    { name: "L-Shaped Sofas", categoryId: insertedCategories[4].id, description: "Corner L-shaped sofas", imageUrl: "/images/living-room-set.jpg" },
    { name: "Sectional Sofas", categoryId: insertedCategories[4].id, description: "Modular sectional sofas", imageUrl: "/images/living-room-set.jpg" },
    { name: "Recliners", categoryId: insertedCategories[4].id, description: "Comfortable recliner chairs", imageUrl: "/images/sofa.jpg" },

    // Cabinets subcategories
    { name: "TV Units", categoryId: insertedCategories[5].id, description: "Entertainment TV units", imageUrl: "/images/living-room-set.jpg" },
    { name: "Pooja Ghar", categoryId: insertedCategories[5].id, description: "Traditional prayer units", imageUrl: "/images/pooja-ghar.jpg" },
    { name: "Storage Cabinets", categoryId: insertedCategories[5].id, description: "General storage cabinets", imageUrl: "/images/wardrobe.webp" },
    { name: "Display Units", categoryId: insertedCategories[5].id, description: "Decorative display cabinets", imageUrl: "/images/wardrobe.webp" },
    { name: "Kitchen Cabinets", categoryId: insertedCategories[5].id, description: "Kitchen storage solutions", imageUrl: "/images/wardrobe.webp" },
  ];

  const insertedSubcategories = await db.insert(subcategories).values(subcategoryData).returning();
  console.log("Subcategories inserted:", insertedSubcategories.length);

  // Insert products using local images with proper subcategory assignments
  const productData = [
    // Featured Teak Furniture Products
    {
      name: "Royal Maharaja Dining Table",
      description: "Exquisite 8-seater solid teak dining table with hand-carved traditional motifs and brass inlays",
      price: "75000",
      originalPrice: "95000",
      categoryId: insertedCategories[0].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "8-Seater Tables")?.id,
      imageUrl: "/images/dining-table.webp",
      featured: true,
      inStock: true,
      stock: 3,
    },
    {
      name: "Premium Teak Chair Set",
      description: "Elegant set of 6 solid teak dining chairs with traditional design and comfortable cushioning",
      price: "48000",
      originalPrice: "62000",
      categoryId: insertedCategories[1].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Dining Chairs")?.id,
      imageUrl: "/images/chair-set.jpg",
      featured: true,
      inStock: true,
      stock: 8,
    },
    {
      name: "Emperor Teak Wardrobe",
      description: "Magnificent 4-door solid teak wardrobe with mirror, drawers and premium brass fittings",
      price: "85000",
      originalPrice: "110000",
      categoryId: insertedCategories[2].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "4-Door Wardrobes")?.id,
      imageUrl: "/images/wardrobe.webp",
      featured: true,
      inStock: true,
      stock: 2,
    },
    {
      name: "Royal King Size Teak Bed",
      description: "Luxurious king size solid teak bed with storage compartments and intricate headboard design",
      price: "95000",
      originalPrice: "125000",
      categoryId: insertedCategories[3].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "King Size")?.id,
      imageUrl: "/images/bed.jpg",
      featured: true,
      inStock: true,
      stock: 2,
    },
    {
      name: "Imperial Teak Sofa",
      description: "Elegant solid teak sofa with premium fabric upholstery and traditional design",
      price: "85000",
      originalPrice: "105000",
      categoryId: insertedCategories[4].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "3-Seater Sofas")?.id,
      imageUrl: "/images/sofa.jpg",
      featured: true,
      inStock: true,
      stock: 3,
    },
    {
      name: "Heritage Teak Pooja Ghar",
      description: "Traditional solid teak pooja mandir with intricate carvings and storage compartments",
      price: "58000",
      originalPrice: "72000",
      categoryId: insertedCategories[5].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Pooja Ghar")?.id,
      imageUrl: "/images/pooja-ghar.jpg",
      featured: true,
      inStock: true,
      stock: 5,
    },

    // ₹1 Deal Products - Flash Sales
    {
      name: "Modern Teak Chairs - Flash Deal",
      description: "Set of 2 modern solid teak chairs with ergonomic design - Limited time ₹1 deal!",
      price: "25000",
      originalPrice: "32000",
      dealPrice: "1",
      categoryId: insertedCategories[1].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Office Chairs")?.id,
      imageUrl: "/images/modern-chairs.webp",
      isDeal: true,
      dealExpiry: new Date(Date.now() + 86400000), // 24 hours from now
      inStock: true,
      stock: 15,
    },
    {
      name: "Teak Temple - ₹1 Deal",
      description: "Beautiful solid teak temple for home worship - Incredible ₹1 flash sale!",
      price: "35000",
      originalPrice: "45000",
      dealPrice: "1",
      categoryId: insertedCategories[5].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Pooja Ghar")?.id,
      imageUrl: "/images/temple-pooja.jpg",
      isDeal: true,
      dealExpiry: new Date(Date.now() + 86400000), // 24 hours from now
      inStock: true,
      stock: 8,
    },
    {
      name: "Traditional Jhula - Flash Sale",
      description: "Handcrafted solid teak jhula swing for garden or porch - Unbelievable ₹1 deal!",
      price: "45000",
      originalPrice: "58000",
      dealPrice: "1",
      categoryId: insertedCategories[4].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Recliners")?.id,
      imageUrl: "/images/jhula.jpg",
      isDeal: true,
      dealExpiry: new Date(Date.now() + 86400000), // 24 hours from now
      inStock: true,
      stock: 12,
    },

    // Regular Teak Furniture Products
    {
      name: "Complete Living Room Set",
      description: "Comprehensive solid teak living room furniture set including sofa, center table, and side tables",
      price: "185000",
      originalPrice: "225000",
      categoryId: insertedCategories[4].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Sectional Sofas")?.id,
      imageUrl: "/images/living-room-set.jpg",
      inStock: true,
      stock: 2,
    },
    {
      name: "Classic Teak Dining Table",
      description: "Spacious 6-seater solid teak dining table perfect for family meals and gatherings",
      price: "55000",
      originalPrice: "68000",
      categoryId: insertedCategories[0].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "6-Seater Tables")?.id,
      imageUrl: "/images/dining-table.webp",
      inStock: true,
      stock: 6,
    },
    {
      name: "Ergonomic Chair Set of 4",
      description: "Set of 4 comfortable solid teak chairs with ergonomic design for dining or office use",
      price: "32000",
      originalPrice: "40000",
      categoryId: insertedCategories[1].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Dining Chairs")?.id,
      imageUrl: "/images/chair-set.jpg",
      inStock: true,
      stock: 10,
    },
    {
      name: "Spacious Teak Wardrobe",
      description: "Large solid teak wardrobe with multiple compartments, hanging space, and mirror",
      price: "72000",
      originalPrice: "88000",
      categoryId: insertedCategories[2].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "3-Door Wardrobes")?.id,
      imageUrl: "/images/wardrobe.webp",
      inStock: true,
      stock: 4,
    },
    {
      name: "Queen Size Teak Bed",
      description: "Elegant queen size solid teak bed with modern design and storage options",
      price: "68000",
      originalPrice: "82000",
      categoryId: insertedCategories[3].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Queen Size")?.id,
      imageUrl: "/images/bed.jpg",
      inStock: true,
      stock: 5,
    },
    {
      name: "Comfortable Teak Sofa",
      description: "Premium 3-seater solid teak sofa with high-quality fabric upholstery",
      price: "65000",
      originalPrice: "78000",
      categoryId: insertedCategories[4].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "3-Seater Sofas")?.id,
      imageUrl: "/images/sofa.jpg",
      inStock: true,
      stock: 7,
    },
    {
      name: "Traditional Pooja Cabinet",
      description: "Compact solid teak pooja cabinet with traditional carvings and storage",
      price: "38000",
      originalPrice: "48000",
      categoryId: insertedCategories[5].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Storage Cabinets")?.id,
      imageUrl: "/images/pooja-ghar.jpg",
      inStock: true,
      stock: 12,
    },
    {
      name: "Modern Designer Chairs",
      description: "Contemporary solid teak chairs with sleek design perfect for modern homes",
      price: "28000",
      originalPrice: "35000",
      categoryId: insertedCategories[1].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Lounge Chairs")?.id,
      imageUrl: "/images/modern-chairs.webp",
      inStock: true,
      stock: 15,
    },
    {
      name: "Garden Teak Jhula",
      description: "Beautiful handcrafted solid teak swing perfect for garden or balcony relaxation",
      price: "42000",
      originalPrice: "52000",
      categoryId: insertedCategories[4].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Recliners")?.id,
      imageUrl: "/images/jhula.jpg",
      inStock: true,
      stock: 8,
    },
    {
      name: "Sacred Temple Unit",
      description: "Elegant solid teak temple with intricate religious carvings and multiple shelves",
      price: "48000",
      originalPrice: "58000",
      categoryId: insertedCategories[5].id,
      subcategoryId: insertedSubcategories.find(sub => sub.name === "Display Units")?.id,
      imageUrl: "/images/temple-pooja.jpg",
      inStock: true,
      stock: 6,
    }
  ];

  const insertedProducts = await db.insert(products).values(productData).returning();
  console.log("Products inserted:", insertedProducts.length);

  console.log("Database seeded successfully!");
}

// Removed direct seed() call - use checkAndSeed() instead to prevent duplicates