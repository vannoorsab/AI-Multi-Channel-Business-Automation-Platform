'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user, token, updateUserWorkspaces } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch workspaces when user and token are loaded
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!token || !user) {
        setWorkspaces([]);
        setActiveWorkspace(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.workspaces && data.workspaces.length > 0) {
          setWorkspaces(data.workspaces);

          // Determine active workspace using user's saved activeWorkspace ID
          const activeId = user.activeWorkspace?._id || user.activeWorkspace || 
                           user.activeBusiness?._id || user.activeBusiness;
          const active = data.workspaces.find(
            ws => ws._id === activeId || ws._id?.toString() === activeId?.toString()
          ) || data.workspaces[0];

          setActiveWorkspace(active);
        } else if (!data.success) {
          console.error('Workspace API error:', data.error);
          // Fallback: build a temporary workspace from businesses already in user object
          if (user.businesses && user.businesses.length > 0) {
            const fallback = user.businesses.map(b => ({
              _id: b._id || b,
              name: b.name || 'My Business',
              settings: b.settings || {},
            }));
            setWorkspaces(fallback);
            setActiveWorkspace(fallback[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        // Fallback to businesses from user context
        if (user && user.businesses && user.businesses.length > 0) {
          const fallback = user.businesses.map(b => ({
            _id: b._id || b,
            name: b.name || 'My Business',
            settings: b.settings || {},
          }));
          setWorkspaces(fallback);
          setActiveWorkspace(fallback[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [token, user?.id]);

  const switchWorkspace = async (workspaceId) => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/switch/${workspaceId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const selected = workspaces.find(ws => ws._id === workspaceId || ws._id?.toString() === workspaceId);
        setActiveWorkspace(selected);
        updateUserWorkspaces(workspaces, workspaceId);
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (data.success) {
        const updated = [...workspaces, data.workspace];
        setWorkspaces(updated);
        setActiveWorkspace(data.workspace);
        updateUserWorkspaces(updated, data.workspace._id);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Error creating workspace:', error);
      return { success: false, error: error.message };
    }
  };

  const updateWorkspaceSettings = async (name, settings) => {
    if (!token || !activeWorkspace) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workspaces/${activeWorkspace._id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, settings }),
      });

      const data = await response.json();

      if (data.success) {
        // Update workspaces list
        const updated = workspaces.map(ws => ws._id === activeWorkspace._id ? data.workspace : ws);
        setWorkspaces(updated);
        setActiveWorkspace(data.workspace);
        updateUserWorkspaces(updated, data.workspace._id);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Error updating workspace settings:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, loading, switchWorkspace, createWorkspace, updateWorkspaceSettings }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
