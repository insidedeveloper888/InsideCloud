-- Check the exact cascade data to see what was created

SELECT
  timeframe,
  category_index,
  year_index,
  month_col_index,
  week_number,
  daily_date_key,
  is_cascaded,
  cascade_level,
  text
FROM strategic_map_items
WHERE text LIKE '%Cascade Test Goal%'
  AND is_deleted = FALSE
ORDER BY cascade_level;

-- Also show what the frontend cell keys would be:
SELECT
  timeframe,
  category_index as rowIndex,
  CASE
    WHEN timeframe = 'yearly' THEN year_index
    WHEN timeframe = 'monthly' THEN month_col_index
    WHEN timeframe = 'weekly' THEN week_number
    WHEN timeframe = 'daily' THEN daily_date_key
  END as colIndex,
  timeframe || '_' || category_index || '_' ||
  CASE
    WHEN timeframe = 'yearly' THEN year_index::TEXT
    WHEN timeframe = 'monthly' THEN month_col_index::TEXT
    WHEN timeframe = 'weekly' THEN week_number::TEXT
    WHEN timeframe = 'daily' THEN daily_date_key::TEXT
  END as frontend_cell_key,
  is_cascaded,
  LEFT(text, 30) as text_preview
FROM strategic_map_items
WHERE text LIKE '%Cascade Test Goal%'
  AND is_deleted = FALSE
ORDER BY cascade_level;
