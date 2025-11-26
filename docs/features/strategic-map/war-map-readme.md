# War Map - Strategic Planning Application

A React-based web application for business owners to strategize and plan their business across multiple time horizons.

## Features

- **5-Year Planning**: Strategic planning from 2025 to 2029
- **First Half Year**: Monthly planning for January to June
- **Second Half Year**: Monthly planning for July to December
- **Months Planning**: Weekly breakdown for each month (Week 1-5 + Month column)
- **Weeks Planning**: Daily breakdown for each week (Monday to Sunday)

## Strategic Categories

Each planning section includes the following strategic categories:
- 阶段成就 (Phase Achievements)
- 财务盈利 (Financial Profit)
- 客户市场 (Customer Market)
- 内部系统 (Internal Systems)
- 人才资本 (Human Capital)
- 学习成长 (Learning & Growth)

## Checklist Functionality

All content items automatically convert into interactive checklists with three states:
- **Unchecked** (default): Empty checkbox icon
- **Checked**: Green checkmark (item is completed)
- **Cross**: Red X mark (item is cancelled/failed)

Click on the checkbox icon to cycle through the states: unchecked → checked → cross → unchecked

## How to Use

1. **Adding Items**: Click on any empty cell and type your items (one per line). Press Enter or click outside to save.

2. **Adding More Items**: After items are added, you can add more by clicking the "Add more items..." field at the bottom of each cell.

3. **Tracking Progress**: Click the checkbox icon next to each item to mark it as checked or crossed.

4. **Data Persistence**: All your data is automatically saved to your browser's localStorage, so your plans persist between sessions.

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Technology Stack

- React 18
- Vite
- Tailwind CSS
- LocalStorage for data persistence

## Project Structure

```
src/
  ├── components/
  │   ├── ChecklistItem.jsx    # Individual checklist item component
  │   └── StrategicTable.jsx   # Main table component for all sections
  ├── App.jsx                   # Main application component
  ├── main.jsx                  # Application entry point
  └── index.css                 # Global styles
```

## License

MIT


