const mongoose = require('mongoose');
const User = require('../models/userModels');
const Item = require('../models/itemModel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected for seeding'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Sample data generators
const generateRandomPrice = () => Math.floor(Math.random() * (20000000 - 500000) + 500000);
const generateRandomDate = () => {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate unique item code
const generateItemCode = (index) => {
    // Pad the index to 4 digits
    const paddedIndex = String(index + 1).padStart(4, '0');
    // Add random 2 digits for extra uniqueness
    const randomDigits = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    // Combine with category prefix
    return `ITM${paddedIndex}${randomDigits}`;
};

const categories = ['Hardware', 'Peripheral', 'Development Tools', 'Software License', 'Lab Equipment'];
const conditions = ['Baik', 'Rusak Ringan', 'Rusak Berat'];
const locations = ['Lab 1', 'Lab 2', 'Lab 3', 'Gudang'];

const hardwareSpecs = {
    processor: ['Intel i3', 'Intel i5', 'Intel i7', 'AMD Ryzen 5', 'AMD Ryzen 7'],
    ram: ['4GB', '8GB', '16GB', '32GB'],
    storage: ['256GB SSD', '512GB SSD', '1TB HDD', '2TB HDD'],
    gpu: ['Integrated', 'NVIDIA GTX 1650', 'NVIDIA RTX 3050', 'AMD Radeon']
};

const generateSpecs = (category) => {
    switch(category) {
        case 'Hardware':
            return {
                processor: hardwareSpecs.processor[Math.floor(Math.random() * hardwareSpecs.processor.length)],
                ram: hardwareSpecs.ram[Math.floor(Math.random() * hardwareSpecs.ram.length)],
                storage: hardwareSpecs.storage[Math.floor(Math.random() * hardwareSpecs.storage.length)],
                gpu: hardwareSpecs.gpu[Math.floor(Math.random() * hardwareSpecs.gpu.length)]
            };
        case 'Peripheral':
            return {
                brand: ['Logitech', 'Dell', 'HP', 'Asus'][Math.floor(Math.random() * 4)],
                connectivity: ['Wireless', 'Wired'][Math.floor(Math.random() * 2)],
                interface: ['USB', 'Bluetooth', 'USB-C'][Math.floor(Math.random() * 3)]
            };
        default:
            return {
                brand: ['Microsoft', 'Adobe', 'JetBrains', 'VMware'][Math.floor(Math.random() * 4)],
                version: '2024',
                type: ['Perpetual', 'Subscription'][Math.floor(Math.random() * 2)]
            };
    }
};

const itemNames = {
    Hardware: ['Laptop Dell', 'PC Desktop HP', 'MacBook Pro', 'ThinkPad', 'ROG Gaming Laptop'],
    Peripheral: ['Mouse Gaming', 'Keyboard Mechanical', 'Monitor 24"', 'Printer', 'Scanner'],
    'Development Tools': ['Arduino Uno', 'Raspberry Pi', 'NodeMCU', 'Sensor Kit', 'Robot Kit'],
    'Software License': ['Visual Studio', 'Adobe Creative Suite', 'Windows 11 Pro', 'Office 365', 'AutoCAD'],
    'Lab Equipment': ['LAN Tester', 'Crimping Tool', 'Multimeter', 'Toolkit Set', 'Soldering Iron']
};

// Seed data
const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Item.deleteMany({});

        // Create admin user
        const admin = await User.create({
            name: 'Admin RPL',
            email: 'admin@rpl.com',
            phone: '+6281234567890',
            class: 'XII RPL 1',
            role: 'admin',
            password: 'admin123'
        });

        console.log('✅ Admin user created:', admin.email);

        // Create 100 items
        const items = [];
        for (let i = 0; i < 100; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const nameList = itemNames[category];
            const name = `${nameList[Math.floor(Math.random() * nameList.length)]} ${Math.floor(Math.random() * 100)}`;
            
            const purchaseDate = generateRandomDate();
            const warrantyDate = new Date(purchaseDate);
            warrantyDate.setFullYear(warrantyDate.getFullYear() + 1);

            items.push({
                code: generateItemCode(i),
                name,
                category,
                specifications: generateSpecs(category),
                condition: conditions[Math.floor(Math.random() * conditions.length)],
                status: 'Tersedia',
                location: locations[Math.floor(Math.random() * locations.length)],
                purchaseInfo: {
                    price: generateRandomPrice(),
                    date: purchaseDate,
                    warranty: warrantyDate
                },
                notes: `Sample ${category} for RPL inventory`,
                createdBy: admin._id,
                updatedBy: admin._id
            });
        }

        const createdItems = await Item.create(items);
        console.log(`✅ Created ${createdItems.length} items`);

        console.log('\n🌱 Seeding completed!');
        console.log('\nAdmin login credentials:');
        console.log('Email:', admin.email);
        console.log('Password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData(); 