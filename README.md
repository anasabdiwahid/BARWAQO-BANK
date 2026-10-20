# BARWAQO BANK
## Modern Full-Stack Enterprise Bank Management System (MERN)

> **Brand Identity:** Security, Accountability, Accuracy, and Trust  
> **Brand Colors:** Bank Red (`#D71920`), Deep Black (`#111111`), White (`#FFFFFF`), Light Gray (`#F5F5F5`)  
> **Currency:** Somali Shilling (`SOS`) with Integer Minor-Unit Accounting  

---

### 1. Logo Asset Strategy
The 3 official brand assets provided have been integrated according to banking standards:
1. **Icon Logo (`/logos/logo-icon.png`)**:
   - Browser Favicon (`/favicon.png`)
   - Collapsed desktop sidebar indicator
   - Mobile app badge & security watermark
2. **Full Logo (`/logos/logo-full.jpg`)**:
   - Central Shared Login authentication banner
   - Official Transaction Advice & printable PDF receipts
   - Customer onboarding header
3. **Typography Wordmark (`/logos/logo-wordmark.png`)**:
   - Expanded desktop dashboard sidebar
   - Official Statement of Account header
   - Public navigation topbar

---

### 2. Five-Tier Role Hierarchy & Permissions

| Role | Dashboard | Permissions & Hierarchy Rules |
|:---|:---|:---|
| **SUPER ADMIN** | `/super-admin/*` | Global System Dashboard, Creates Admins, Bank Branches, Audit Logs, Reversals, Security Settings |
| **ADMIN** | `/admin/*` | Operational Dashboard, Appoints Managers, Staff Overview, Customer Monitoring, Reversals Review |
| **MANAGER** | `/manager/*` | Supervised Team Dashboard, Appoints Employees, Reversal Approvals, Applies Holds, Support Cases |
| **EMPLOYEE** | `/employee/*` | Service Desk, Registers Customers (KYC), Search Accounts, Places Holds, Requests Reversals |
| **CUSTOMER** | `/customer/*` | Customer Portal, 8-Digit P2P Transfers, Live Balance (Ledger/Available/Restricted), Receipts, Statements, Support |

---

### 3. Test Credentials

| Role | Login Identifier (Email or Account) | Password |
|:---|:---|:---|
| **Super Admin** | `superadmin@barwaqobank.so` | `Barwaqo@2026` |
| **Admin** | `admin@barwaqobank.so` | `Barwaqo@2026` |
| **Manager** | `manager@barwaqobank.so` | `Barwaqo@2026` |
| **Employee 1** | `amina.employee@barwaqobank.so` | `Barwaqo@2026` |
| **Customer 1 (Sahra)** | `10011001` or `sahra.customer@barwaqobank.so` | `Barwaqo@2026` |
| **Customer 2 (Khadar)** | `10011002` or `khadar.customer@barwaqobank.so` | `Barwaqo@2026` |
| **Customer 3 (Bilal - Hold)** | `10011003` or `bilal.customer@barwaqobank.so` | `Barwaqo@2026` |
| **Customer 4 (Hodan)** | `10011004` or `hodan.customer@barwaqobank.so` | `Barwaqo@2026` |

*Note: The login page also features one-click demo role auto-fill buttons for rapid testing.*

---

### 4. Running the Application

#### Start MongoDB
Ensure MongoDB service is running (default `mongodb://127.0.0.1:27017/barwaqo_bank`).

#### Backend Setup & Seed:
```bash
cd server
npm install
node src/seeds/seed.js   # Populates synthetic branches, staff, customers, and accounts
npm run dev              # Starts Express API on http://localhost:5000
```

#### Automated Backend Test Suite:
```bash
cd server
npm test                 # Runs Vitest unit & integration test suite
```

#### Frontend Setup & Development:
```bash
cd client
npm install
npm run dev              # Launches Vite dev server on http://localhost:5173
```

