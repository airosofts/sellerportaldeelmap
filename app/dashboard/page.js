"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getCurrentCurrencySymbol } from '@/lib/currency';
import {
  LayoutDashboard,
  Calendar,
  DoorOpen,
  Users,
  DollarSign,
  Building2,
  CalendarCheck,
  BedDouble,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
  Plus,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  PieChart,
  BarChart3,
  Utensils,
  Receipt
} from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalProperties: 0,
    draftProperties: 0,
    publishedProperties: 0,
    archivedProperties: 0,
    availableProperties: 0,
    soldProperties: 0,
    underContractProperties: 0,
    totalValue: 0,
    averagePrice: 0,
    totalBedrooms: 0,
    totalBathrooms: 0,
    recentlyAdded: 0
  });
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [currency, setCurrency] = useState('$');

  useEffect(() => {
    const userStr = localStorage.getItem('hotel_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    setCurrency(getCurrentCurrencySymbol());

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get user_id from localStorage
      const userStr = localStorage.getItem('hotel_user');
      if (!userStr) {
        setLoading(false);
        return;
      }
      const currentUser = JSON.parse(userStr);
      const currentUserId = currentUser.id;

      // Fetch properties with images
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            id,
            image_url,
            sort_order
          )
        `)
        .eq('seller_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allProperties = properties || [];

      // Calculate date threshold for "recently added" (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Calculate statistics
      const draftCount = allProperties.filter(p => p.status === 'draft').length;
      const publishedCount = allProperties.filter(p => p.status === 'published').length;
      const archivedCount = allProperties.filter(p => p.status === 'archived').length;

      const availableCount = allProperties.filter(p => p.property_status === 'available' && p.status !== 'archived').length;
      const soldCount = allProperties.filter(p => p.property_status === 'sold').length;
      const underContractCount = allProperties.filter(p => p.property_status === 'under_contract').length;

      const totalValue = allProperties
        .filter(p => p.status !== 'archived')
        .reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

      const avgPrice = allProperties.filter(p => p.status !== 'archived' && p.price).length > 0
        ? totalValue / allProperties.filter(p => p.status !== 'archived' && p.price).length
        : 0;

      const totalBeds = allProperties
        .filter(p => p.status !== 'archived')
        .reduce((sum, p) => sum + (parseInt(p.bedrooms) || 0), 0);

      const totalBaths = allProperties
        .filter(p => p.status !== 'archived')
        .reduce((sum, p) => sum + (parseFloat(p.bathrooms) || 0), 0);

      const recentCount = allProperties.filter(p => {
        const createdAt = new Date(p.created_at);
        return createdAt >= sevenDaysAgo;
      }).length;

      setStats({
        totalProperties: allProperties.filter(p => p.status !== 'archived').length,
        draftProperties: draftCount,
        publishedProperties: publishedCount,
        archivedProperties: archivedCount,
        availableProperties: availableCount,
        soldProperties: soldCount,
        underContractProperties: underContractCount,
        totalValue,
        averagePrice: avgPrice,
        totalBedrooms: totalBeds,
        totalBathrooms: totalBaths,
        recentlyAdded: recentCount
      });

      // Set recent properties (top 5)
      setRecentProperties(allProperties.slice(0, 5));

      // Create recent activities
      const activities = allProperties.slice(0, 6).map(property => {
        const createdAt = new Date(property.created_at);
        const now = new Date();
        const diffMs = now - createdAt;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeAgo;
        if (diffDays > 0) timeAgo = `${diffDays}d ago`;
        else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
        else timeAgo = `${diffMins}m ago`;

        return {
          id: property.id,
          type: property.status === 'published' ? 'published' : 'draft',
          title: property.slug?.replace(/-/g, ' ').replace(/\d+$/, '').trim() || 'Property',
          address: property.address || 'No address',
          price: `${currency}${parseFloat(property.price || 0).toLocaleString()}`,
          time: timeAgo
        };
      });
      setRecentActivities(activities);

      // Property status breakdown
      const statusData = [
        { name: 'Available', count: availableCount, color: 'bg-green-500' },
        { name: 'Under Contract', count: underContractCount, color: 'bg-purple-500' },
        { name: 'Sold', count: soldCount, color: 'bg-blue-500' }
      ].filter(item => item.count > 0);

      const totalActive = availableCount + underContractCount + soldCount;
      setStatusBreakdown(statusData.map(item => ({
        ...item,
        percentage: totalActive > 0 ? Math.round((item.count / totalActive) * 100) : 0
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };


  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Welcome back, {user?.full_name || 'Admin'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Here's an overview of your property portfolio
          </p>
        </div>

        {/* Main Stats Cards - Compact Design like Rooms Page */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Total Properties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#F5F3FF] rounded-xl border border-neutral-200 p-2.5 sm:p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-neutral-500">Total Properties</p>
                {loading ? (
                  <div className="h-5 sm:h-6 w-10 sm:w-12 bg-neutral-100 rounded animate-pulse mt-0.5"></div>
                ) : (
                  <p className="text-base sm:text-lg font-semibold text-neutral-900 mt-0.5">{stats.totalProperties}</p>
                )}
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#472F97] flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Total Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#F5F3FF] rounded-xl border border-neutral-200 p-2.5 sm:p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-neutral-500">Total Value</p>
                {loading ? (
                  <div className="h-5 sm:h-6 w-14 sm:w-16 bg-neutral-100 rounded animate-pulse mt-0.5"></div>
                ) : (
                  <p className="text-base sm:text-lg font-semibold text-neutral-900 mt-0.5">
                    {currency}{stats.totalValue.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#472F97] flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Available Properties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#F5F3FF] rounded-xl border border-neutral-200 p-2.5 sm:p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-neutral-500">Available</p>
                {loading ? (
                  <div className="h-5 sm:h-6 w-10 sm:w-12 bg-neutral-100 rounded animate-pulse mt-0.5"></div>
                ) : (
                  <p className="text-base sm:text-lg font-semibold text-neutral-900 mt-0.5">
                    {stats.availableProperties}
                  </p>
                )}
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#472F97] flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Published Properties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#F5F3FF] rounded-xl border border-neutral-200 p-2.5 sm:p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-neutral-500">Published</p>
                {loading ? (
                  <div className="h-5 sm:h-6 w-8 sm:w-10 bg-neutral-100 rounded animate-pulse mt-0.5"></div>
                ) : (
                  <p className="text-base sm:text-lg font-semibold text-neutral-900 mt-0.5">{stats.publishedProperties}</p>
                )}
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#472F97] flex items-center justify-center">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Secondary Stats - Compact Design */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
          {[
            { label: 'Draft Properties', value: stats.draftProperties, icon: Clock },
            { label: 'Sold Properties', value: stats.soldProperties, icon: CheckCircle },
            { label: 'Under Contract', value: stats.underContractProperties, icon: Calendar },
            { label: 'Avg. Price', value: `${currency}${Math.round(stats.averagePrice).toLocaleString()}`, icon: DollarSign },
            { label: 'Total Bedrooms', value: stats.totalBedrooms, icon: BedDouble },
            { label: 'Recently Added', value: stats.recentlyAdded, icon: Plus },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="bg-[#F5F3FF] rounded-xl border border-neutral-200 p-2.5 sm:p-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] text-neutral-500">{item.label}</p>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-900">{item.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
          {/* Recent Properties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 overflow-hidden"
          >
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xs sm:text-sm font-semibold text-neutral-900">Recent Properties</h2>
              </div>
              <Link
                href="/properties"
                className="flex items-center gap-1 text-[10px] sm:text-xs text-[#472F97] hover:text-[#3a2578] transition-colors"
              >
                View All
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div>
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 text-left text-[9px] md:text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-[30%]">Property</th>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 text-left text-[9px] md:text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-[25%]">Location</th>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 text-left text-[9px] md:text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-[15%]">Status</th>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 text-left text-[9px] md:text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-[15%]">Prop. Status</th>
                    <th className="px-2 md:px-3 py-2 md:py-2.5 text-right text-[9px] md:text-[10px] font-semibold text-neutral-500 uppercase tracking-wider w-[15%]">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-2 md:px-3 py-2 md:py-2.5"><div className="h-3 w-20 bg-neutral-100 rounded"></div></td>
                        <td className="px-2 md:px-3 py-2 md:py-2.5"><div className="h-3 w-16 bg-neutral-100 rounded"></div></td>
                        <td className="px-2 md:px-3 py-2 md:py-2.5"><div className="h-3 w-14 bg-neutral-100 rounded"></div></td>
                        <td className="px-2 md:px-3 py-2 md:py-2.5"><div className="h-3 w-14 bg-neutral-100 rounded"></div></td>
                        <td className="px-2 md:px-3 py-2 md:py-2.5"><div className="h-3 w-10 bg-neutral-100 rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : recentProperties.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-2 md:px-3 py-4 md:py-6 text-center">
                        <Building2 className="w-7 h-7 md:w-8 md:h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-[10px] md:text-xs text-neutral-500">No properties yet</p>
                      </td>
                    </tr>
                  ) : (
                    recentProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-2 md:px-3 py-2 md:py-2.5 text-[11px] md:text-xs font-medium text-neutral-900 truncate max-w-0">
                          {property.slug?.replace(/-/g, ' ').replace(/\d+$/, '').trim() || 'Property'}
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-2.5 text-[10px] md:text-[11px] text-neutral-600 truncate max-w-0">
                          {property.address?.split(',')[0] || 'N/A'}
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium border whitespace-nowrap ${
                            property.status === 'draft'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : property.status === 'published'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}>
                            {property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium border whitespace-nowrap ${
                            property.property_status === 'available'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : property.property_status === 'sold'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : property.property_status === 'under_contract'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}>
                            {property.property_status?.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-2.5 text-[11px] md:text-xs font-semibold text-neutral-900 text-right whitespace-nowrap">
                          {currency}{parseFloat(property.price || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
          >
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xs sm:text-sm font-semibold text-neutral-900">Recent Activities</h2>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 space-y-2 max-h-[320px] overflow-y-auto scrollbar-hide">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#F5F3FF] rounded-lg animate-pulse">
                    <div className="w-7 h-7 bg-neutral-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-2.5 w-16 bg-neutral-200 rounded mb-1"></div>
                      <div className="h-2 w-12 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-3 sm:py-4">
                  <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-300 mx-auto mb-2" />
                  <p className="text-[10px] sm:text-xs text-neutral-500">No recent activities</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-2 p-1.5 sm:p-2 bg-[#F5F3FF] hover:bg-[#EDE9FE] rounded-lg transition-colors"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#472F97] flex items-center justify-center">
                      {activity.type === 'published' ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Clock className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-xs font-medium text-neutral-900 truncate">{activity.title}</p>
                      <p className="text-[9px] sm:text-[10px] text-neutral-500 truncate">{activity.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-900">{activity.price}</p>
                      <span className="text-[9px] sm:text-[10px] text-neutral-400">{activity.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 sm:p-3 border-t border-neutral-200">
              <Link
                href="/properties"
                className="block w-full py-1.5 sm:py-2 bg-[#472F97] hover:bg-[#3a2578] text-white text-center rounded-lg text-[11px] sm:text-xs font-medium transition-colors"
              >
                View All Properties
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
          {/* Property Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 overflow-hidden"
          >
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xs sm:text-sm font-semibold text-neutral-900">Property Status Breakdown</h2>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-2.5 w-20 bg-neutral-200 rounded mb-1.5"></div>
                      <div className="h-1.5 bg-neutral-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : statusBreakdown.length === 0 ? (
                <div className="text-center py-3 sm:py-4">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-300 mx-auto mb-2" />
                  <p className="text-[10px] sm:text-xs text-neutral-500">No properties to display</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statusBreakdown.map((item, index) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] sm:text-xs font-medium text-neutral-700">{item.name}</span>
                        <span className="text-[9px] sm:text-[10px] text-neutral-500">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                          className={`h-full rounded-full ${item.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
          >
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xs sm:text-sm font-semibold text-neutral-900">Quick Actions</h2>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 space-y-2">
              <Link
                href="/properties/new"
                className="flex items-center gap-2 p-1.5 sm:p-2 bg-[#F5F3FF] hover:bg-[#EDE9FE] rounded-lg transition-colors group"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-neutral-700 group-hover:text-neutral-900">Add New Property</span>
                <ArrowRight className="w-3 h-3 text-neutral-400 ml-auto" />
              </Link>

              <Link
                href="/properties"
                className="flex items-center gap-2 p-1.5 sm:p-2 bg-[#F5F3FF] hover:bg-[#EDE9FE] rounded-lg transition-colors group"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-neutral-700 group-hover:text-neutral-900">Manage Properties</span>
                <ArrowRight className="w-3 h-3 text-neutral-400 ml-auto" />
              </Link>

              <Link
                href="/properties?view=trash"
                className="flex items-center gap-2 p-1.5 sm:p-2 bg-[#F5F3FF] hover:bg-[#EDE9FE] rounded-lg transition-colors group"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-neutral-700 group-hover:text-neutral-900">View Archived</span>
                <ArrowRight className="w-3 h-3 text-neutral-400 ml-auto" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Property Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
        >
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#472F97] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xs sm:text-sm font-semibold text-neutral-900">Property Summary</h2>
            </div>
          </div>

          <div className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-[#F5F3FF] rounded-lg p-2.5 sm:p-3 border border-neutral-200">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium text-neutral-600">Available</span>
              </div>
              <p className="text-base sm:text-lg font-semibold text-neutral-900">{stats.availableProperties}</p>
            </div>

            <div className="bg-[#F5F3FF] rounded-lg p-2.5 sm:p-3 border border-neutral-200">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium text-neutral-600">Under Contract</span>
              </div>
              <p className="text-base sm:text-lg font-semibold text-neutral-900">{stats.underContractProperties}</p>
            </div>

            <div className="bg-[#F5F3FF] rounded-lg p-2.5 sm:p-3 border border-neutral-200">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium text-neutral-600">Sold</span>
              </div>
              <p className="text-base sm:text-lg font-semibold text-neutral-900">{stats.soldProperties}</p>
            </div>

            <div className="bg-[#F5F3FF] rounded-lg p-2.5 sm:p-3 border border-neutral-200">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#472F97] flex items-center justify-center">
                  <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium text-neutral-600">Avg. Price</span>
              </div>
              <p className="text-base sm:text-lg font-semibold text-neutral-900">{currency}{Math.round(stats.averagePrice).toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      </div>
  );
}
