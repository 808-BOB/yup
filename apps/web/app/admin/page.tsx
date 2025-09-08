"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import Header from "@/dash/header";
import PageLayout from "@/ui/page-layout";
import { useAuth } from "@/utils/auth-context";
import { getSupabaseClient } from "@/lib/supabase";
import User from "lucide-react/dist/esm/icons/user";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Shield from "lucide-react/dist/esm/icons/shield";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Edit from "lucide-react/dist/esm/icons/edit";
import Eye from "lucide-react/dist/esm/icons/eye";
import Download from "lucide-react/dist/esm/icons/download";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Palette from "lucide-react/dist/esm/icons/palette";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Settings from "lucide-react/dist/esm/icons/settings";
import Users from "lucide-react/dist/esm/icons/users";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Activity from "lucide-react/dist/esm/icons/activity";
import Database from "lucide-react/dist/esm/icons/database";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import Layout from "lucide-react/dist/esm/icons/layout";

interface SystemMetrics {
  totalUsers: number;
  totalEvents: number;
  totalResponses: number;
  activeUsers: number;
  premiumUsers: number;
  adminUsers: number;
  loading: boolean;
}

interface UserData {
  id: string;
  email: string;
  display_name: string;
  is_premium: boolean;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

interface Event {
  id: string;
  title: string;
  host_id: string;
  created_at: string;
  date: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalEvents: 0,
    totalResponses: 0,
    activeUsers: 0,
    premiumUsers: 0,
    adminUsers: 0,
    loading: true
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'events' | 'system' | 'styleguide'>('overview');
  const [styleGuideTab, setStyleGuideTab] = useState<'typography' | 'colors' | 'spacing' | 'components' | 'layout' | 'page-layouts' | 'interactions' | 'tokens'>('typography');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  const isAdmin = (user as any)?.is_admin;

  // Get Supabase client with error handling
  const getSupabase = () => {
    try {
      return getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  };

  // Fetch comprehensive system metrics
  const fetchSystemMetrics = async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabase();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      // Get total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get premium users
      const { count: premiumCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_premium', true);

      // Get admin users
      const { count: adminCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true);

      // Get total events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Get total responses
      const { count: responsesCount } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true });

      // Get active users (users who created events or responses in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeEventUsers } = await supabase
        .from('events')
        .select('host_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: activeResponseUsers } = await supabase
        .from('responses')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const activeUserIds = new Set([
        ...(activeEventUsers?.map(e => e.host_id) || []),
        ...(activeResponseUsers?.map(r => r.user_id) || [])
      ]);

      setMetrics({
        totalUsers: usersCount || 0,
        totalEvents: eventsCount || 0,
        totalResponses: responsesCount || 0,
        activeUsers: activeUserIds.size,
        premiumUsers: premiumCount || 0,
        adminUsers: adminCount || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users for management
  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const supabase = getSupabase();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Increased limit to show more users

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      console.log('Users fetched:', data?.length || 0);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch events for management
  const fetchEvents = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Handle user actions
  const handleUserAction = async (userId: string, action: 'delete' | 'toggle_admin' | 'toggle_premium') => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const user = users.find(u => u.id === userId);
      if (!user) {
        alert('User not found');
        return;
      }

      let confirmMessage = '';
      switch (action) {
        case 'delete':
          confirmMessage = `Are you sure you want to delete ${user.email}? This action cannot be undone.`;
          break;
        case 'toggle_admin':
          confirmMessage = `Are you sure you want to ${user.is_admin ? 'remove' : 'grant'} admin privileges for ${user.email}?`;
          break;
        case 'toggle_premium':
          confirmMessage = `Are you sure you want to ${user.is_premium ? 'remove' : 'grant'} premium status for ${user.email}?`;
          break;
      }

      if (!confirm(confirmMessage)) {
        return;
      }

      let updateData = {};
      switch (action) {
        case 'delete':
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
          
          if (deleteError) throw deleteError;
          console.log(`User ${user.email} deleted successfully`);
          break;
          
        case 'toggle_admin':
          updateData = { is_admin: !user.is_admin };
          break;
          
        case 'toggle_premium':
          updateData = { is_premium: !user.is_premium };
          break;
      }

      if (action !== 'delete') {
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);
        
        if (updateError) throw updateError;
        console.log(`User ${user.email} updated successfully`);
      }

      // Refresh the users list
      await fetchUsers();
      await fetchSystemMetrics();
      
    } catch (error) {
      console.error('Error handling user action:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchSystemMetrics();
      fetchUsers();
      fetchEvents();
    }
  }, [isAdmin]);

  // Redirect if not admin
  if (user && !isAdmin) {
    return (
      <PageLayout maxWidth="md" className="flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400 mb-4">You don't have permission to access the admin dashboard.</p>
            <Button onClick={() => router.push('/settings')}>
              Go to Settings
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Loading state
  if (!user) {
    return (
      <PageLayout maxWidth="md" className="flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-400">Loading admin dashboard...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950">
      {/* Sidebar */}
      <div className={`bg-neutral-900 border-r border-neutral-800 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            {!sidebarCollapsed && (
              <h2 className="text-lg font-semibold text-white">Admin</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'events', label: 'Event Management', icon: Calendar },
              { id: 'system', label: 'System', icon: Settings },
              { id: 'styleguide', label: 'Style Guide', icon: Palette }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedTab(item.id as any)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === item.id
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  } ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

              {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-neutral-950 border-b border-neutral-800 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {selectedTab === 'overview' && 'Overview'}
              {selectedTab === 'users' && 'User Management'}
              {selectedTab === 'events' && 'Event Management'}
              {selectedTab === 'system' && 'System'}
              {selectedTab === 'styleguide' && 'Style Guide'}
            </h1>
            <Button 
              onClick={fetchSystemMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* System Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Total Users</p>
                    <p className="text-3xl font-bold text-white">
                      {metrics.loading ? "..." : metrics.totalUsers.toLocaleString()}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Total Events</p>
                    <p className="text-3xl font-bold text-white">
                      {metrics.loading ? "..." : metrics.totalEvents.toLocaleString()}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Total Responses</p>
                    <p className="text-3xl font-bold text-white">
                      {metrics.loading ? "..." : metrics.totalResponses.toLocaleString()}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Active Users</p>
                    <p className="text-3xl font-bold text-white">
                      {metrics.loading ? "..." : metrics.activeUsers.toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Premium & Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Premium Users</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-yellow-500">
                      {metrics.premiumUsers.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {metrics.totalUsers > 0 
                        ? `${((metrics.premiumUsers / metrics.totalUsers) * 100).toFixed(1)}% of total users`
                        : '0% of total users'
                      }
                    </p>
                  </div>
                  <Shield className="h-12 w-12 text-yellow-500" />
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Admin Users</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-red-500">
                      {metrics.adminUsers.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {metrics.totalUsers > 0 
                        ? `${((metrics.adminUsers / metrics.totalUsers) * 100).toFixed(1)}% of total users`
                        : '0% of total users'
                      }
                    </p>
                  </div>
                  <Shield className="h-12 w-12 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">User Management</h3>
                  <p className="text-gray-400 text-sm">Manage user accounts, permissions, and status</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">Total Users: {users.length}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchUsers}
                    className="h-8 px-3"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Sign In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <Users className="h-8 w-8 mb-2" />
                          <p>No users found</p>
                          <p className="text-sm">Users will appear here once they register</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{user.display_name || 'No name'}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                            <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.is_admin && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Admin
                              </span>
                            )}
                            {user.is_premium && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Premium
                              </span>
                            )}
                            {!user.is_admin && !user.is_premium && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Free
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <div>
                            <div>{new Date(user.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(user.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {user.last_sign_in_at ? (
                            <div>
                              <div>{new Date(user.last_sign_in_at).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(user.last_sign_in_at).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user.id, 'toggle_admin')}
                              className="h-8 px-3"
                            >
                              {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user.id, 'toggle_premium')}
                              className="h-8 px-3"
                            >
                              {user.is_premium ? 'Remove Premium' : 'Make Premium'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete user ${user.email}?`)) {
                                  handleUserAction(user.id, 'delete');
                                }
                              }}
                              className="h-8 px-3 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {selectedTab === 'events' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Event Management</h3>
              <p className="text-gray-400 text-sm">View and manage all events in the system</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-0">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24 min-w-0">Host</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-0">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-0">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-0">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap min-w-0">
                        <div className="text-sm font-medium text-white truncate">{event.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 w-24 min-w-0">
                        <div className="truncate">{event.host_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 min-w-0">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap min-w-0">
                        {event.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium min-w-0">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="h-8 px-3">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-3">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Tab */}
        {selectedTab === 'system' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Database</span>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-500">Healthy</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Authentication</span>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-500">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Storage</span>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-500">Available</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Database Backup
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <div className="flex items-center">
                    <UserCheck className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-white">New user registered</span>
                  </div>
                  <span className="text-gray-400 text-sm">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-blue-500 mr-3" />
                    <span className="text-white">New event created</span>
                  </div>
                  <span className="text-gray-400 text-sm">5 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-purple-500 mr-3" />
                    <span className="text-white">New RSVP response</span>
                  </div>
                  <span className="text-gray-400 text-sm">10 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Style Guide Tab */}
        {selectedTab === 'styleguide' && (
          <div className="space-y-6">
            {/* Style Guide Sub-Tabs */}
            <div className="flex space-x-1 bg-gray-900 rounded-lg p-1">
              {[
                { id: 'typography', label: 'Typography', icon: FileText },
                { id: 'colors', label: 'Colors', icon: Palette },
                { id: 'spacing', label: 'Spacing', icon: Calendar },
                { id: 'components', label: 'Components', icon: Settings },
                { id: 'layout', label: 'Layout', icon: BarChart3 },
                { id: 'page-layouts', label: 'Page Layouts', icon: Layout },
                { id: 'interactions', label: 'Interactions', icon: Eye },
                { id: 'tokens', label: 'Design Tokens', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStyleGuideTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      styleGuideTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Typography Sub-Tab */}
            {styleGuideTab === 'typography' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Typography</h3>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Heading 1 (text-4xl font-bold)</h1>
                    <p className="text-gray-400 text-sm">Used for main page titles</p>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Heading 2 (text-3xl font-bold)</h2>
                    <p className="text-gray-400 text-sm">Used for section headers</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-2">Heading 3 (text-2xl font-semibold)</h3>
                    <p className="text-gray-400 text-sm">Used for subsection headers</p>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">Heading 4 (text-xl font-semibold)</h4>
                    <p className="text-gray-400 text-sm">Used for card titles</p>
                  </div>
                  <div>
                    <p className="text-lg text-white mb-2">Body Large (text-lg)</p>
                    <p className="text-gray-400 text-sm">Used for important body text</p>
                  </div>
                  <div>
                    <p className="text-base text-white mb-2">Body Regular (text-base)</p>
                    <p className="text-gray-400 text-sm">Used for standard body text</p>
                  </div>
                  <div>
                    <p className="text-sm text-white mb-2">Body Small (text-sm)</p>
                    <p className="text-gray-400 text-sm">Used for captions and metadata</p>
                  </div>
                  <div>
                    <p className="text-xs text-white mb-2">Body Extra Small (text-xs)</p>
                    <p className="text-gray-400 text-sm">Used for labels and fine print</p>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Colors Sub-Tab */}
            {styleGuideTab === 'colors' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Color Palette</h3>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  {/* Brand Colors */}
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-white mb-4">Brand Colors (Design Tokens)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-2 border-2 border-white shadow-lg ring-2 ring-primary/50"></div>
                      <p className="text-white text-sm font-medium">Primary</p>
                      <p className="text-gray-400 text-xs">--primary (HSL)</p>
                      <p className="text-gray-500 text-xs">#FF00FF</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary-foreground rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-sm font-medium">Primary Foreground</p>
                      <p className="text-gray-400 text-xs">--primary-foreground</p>
                      <p className="text-gray-500 text-xs">#ffffff</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-neutral-950 rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-sm font-medium">App Background</p>
                      <p className="text-gray-400 text-xs">--background</p>
                      <p className="text-gray-500 text-xs">#0a0a0a</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-neutral-400 rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-sm font-medium">Secondary</p>
                      <p className="text-gray-400 text-xs">--secondary</p>
                      <p className="text-gray-500 text-xs">#a3a3a3</p>
                    </div>
                  </div>
                </div>

                {/* Primary Color Scale */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-4">Primary Color Scale</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#330033'}}></div>
                      <p className="text-white text-xs">Magenta 900</p>
                      <p className="text-gray-400 text-xs">#330033</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#660066'}}></div>
                      <p className="text-white text-xs">Magenta 800</p>
                      <p className="text-gray-400 text-xs">#660066</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#990099'}}></div>
                      <p className="text-white text-xs">Magenta 700</p>
                      <p className="text-gray-400 text-xs">#990099</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#cc00cc'}}></div>
                      <p className="text-white text-xs">Magenta 600</p>
                      <p className="text-gray-400 text-xs">#cc00cc</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#ff00ff'}}></div>
                      <p className="text-white text-xs">Magenta 500</p>
                      <p className="text-gray-400 text-xs">#ff00ff</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#ff20ff'}}></div>
                      <p className="text-white text-xs">Magenta 400</p>
                      <p className="text-gray-400 text-xs">#ff20ff</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#ff40ff'}}></div>
                      <p className="text-white text-xs">Magenta 300</p>
                      <p className="text-gray-400 text-xs">#ff40ff</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#ff80ff'}}></div>
                      <p className="text-white text-xs">Magenta 200</p>
                      <p className="text-gray-400 text-xs">#ff80ff</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#ffbfff'}}></div>
                      <p className="text-white text-xs">Magenta 100</p>
                      <p className="text-gray-400 text-xs">#ffbfff</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: '#ffdfff'}}></div>
                      <p className="text-white text-xs">Magenta 50</p>
                      <p className="text-gray-400 text-xs">#ffdfff</p>
                    </div>
                  </div>
                </div>

                {/* Neutral Scale */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-4">Neutral Scale (Tailwind Standard)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-950 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 950</p>
                      <p className="text-gray-400 text-xs">#0a0a0a</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-900 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 900</p>
                      <p className="text-gray-400 text-xs">#171717</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-800 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 800</p>
                      <p className="text-gray-400 text-xs">#262626</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-700 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 700</p>
                      <p className="text-gray-400 text-xs">#404040</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-600 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 600</p>
                      <p className="text-gray-400 text-xs">#525252</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-500 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 500</p>
                      <p className="text-gray-400 text-xs">#737373</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-400 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 400</p>
                      <p className="text-gray-400 text-xs">#a3a3a3</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-300 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 300</p>
                      <p className="text-gray-400 text-xs">#d4d4d4</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-200 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 200</p>
                      <p className="text-gray-400 text-xs">#e5e5e5</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-100 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 100</p>
                      <p className="text-gray-400 text-xs">#f5f5f5</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-neutral-50 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Neutral 50</p>
                      <p className="text-gray-400 text-xs">#fafafa</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">White</p>
                      <p className="text-gray-400 text-xs">#ffffff</p>
                    </div>
                  </div>
                </div>

                {/* Slate Scale */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-4">Slate Scale (Tailwind Standard)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-950 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 950</p>
                      <p className="text-gray-400 text-xs">#020617</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-900 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 900</p>
                      <p className="text-gray-400 text-xs">#0f172a</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-800 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 800</p>
                      <p className="text-gray-400 text-xs">#1e293b</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-700 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 700</p>
                      <p className="text-gray-400 text-xs">#334155</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-600 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 600</p>
                      <p className="text-gray-400 text-xs">#475569</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-500 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 500</p>
                      <p className="text-gray-400 text-xs">#64748b</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-400 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 400</p>
                      <p className="text-gray-400 text-xs">#94a3b8</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-300 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 300</p>
                      <p className="text-gray-400 text-xs">#cbd5e1</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-200 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 200</p>
                      <p className="text-gray-400 text-xs">#e2e8f0</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-100 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 100</p>
                      <p className="text-gray-400 text-xs">#f1f5f9</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-50 color-palette-item rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-xs">Slate 50</p>
                      <p className="text-gray-400 text-xs">#f8fafc</p>
                    </div>
                  </div>
                </div>

                {/* Status Colors */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-4">Status Colors (Design Tokens)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-emerald-500 rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Success</p>
                      <p className="text-gray-400 text-xs">--success</p>
                      <p className="text-gray-500 text-xs">#10b981</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-rose-500 rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Error</p>
                      <p className="text-gray-400 text-xs">--error</p>
                      <p className="text-gray-500 text-xs">#f43f5e</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-amber-500 rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Warning</p>
                      <p className="text-gray-400 text-xs">--warning</p>
                      <p className="text-gray-500 text-xs">#f59e0b</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-cyan-500 rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Info</p>
                      <p className="text-gray-400 text-xs">--info</p>
                      <p className="text-gray-500 text-xs">#06b6d4</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Primary</p>
                      <p className="text-gray-400 text-xs">--primary</p>
                      <p className="text-gray-500 text-xs">#FF00FF</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-violet-500 rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Purple</p>
                      <p className="text-gray-400 text-xs">--purple</p>
                      <p className="text-gray-500 text-xs">#8b5cf6</p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Spacing Sub-Tab */}
            {styleGuideTab === 'spacing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Spacing System</h3>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-1 h-1 bg-primary"></div>
                    <span className="text-white text-sm">1px (w-1 h-1)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-primary"></div>
                    <span className="text-white text-sm">2px (w-2 h-2)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-primary"></div>
                    <span className="text-white text-sm">4px (w-4 h-4)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 bg-primary"></div>
                    <span className="text-white text-sm">6px (w-6 h-6)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary"></div>
                    <span className="text-white text-sm">8px (w-8 h-8)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary"></div>
                    <span className="text-white text-sm">12px (w-12 h-12)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary"></div>
                    <span className="text-white text-sm">16px (w-16 h-16)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-primary"></div>
                    <span className="text-white text-sm">20px (w-20 h-20)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-primary"></div>
                    <span className="text-white text-sm">24px (w-24 h-24)</span>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Components Sub-Tab */}
            {styleGuideTab === 'components' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Components</h3>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                
                {/* Button Styles */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Button Styles</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button>Primary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                {/* Button Sizes */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Button Sizes</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Card Styles */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Card Styles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
                      <h5 className="text-lg font-semibold text-white mb-2">Standard Card</h5>
                      <p className="text-neutral-300">This is a standard card with neutral background.</p>
                    </div>
                    <div className="bg-primary/30 border border-primary/50 rounded-lg p-6">
                      <h5 className="text-lg font-semibold text-white mb-2">Primary Card</h5>
                      <p className="text-primary-foreground/80">This card uses primary color with transparency.</p>
                    </div>
                  </div>
                </div>

                {/* Card Sizes */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Card Sizes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-white mb-2">Small Card</h5>
                      <p className="text-neutral-300 text-xs">Compact card with minimal padding.</p>
                    </div>
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
                      <h5 className="text-lg font-semibold text-white mb-2">Default Card</h5>
                      <p className="text-neutral-300">Standard card with default padding.</p>
                    </div>
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-8">
                      <h5 className="text-xl font-semibold text-white mb-2">Large Card</h5>
                      <p className="text-neutral-300">Large card with generous padding.</p>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500 text-white">
                      Success
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500 text-white">
                      Error
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500 text-white">
                      Warning
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500 text-white">
                      Info
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                      Primary
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500 text-white">
                      Purple
                    </span>
                  </div>
                </div>

                {/* Account Badges */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Account Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">
                      Free
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                      Pro
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                      Premium
                    </span>
                  </div>
                </div>

                {/* Alerts */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Alerts</h4>
                  <div className="space-y-4">
                    <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>Success alert message</span>
                      </div>
                    </div>
                    <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 px-4 py-3 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span>Error alert message</span>
                      </div>
                    </div>
                    <div className="bg-amber-500/20 border border-amber-500/50 text-amber-300 px-4 py-3 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span>Warning alert message</span>
                      </div>
                    </div>
                    <div className="bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 px-4 py-3 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span>Info alert message</span>
                      </div>
                    </div>
                    <div className="bg-primary/20 border border-primary/50 text-primary-foreground px-4 py-3 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span>Primary alert message</span>
                      </div>
                    </div>
                    <div className="bg-violet-500/20 border border-violet-500/50 text-violet-300 px-4 py-3 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span>Purple alert message</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Layout Sub-Tab */}
            {styleGuideTab === 'layout' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Layout & Grid</h3>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                
                {/* Grid System */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Grid System</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <p className="text-white text-sm">Grid Item 1</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <p className="text-white text-sm">Grid Item 2</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <p className="text-white text-sm">Grid Item 3</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <p className="text-white text-sm">Grid Item 4</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <p className="text-white text-sm">Grid Item 5</p>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <p className="text-white text-sm">Grid Item 6</p>
                    </div>
                  </div>
                </div>

                {/* Flexbox */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Flexbox Layouts</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <span className="text-white">Left Content</span>
                      <span className="text-white">Right Content</span>
                    </div>
                    <div className="flex items-center space-x-4 bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <span className="text-white">Item 1</span>
                      <span className="text-white">Item 2</span>
                      <span className="text-white">Item 3</span>
                    </div>
                    <div className="flex flex-col space-y-2 bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <span className="text-white">Vertical Item 1</span>
                      <span className="text-white">Vertical Item 2</span>
                      <span className="text-white">Vertical Item 3</span>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Page Layouts Sub-Tab */}
            {styleGuideTab === 'page-layouts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Page Layouts & Wireframes</h3>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                
                {/* My Events Page Layout */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">My Events Page Layout</h4>
                  <div className="bg-black border border-gray-700 rounded-lg p-4 max-w-sm mx-auto">
                    {/* Header */}
                    <div className="bg-gray-800 border-b border-gray-700 p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <h1 className="text-white text-lg font-semibold">My Events</h1>
                        <button className="bg-primary text-white px-3 py-1 rounded text-sm">+ New Event</button>
                      </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex bg-gray-800 rounded-lg p-1 mb-4">
                      <button className="flex-1 bg-primary text-white px-3 py-2 rounded text-sm">Hosting</button>
                      <button className="flex-1 text-gray-300 px-3 py-2 rounded text-sm">Invited To</button>
                    </div>
                    
                    {/* Event Cards */}
                    <div className="space-y-3">
                      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">Board Game Night</h3>
                          <span className="bg-green-500/25 text-green-400 px-2 py-1 rounded text-xs">Active</span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">Sunday, Oct 5 • 6:30 PM</p>
                        <p className="text-gray-300 text-sm">Game Haven, Seattle</p>
                      </div>
                      
                      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">Dinner Party</h3>
                          <span className="bg-gray-500/25 text-gray-300 px-2 py-1 rounded text-xs">Draft</span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">Friday, Oct 10 • 7:00 PM</p>
                        <p className="text-gray-300 text-sm">My House</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Details Page Layout */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Event Details Page Layout</h4>
                  <div className="bg-black border border-gray-700 rounded-lg p-4 max-w-sm mx-auto">
                    {/* Header */}
                    <div className="bg-gray-800 border-b border-gray-700 p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <button className="text-gray-300 text-sm">← Back</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <h1 className="text-white text-lg font-semibold">Board Game Night</h1>
                        <div className="flex gap-2">
                          <button className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Share</button>
                          <button className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Edit</button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Event Info */}
                    <div className="space-y-4">
                      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm">B</div>
                          <div>
                            <p className="text-white text-sm">B Bob</p>
                            <p className="text-gray-400 text-xs">Created 7/20/2025</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">📅</span>
                            <span className="text-white text-sm">Sunday, October 5, 2025</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">🕐</span>
                            <span className="text-white text-sm">6:30 PM - 10:30 PM</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">📍</span>
                            <span className="text-white text-sm">Game Haven, 321 Game Street, Seattle, WA</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* RSVP Settings */}
                      <div className="bg-gray-600 border border-gray-600 rounded-lg p-4">
                        <h3 className="text-white text-sm font-semibold mb-3">RSVP Settings</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-xs">Guest RSVP</span>
                            <span className="bg-green-500/25 text-green-400 px-2 py-1 rounded text-xs border border-green-500/50">Allowed</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-xs">Plus One</span>
                            <span className="bg-green-500/25 text-green-400 px-2 py-1 rounded text-xs border border-green-500/50">Allowed</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-xs">Max Guests</span>
                            <span className="text-white text-xs font-medium">3</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Guidelines */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Color Guidelines</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-black rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-sm font-medium">Page Background</p>
                      <p className="text-gray-400 text-xs">bg-black</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-800 rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-sm font-medium">Container Background</p>
                      <p className="text-gray-400 text-xs">bg-gray-800</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-sm font-medium">Card Background</p>
                      <p className="text-gray-400 text-xs">bg-gray-700</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-600 rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-sm font-medium">Secondary Card</p>
                      <p className="text-gray-400 text-xs">bg-gray-600</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-white text-sm font-medium mb-2">Primary Text</p>
                      <p className="text-gray-400 text-xs">text-white</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300 text-sm font-medium mb-2">Secondary Text</p>
                      <p className="text-gray-400 text-xs">text-gray-300</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm font-medium mb-2">Muted Text</p>
                      <p className="text-gray-400 text-xs">text-gray-400</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-400 text-sm font-medium mb-2">Success Text</p>
                      <p className="text-gray-400 text-xs">text-green-400</p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Interactions Sub-Tab */}
            {styleGuideTab === 'interactions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Interactions & States</h3>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                
                {/* Hover States */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Hover States</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-primary hover:bg-primary/90 transition-colors text-white">
                      Hover Me
                    </Button>
                    <div className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 transition-colors cursor-pointer">
                      <p className="text-white">Hover Card</p>
                    </div>
                    <div className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                      Hover Link
                    </div>
                  </div>
                </div>

                {/* Focus States */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Focus States</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 text-white">
                      Focus Button
                    </Button>
                    <input 
                      type="text" 
                      placeholder="Focus input" 
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* Loading States */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Loading States</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button disabled className="bg-primary/50 text-white">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin text-white" />
                      Loading...
                    </Button>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Design Tokens Sub-Tab */}
            {styleGuideTab === 'tokens' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Design Tokens</h3>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                
                {/* Color Tokens */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Color Tokens</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Primary</p>
                      <p className="text-gray-400 text-xs">--primary</p>
                      <p className="text-gray-500 text-xs">HSL: 330 100% 60%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary-foreground rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Primary Foreground</p>
                      <p className="text-gray-400 text-xs">--primary-foreground</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 100%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-background rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Background</p>
                      <p className="text-gray-400 text-xs">--background</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 0%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-foreground rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Foreground</p>
                      <p className="text-gray-400 text-xs">--foreground</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 100%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Secondary</p>
                      <p className="text-gray-400 text-xs">--secondary</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 10%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-secondary-foreground rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Secondary Foreground</p>
                      <p className="text-gray-400 text-xs">--secondary-foreground</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 100%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Muted</p>
                      <p className="text-gray-400 text-xs">--muted</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 10%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-muted-foreground rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Muted Foreground</p>
                      <p className="text-gray-400 text-xs">--muted-foreground</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 70%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-accent rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Accent</p>
                      <p className="text-gray-400 text-xs">--accent</p>
                      <p className="text-gray-500 text-xs">HSL: 330 100% 60%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-accent-foreground rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Accent Foreground</p>
                      <p className="text-gray-400 text-xs">--accent-foreground</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 100%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-destructive rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Destructive</p>
                      <p className="text-gray-400 text-xs">--destructive</p>
                      <p className="text-gray-500 text-xs">HSL: 0 62.8% 30.6%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-destructive-foreground rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Destructive Foreground</p>
                      <p className="text-gray-400 text-xs">--destructive-foreground</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 100%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-border rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Border</p>
                      <p className="text-gray-400 text-xs">--border</p>
                      <p className="text-gray-500 text-xs">HSL: 330 100% 60%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-input rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Input</p>
                      <p className="text-gray-400 text-xs">--input</p>
                      <p className="text-gray-500 text-xs">HSL: 0 0% 10%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-ring rounded-lg mx-auto mb-2 border border-gray-600"></div>
                      <p className="text-white text-xs font-medium">Ring</p>
                      <p className="text-gray-400 text-xs">--ring</p>
                      <p className="text-gray-500 text-xs">HSL: 330 100% 60%</p>
                    </div>
                  </div>
                </div>

                {/* Custom Brand Tokens */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Custom Brand Tokens</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: 'var(--primary-color)'}}></div>
                      <p className="text-white text-xs font-medium">Primary Color</p>
                      <p className="text-gray-400 text-xs">--primary-color</p>
                      <p className="text-gray-500 text-xs">#FF00FF</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: 'var(--secondary-color)'}}></div>
                      <p className="text-white text-xs font-medium">Secondary Color</p>
                      <p className="text-gray-400 text-xs">--secondary-color</p>
                      <p className="text-gray-500 text-xs">#000000</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: 'var(--tertiary-color)'}}></div>
                      <p className="text-white text-xs font-medium">Tertiary Color</p>
                      <p className="text-gray-400 text-xs">--tertiary-color</p>
                      <p className="text-gray-500 text-xs">#ffffff</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-600" style={{backgroundColor: 'var(--page-background)'}}></div>
                      <p className="text-white text-xs font-medium">Page Background</p>
                      <p className="text-gray-400 text-xs">--page-background</p>
                      <p className="text-gray-500 text-xs">#000000</p>
                    </div>
                  </div>
                </div>

                {/* Border Radius Tokens */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Border Radius Tokens</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary rounded-sm mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Small</p>
                      <p className="text-gray-400 text-xs">--radius-sm</p>
                      <p className="text-gray-500 text-xs">calc(var(--radius) - 4px)</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary rounded-md mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Medium</p>
                      <p className="text-gray-400 text-xs">--radius-md</p>
                      <p className="text-gray-500 text-xs">calc(var(--radius) - 2px)</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Large</p>
                      <p className="text-gray-400 text-xs">--radius-lg</p>
                      <p className="text-gray-500 text-xs">var(--radius)</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary rounded-xl mx-auto mb-2"></div>
                      <p className="text-white text-sm font-medium">Extra Large</p>
                      <p className="text-gray-400 text-xs">--radius-xl</p>
                      <p className="text-gray-500 text-xs">0.75rem</p>
                    </div>
                  </div>
                </div>

                {/* Shadows */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Shadows</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-800 shadow-sm mx-auto mb-2"></div>
                      <p className="text-white text-sm">Small</p>
                      <p className="text-gray-400 text-xs">shadow-sm</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-800 shadow mx-auto mb-2"></div>
                      <p className="text-white text-sm">Default</p>
                      <p className="text-gray-400 text-xs">shadow</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-800 shadow-md mx-auto mb-2"></div>
                      <p className="text-white text-sm">Medium</p>
                      <p className="text-gray-400 text-xs">shadow-md</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-800 shadow-lg mx-auto mb-2"></div>
                      <p className="text-white text-sm">Large</p>
                      <p className="text-gray-400 text-xs">shadow-lg</p>
                    </div>
                  </div>
                </div>

                {/* Transitions */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Transitions</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button className="transition-all duration-200">
                      Fast Transition
                    </Button>
                    <Button className="transition-all duration-300">
                      Normal Transition
                    </Button>
                    <Button className="transition-all duration-500">
                      Slow Transition
                    </Button>
                    <Button className="transition-colors">
                      Colors Only
                    </Button>
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
