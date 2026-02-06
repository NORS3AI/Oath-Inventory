# Oath Research - Peptide Inventory Management System

A comprehensive inventory management solution designed specifically for Oath Research, a peptide manufacturing and distribution company. This system streamlines the entire peptide lifecycle from ordering through testing to labeling and sales readiness.

## Overview

The Oath Inventory System manages three critical aspects of peptide operations:

1. **Inventory Tracking** - Real-time stock levels with color-coded visual indicators
2. **Lifecycle Management** - Complete tracking from order placement through testing and labeling
3. **Sales Readiness** - Automated validation ensuring only compliant products are marked for sale

## Key Features

### 📊 Inventory Management
- Import inventory data from standardized CSV files
- Color-coded stock status for instant visibility:
  - 🔴 **RED**: Out of stock (immediate action)
  - 🟠 **ORANGE**: Nearly out of stock (urgent)
  - 🟡 **YELLOW**: Low stock (order soon)
  - 🟢 **GREEN**: Good stock (no action needed)
  - 🔵 **TEAL**: On order (in transit)

### 🧪 Peptide Lifecycle Tracking
Track every stage of your peptide journey:
- Order placement date
- Arrival from lab
- Testing submission date
- Results received date
- Purity percentage
- Net weight verification
- Batch number assignment
- MG quantity tracking

### 🏷️ Smart Label Management
- Track available label inventory
- Prioritized labeling queue (most urgent first)
- Visual indicators for labeling needs
- Only show peptides with actual inventory
- Track labeling completion status

### ✅ Sales Readiness Validation
Automated three-point check system ensures peptides can only be sold when they have:
1. Purity test results
2. Net weight confirmation
3. Applied label

## Technology Stack

*To be determined based on implementation phase*

Considerations:
- **Frontend**: React, Vue, or Svelte for modern, responsive UI
- **Backend**: Node.js/Express, Python/Flask, or similar
- **Database**: PostgreSQL, SQLite, or MongoDB
- **File Processing**: CSV parsing libraries
- **UI Framework**: Tailwind CSS, Material-UI, or Bootstrap

## Project Structure

```
oath-inventory/
├── docs/               # Documentation
│   └── features.md     # Detailed feature specifications
├── src/                # Source code (to be created)
│   ├── frontend/       # UI components
│   ├── backend/        # API and business logic
│   └── database/       # Database schemas and migrations
├── tests/              # Test suites
├── data/               # Sample data and CSV templates
└── README.md           # This file
```

## Getting Started

### Prerequisites
*To be defined based on chosen tech stack*

### Installation
*Coming soon*

### Usage
*Coming soon*

## Development Roadmap

### Phase 1: Foundation (MVP)
- CSV import functionality
- Basic inventory display
- Color-coded status system
- Data persistence

### Phase 2: Lifecycle Tracking
- Order management
- Testing workflow
- Date tracking for all stages
- Batch number management

### Phase 3: Label Management
- Label inventory tracking
- Priority queue system
- Labeling status tracking
- Visual indicators

### Phase 4: Sales Readiness
- Three-point validation system
- Sales dashboard
- Blocked inventory visibility
- Missing requirements indicators

### Phase 5: Polish & Enhancement
- Reporting and analytics
- Export capabilities
- UI/UX refinements
- Performance optimization

See the full todo list for detailed breakdown of tasks in each phase.

## Business Context

Oath Research manufactures and distributes research peptides. The company:
- Receives peptide shipments in glass vials from external labs
- Must send each batch for purity and weight testing
- Can only sell peptides that have passed testing and been properly labeled
- Needs to maintain optimal inventory levels across multiple peptide types
- Requires quick visual identification of stock issues and operational bottlenecks

## Contributing

*Guidelines to be established*

## License

*To be determined*

## Contact

**Oath Research**
*Contact information to be added*

---

## Quick Reference

### Stock Status Colors
| Color | Status | Action Required |
|-------|--------|-----------------|
| 🔴 RED | Out of stock | Order immediately |
| 🟠 ORANGE | Nearly out | Order urgently |
| 🟡 YELLOW | Low stock | Order soon |
| 🟢 GREEN | Good stock | No action needed |
| 🔵 TEAL | On order | Monitor delivery |

### Sales Readiness Checklist
- [ ] Purity test completed
- [ ] Net weight verified
- [ ] Label applied
- [ ] All three = Ready to sell ✅

---

*Last updated: 2026-02-06*
