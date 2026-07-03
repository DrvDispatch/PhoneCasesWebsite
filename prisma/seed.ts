/**
 * Idempotent database seed for the REAL GlobeCase catalog.
 *   - Bootstrap admin user (ADMIN_EMAIL / ADMIN_PASSWORD from env)
 *   - Regions + one €20 product per live country, with self-hosted images
 *   - Removes stale products whose slug is no longer in the catalog
 *
 * Run: npm run db:seed
 */
import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { REGIONS, DEFAULT_PRICE_CENTS, productImage, productDescription } from "./catalog";

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@globecase.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe!Admin123";
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "Store Owner", role: AdminRole.OWNER },
  });
  console.log(`✓ admin ready: ${email}`);
}

async function seedCatalog() {
  const currency = (process.env.STORE_CURRENCY || "eur").toLowerCase();
  const liveSlugs: string[] = [];
  let regionOrder = 0;
  let productCount = 0;

  for (const region of REGIONS) {
    const r = await prisma.region.upsert({
      where: { slug: region.slug },
      update: { name: region.name, blurb: region.blurb, image: region.image, sortOrder: regionOrder },
      create: {
        slug: region.slug,
        name: region.name,
        blurb: region.blurb,
        image: region.image,
        sortOrder: regionOrder,
      },
    });
    regionOrder += 1;

    let productOrder = 0;
    for (const country of region.countries) {
      liveSlugs.push(country.slug);
      await prisma.product.upsert({
        where: { slug: country.slug },
        update: {
          name: `${country.name} Phone Case`,
          image: productImage(country.slug),
          regionId: r.id,
          sortOrder: productOrder,
          active: true,
        },
        create: {
          slug: country.slug,
          name: `${country.name} Phone Case`,
          description: productDescription(country.name),
          priceCents: DEFAULT_PRICE_CENTS,
          currency,
          image: productImage(country.slug),
          featured: productOrder === 0,
          sortOrder: productOrder,
          regionId: r.id,
        },
      });
      productOrder += 1;
      productCount += 1;
    }
    console.log(`✓ ${region.name}: ${region.countries.length} products`);
  }

  // Remove stale placeholder products no longer in the live catalog.
  const stale = await prisma.product.deleteMany({ where: { slug: { notIn: liveSlugs } } });
  if (stale.count) console.log(`✓ removed ${stale.count} stale products`);
  console.log(`✓ ${productCount} products seeded across ${REGIONS.length} regions`);
}

// Real 5★ Google reviews from the live site (approved for display).
const REVIEWS = [
  { author: "Wiktor Białowicz", rating: 5, body: "The phone case was great, in my experience with phone cases most of them fell apart quickly but this one held up really well." },
  { author: "Timur Kaan Kubus", rating: 5, body: "The phone case is high quality and very nice." },
  { author: "Jennifer Kirvalidze", rating: 5, body: "Kwalitatief product met een heel aangename werking en zeer flexibel met design. Echt een aanrader!" },
  { author: "murad istapayev", rating: 5, body: "High quality and fast delivery!" },
];

async function seedReviews() {
  for (const r of REVIEWS) {
    const existing = await prisma.review.findFirst({ where: { author: r.author, body: r.body } });
    if (!existing) await prisma.review.create({ data: { ...r, approved: true } });
  }
  console.log(`✓ ${REVIEWS.length} reviews ready`);
}

async function main() {
  await seedAdmin();
  await seedCatalog();
  await seedReviews();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
