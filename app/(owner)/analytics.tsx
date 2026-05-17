import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Ionicons } from '@expo/vector-icons';
import { useOwnerBusinesses, useOwnerAnalytics } from '@/hooks/useOwner';
import { router } from 'expo-router';

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';
type TrendTabType = 'bookings' | 'revenue';

const MetricCard = ({ title, value, icon, delay = 0 }: { title: string, value: string | number, icon: any, delay?: number }) => (
  <AnimatedSection delay={delay} direction="up" className="w-[48%] mb-4">
    <View className="bg-white border border-slate-200 p-5 rounded-2xl h-32 justify-between">
      <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
        <Ionicons name={icon} size={16} color="#64748B" />
      </View>
      <View>
        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</Text>
        <Text className="text-slate-900 text-xl font-extrabold mt-1">{value}</Text>
      </View>
    </View>
  </AnimatedSection>
);

export default function OwnerAnalyticsScreen() {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState<string>(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(''); // YYYY-MM-DD
  const [showFilter, setShowFilter] = useState(false);
  const [trendTab, setTrendTab] = useState<TrendTabType>('bookings');
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  const { data: businessesData, isLoading: businessesLoading, refetch: refetchBusinesses } = useOwnerBusinesses();

  // Compute exact human-readable date bounds for the filters
  const dateBounds = useMemo(() => {
    const now = new Date();
    
    const formatLabelDate = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    };

    const getLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    };

    // Week boundaries (Monday to Sunday)
    const day = now.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysSinceMonday);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      todayStr: getLocalDateString(now),
      weekStartStr: getLocalDateString(weekStart),
      weekEndStr: getLocalDateString(weekEnd),
      monthStartStr: getLocalDateString(monthStart),
      monthEndStr: getLocalDateString(monthEnd),
      todayLabel: formatLabelDate(now),
      weekLabel: `${formatLabelDate(weekStart)} - ${formatLabelDate(weekEnd)}`,
      monthLabel: `${formatLabelDate(monthStart)} - ${formatLabelDate(monthEnd)}`
    };
  }, []);

  // Compute parameters to pass to the analytics API hook
  const analyticsParams = useMemo(() => {
    const params: {
      businessId: string;
      type: string;
      aggregated: boolean;
      startDate?: string;
      endDate?: string;
    } = {
      businessId: selectedBusinessId,
      type: 'overview',
      aggregated: true
    };

    if (dateFilter === 'today') {
      params.startDate = dateBounds.todayStr;
      params.endDate = dateBounds.todayStr;
    } else if (dateFilter === 'week') {
      params.startDate = dateBounds.weekStartStr;
      params.endDate = dateBounds.weekEndStr;
    } else if (dateFilter === 'month') {
      params.startDate = dateBounds.monthStartStr;
      params.endDate = dateBounds.monthEndStr;
    } else if (dateFilter === 'custom') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    }

    return params;
  }, [selectedBusinessId, dateFilter, startDate, endDate, dateBounds]);

  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    isError: analyticsError, 
    refetch: refetchAnalytics,
    error: apiError 
  } = useOwnerAnalytics(analyticsParams);

  const onRefresh = useCallback(async () => {
    await Promise.all([
      refetchBusinesses(),
      refetchAnalytics()
    ]);
  }, [refetchBusinesses, refetchAnalytics]);

  const selectedBusinessName = useMemo(() => {
    if (selectedBusinessId === 'all') return 'All Hubs';
    return businessesData?.find((b: any) => b.id === selectedBusinessId)?.salon_name || 'Business';
  }, [selectedBusinessId, businessesData]);

  const filterSummary = useMemo(() => {
    let dateStr = 'All Dates';
    if (dateFilter === 'today') dateStr = `Today (${dateBounds.todayLabel})`;
    else if (dateFilter === 'week') dateStr = `This Week (${dateBounds.weekLabel})`;
    else if (dateFilter === 'month') dateStr = `This Month (${dateBounds.monthLabel})`;
    else if (dateFilter === 'custom') {
      dateStr = (startDate || endDate) 
        ? `Custom: ${startDate || 'any'} to ${endDate || 'any'}` 
        : 'Custom Date';
    }
    
    return `${selectedBusinessName} • ${dateStr}`;
  }, [selectedBusinessName, dateFilter, startDate, endDate, dateBounds]);

  // Compute Daily Trend Points
  const dailyPoints = useMemo(() => {
    const rawDaily = analytics?.daily || [];
    if (rawDaily.length === 0) {
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          label: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
          bookingCount: 0,
          revenue: 0
        };
      });
    }

    return rawDaily.map((d: any) => {
      const parsedDate = new Date(d.date.split(/[T ]/)[0]);
      return {
        label: `${parsedDate.getDate()} ${parsedDate.toLocaleString('default', { month: 'short' })}`,
        bookingCount: d.totalBookings || 0,
        revenue: (d.revenue ?? 0) / 100
      };
    });
  }, [analytics]);

  // Max values for scaling bar charts
  const maxTrendValue = useMemo(() => {
    const values = dailyPoints.map((p: any) => trendTab === 'bookings' ? p.bookingCount : p.revenue);
    return Math.max(...values, 1);
  }, [dailyPoints, trendTab]);

  // Compute Booking Status Share
  const statusSummary = useMemo(() => {
    const confirmed = analytics?.overview?.confirmedBookings || 0;
    const rejected = analytics?.overview?.rejectedBookings || 0;
    const cancelled = analytics?.overview?.cancelledBookings || 0;
    const total = confirmed + rejected + cancelled;

    if (total === 0) {
      return {
        confirmedPct: 0,
        rejectedPct: 0,
        cancelledPct: 0,
        confirmed,
        rejected,
        cancelled,
        total
      };
    }

    return {
      confirmedPct: Math.round((confirmed / total) * 100),
      rejectedPct: Math.round((rejected / total) * 100),
      cancelledPct: Math.round((cancelled / total) * 100),
      confirmed,
      rejected,
      cancelled,
      total
    };
  }, [analytics]);

  // Compute Peak Booking Hours
  const peakHoursData = useMemo(() => {
    const rawPeak = analytics?.peakHours || analytics?.advanced?.peakHoursHeatmap || [];
    if (rawPeak.length === 0) {
      return [
        { label: '09:00 AM', count: 0 },
        { label: '11:00 AM', count: 0 },
        { label: '01:00 PM', count: 0 },
        { label: '03:00 PM', count: 0 },
        { label: '05:00 PM', count: 0 }
      ];
    }
    return [...rawPeak]
      .sort((a, b) => a.hour - b.hour)
      .map((p: any) => {
        const ampm = p.hour >= 12 ? 'PM' : 'AM';
        const displayHour = p.hour % 12 === 0 ? 12 : p.hour % 12;
        return {
          label: `${displayHour}:00 ${ampm}`,
          count: p.bookingCount || 0
        };
      });
  }, [analytics]);

  const maxPeakCount = useMemo(() => {
    return Math.max(...peakHoursData.map(p => p.count), 1);
  }, [peakHoursData]);

  // Compute Service Popularity
  const servicesData = useMemo(() => {
    const rawServices = analytics?.advanced?.servicePopularityRanking || analytics?.overview?.services || [];
    if (rawServices.length === 0) {
      return [
        { name: 'Standard Treatment', count: 0 },
        { name: 'Quick Treatment', count: 0 }
      ];
    }
    return rawServices.map((s: any) => ({
      name: s.serviceName || s.name || 'Service',
      count: s.bookingCount || s.count || 0
    }));
  }, [analytics]);

  const maxServiceCount = useMemo(() => {
    return Math.max(...servicesData.map((s: any) => s.count), 1);
  }, [servicesData]);

  if (businessesLoading || (analyticsLoading && !analytics)) {
    return (
      <View className="flex-1 bg-slate-50">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="px-luxury py-6">
            <LoadingSkeleton height={40} width={150} className="mb-8" />
            <LoadingSkeleton height={180} className="mb-6" />
            <View className="flex-row flex-wrap justify-between">
              <LoadingSkeleton height={120} width="48%" className="mb-4" />
              <LoadingSkeleton height={120} width="48%" className="mb-4" />
              <LoadingSkeleton height={120} width="48%" className="mb-4" />
              <LoadingSkeleton height={120} width="48%" className="mb-4" />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (analyticsError) {
    return (
      <View className="flex-1 bg-slate-50">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 justify-center items-center px-luxury">
            <View className="bg-white border border-slate-200 items-center w-full p-8 rounded-2xl">
              <Ionicons name="alert-circle-outline" size={48} color="#000000" />
              <Text className="text-slate-900 text-lg font-extrabold mt-4 text-center">
                Sync Error
              </Text>
              <Text className="text-slate-500 text-center mt-2 mb-8 text-sm font-medium">
                We couldn't fetch your analytics data. Please check your connection or try again later.
                {apiError instanceof Error ? `\n\nError: ${apiError.message}` : ''}
              </Text>
              <Pressable 
                onPress={onRefresh} 
                className="bg-slate-900 py-4 px-10 rounded-full items-center justify-center active:bg-slate-800 w-full"
              >
                <Text className="text-white font-extrabold text-sm uppercase tracking-widest">Retry Sync</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const noData = !analytics?.overview || analytics?.overview?.totalBookings === 0;

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-luxury py-6 flex-row justify-between items-end border-b border-slate-200 bg-white">
          <View className="flex-1 mr-4">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Performance</Text>
            <Text className="text-slate-900 text-3xl font-extrabold tracking-tight" numberOfLines={1}>
              Analytics
            </Text>
            <Text className="text-slate-500 text-xs mt-1" numberOfLines={1}>
              {filterSummary}
            </Text>
          </View>
          <Pressable 
            onPress={() => setShowFilter(true)}
            className="bg-slate-50 p-3 rounded-2xl border border-slate-200 active:bg-slate-100"
          >
            <Ionicons name="funnel-outline" size={20} color="#334155" />
          </Pressable>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-12"
          refreshControl={
            <RefreshControl
              refreshing={analyticsLoading}
              onRefresh={onRefresh}
              tintColor="#0F172A"
            />
          }
        >
          {noData && !analyticsLoading ? (
            <AnimatedSection className="px-luxury pt-12 items-center">
              <View className="bg-white border border-slate-200 w-full p-8 items-center rounded-2xl">
                <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-6">
                  <Ionicons name="bar-chart-outline" size={40} color="#94A3B8" />
                </View>
                <Text className="text-slate-900 text-xl font-extrabold mb-2">No Data Available</Text>
                <Text className="text-slate-500 text-center px-6 text-sm font-medium leading-relaxed">
                  There is no performance data for the selected period or business hub.
                </Text>
                <Pressable 
                  onPress={() => router.push('/(owner)/businesses')} 
                  className="mt-8 bg-slate-900 py-4 px-10 rounded-full items-center justify-center active:bg-slate-800 w-full"
                >
                  <Text className="text-white font-extrabold text-sm uppercase tracking-widest">Launch Your Hub</Text>
                </Pressable>
              </View>
            </AnimatedSection>
          ) : (
            <>
              {/* Key Metrics */}
              <View className="px-luxury pt-6 mb-6">
                <AnimatedSection direction="up">
                  <View className="bg-white border border-slate-200 p-8 rounded-2xl overflow-hidden relative">
                    <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total Revenue</Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-slate-900 text-4xl font-extrabold tracking-tight">
                        ₹{((analytics?.overview?.totalRevenueCents || 0) / 100).toLocaleString()}
                      </Text>
                      <View className="ml-3 bg-neutral-100 px-2 py-1 rounded-md flex-row items-center border border-neutral-200">
                        <Ionicons name="trending-up" size={12} color="#000000" />
                        <Text className="text-neutral-800 text-[10px] font-bold ml-1">+12%</Text>
                      </View>
                    </View>
                  </View>
                </AnimatedSection>
              </View>

              <View className="px-luxury flex-row flex-wrap justify-between">
                <MetricCard 
                  title="Volume" 
                  value={analytics?.overview?.totalBookings || 0} 
                  icon="calendar-outline" 
                  delay={100} 
                />
                <MetricCard 
                  title="Success" 
                  value={`${Math.round(analytics?.overview?.conversionRate || 0)}%`} 
                  icon="checkmark-circle-outline" 
                  delay={200} 
                />
                <MetricCard 
                  title="No-Show" 
                  value={`${Math.round(analytics?.overview?.noShowRate || 0)}%`} 
                  icon="alert-circle-outline" 
                  delay={300} 
                />
                <MetricCard 
                  title="Cancelled" 
                  value={analytics?.overview?.cancelledBookings || 0} 
                  icon="close-circle-outline" 
                  delay={400} 
                />
              </View>

              {/* Trend Charts (Interactive Columns View) */}
              <View className="px-luxury mb-6">
                <AnimatedSection direction="up" delay={450}>
                  <View className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <View className="flex-row items-center justify-between mb-6">
                      <Text className="text-slate-900 text-base font-extrabold">Activity Trends</Text>
                      
                      {/* Sub-tabs */}
                      <View className="flex-row bg-slate-100 p-1 rounded-full border border-slate-200">
                        <Pressable 
                          onPress={() => { setTrendTab('bookings'); setActiveBarIndex(null); }}
                          className={`px-4 py-1.5 rounded-full ${trendTab === 'bookings' ? 'bg-white' : ''}`}
                        >
                          <Text className={`text-[10px] font-bold ${trendTab === 'bookings' ? 'text-slate-900' : 'text-slate-500'}`}>
                            Bookings
                          </Text>
                        </Pressable>
                        <Pressable 
                          onPress={() => { setTrendTab('revenue'); setActiveBarIndex(null); }}
                          className={`px-4 py-1.5 rounded-full ${trendTab === 'revenue' ? 'bg-white' : ''}`}
                        >
                          <Text className={`text-[10px] font-bold ${trendTab === 'revenue' ? 'text-slate-900' : 'text-slate-500'}`}>
                            Revenue
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Chart Core */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="h-44 items-end pb-2">
                      {dailyPoints.map((point: any, index: number) => {
                        const val = trendTab === 'bookings' ? point.bookingCount : point.revenue;
                        const barHeight = Math.max((val / maxTrendValue) * 100, 4); // min height 4px, max 100px
                        const isActive = activeBarIndex === index;

                        return (
                          <Pressable 
                            key={index} 
                            onPress={() => setActiveBarIndex(isActive ? null : index)}
                            className="items-center justify-end mx-3"
                          >
                            {/* Hover info badge */}
                            {isActive && (
                              <View className="absolute -top-12 bg-slate-900 px-2.5 py-1 rounded-lg items-center justify-center z-10">
                                <Text className="text-white text-[10px] font-bold">
                                  {trendTab === 'bookings' ? `${val} book` : `₹${Math.round(val)}`}
                                </Text>
                                <View className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mb-1 mt-0.5" />
                              </View>
                            )}

                            <View 
                              style={{ height: barHeight }} 
                              className={`w-8 rounded-t-lg transition-colors ${
                                isActive 
                                  ? 'bg-black' 
                                  : 'bg-neutral-300'
                              }`} 
                            />
                            <Text className="text-slate-400 text-[8px] font-bold mt-2">{point.label}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                </AnimatedSection>
              </View>

              {/* Status Breakdown & Peak Hours Section */}
              <View className="px-luxury mb-6">
                <AnimatedSection direction="up" delay={500}>
                  <View className="bg-white border border-slate-200 p-6 rounded-2xl mb-6">
                    <Text className="text-slate-900 text-base font-extrabold mb-4">Booking Status Allocation</Text>
                    
                    {/* Stacked percentage bar */}
                    <View className="h-4 bg-slate-100 rounded-full flex-row overflow-hidden mb-6">
                      {statusSummary.confirmedPct > 0 && (
                        <View style={{ width: `${statusSummary.confirmedPct}%` }} className="bg-black h-full" />
                      )}
                      {statusSummary.rejectedPct > 0 && (
                        <View style={{ width: `${statusSummary.rejectedPct}%` }} className="bg-neutral-500 h-full" />
                      )}
                      {statusSummary.cancelledPct > 0 && (
                        <View style={{ width: `${statusSummary.cancelledPct}%` }} className="bg-neutral-300 h-full" />
                      )}
                    </View>

                    {/* Breakdown breakdown numbers */}
                    <View className="space-y-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-3 h-3 bg-black rounded-full mr-2" />
                          <Text className="text-slate-600 text-xs font-semibold">Confirmed</Text>
                        </View>
                        <Text className="text-slate-900 text-xs font-extrabold">
                          {statusSummary.confirmed} ({statusSummary.confirmedPct}%)
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-3 h-3 bg-neutral-500 rounded-full mr-2" />
                          <Text className="text-slate-600 text-xs font-semibold">Rejected</Text>
                        </View>
                        <Text className="text-slate-900 text-xs font-extrabold">
                          {statusSummary.rejected} ({statusSummary.rejectedPct}%)
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-3 h-3 bg-neutral-300 rounded-full mr-2" />
                          <Text className="text-slate-600 text-xs font-semibold">Cancelled</Text>
                        </View>
                        <Text className="text-slate-900 text-xs font-extrabold">
                          {statusSummary.cancelled} ({statusSummary.cancelledPct}%)
                        </Text>
                      </View>
                    </View>
                  </View>
                </AnimatedSection>

                {/* Peak Booking Hours */}
                <AnimatedSection direction="up" delay={550}>
                  <View className="bg-white border border-slate-200 p-6 rounded-2xl mb-6">
                    <Text className="text-slate-900 text-base font-extrabold mb-4">Peak Traffic Hours</Text>
                    
                    <View className="space-y-3">
                      {peakHoursData.map((hour, index) => {
                        const widthPct = Math.max((hour.count / maxPeakCount) * 100, 3);
                        return (
                          <View key={index} className="flex-row items-center">
                            <Text className="w-20 text-slate-500 text-[10px] font-bold">{hour.label}</Text>
                            <View className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden mr-3">
                              <View 
                                style={{ width: `${widthPct}%` }} 
                                className="bg-slate-800 h-full rounded-full" 
                              />
                            </View>
                            <Text className="text-slate-900 text-xs font-extrabold w-6 text-right">
                              {hour.count}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </AnimatedSection>

                {/* Service Performance Rankings */}
                <AnimatedSection direction="up" delay={600}>
                  <View className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <Text className="text-slate-900 text-base font-extrabold mb-4">Popular Treatments</Text>
                    
                    <View className="space-y-4">
                      {servicesData.map((service: any, index: number) => {
                        const widthPct = Math.max((service.count / maxServiceCount) * 100, 3);
                        return (
                          <View key={index} className="space-y-1.5">
                            <View className="flex-row justify-between items-center">
                              <Text className="text-slate-700 text-xs font-bold" numberOfLines={1}>
                                {service.name}
                              </Text>
                              <Text className="text-slate-900 text-xs font-extrabold ml-2">
                                {service.count} book
                              </Text>
                            </View>
                            <View className="bg-slate-100 h-2.5 rounded-full overflow-hidden w-full">
                              <View 
                                style={{ width: `${widthPct}%` }} 
                                className="bg-black h-full rounded-full" 
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </AnimatedSection>
              </View>

              {/* Intelligence Section */}
              <AnimatedSection delay={650} direction="up" className="px-luxury">
                <View className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <View className="flex-row items-center gap-x-3 mb-4">
                    <View className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
                      <Ionicons name="bulb-outline" size={20} color="#FFFFFF" />
                    </View>
                    <Text className="text-white font-extrabold text-sm uppercase tracking-wider">Intelligence Insight</Text>
                  </View>
                  <Text className="text-slate-300 text-xs leading-5">
                    {analytics?.overview?.confirmedBookings && analytics.overview.confirmedBookings > 10
                      ? "Your business is showing strong momentum. Consider optimizing high-traffic slots for premium pricing to maximize revenue."
                      : "Focus on increasing your booking velocity by sharing your booking link on WhatsApp and Instagram stories."}
                  </Text>
                </View>
              </AnimatedSection>
            </>
          )}
        </ScrollView>

        {/* Unified Filter Modal */}
        <Modal
          visible={showFilter}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFilter(false)}
        >
          <Pressable 
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
            onPress={() => setShowFilter(false)}
          >
            <View className="bg-white rounded-t-[40px] p-6 border-t border-slate-200 max-h-[90%]">
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" />
                <Text className="text-slate-900 text-xl font-extrabold uppercase tracking-wider">Configure Filters</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
                {/* 1. Hub Selection */}
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Select Hub</Text>
                
                <Pressable
                  onPress={() => setSelectedBusinessId('all')}
                  className={`px-4 py-3.5 border-b border-slate-100 flex-row items-center justify-between rounded-xl mb-2 ${selectedBusinessId === 'all' ? 'bg-slate-50' : ''}`}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="grid-outline" size={18} color={selectedBusinessId === 'all' ? '#000000' : '#64748B'} />
                    <Text className={`text-sm ml-3 ${selectedBusinessId === 'all' ? 'text-slate-900 font-extrabold' : 'text-slate-600 font-medium'}`}>
                      All Hubs (Portfolio)
                    </Text>
                  </View>
                  {selectedBusinessId === 'all' && <Ionicons name="checkmark-circle" size={20} color="#000000" />}
                </Pressable>

                {businessesData?.map((biz: any) => (
                  <Pressable
                    key={biz.id}
                    onPress={() => setSelectedBusinessId(biz.id)}
                    className={`px-4 py-3.5 border-b border-slate-100 flex-row items-center justify-between rounded-xl mb-2 ${selectedBusinessId === biz.id ? 'bg-slate-50' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="business-outline" size={18} color={selectedBusinessId === biz.id ? '#000000' : '#64748B'} />
                      <Text className={`text-sm ml-3 ${selectedBusinessId === biz.id ? 'text-slate-900 font-extrabold' : 'text-slate-600 font-medium'}`}>
                        {biz.salon_name}
                      </Text>
                    </View>
                    {selectedBusinessId === biz.id && <Ionicons name="checkmark-circle" size={20} color="#000000" />}
                  </Pressable>
                ))}

                <View className="h-[1px] bg-slate-100 my-5" />

                {/* 2. Date Selection */}
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Select Period</Text>
                
                {([
                  { key: 'all', label: 'All Dates', icon: 'infinite-outline', desc: '' },
                  { key: 'today', label: 'Today', icon: 'today-outline', desc: dateBounds.todayLabel },
                  { key: 'week', label: 'This Week', icon: 'calendar-outline', desc: dateBounds.weekLabel },
                  { key: 'month', label: 'This Month', icon: 'time-outline', desc: dateBounds.monthLabel },
                  { key: 'custom', label: 'Custom Date Range', icon: 'options-outline', desc: '' }
                ] as const).map((period) => (
                  <Pressable
                    key={period.key}
                    onPress={() => setDateFilter(period.key)}
                    className={`px-4 py-3.5 border-b border-slate-100 flex-row items-center justify-between rounded-xl mb-2 ${dateFilter === period.key ? 'bg-slate-50' : ''}`}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons name={period.icon as any} size={18} color={dateFilter === period.key ? '#000000' : '#64748B'} />
                      <View className="ml-3 flex-1">
                        <Text className={`text-sm ${dateFilter === period.key ? 'text-slate-900 font-extrabold' : 'text-slate-600 font-medium'}`}>
                          {period.label}
                        </Text>
                        {period.desc ? (
                          <Text className="text-slate-400 text-[10px] mt-0.5 font-semibold">
                            {period.desc}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {dateFilter === period.key && <Ionicons name="checkmark-circle" size={20} color="#000000" />}
                  </Pressable>
                ))}

                {/* Custom Date Range Inputs */}
                {dateFilter === 'custom' && (
                  <View className="flex-row gap-x-2 mt-4 px-2">
                    <View className="flex-1">
                      <Text className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Start Date</Text>
                      <TextInput
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">End Date</Text>
                      <TextInput
                        value={endDate}
                        onChangeText={setEndDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
                      />
                    </View>
                  </View>
                )}
              </ScrollView>

              <Pressable
                onPress={() => setShowFilter(false)} 
                className="bg-slate-900 py-4 rounded-full items-center justify-center active:bg-slate-800"
              >
                <Text className="text-white font-extrabold text-sm uppercase tracking-widest">Apply & Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
