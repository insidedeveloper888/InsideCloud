# InsideCloud Documentation

Complete documentation for the InsideCloud multi-tenant SaaS platform.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Core Documentation](#-core-documentation)
- [Products & Features](#-products--features)
- [SQL Scripts](#-sql-scripts)
- [Development Guides](#-development-guides)
- [Architecture](#-architecture)

---

## 🚀 Quick Start

- **Project Overview**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Project Structure**: [project/PROJECT_STRUCTURE.md](project/PROJECT_STRUCTURE.md)
- **Development Guide**: [CLAUDE.md](CLAUDE.md)

---

## 📚 Core Documentation

### General
- [API Development Lessons](API_DEVELOPMENT_LESSONS_LEARNED.md)
- [Auth Performance Fix](AUTH_PERFORMANCE_FIX_SUMMARY.md)
- [Testing Token Expiration](TESTING_TOKEN_EXPIRATION.md)

### Project
- [Project Structure](project/PROJECT_STRUCTURE.md) - Complete project organization
- [Project Understanding](project/project-understanding.md) - Overview and concepts

### Implementation
- [Implementation Plan](implementation/IMPLEMENTATION_PLAN.md) - Multi-tenant auth plan
- [Implementation Status](implementation/IMPLEMENTATION_STATUS.md) - Current progress

---

## 🎯 Products & Features

### Inventory Management
**Documentation:**
- [Quick Start](inventory/inventory_quick_start.md) - Get started quickly
- [Product Setup](inventory/INVENTORY_PRODUCT_SETUP.md) - Complete setup guide
- [Purchase Order Flow](inventory/PURCHASE_ORDER_STATUS_FLOW.md) - PO status workflow
- [Integration Plan](inventory/inventory_integration_plan.md) - Future integrations

**SQL Scripts:**
- [Setup Inventory](sql-scripts/inventory/setup_inventory_product.sql) - Initial setup
- [Enable for All Orgs](sql-scripts/inventory/quick_enable_inventory_for_all.sql)
- [Quick Insert Template](sql-scripts/inventory/quick_insert_template.sql)
- [Manual Insert Guide](sql-scripts/inventory/sql_manual_insert_guide.sql)
- [Clear Data](sql-scripts/inventory/clear_inventory_data.sql)
- [Delete All Data](sql-scripts/inventory/delete_all_inventory_all_tenants.sql)
- [Debug PO Received](sql-scripts/inventory/debug_po_received.sql)

### Strategic Map
- [Quick Start](strategic-map/QUICK_START.md)
- [Implementation Complete](strategic-map/IMPLEMENTATION_COMPLETE.md)
- [CRUD Guide](strategic-map/CRUD_GUIDE.md)
- [Cascade Flow](strategic-map/strategic-map-cascade-flow.md)
- [Solution Summary](strategic-map/strategic-map-solution-summary.md)
- [Restructure Proposal](strategic-map/strategic-map-restructure-proposal.md)
- [Backend Integration](strategic-map/backend-integration-plan.md)
- [Migration Instructions](strategic-map/migration-instructions.md)
- [War Map README](strategic-map/war-map-readme.md)

### Contact Management
**SQL Scripts:**
- [Complete Schema](sql-scripts/contact-management/contact-management-complete-schema.sql)

### Document Parser
- [Setup Guide](document-parser/DOCUMENT_PARSER_SETUP.md)

### Product System
**Documentation:**
- [Products API Fix](products/PRODUCTS_API_FIX_SUMMARY.md)
- [Access Control Implementation](products/PRODUCT_ACCESS_CONTROL_IMPLEMENTATION_SUMMARY.md)
- [Access Control Usage](products/PRODUCT_ACCESS_CONTROL_USAGE.md)
- [Icon Mapping Design](products/PRODUCT_ICON_MAPPING_DESIGN.md)
- [Status Guide](products/PRODUCT_STATUS_GUIDE.md)
- [Status Implementation](products/PRODUCT_STATUS_IMPLEMENTATION_SUMMARY.md)

**SQL Scripts:**
- [Access Control Schema](sql-scripts/products/product-access-control-schema.sql)
- [Access Control Migration](sql-scripts/products/product-access-control-migration.sql)
- [Status Enhancement](sql-scripts/products/product-status-enhancement.sql)

---

## 🗄️ SQL Scripts

All SQL scripts are organized by feature in `sql-scripts/`:

### By Category
- **Inventory**: `sql-scripts/inventory/` - 7 scripts for inventory management
- **Products**: `sql-scripts/products/` - 3 scripts for product system
- **Contact Management**: `sql-scripts/contact-management/` - Schema scripts
- **Migrations**: `migrations/` - Database migration scripts

### Database Migrations
- [Inventory Schema](migrations/inventory_schema.sql)
- [Fix Inventory Constraints](migrations/fix_inventory_constraints.sql)
- [Add Location to PO](migrations/add_location_to_po.sql)

---

## 📖 Development Guides

### Lark (飞书) Integration
Complete API documentation:
- [API Overview](lark/lark-api-overview.md)
- [Authentication APIs](lark/lark-authentication-apis.md)
- [Bitable APIs](lark/lark-bitable-apis.md)
- [Calendar APIs](lark/lark-calendar-apis.md)
- [Contact APIs](lark/lark-contact-apis.md)
- [CoreHR APIs](lark/lark-corehr-apis.md)
- [Implementation Guide](lark/lark-implementation-guide.md)
- [Messaging APIs](lark/lark-messaging-apis.md)
- [Sheets APIs](lark/lark-sheets-apis.md)
- [Task APIs](lark/lark-task-apis.md)

### General Guides
- [Noncestr Explanation](guides/NONCESTR_EXPLANATION.md) - JSAPI auth concept
- [OAuth Local Development](guides/oauth-local-development.md) - Local OAuth setup

### Integration
- [InsideCloud-BOMS Integration](integration/insidecloud-boms-integration-plan.md)

---

## 🏗️ Architecture

### Design
- [Design System](architecture/design-system.md) - UI/UX design guidelines

### Key Concepts
1. **Multi-tenancy**: Organization-based data isolation
2. **Product Access Control**: Feature-level permissions per organization
3. **Product Status**: Beta, Active, Coming Soon states
4. **Icon Mapping**: Database-driven icon component resolution

---

## 🔍 Finding What You Need

| I want to...                          | Go to...                                      |
|---------------------------------------|-----------------------------------------------|
| Set up inventory management           | `inventory/inventory_quick_start.md`          |
| Understand product access control     | `products/PRODUCT_ACCESS_CONTROL_USAGE.md`    |
| Run SQL migrations                    | `migrations/` or `sql-scripts/`               |
| Integrate with Lark                   | `lark/lark-implementation-guide.md`           |
| Work on strategic map                 | `strategic-map/QUICK_START.md`                |
| Understand project structure          | `project/PROJECT_STRUCTURE.md`                |
| Set up document parser                | `document-parser/DOCUMENT_PARSER_SETUP.md`    |
| Debug inventory issues                | `sql-scripts/inventory/debug_po_received.sql` |

---

## 📝 Contributing to Documentation

When adding new documentation:
1. Place it in the appropriate subdirectory
2. Update this README if adding a new category
3. Use clear, descriptive filenames
4. Include code examples where applicable
5. Link related documents together

---

**Last Updated**: 2025-11-20
