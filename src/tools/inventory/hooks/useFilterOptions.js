/**
 * Custom hook to transform filter data into option format
 */

import { useMemo } from 'react';
import { transformFilterOptions } from '../utils/filterHelpers';

export function useFilterOptions({
  categories = [],
  states = [],
  locations = [],
  suppliers = [],
  users = [],
  customers = [],
}) {
  const categoryOptions = useMemo(
    () => transformFilterOptions(categories, 'categories'),
    [categories]
  );

  const stateOptions = useMemo(
    () => transformFilterOptions(states, 'states'),
    [states]
  );

  const locationOptions = useMemo(
    () => transformFilterOptions(locations, 'locations'),
    [locations]
  );

  const supplierOptions = useMemo(
    () => transformFilterOptions(suppliers, 'suppliers'),
    [suppliers]
  );

  const userOptions = useMemo(
    () => transformFilterOptions(users, 'users'),
    [users]
  );

  const customerOptions = useMemo(
    () => transformFilterOptions(customers, 'customers'),
    [customers]
  );

  return {
    categoryOptions,
    stateOptions,
    locationOptions,
    supplierOptions,
    userOptions,
    customerOptions,
  };
}
