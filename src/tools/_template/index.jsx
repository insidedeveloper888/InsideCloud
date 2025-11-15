import React, { useState, useEffect } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import axios from 'axios';

/**
 * ToolTemplate Component
 *
 * Template for creating new Lark integration tools
 * Replace with your tool name and implementation
 *
 * @param {Object} props - Component props
 * @param {string} props.userName - Current user's name (optional)
 * @param {string} props.organizationName - Organization name (optional)
 */
const ToolTemplate = ({ userName, organizationName }) => {
  const { organizationSlug } = useOrganization();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (organizationSlug) {
      fetchData();
    }
  }, [organizationSlug]);

  /**
   * Fetch data from backend API
   */
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/your_tool_endpoint?organization_slug=${organizationSlug}`
      );

      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user action
   */
  const handleAction = async () => {
    try {
      const response = await axios.post(
        `/api/your_tool_endpoint?organization_slug=${organizationSlug}`,
        {
          // Request payload
        }
      );

      if (response.data.success) {
        // Refresh data
        await fetchData();
      }
    } catch (err) {
      console.error('Error performing action:', err);
      setError(err.response?.data?.error || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Tool Name</h1>
        <p className="text-gray-600 mt-2">Brief description of what this tool does</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Feature 1</CardTitle>
                <CardDescription>Description of feature 1</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Content goes here</p>
                <Button onClick={handleAction} className="mt-4 w-full">
                  Action Button
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Feature 2</CardTitle>
                <CardDescription>Description of feature 2</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Content goes here</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Feature 3</CardTitle>
                <CardDescription>Description of feature 3</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Content goes here</p>
              </CardContent>
            </Card>
          </div>

          {/* Data Display */}
          {data.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Data List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium">{item.name || 'Item ' + (index + 1)}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ToolTemplate;
