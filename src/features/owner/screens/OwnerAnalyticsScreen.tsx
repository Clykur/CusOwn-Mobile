import { THEME } from '@/theme/theme';
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useOwnerBusinesses, useOwnerAnalytics } from '@/hooks/useOwner';
import Svg, {
  Path,
  Circle,
  Rect,
  Line as SvgLine,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';
type TrendTabType = 'bookings' | 'revenue';

type MetricCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  delay?: number;
};

const MetricCard = ({
  title,
  value,
  icon,
  iconColor = THEME.colors.primary,
  delay = 0,
}: MetricCardProps) => (
  <AnimatedSection delay={delay} direction="up" className="flex-1">
    <GlassCard className="p-5 border border-border rounded-full overflow-hidden relative min-h-44 justify-between">
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={22} color={iconColor} />

        <Text
          className="text-textSecondary text-xs font-extrabold uppercase tracking-0.5 flex-1"
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <Text
        className="text-text text-4xl font-black leading-none mt-4"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {value}
      </Text>
    </GlassCard>
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
  const [activeHourIndex, setActiveHourIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(300);

  const {
    data: businessesData,
    isLoading: businessesLoading,
    refetch: refetchBusinesses,
  } = useOwnerBusinesses();

  // Compute exact human-readable date bounds for the filters
  const dateBounds = useMemo(() => {
    const now = new Date();

    const formatLabelDate = (d: Date) => {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
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
      monthLabel: `${formatLabelDate(monthStart)} - ${formatLabelDate(monthEnd)}`,
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
      aggregated: true,
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
    error: apiError,
  } = useOwnerAnalytics(analyticsParams);

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchBusinesses(), refetchAnalytics()]);
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
      dateStr =
        startDate || endDate
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
          revenue: 0,
        };
      });
    }

    return rawDaily.map((d: any) => {
      const parsedDate = new Date(d.date.split(/[T ]/)[0]);
      return {
        label: `${parsedDate.getDate()} ${parsedDate.toLocaleString('default', { month: 'short' })}`,
        bookingCount: d.totalBookings || 0,
        revenue: (d.revenue ?? 0) / 100,
      };
    });
  }, [analytics]);

  // Max values for scaling bar charts
  const maxTrendValue = useMemo(() => {
    const values = dailyPoints.map((p: any) =>
      trendTab === 'bookings' ? p.bookingCount : p.revenue,
    );
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
        total,
      };
    }

    return {
      confirmedPct: Math.round((confirmed / total) * 100),
      rejectedPct: Math.round((rejected / total) * 100),
      cancelledPct: Math.round((cancelled / total) * 100),
      confirmed,
      rejected,
      cancelled,
      total,
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
        { label: '05:00 PM', count: 0 },
      ];
    }
    return [...rawPeak]
      .sort((a, b) => a.hour - b.hour)
      .map((p: any) => {
        const ampm = p.hour >= 12 ? 'PM' : 'AM';
        const displayHour = p.hour % 12 === 0 ? 12 : p.hour % 12;
        return {
          label: `${displayHour}:00 ${ampm}`,
          count: p.bookingCount || 0,
        };
      });
  }, [analytics]);

  const maxPeakCount = useMemo(() => {
    return Math.max(...peakHoursData.map((p) => p.count), 1);
  }, [peakHoursData]);

  const peakHoursPoints = useMemo(() => {
    const minVal = 0;
    const maxVal = maxPeakCount;
    const height = 180;
    const padding = { top: 20, right: 15, bottom: 25, left: 30 };
    return peakHoursData.map((d, i) => {
      const x =
        padding.left +
        (i / (peakHoursData.length - 1 || 1)) * (chartWidth - padding.left - padding.right);
      const y =
        height -
        padding.bottom -
        ((d.count - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
      return { x, y, val: d.count, label: d.label };
    });
  }, [peakHoursData, maxPeakCount, chartWidth]);

  // Compute Service Popularity
  const servicesData = useMemo(() => {
    const rawServices =
      analytics?.advanced?.servicePopularityRanking || analytics?.overview?.services || [];
    if (rawServices.length === 0) {
      return [
        { name: 'Standard Treatment', count: 0 },
        { name: 'Quick Treatment', count: 0 },
      ];
    }
    return rawServices.map((s: any) => ({
      name: s.serviceName || s.name || 'Service',
      count: s.bookingCount || s.count || 0,
    }));
  }, [analytics]);

  const maxServiceCount = useMemo(() => {
    return Math.max(...servicesData.map((s: any) => s.count), 1);
  }, [servicesData]);

  if (businessesLoading || (analyticsLoading && !analytics)) {
    return (
      <PremiumBackground>
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
      </PremiumBackground>
    );
  }

  if (analyticsError) {
    return (
      <PremiumBackground>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 justify-center items-center px-luxury">
            <GlassCard className="items-center w-full bg-card border border-border p-6">
              <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.background} />
              <Text className="text-text text-lg font-bold mt-4 text-center">Sync Error</Text>
              <Text className="text-textSecondary text-center mt-2 mb-8 text-sm font-medium">
                We couldn't fetch your analytics data. Please check your connection or try again
                later.
                {apiError instanceof Error ? `\n\nError: ${apiError.message}` : ''}
              </Text>
              <Pressable
                onPress={onRefresh}
                className="bg-primary py-4 px-10 rounded-full items-center justify-center active:opacity-80 w-full"
              >
                <Text className="text-background font-extrabold text-sm uppercase tracking-widest">
                  Retry Sync
                </Text>
              </Pressable>
            </GlassCard>
          </View>
        </SafeAreaView>
      </PremiumBackground>
    );
  }

  const noData = !analytics?.overview || analytics?.overview?.totalBookings === 0;

  return (
    <PremiumBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Cinematic Header & Filter Action */}
        <View className="px-luxury pt-5 pb-2 flex-row justify-between items-center">
          <View className="flex-1 mr-4">
            <Text className="text-textSecondary text-xs font-black uppercase tracking-1 mb-1">
              Performance
            </Text>
            <Text className="text-text text-3xl font-black tracking-tight">Analytics</Text>
            <Text className="text-textSecondary text-xs mt-1" numberOfLines={1}>
              {filterSummary}
            </Text>
          </View>
          <Pressable onPress={() => setShowFilter(true)} className="p-3">
            <Ionicons name="funnel-outline" size={20} color={THEME.colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-12"
          refreshControl={
            <RefreshControl
              refreshing={analyticsLoading}
              onRefresh={onRefresh}
              tintColor={THEME.colors.background}
            />
          }
        >
          {noData && !analyticsLoading ? (
            <AnimatedSection className="px-luxury pt-6 items-center">
              <GlassCard className="border border-border w-full p-2 items-center justify-center rounded-luxury">
                {/* Icon */}
                <View className="items-center justify-center mb-6">
                  <Ionicons name="analytics-outline" size={40} color={THEME.colors.text} />
                </View>

                {/* Title */}
                <Text className="text-text text-xl font-bold text-center mb-2">
                  No Data Available
                </Text>

                {/* Description */}
                <Text className="text-textSecondary text-center px-4 text-sm font-medium leading-relaxed">
                  There is no performance data for the selected period or business hub.
                </Text>
              </GlassCard>
            </AnimatedSection>
          ) : (
            <>
              {/* Key Metrics */}
              <View className="px-luxury pt-6 mb-6">
                <AnimatedSection direction="up">
                  <GlassCard className="border-border p-8 rounded-luxury overflow-hidden relative">
                    <Text className="text-textSecondary text-xs font-black uppercase tracking-widest mb-2">
                      Total Revenue
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-text text-4xl font-extrabold tracking-tight">
                        ₹{((analytics?.overview?.totalRevenueCents || 0) / 100).toLocaleString()}
                      </Text>
                      <View className="ml-3 bg-secondary/60 px-2 py-1 rounded-md flex-row items-center border border-primary/20">
                        <Ionicons name="trending-up" size={12} color={THEME.colors.primary} />
                        <Text className="text-primary text-xs font-bold ml-1">+12%</Text>
                      </View>
                    </View>
                  </GlassCard>
                </AnimatedSection>
              </View>

              <View className="px-luxury mb-8">
                <View className="flex-row gap-x-2 mb-4">
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
                </View>

                <View className="flex-row gap-x-2">
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
              </View>

              {/* Trend Charts (Interactive Columns View) */}
              <View className="px-luxury mb-6">
                <AnimatedSection direction="up" delay={450}>
                  <GlassCard className="border-border p-2 rounded-luxury">
                    <View className="flex-row items-center justify-between mb-6">
                      <View>
                        <Text className="text-text text-base font-extrabold">Activity Trends</Text>
                        {activeBarIndex !== null && dailyPoints[activeBarIndex] && (
                          <Text className="text-primary text-xs font-bold mt-0.5">
                            {dailyPoints[activeBarIndex].label}:{' '}
                            {trendTab === 'bookings'
                              ? `${dailyPoints[activeBarIndex].bookingCount} bookings`
                              : `₹${Math.round(dailyPoints[activeBarIndex].revenue)}`}
                          </Text>
                        )}
                      </View>

                      {/* Sub-tabs */}
                      <View className="flex-row bg-input p-1 rounded-full border border-border">
                        <Pressable
                          onPress={() => {
                            setTrendTab('bookings');
                            setActiveBarIndex(null);
                          }}
                          className={`px-4 py-1.5 rounded-full ${trendTab === 'bookings' ? 'bg-card' : ''}`}
                        >
                          <Text
                            className={`text-xs font-bold ${trendTab === 'bookings' ? 'text-primary' : 'text-textSecondary'}`}
                          >
                            Bookings
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setTrendTab('revenue');
                            setActiveBarIndex(null);
                          }}
                          className={`px-4 py-1.5 rounded-full ${trendTab === 'revenue' ? 'bg-card' : ''}`}
                        >
                          <Text
                            className={`text-xs font-bold ${trendTab === 'revenue' ? 'text-primary' : 'text-textSecondary'}`}
                          >
                            Revenue
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Chart Core */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerClassName="h-52 items-end pb-2"
                    >
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
                              <View className="absolute -top-12 bg-card border border-border px-2.5 py-1 rounded-lg items-center justify-center z-10">
                                <Text className="text-primary text-xs font-bold">
                                  {trendTab === 'bookings' ? `${val}` : `₹${Math.round(val)}`}
                                </Text>
                                <View className="w-1.5 h-1.5 bg-card rotate-45 -mb-1 mt-0.5" />
                              </View>
                            )}

                            <View
                              style={[{ height: barHeight }]}
                              className={`w-8 rounded-t-lg transition-colors ${
                                isActive ? 'bg-primary' : 'bg-border'
                              }`}
                            />
                            <Text className="text-textSecondary text-xs font-bold mt-2">
                              {point.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </GlassCard>
                </AnimatedSection>
              </View>

              {/* Status Breakdown & Peak Hours Section */}
              <View className="px-luxury mb-6">
                <AnimatedSection direction="up" delay={500}>
                  <GlassCard className="border-border p-2 rounded-luxury mb-6">
                    <Text className="text-text text-base font-extrabold mb-4">
                      Booking Status Allocation
                    </Text>

                    {/* Stacked percentage bar */}
                    <View className="h-4 bg-input rounded-full flex-row overflow-hidden mb-6">
                      {statusSummary.confirmedPct > 0 && (
                        <View
                          style={[{ width: `${statusSummary.confirmedPct}%` }]}
                          className="bg-primary h-full"
                        />
                      )}
                      {statusSummary.rejectedPct > 0 && (
                        <View
                          style={[{ width: `${statusSummary.rejectedPct}%` }]}
                          className="bg-error h-full"
                        />
                      )}
                      {statusSummary.cancelledPct > 0 && (
                        <View
                          style={[{ width: `${statusSummary.cancelledPct}%` }]}
                          className="bg-disabled h-full"
                        />
                      )}
                    </View>

                    {/* Breakdown numbers */}
                    <View className="space-y-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-3 h-3 bg-primary rounded-full mr-2" />
                          <Text className="text-textSecondary text-xs font-semibold">
                            Confirmed
                          </Text>
                        </View>
                        <Text className="text-text text-xs font-extrabold">
                          {statusSummary.confirmed} ({statusSummary.confirmedPct}%)
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-3 h-3 bg-error rounded-full mr-2" />
                          <Text className="text-textSecondary text-xs font-semibold">Rejected</Text>
                        </View>
                        <Text className="text-text text-xs font-extrabold">
                          {statusSummary.rejected} ({statusSummary.rejectedPct}%)
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-3 h-3 bg-disabled rounded-full mr-2" />
                          <Text className="text-textSecondary text-xs font-semibold">
                            Cancelled
                          </Text>
                        </View>
                        <Text className="text-text text-xs font-extrabold">
                          {statusSummary.cancelled} ({statusSummary.cancelledPct}%)
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </AnimatedSection>

                {/* Peak Booking Hours */}
                <AnimatedSection direction="up" delay={550}>
                  <GlassCard className="border border-border p-2 rounded-full mb-6">
                    {/* Header */}
                    <View className="mb-5">
                      <Text className="text-text text-lg font-black">Peak Traffic Hours</Text>

                      <Text className="text-textSecondary text-xs mt-1">
                        Customer activity throughout the day
                      </Text>
                    </View>

                    {/* Graph */}
                    <View className="w-full h-45">
                      {(() => {
                        const height = 180;
                        const padding = { top: 20, right: 15, bottom: 25, left: 30 };
                        const pathD = peakHoursPoints
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                          .join(' ');
                        const areaD =
                          peakHoursPoints.length > 0
                            ? `${pathD} L ${peakHoursPoints[peakHoursPoints.length - 1].x} ${height - padding.bottom} L ${peakHoursPoints[0].x} ${height - padding.bottom} Z`
                            : '';

                        const yTicks = 4;
                        const yTicksList = Array.from({ length: yTicks }, (_, i) => {
                          const val = Math.round((i / (yTicks - 1)) * maxPeakCount);
                          const y =
                            height -
                            padding.bottom -
                            (i / (yTicks - 1)) * (height - padding.top - padding.bottom);
                          return { val, y };
                        });

                        return (
                          <View
                            className="w-full relative"
                            style={[{ height }]}
                            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width || 300)}
                          >
                            {activeHourIndex !== null && peakHoursPoints[activeHourIndex] && (
                              <View
                                className="absolute bg-background px-2 py-1 rounded-md"
                                style={[
                                  {
                                    left: Math.max(
                                      10,
                                      Math.min(
                                        chartWidth - 90,
                                        peakHoursPoints[activeHourIndex].x - 40,
                                      ),
                                    ),
                                    top: Math.max(0, peakHoursPoints[activeHourIndex].y - 35),
                                    zIndex: 10,
                                    shadowColor: THEME.colors.background,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                  },
                                ]}
                              >
                                <Text className="text-text text-xs font-bold">
                                  {peakHoursPoints[activeHourIndex].val}
                                </Text>
                              </View>
                            )}

                            <Svg width="100%" height="100%">
                              <Defs>
                                <LinearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                                  <Stop
                                    offset="0%"
                                    stopColor={THEME.colors.primary}
                                    stopOpacity="0.25"
                                  />
                                  <Stop
                                    offset="100%"
                                    stopColor={THEME.colors.primary}
                                    stopOpacity="0.0"
                                  />
                                </LinearGradient>
                              </Defs>

                              {/* Horizontal grid lines and Y-axis text */}
                              {yTicksList.map((tick, i) => (
                                <G key={i}>
                                  <SvgLine
                                    x1={padding.left}
                                    y1={tick.y}
                                    x2={chartWidth - padding.right}
                                    y2={tick.y}
                                    stroke={THEME.colors.border}
                                    strokeDasharray="4 4"
                                    strokeWidth="1"
                                  />
                                  {String(tick.val)
                                    .split('')
                                    .map((char, charIdx, arr) => {
                                      const digitHeight = 9;
                                      const offset = (charIdx - (arr.length - 1) / 2) * digitHeight;
                                      return (
                                        <SvgText
                                          key={charIdx}
                                          x={padding.left - 12}
                                          y={tick.y + offset + 3}
                                          fontSize="9"
                                          fill={THEME.colors.textSecondary}
                                          textAnchor="middle"
                                          fontWeight="bold"
                                        >
                                          {char}
                                        </SvgText>
                                      );
                                    })}
                                </G>
                              ))}

                              {/* Area under curve */}
                              {areaD ? <Path d={areaD} fill="url(#peakGradient)" /> : null}

                              {/* Line itself */}
                              {pathD ? (
                                <Path
                                  d={pathD}
                                  fill="none"
                                  stroke={THEME.colors.primary}
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              ) : null}

                              {/* Dots */}
                              {peakHoursPoints.map((p, i) => (
                                <Circle
                                  key={i}
                                  cx={p.x}
                                  cy={p.y}
                                  r={activeHourIndex === i ? 6 : 4}
                                  fill={
                                    activeHourIndex === i
                                      ? THEME.colors.primary
                                      : THEME.colors.secondary
                                  }
                                />
                              ))}

                              {/* X-axis labels */}
                              {peakHoursPoints.map((p, i) => {
                                if (peakHoursPoints.length > 6 && i % 2 !== 0) return null;
                                return (
                                  <SvgText
                                    key={i}
                                    x={p.x}
                                    y={height - 6}
                                    fontSize="9"
                                    fill={THEME.colors.textSecondary}
                                    textAnchor="middle"
                                    fontWeight="bold"
                                  >
                                    {p.label.replace(':00 ', ' ')}
                                  </SvgText>
                                );
                              })}

                              {/* Column interaction targets */}
                              {peakHoursPoints.map((p, i) => {
                                const colWidth = chartWidth / (peakHoursPoints.length || 1);
                                return (
                                  <Rect
                                    key={i}
                                    x={p.x - colWidth / 2}
                                    y={0}
                                    width={colWidth}
                                    height={height}
                                    fill="transparent"
                                    onPressIn={() => setActiveHourIndex(i)}
                                  />
                                );
                              })}
                            </Svg>
                          </View>
                        );
                      })()}
                    </View>
                  </GlassCard>
                </AnimatedSection>

                {/* Service Performance Rankings */}
                <AnimatedSection direction="up" delay={600}>
                  <GlassCard className="border-border p-2 rounded-luxury">
                    <Text className="text-text text-base font-extrabold mb-4">
                      Popular Treatments
                    </Text>

                    <View className="space-y-2">
                      {servicesData.map((service: any, index: number) => {
                        const widthPct = Math.max((service.count / maxServiceCount) * 100, 3);
                        return (
                          <View key={index} className="space-y-2">
                            <View className="flex-row justify-between items-center mt-1 mb-1">
                              <Text
                                className="text-textSecondary text-xs font-bold"
                                numberOfLines={1}
                              >
                                {service.name}
                              </Text>
                              <Text className="text-text text-xs font-extrabold ml-2">
                                {service.count} book
                              </Text>
                            </View>
                            <View className="bg-input h-2.5 rounded-full overflow-hidden w-full">
                              <View
                                style={[{ width: `${widthPct}%` }]}
                                className="bg-primary h-full rounded-full"
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </GlassCard>
                </AnimatedSection>
              </View>
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
            className="flex-1 justify-end bg-black/70"
            onPress={() => setShowFilter(false)}
          >
            <View className="bg-card rounded-t-3xl p-6 border-t border-border max-h-full flex-1">
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 bg-border rounded-full mb-6" />
                <Text className="text-text text-xl font-black uppercase tracking-wider">
                  Configure Filters
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
                {/* 1. Business Selection */}
                <Text className="text-xs text-textSecondary font-black uppercase tracking-0.5 mb-3">
                  Select Business
                </Text>

                <Pressable
                  onPress={() => setSelectedBusinessId('all')}
                  className={`px-4 py-3.5 border-b border-border flex-row items-center justify-between rounded-xl mb-2 ${selectedBusinessId === 'all' ? 'bg-input' : ''}`}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="grid-outline"
                      size={18}
                      color={
                        selectedBusinessId === 'all'
                          ? THEME.colors.primary
                          : THEME.colors.textSecondary
                      }
                    />
                    <Text
                      className={`text-sm ml-3 ${selectedBusinessId === 'all' ? 'text-primary font-extrabold' : 'text-textSecondary font-medium'}`}
                    >
                      All Hubs (Portfolio)
                    </Text>
                  </View>
                  {selectedBusinessId === 'all' && (
                    <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                  )}
                </Pressable>

                {businessesData?.map((biz: any) => (
                  <Pressable
                    key={biz.id}
                    onPress={() => setSelectedBusinessId(biz.id)}
                    className={`px-4 py-3.5 border-b border-border flex-row items-center justify-between rounded-xl mb-2 ${selectedBusinessId === biz.id ? 'bg-input' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="business-outline"
                        size={18}
                        color={
                          selectedBusinessId === biz.id
                            ? THEME.colors.primary
                            : THEME.colors.textSecondary
                        }
                      />
                      <Text
                        className={`text-sm ml-3 ${selectedBusinessId === biz.id ? 'text-primary font-extrabold' : 'text-textSecondary font-medium'}`}
                      >
                        {biz.salon_name}
                      </Text>
                    </View>
                    {selectedBusinessId === biz.id && (
                      <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                    )}
                  </Pressable>
                ))}

                <View className="h-hairline bg-border my-5" />

                {/* 2. Date Selection */}
                <Text className="text-xs text-textSecondary font-black uppercase tracking-0.5 mb-3">
                  Select Period
                </Text>

                {(
                  [
                    { key: 'all', label: 'All Dates', icon: 'infinite-outline', desc: '' },
                    {
                      key: 'today',
                      label: 'Today',
                      icon: 'today-outline',
                      desc: dateBounds.todayLabel,
                    },
                    {
                      key: 'week',
                      label: 'This Week',
                      icon: 'calendar-outline',
                      desc: dateBounds.weekLabel,
                    },
                    {
                      key: 'month',
                      label: 'This Month',
                      icon: 'time-outline',
                      desc: dateBounds.monthLabel,
                    },
                    {
                      key: 'custom',
                      label: 'Custom Date Range',
                      icon: 'options-outline',
                      desc: '',
                    },
                  ] as const
                ).map((period) => (
                  <Pressable
                    key={period.key}
                    onPress={() => setDateFilter(period.key)}
                    className={`px-4 py-3.5 border-b border-border flex-row items-center justify-between rounded-xl mb-2 ${dateFilter === period.key ? 'bg-input' : ''}`}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Ionicons
                        name={period.icon as any}
                        size={18}
                        color={
                          dateFilter === period.key
                            ? THEME.colors.primary
                            : THEME.colors.textSecondary
                        }
                      />
                      <View className="ml-3 flex-1">
                        <Text
                          className={`text-sm ${dateFilter === period.key ? 'text-primary font-extrabold' : 'text-textSecondary font-medium'}`}
                        >
                          {period.label}
                        </Text>
                        {period.desc ? (
                          <Text className="text-textSecondary text-xs mt-0.5 font-semibold">
                            {period.desc}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {dateFilter === period.key && (
                      <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                    )}
                  </Pressable>
                ))}

                {/* Custom Date Range Inputs */}
                {dateFilter === 'custom' && (
                  <View className="flex-row gap-x-2 mt-4 px-2">
                    <View className="flex-1">
                      <Text className="text-xs text-textSecondary font-bold uppercase tracking-wider mb-1.5">
                        Start Date
                      </Text>
                      <TextInput
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={THEME.colors.textSecondary}
                        className="bg-input border border-border rounded-xl px-4 py-2.5 text-xs text-text"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-textSecondary font-bold uppercase tracking-wider mb-1.5">
                        End Date
                      </Text>
                      <TextInput
                        value={endDate}
                        onChangeText={setEndDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={THEME.colors.textSecondary}
                        className="bg-input border border-border rounded-xl px-4 py-2.5 text-xs text-text"
                      />
                    </View>
                  </View>
                )}
              </ScrollView>

              <Pressable
                onPress={() => setShowFilter(false)}
                className="bg-primary py-4 rounded-full items-center justify-center active:opacity-80"
              >
                <Text className="text-background font-black text-sm uppercase tracking-widest">
                  Apply & Close
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </PremiumBackground>
  );
}
