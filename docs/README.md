# InsideCloud Documentation

Complete documentation for the InsideCloud multi-tenant SaaS platform.

**Version**: 2.0.0
**Last Updated**: 2025-11-25
**Maintained By**: Documentation Architect + Development Team

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Getting Started](#-getting-started)
- [Architecture & Design](#-architecture--design)
- [Development](#-development)
- [Testing & Quality](#-testing--quality)
- [Features & Tools](#-features--tools)
- [API Documentation](#-api-documentation)
- [Integration](#-integration)
- [Database & Scripts](#-database--scripts)
- [Project Information](#-project-information)
- [Finding What You Need](#-finding-what-you-need)

---

## 🚀 Quick Start

**Essential Documents:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - Master architecture document with ADRs
- [CLAUDE.md](CLAUDE.md) - AI agent instructions and operational commands
- [Quick Reference: Development & Testing](getting-started/QUICK_REFERENCE_DEVELOPMENT.md) - Essential commands and workflows

**New to the Project?**
1. Read [Project Understanding](project/project-understanding.md)
2. Review [Project Structure](project/PROJECT_STRUCTURE.md)
3. Follow [Development Server Practices](development/DEVELOPMENT_SERVER_PRACTICES.md)
4. Check [OAuth Local Development](getting-started/oauth-local-development.md) for setup

---

## 🎯 Getting Started

Quick start guides and onboarding documentation.

- [Quick Reference: Development & Testing](getting-started/QUICK_REFERENCE_DEVELOPMENT.md) - Essential commands, agent workflows, checklists
- [OAuth Local Development](getting-started/oauth-local-development.md) - Local OAuth setup for external browser testing

---

## 🏗️ Architecture & Design

System architecture, design decisions, and design standards.

### Core Architecture
- [ARCHITECTURE.md](ARCHITECTURE.md) - Master architecture document
  - Architecture Decision Records (ADR-001 through ADR-013)
  - Component standards and naming conventions
  - UI/UX guidelines and design system
  - Multi-tenant implementation patterns
  - Lark integration architecture
  - Development workflow and best practices
  - Complete change log with version history

### Design System
- [Design System](architecture/design-system.md) - UI/UX design guidelines, color palette, component library

### Key Architectural Concepts
1. **Multi-Tenancy**: Organization-based data isolation with org-specific Lark credentials
2. **Hybrid Deployment**: Koa dev server + Vercel serverless production
3. **Dual Authentication**: JSAPI (production) + OAuth (development)
4. **Product Access Control**: Feature-level permissions per organization
5. **Tool-Based Structure**: Self-contained tools in `/src/tools/` directory

---

## 💻 Development

Development practices, lessons learned, and operational guides.

### Essential Practices
- [Development Server Practices](development/DEVELOPMENT_SERVER_PRACTICES.md) - **CRITICAL**: Server start procedures, port management, testing workflows
- [API Development Lessons Learned](development/API_DEVELOPMENT_LESSONS_LEARNED.md) - Common patterns, pitfalls, and solutions
- [Noncestr Explanation](development/NONCESTR_EXPLANATION.md) - JSAPI authentication concept

### Key Development Patterns
- **Standard Server Start**: `pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start`
- **Dual Implementation Required**: All API endpoints must exist in BOTH Koa (`server/server.js`) and Vercel (`api/[...path].js`)
- **CORS Preflight**: Every API route needs OPTIONS handler for browser CORS
- **Product Navigation**: New products require routes in BOTH `App.js` and `Home` access control

---

## 🧪 Testing & Quality

Testing workflows, agent coordination, and quality assurance.

### Testing Documentation
- [Testing Workflow Guide](testing/TESTING_WORKFLOW_GUIDE.md) - Agent coordination protocol for TDD with Playwright MCP
- [Sales Management Test Plan](testing/sales-management-test-plan.md) - Comprehensive test scenarios for sales management module

### Testing Architecture
- **Two-Agent System**: `test-driven-developer` (implementation) + `playwright-testing-agent` (execution)
- **Browser-Based Testing**: Playwright MCP tools for automated UI testing
- **Test Scenario Format**: Structured format with prerequisites, steps, expected results, validation
- **Evidence-Based Reports**: Screenshots, console logs, network traces, root cause analysis

---

## 🎯 Features & Tools

Production-ready tools and feature documentation.

### Contact Management (名单管理) ✅ Production Ready
**Status**: v1.0.0 (2025-11-19)

Full CRM system for managing customers, suppliers, COI, and internal contacts.

**Key Features:**
- Full CRUD with multi-field forms
- Configurable customer rating system (3-10 star scale)
- Advanced filtering by type, stage, traffic source, tags, ratings
- Custom pipeline stages with color-coding
- Tag system for flexible categorization
- Sales and customer service assignment
- Malaysian address validation
- Search functionality across all fields

**SQL Scripts:**
- [Complete Schema](sql-scripts/contact-management/contact-management-complete-schema.sql)

---

### Document Parser ✅ Production Ready
**Status**: v1.0.0 (2025-11-18)

Pure frontend tool for parsing and reformatting accounting software exports.

**Key Features:**
- Zero backend dependencies (no database, no API)
- Excel (.xlsx, .xls) and CSV file format support
- Multi-software support (SQL Accounting, Autocount ready)
- Custom parsers per document type with invoice+item combination
- Live preview table with metadata
- CSV export with timestamped filenames

**Documentation:**
- [Setup Guide](features/document-parser/DOCUMENT_PARSER_SETUP.md)

---

### Inventory Management (库存管理) ✅ Production Ready
**Status**: v1.0.0 (2025-11-22)

Comprehensive inventory management system with multi-location stock tracking.

**Key Features:**
- Product catalog with SKU, categories, units
- Multi-location tracking (warehouses, sites, vehicles)
- Stock movements (IN/OUT) with batch recording
- Purchase order management with supplier integration
- Low stock alerts and inventory thresholds
- Mobile-responsive card views

**Documentation:**
- [Quick Start](features/inventory/inventory_quick_start.md)
- [Product Setup](features/inventory/INVENTORY_PRODUCT_SETUP.md)
- [Purchase Order Flow](features/inventory/PURCHASE_ORDER_STATUS_FLOW.md)
- [Stock In Button Implementation](features/inventory/STOCK_IN_BUTTON_IMPLEMENTATION.md)
- [Stock In/Out User Tracking](features/inventory/STOCK_IN_OUT_USER_TRACKING.md)
- [Integration Plan](features/inventory/inventory_integration_plan.md)
- [Stock In/Out Flow Diagram](features/inventory/stock-in-out-flow-diagram.md)

**SQL Scripts:**
- [Setup Inventory](sql-scripts/inventory/setup_inventory_product.sql)
- [Enable for All Orgs](sql-scripts/inventory/quick_enable_inventory_for_all.sql)
- [Quick Insert Template](sql-scripts/inventory/quick_insert_template.sql)
- [Manual Insert Guide](sql-scripts/inventory/sql_manual_insert_guide.sql)
- [Clear Data](sql-scripts/inventory/clear_inventory_data.sql)
- [Delete All Data](sql-scripts/inventory/delete_all_inventory_all_tenants.sql)
- [Debug PO Received](sql-scripts/inventory/debug_po_received.sql)

---

### Product System
**Status**: Core system (multi-product platform)

Platform-wide product access control and status management.

**Documentation:**
- [Products API Fix](features/products/PRODUCTS_API_FIX_SUMMARY.md)
- [Access Control Implementation](features/products/PRODUCT_ACCESS_CONTROL_IMPLEMENTATION_SUMMARY.md)
- [Access Control Usage](features/products/PRODUCT_ACCESS_CONTROL_USAGE.md)
- [Icon Mapping Design](features/products/PRODUCT_ICON_MAPPING_DESIGN.md)
- [Status Guide](features/products/PRODUCT_STATUS_GUIDE.md)
- [Status Implementation](features/products/PRODUCT_STATUS_IMPLEMENTATION_SUMMARY.md)

**SQL Scripts:**
- [Access Control Schema](sql-scripts/products/product-access-control-schema.sql)
- [Access Control Migration](sql-scripts/products/product-access-control-migration.sql)
- [Status Enhancement](sql-scripts/products/product-status-enhancement.sql)

---

### Sales Management (销售管理) ✅ Production Ready
**Status**: v1.0.0 (2025-11-25)

Complete sales document workflow from quotation to invoice with visual PDF template builder.

**Key Features:**
- 4 Document Types: Quotations, Sales Orders, Delivery Orders, Invoices
- Document conversion workflow with one-click auto-fill
- Visual PDF template builder with 10 component types
- PDF generation engine with data mapping, QR codes, dynamic tables
- Configurable status workflows per document type
- Payment tracking with multiple methods and automatic status calculation
- Auto-generated document codes with custom formats
- Team-based access control (organization-wide, assigned-only, team-based)
- 7 reusable select components for consistent UI/UX
- Inline validation system

**Documentation:**
- [Sales Management README](features/sales-management/SALES_MANAGEMENT_README.md)

**SQL Scripts:**
- [Complete Schema](sql-scripts/sales-management/sales-management-complete-schema.sql)

---

### Strategic Map (战略地图) ✅ Production Ready
**Status**: v2.2.0 (2025-11-17)

Fully database-driven, real-time collaborative goal planning tool with automatic cascading.

**Key Features:**
- Full CRUD operations with database persistence
- PostgreSQL triggers for automatic cascade creation and updates
- Supabase Realtime for multi-user collaboration
- Smart deduplication to prevent duplicate items
- Optimistic updates with automatic rollback on errors
- Advanced year management (auto-discovery, hide/show, default 5-year view)
- Clickable hyperlinks in goal text
- ISO 8601 compliant weekly view
- Timezone-aware date formatting

**Documentation:**
- [Quick Start](features/strategic-map/QUICK_START.md)
- [Implementation Complete](features/strategic-map/IMPLEMENTATION_COMPLETE.md)
- [CRUD Guide](features/strategic-map/strategic-map-crud-guide.md)
- [Cascade Flow](features/strategic-map/strategic-map-cascade-flow.md)
- [Solution Summary](features/strategic-map/strategic-map-solution-summary.md)
- [Restructure Proposal](features/strategic-map/strategic-map-restructure-proposal.md)
- [Backend Integration](features/strategic-map/backend-integration-plan.md)
- [Migration Instructions](features/strategic-map/migration-instructions.md)
- [War Map README](features/strategic-map/war-map-readme.md)

---

### WhatsApp Integration
**Status**: Planning/Design

WhatsApp Business API integration documentation.

**Documentation:**
- [WhatsApp Integration Plan](features/whatsapp-integration/whatsapp-integration.md)

---

## 📡 API Documentation

API references and integration guides.

### Lark (飞书) Integration
Complete Lark Open Platform API documentation:

- [API Overview](api/lark/lark-api-overview.md) - Overview of all Lark APIs
- [Authentication APIs](api/lark/lark-authentication-apis.md) - JSAPI and OAuth flows
- [Bitable APIs](api/lark/lark-bitable-apis.md) - Spreadsheet-like database APIs
- [Calendar APIs](api/lark/lark-calendar-apis.md) - Calendar event management
- [Contact APIs](api/lark/lark-contact-apis.md) - User and department management
- [CoreHR APIs](api/lark/lark-corehr-apis.md) - HR information system APIs
- [Implementation Guide](api/lark/lark-implementation-guide.md) - Practical implementation patterns
- [Messaging APIs](api/lark/lark-messaging-apis.md) - Send messages and notifications
- [Sheets APIs](api/lark/lark-sheets-apis.md) - Spreadsheet manipulation
- [Task APIs](api/lark/lark-task-apis.md) - Task management APIs

### Performance & Optimization
- [Auth Performance Fix Summary](api/AUTH_PERFORMANCE_FIX_SUMMARY.md) - Auth optimization techniques

---

## 🔗 Integration

Third-party integration plans and documentation.

- [InsideCloud-BOMS Integration Plan](integration/insidecloud-boms-integration-plan.md) - Bill of Materials System integration

---

## 🗄️ Database & Scripts

Database schemas, migrations, and SQL scripts.

### SQL Scripts by Category

All SQL scripts are organized by feature in `sql-scripts/`:

- **Contact Management**: `sql-scripts/contact-management/` - CRM schema and data scripts
- **Inventory**: `sql-scripts/inventory/` - 7 scripts for inventory management
- **Products**: `sql-scripts/products/` - 3 scripts for product system
- **Sales Management**: `sql-scripts/sales-management/` - Sales document schemas and migrations

### Database Migrations

Migration scripts in `migrations/`:
- [Inventory Schema](migrations/inventory_schema.sql)
- [Fix Inventory Constraints](migrations/fix_inventory_constraints.sql)
- [Add Location to PO](migrations/add_location_to_po.sql)

---

## 📁 Project Information

Project structure and implementation status.

### Project Structure
- [Project Structure](project/PROJECT_STRUCTURE.md) - Complete project organization
- [Project Understanding](project/project-understanding.md) - Overview and concepts

### Implementation Status
- [Implementation Plan](implementation/IMPLEMENTATION_PLAN.md) - Multi-tenant auth plan
- [Implementation Status](implementation/IMPLEMENTATION_STATUS.md) - Current progress

---

## 🔍 Finding What You Need

### By Task

| I want to...                          | Go to...                                                          |
|---------------------------------------|-------------------------------------------------------------------|
| **Get started quickly**               | [Quick Reference](getting-started/QUICK_REFERENCE_DEVELOPMENT.md) |
| **Start development servers**         | [Development Server Practices](development/DEVELOPMENT_SERVER_PRACTICES.md) |
| **Add a new API endpoint**            | [CLAUDE.md - Hybrid Deployment](CLAUDE.md#hybrid-deployment-architecture) |
| **Add a new product/tool**            | [Quick Reference - New Product Checklist](getting-started/QUICK_REFERENCE_DEVELOPMENT.md#new-producttool-checklist) |
| **Run browser-based tests**           | [Testing Workflow Guide](testing/TESTING_WORKFLOW_GUIDE.md) |
| **Understand architecture decisions** | [ARCHITECTURE.md - ADRs](ARCHITECTURE.md#2-architecture-decisions) |
| **Set up inventory management**       | [Inventory Quick Start](features/inventory/inventory_quick_start.md) |
| **Set up contact management**         | [Contact Management Schema](sql-scripts/contact-management/contact-management-complete-schema.sql) |
| **Set up sales management**           | [Sales Management README](features/sales-management/SALES_MANAGEMENT_README.md) |
| **Work on strategic map**             | [Strategic Map Quick Start](features/strategic-map/QUICK_START.md) |
| **Parse accounting exports**          | [Document Parser Setup](features/document-parser/DOCUMENT_PARSER_SETUP.md) |
| **Integrate with Lark**               | [Lark Implementation Guide](api/lark/lark-implementation-guide.md) |
| **Set up local OAuth**                | [OAuth Local Development](getting-started/oauth-local-development.md) |
| **Understand product access control** | [Product Access Control Usage](features/products/PRODUCT_ACCESS_CONTROL_USAGE.md) |
| **Run SQL migrations**                | `migrations/` or `sql-scripts/` directories |
| **Debug inventory issues**            | [Debug PO Received](sql-scripts/inventory/debug_po_received.sql) |

### By Role

**New Developer:**
1. [Project Understanding](project/project-understanding.md)
2. [Quick Reference](getting-started/QUICK_REFERENCE_DEVELOPMENT.md)
3. [Development Server Practices](development/DEVELOPMENT_SERVER_PRACTICES.md)
4. [ARCHITECTURE.md](ARCHITECTURE.md)

**Frontend Developer:**
1. [Design System](architecture/design-system.md)
2. [Component Standards](ARCHITECTURE.md#3-component-standards)
3. [UI/UX Guidelines](ARCHITECTURE.md#4-uiux-guidelines)
4. Tool-specific docs in `features/` directory

**Backend Developer:**
1. [API Development Lessons](development/API_DEVELOPMENT_LESSONS_LEARNED.md)
2. [Hybrid Deployment Architecture](CLAUDE.md#hybrid-deployment-architecture)
3. [Multi-Tenant Implementation](ARCHITECTURE.md#5-multi-tenant-implementation)
4. SQL scripts in `sql-scripts/` directory

**QA/Testing:**
1. [Testing Workflow Guide](testing/TESTING_WORKFLOW_GUIDE.md)
2. [Development Server Practices](development/DEVELOPMENT_SERVER_PRACTICES.md)
3. [Quick Reference - Testing](getting-started/QUICK_REFERENCE_DEVELOPMENT.md#testing--quality)
4. Feature-specific test plans in `testing/` directory

**Technical Writer:**
1. This README.md structure
2. [ARCHITECTURE.md - Change Log](ARCHITECTURE.md#8-change-log)
3. [Contributing to Documentation](#-contributing-to-documentation)
4. Feature docs in `features/` directory

---

## 📝 Contributing to Documentation

### Documentation Standards

When adding or updating documentation:

1. **Location**: Place it in the appropriate subdirectory based on content type:
   - `getting-started/` - Onboarding and quick start guides
   - `architecture/` - Architecture and design documentation
   - `development/` - Development practices and lessons learned
   - `testing/` - Testing guides and test plans
   - `features/` - Tool/product-specific documentation (create subdirectory per tool)
   - `api/` - API references and integration guides
   - `integration/` - Third-party integration plans
   - `project/` - Project structure and status
   - `implementation/` - Implementation plans and status

2. **Naming Conventions**:
   - Use descriptive, kebab-case filenames: `oauth-local-development.md`
   - Use UPPER_SNAKE_CASE for important root-level docs: `ARCHITECTURE.md`, `CLAUDE.md`
   - Prefix with tool name for feature docs: `INVENTORY_PRODUCT_SETUP.md`

3. **Content Structure**:
   - Include version and last updated date at the top
   - Use clear headings and table of contents for long documents
   - Include code examples where applicable
   - Add cross-references to related documents
   - Use consistent terminology from ARCHITECTURE.md

4. **Metadata**:
   - Add version number (e.g., v1.0.0, v2.1.0)
   - Include last updated date
   - Specify maintainer/author

5. **Cross-References**:
   - Link to related documents using relative paths
   - Update this README when adding new categories
   - Maintain bidirectional links between related docs

6. **Quality Checklist**:
   - [ ] Clear, descriptive title
   - [ ] Version and last updated date included
   - [ ] Table of contents for documents >100 lines
   - [ ] Code examples are tested and accurate
   - [ ] Links to related documents included
   - [ ] Consistent with ARCHITECTURE.md terminology
   - [ ] Added to README.md index
   - [ ] Grammar and spelling checked

---

## 📊 Documentation Structure Overview

```
docs/
├── README.md                          # This file - main documentation index
├── ARCHITECTURE.md                    # Master architecture document with ADRs
├── CLAUDE.md                          # AI agent instructions
│
├── getting-started/                   # Quick start and onboarding
│   ├── QUICK_REFERENCE_DEVELOPMENT.md # Essential commands and workflows
│   └── oauth-local-development.md     # Local OAuth setup
│
├── architecture/                      # Architecture and design
│   └── design-system.md               # UI/UX design guidelines
│
├── development/                       # Development practices
│   ├── DEVELOPMENT_SERVER_PRACTICES.md # Server management guide
│   ├── API_DEVELOPMENT_LESSONS_LEARNED.md # API patterns and lessons
│   └── NONCESTR_EXPLANATION.md        # JSAPI auth concept
│
├── testing/                           # Testing and QA
│   ├── TESTING_WORKFLOW_GUIDE.md      # Agent coordination protocol
│   └── sales-management-test-plan.md  # Sales management tests
│
├── features/                          # Tool/product documentation
│   ├── contact-management/
│   ├── document-parser/
│   ├── inventory/
│   ├── products/
│   ├── sales-management/
│   ├── strategic-map/
│   └── whatsapp-integration/
│
├── api/                               # API documentation
│   ├── lark/                          # Lark API references
│   └── AUTH_PERFORMANCE_FIX_SUMMARY.md
│
├── integration/                       # Third-party integrations
│   └── insidecloud-boms-integration-plan.md
│
├── database/                          # Database documentation
├── migrations/                        # Database migration scripts
├── sql-scripts/                       # SQL scripts by feature
│   ├── contact-management/
│   ├── inventory/
│   ├── products/
│   └── sales-management/
│
├── project/                           # Project information
│   ├── PROJECT_STRUCTURE.md
│   └── project-understanding.md
│
├── implementation/                    # Implementation plans
│   ├── IMPLEMENTATION_PLAN.md
│   └── IMPLEMENTATION_STATUS.md
│
└── sample-csv/                        # Sample data files
```

---

## 🎯 Key Features Status

| Feature                | Status      | Version | Last Updated | Documentation                                          |
|------------------------|-------------|---------|--------------|--------------------------------------------------------|
| Strategic Map          | ✅ Production | v2.2.0  | 2025-11-17   | [Quick Start](features/strategic-map/QUICK_START.md) |
| Contact Management     | ✅ Production | v1.0.0  | 2025-11-19   | [Schema](sql-scripts/contact-management/)             |
| Sales Management       | ✅ Production | v1.0.0  | 2025-11-25   | [README](features/sales-management/SALES_MANAGEMENT_README.md) |
| Inventory Management   | ✅ Production | v1.0.0  | 2025-11-22   | [Quick Start](features/inventory/inventory_quick_start.md) |
| Document Parser        | ✅ Production | v1.0.0  | 2025-11-18   | [Setup](features/document-parser/DOCUMENT_PARSER_SETUP.md) |
| WhatsApp Integration   | 📋 Planning  | -       | -            | [Plan](features/whatsapp-integration/whatsapp-integration.md) |

---

## 📞 Support & Maintenance

**Documentation Maintained By**: Documentation Architect Agent + Development Team

**Review Frequency**: Monthly or after major feature releases

**Next Review**: 2025-12-25

**For Issues or Suggestions**:
- Create issues for documentation improvements
- Follow the [Contributing to Documentation](#-contributing-to-documentation) guidelines
- Consult ARCHITECTURE.md for architectural decisions

---

**Documentation Version**: 2.0.0
**Last Updated**: 2025-11-25
**Documentation Reorganization**: Complete restructure for improved discoverability and maintainability
