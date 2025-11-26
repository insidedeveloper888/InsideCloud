# Strategic Map Cascade Flow Diagram

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    YEARLY VIEW (5 Years)                         │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐        │
│  │  2024    │  2025    │  2026    │  2027    │  2028    │        │
│  │          │          │          │          │          │        │
│  │ [Goal A] │ [Goal B] │ [Goal C] │ [Goal D] │ [Goal E] │        │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘        │
│       │          │          │          │          │              │
│       │          │          │          │          │              │
│       ▼          ▼          ▼          ▼          ▼              │
│   Auto-copy to December (last month of each year)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MONTHLY VIEW (12 Months)                      │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐ │
│  │Jan │Feb │Mar │Apr │May │Jun │Jul │Aug │Sep │Oct │Nov │Dec │ │
│  │    │    │    │    │    │    │    │    │    │    │    │    │ │
│  │    │    │    │    │    │    │    │    │    │    │    │[A] │ │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘ │
│                                                                 │
│  Example: January goals → Last week of Jan → Last day of Jan   │
│           December goals → Last week of Dec → Last day of Dec   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WEEKLY VIEW (52 Weeks)                       │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐ │
│  │W01 │W02 │W03 │... │W50 │W51 │W52 │    │    │    │    │    │ │
│  │    │    │    │    │    │    │    │    │    │    │    │    │ │
│  │    │    │    │    │    │    │[A] │    │    │    │    │    │ │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘ │
│                                                                 │
│  Last week of December (W52) → Last day of that week           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY VIEW (365 Days)                        │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐ │
│  │ 01 │ 02 │ 03 │... │ 29 │ 30 │ 31 │    │    │    │    │    │ │
│  │    │    │    │    │    │    │    │    │    │    │    │    │ │
│  │    │    │    │    │    │    │[A] │    │    │    │    │    │ │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘ │
│                                                                 │
│  Last day of December (Dec 31)                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Cascade Rules

### Rule 1: Yearly → December (Monthly)
```
IF timeframe = 'yearly' AND year = 2024
THEN create monthly item:
  - timeframe = 'monthly'
  - timeframe_value = '2024-12-01'
  - column_index = 11 (December)
  - parent_item_id = yearly_item.id
```

### Rule 2: Monthly → Last Week of Month
```
IF timeframe = 'monthly' AND month = January (or any month)
THEN create weekly item:
  - timeframe = 'weekly'
  - timeframe_value = last_week_start_date_of_month
  - column_index = week_number_in_year
  - parent_item_id = monthly_item.id
```

### Rule 3: Monthly → Last Day of Month
```
IF timeframe = 'monthly' AND month = January (or any month)
THEN create daily item:
  - timeframe = 'daily'
  - timeframe_value = last_day_of_month
  - column_index = day_number_in_year
  - parent_item_id = monthly_item.id
```

### Rule 4: Weekly → Last Day of Week
```
IF timeframe = 'weekly'
THEN create daily item:
  - timeframe = 'daily'
  - timeframe_value = last_day_of_week (Sunday)
  - column_index = day_number_in_year
  - parent_item_id = weekly_item.id
```

## Example: Complete Cascade Chain

```
1. User creates yearly goal for 2024:
   └─> "Achieve 20% revenue growth"
       │
       ├─> Auto-creates December 2024 monthly item:
       │   └─> "Achieve 20% revenue growth" (Dec 2024)
       │       │
       │       ├─> Auto-creates last week of December weekly item:
       │       │   └─> "Achieve 20% revenue growth" (Week 52)
       │       │       │
       │       │       └─> Auto-creates last day of week daily item:
       │       │           └─> "Achieve 20% revenue growth" (Dec 31)
       │       │
       │       └─> Auto-creates last day of December daily item:
       │           └─> "Achieve 20% revenue growth" (Dec 31)
       │               (Same as above, but different parent)
```

## Update Cascade

When parent item is updated:
```
Yearly item updated: "Achieve 25% revenue growth"
  └─> December monthly item updated: "Achieve 25% revenue growth"
      └─> Last week weekly item updated: "Achieve 25% revenue growth"
          └─> Last day daily item updated: "Achieve 25% revenue growth"
```

## Delete Cascade

When parent item is deleted:
```
Yearly item deleted
  └─> All child items deleted (CASCADE):
      - December monthly item
      - Last week weekly item
      - Last day daily item
```

## Data Structure Example

```json
{
  "id": "yearly-item-uuid",
  "timeframe": "yearly",
  "timeframe_value": "2024-01-01",
  "cell_value": "Achieve 20% revenue growth",
  "parent_item_id": null,
  "children": [
    {
      "id": "december-item-uuid",
      "timeframe": "monthly",
      "timeframe_value": "2024-12-01",
      "cell_value": "Achieve 20% revenue growth",
      "parent_item_id": "yearly-item-uuid",
      "children": [
        {
          "id": "last-week-item-uuid",
          "timeframe": "weekly",
          "timeframe_value": "2024-12-23", // Last week start
          "cell_value": "Achieve 20% revenue growth",
          "parent_item_id": "december-item-uuid",
          "children": [
            {
              "id": "last-day-item-uuid",
              "timeframe": "daily",
              "timeframe_value": "2024-12-31",
              "cell_value": "Achieve 20% revenue growth",
              "parent_item_id": "last-week-item-uuid"
            }
          ]
        },
        {
          "id": "last-day-direct-uuid",
          "timeframe": "daily",
          "timeframe_value": "2024-12-31",
          "cell_value": "Achieve 20% revenue growth",
          "parent_item_id": "december-item-uuid"
        }
      ]
    }
  ]
}
```

## Implementation Notes

1. **Multiple Parents**: A daily item can have multiple parents:
   - Parent 1: Last week of December (weekly)
   - Parent 2: Last day of December (monthly direct)
   - **Solution**: Use `parent_item_id` for primary parent, store others in `metadata.parents[]`

2. **Date Calculations**:
   - Last week of month: Find last Monday of month
   - Last day of month: Use `new Date(year, month, 0)`
   - Last day of week: Add 6 days to week start (Sunday)

3. **Conflict Resolution**:
   - If item already exists (same unique constraint), UPDATE instead of INSERT
   - Preserve manual edits if `is_manual_edit = true`

4. **Performance**:
   - Use database triggers for immediate cascade
   - Batch operations for bulk updates
   - Index on `parent_item_id` for fast lookups

