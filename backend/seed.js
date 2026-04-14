import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from './models/user.model.js';
import Asset from './models/asset.model.js';
import Ticket from './models/ticket.model.js';
import License from './models/license.model.js';
import AuditLog from './models/auditLog.model.js';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// ── Test Users ──────────────────────────────────
const users = [
    {
        name: 'System Admin',
        email: 'admin@vsitcompany.com',
        password: 'Admin@123',
        role: 'admin',
        department: 'IT',
    },
    {
        name: 'Operations Manager',
        email: 'manager@vsitcompany.com',
        password: 'Manager@123',
        role: 'manager',
        department: 'Operations',
    },
    {
        name: 'Compliance Officer',
        email: 'auditor@vsitcompany.com',
        password: 'Auditor@123',
        role: 'auditor',
        department: 'Legal',
    },
    {
        name: 'Jane Doe',
        email: 'employee@vsitcompany.com',
        password: 'User@123',
        role: 'employee',
        department: 'Engineering',
    },
    {
        name: 'Mike Chen',
        email: 'mike.chen@vsitcompany.com',
        password: 'User@123',
        role: 'employee',
        department: 'Marketing',
    },
];

// ── Sample Assets ───────────────────────────────
const assets = [
    {
        name: 'MacBook Pro 14"',
        description: 'M3 Pro, 18GB RAM, 512GB SSD',
        purchasePrice: 1999,
        category: 'Laptops',
        serialNumber: 'MBP-2024-001',
        status: 'available',
        condition: 'New',
        location: 'IT Storage Room 101',
        purchaseDate: new Date('2024-06-15'),
    },
    {
        name: 'MacBook Pro 16"',
        description: 'M3 Max, 36GB RAM, 1TB SSD',
        purchasePrice: 3499,
        category: 'Laptops',
        serialNumber: 'MBP-2024-002',
        status: 'assigned',
        condition: 'Excellent',
        location: 'Building A - Floor 3',
        purchaseDate: new Date('2024-03-10'),
    },
    {
        name: 'ThinkPad X1 Carbon Gen 11',
        description: 'i7-1365U, 32GB, 1TB, 14" 2.8K OLED',
        purchasePrice: 1849,
        category: 'Laptops',
        serialNumber: 'LNV-X1C-0047',
        status: 'maintenance',
        condition: 'Fair',
        location: 'IT Repair Bench',
        purchaseDate: new Date('2023-11-20'),
    },
    {
        name: 'Dell U2723QE',
        description: '27" 4K USB-C monitor, IPS Black',
        purchasePrice: 620,
        category: 'Monitors',
        serialNumber: 'DLL-MON-0042',
        status: 'available',
        condition: 'New',
        location: 'IT Storage Room 101',
        purchaseDate: new Date('2024-01-10'),
    },
    {
        name: 'Dell PowerEdge R750',
        description: 'Dual Xeon Gold 5418Y, 256GB DDR5, 4x 1.92TB NVMe',
        purchasePrice: 12999,
        category: 'Servers',
        serialNumber: 'DLL-SVR-R750-01',
        status: 'assigned',
        condition: 'New',
        location: 'Data Center - Rack A1',
        purchaseDate: new Date('2024-01-05'),
        isFeatured: true,
    },
    {
        name: 'Cisco Catalyst 9300-48P',
        description: '48-port PoE+ managed switch',
        purchasePrice: 8500,
        category: 'Networking',
        serialNumber: 'CSC-9300-0012',
        status: 'assigned',
        condition: 'Good',
        location: 'Data Center - Rack B2',
        purchaseDate: new Date('2023-09-15'),
    },
    {
        name: 'Logitech MX Master 3S',
        description: 'Wireless mouse, 8K DPI, USB-C',
        purchasePrice: 99,
        category: 'Peripherals',
        serialNumber: 'LOG-MX3S-0088',
        status: 'available',
        condition: 'New',
        location: 'IT Storage Room 101',
        purchaseDate: new Date('2024-07-01'),
    },
    {
        name: 'iPhone 15 Pro',
        description: '256GB, company-issued mobile device',
        purchasePrice: 999,
        category: 'Mobile',
        serialNumber: 'APL-IPH15P-0031',
        status: 'assigned',
        condition: 'Excellent',
        location: 'Building A - Floor 2',
        purchaseDate: new Date('2024-04-20'),
    },
    {
        name: 'Dell Latitude 5540',
        description: 'i5-1345U, 16GB, 256GB, 15.6" FHD',
        purchasePrice: 1100,
        category: 'Laptops',
        serialNumber: 'DLL-LAT-5540-009',
        status: 'retired',
        condition: 'Fair',
        location: 'Warehouse - Decommissioned',
        purchaseDate: new Date('2021-02-10'),
    },
];

// ── Sample Licenses ─────────────────────────────
const licenses = [
    {
        softwareName: 'Microsoft 365 Business',
        provider: 'Microsoft',
        licenseKey: 'M365-XXXX-XXXX-XXXX-0001',
        type: 'Subscription',
        seatsTotal: 50,
        seatsUsed: 32,
        costPerSeat: 22,
        purchaseDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
        assignedToDept: 'General',
    },
    {
        softwareName: 'Adobe Creative Cloud',
        provider: 'Adobe',
        licenseKey: 'ACC-XXXX-XXXX-XXXX-0001',
        type: 'Subscription',
        seatsTotal: 10,
        seatsUsed: 7,
        costPerSeat: 55,
        purchaseDate: new Date('2024-03-01'),
        expiryDate: new Date('2025-03-01'),
        assignedToDept: 'Marketing',
    },
    {
        softwareName: 'JetBrains IntelliJ IDEA',
        provider: 'JetBrains',
        licenseKey: 'JB-IDEA-XXXX-XXXX-0001',
        type: 'Subscription',
        seatsTotal: 15,
        seatsUsed: 12,
        costPerSeat: 149,
        purchaseDate: new Date('2024-06-01'),
        expiryDate: new Date('2025-06-01'),
        assignedToDept: 'Engineering',
    },
];

// ── Seed Logic ──────────────────────────────────
const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('Cleaning database...');
        await User.deleteMany({});
        await Asset.deleteMany({});
        await Ticket.deleteMany({});
        await License.deleteMany({});
        await AuditLog.deleteMany({});

        // Users
        console.log('Creating users...');
        const createdUsers = [];
        for (const userData of users) {
            const user = await User.create(userData);
            createdUsers.push(user);
        }
        console.log(`  -> ${createdUsers.length} users`);

        const admin = createdUsers.find(u => u.role === 'admin');
        const employees = createdUsers.filter(u => u.role === 'employee');

        // Assets
        console.log('Creating assets...');
        const createdAssets = [];
        let tagCounter = 1;

        for (const assetData of assets) {
            const tag = `AST-${String(tagCounter++).padStart(4, '0')}`;

            let assignedTo = null;
            if (assetData.status === 'assigned' && employees.length > 0) {
                assignedTo = employees[createdAssets.length % employees.length]._id;
            }

            const asset = await Asset.create({
                ...assetData,
                assetTag: tag,
                assignedTo,
                history: [{
                    action: 'Created',
                    date: assetData.purchaseDate,
                    user: 'System',
                    details: `Asset ${tag} added to inventory`,
                }],
            });
            createdAssets.push(asset);
        }
        console.log(`  -> ${createdAssets.length} assets`);

        // Licenses
        console.log('Creating licenses...');
        for (const lic of licenses) {
            await License.create(lic);
        }
        console.log(`  -> ${licenses.length} licenses`);

        // Tickets
        console.log('Creating tickets...');
        const ticketData = [
            {
                ticketNumber: 'TKT-0001',
                user: employees[0]._id,
                asset: createdAssets[2]._id,
                title: 'Laptop battery draining fast',
                description: 'ThinkPad X1 battery lasts about 2 hours. Was getting 8+ when new.',
                category: 'Hardware Issue',
                priority: 'High',
                status: 'In Progress',
            },
            {
                ticketNumber: 'TKT-0002',
                user: employees[1] ? employees[1]._id : employees[0]._id,
                title: 'Need VPN access for remote work',
                description: 'Starting remote next week, need VPN client and credentials.',
                category: 'General Inquiry',
                priority: 'Medium',
                status: 'Open',
            },
        ];

        for (const t of ticketData) {
            await Ticket.create(t);
        }
        console.log(`  -> ${ticketData.length} tickets`);

        // Audit logs
        console.log('Creating audit logs...');
        const auditData = [
            { userId: admin._id, action: 'LOGIN_SUCCESS', resource: 'Auth', ipAddress: '192.168.1.100', status: 'SUCCESS' },
            { userId: admin._id, action: 'CREATE', resource: 'Asset', ipAddress: '192.168.1.100', status: 'SUCCESS' },
            { userId: employees[0]._id, action: 'LOGIN_SUCCESS', resource: 'Auth', ipAddress: '192.168.1.105', status: 'SUCCESS' },
        ];

        for (const log of auditData) {
            await AuditLog.create(log);
        }
        console.log(`  -> ${auditData.length} audit logs`);

        console.log('\nSeed complete.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();