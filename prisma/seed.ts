import bcrypt from "bcrypt";
import "dotenv/config";
import prisma from "./client.ts";

async function main() {
    console.log("🌱 Cleaning database...");
    await prisma.refreshToken.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.user.deleteMany();

    console.log("🌱 Creating test users...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    const ivan = await prisma.user.create({
        data: {
            username: "ivan_petrenko",
            email: "ivan@example.com",
            password: hashedPassword,
            name: "Ivan Petrenko",
        },
    });

    const olena = await prisma.user.create({
        data: {
            username: "olena_koval",
            email: "olena@example.com",
            password: hashedPassword,
            name: "Olena Koval",
        },
    });

    console.log("🌱 Creating test announcements...");
    const announcementsData = [
        {
            title: "ASUS ROG Gaming Laptop",
            description: "Excellent condition, 16GB RAM, 512GB SSD, RTX 3060",
            price: 28000,
            category: "sale",
            userId: ivan.id,
        },
        {
            title: "Trek Mountain Bike",
            description: "21-speed, aluminum frame, hydraulic disc brakes",
            price: 12500,
            category: "sale",
            userId: ivan.id,
        },
        {
            title: "Washing Machine Repair Service",
            description: "Quick on-site diagnostics and repair with warranty",
            price: 500,
            category: "service",
            userId: olena.id,
        },
        {
            title: "Online English Lessons",
            description:
                "IELTS preparation and conversational English for adults",
            price: 450,
            category: "service",
            userId: olena.id,
        },
        {
            title: "Node.js Backend Developer Position",
            description:
                "Looking for a Middle developer for fintech project, remote",
            price: 80000,
            category: "job",
            userId: ivan.id,
        },
        {
            title: "UI/UX Designer Position",
            description:
                "Design systems creation in Figma, 2+ years of experience",
            price: 65000,
            category: "job",
            userId: olena.id,
        },
        {
            title: "Dell 27 4K Monitor",
            description: "IPS panel, USB-C connectivity with 65W charging",
            price: 14000,
            category: "sale",
            userId: ivan.id,
        },
        {
            title: "Keychron K2 Mechanical Keyboard",
            description: "Gateron Brown switches, wireless Bluetooth and RGB",
            price: 3200,
            category: "sale",
            userId: olena.id,
        },
        {
            title: "German to English Translation",
            description: "Professional technical translation and proofreading",
            price: 600,
            category: "service",
            userId: ivan.id,
        },
        {
            title: "Ergonomic Office Chair",
            description:
                "Breathable mesh back, adjustable armrests and headrest",
            price: 5500,
            category: "sale",
            userId: olena.id,
        },
        {
            title: "Kitten Looking for a Loving Home",
            description: "Playful 2-month-old kitten, litter box trained",
            price: 1,
            category: "other",
            userId: ivan.id,
        },
        {
            title: "Travel Companion Wanted",
            description: "Looking for a travel buddy for weekend mountain trip",
            price: 100,
            category: "other",
            userId: olena.id,
        },
    ];

    for (const item of announcementsData) {
        await prisma.announcement.create({ data: item });
    }

    console.log(`✅ Database seeded successfully!`);
    console.log(`   Users: ivan_petrenko, olena_koval (password: password123)`);
    console.log(`   Announcements created: ${announcementsData.length}`);
}

main()
    .catch((e) => {
        console.error("❌ Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
