import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface CategoryData {
  _id: string;
  total: number;
  count: number;
}

interface Insight {
  category: string;
  changePercent: number;
  message: string;
  currentAmount: number;
}

export default function Stats() {
  const [period, setPeriod] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [total, setTotal] = useState(0);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [catRes, insightRes] = await Promise.all([
        api.getCategoryBreakdown(),
        api.getInsights()
      ]);
      setCategories(catRes.breakdown || []);
      setTotal(catRes.total || 0);
      setInsights(insightRes.insights || []);
    } catch (error) {
      console.log('Error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const getCategoryColor = (category: string) => {
    return Colors.categories[category as keyof typeof Colors.categories] || Colors.categories.Other;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      Food: 'restaurant',
      Transport: 'car',
      Shopping: 'cart',
      Entertainment: 'film',
      Bills: 'receipt',
      Health: 'medkit',
      Education: 'school',
      Other: 'ellipsis-horizontal'
    };
    return icons[category] || 'ellipsis-horizontal';
  };

  const maxAmount = Math.max(...categories.map(c => c.total), 1);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <TouchableOpacity style={styles.calendarBtn}>
          <Ionicons name="calendar-outline" size={22} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.periodTabs}>
        {(['Day', 'Week', 'Month', 'Year'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Spending</Text>
        <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        <Text style={styles.totalPeriod}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        <View style={styles.barChart}>
          {categories.map((cat, index) => {
            const catColor = getCategoryColor(cat._id);
            const barHeight = (cat.total / maxAmount) * 120;
            return (
              <View key={cat._id} style={styles.barContainer}>
                <Text style={styles.barValue}>${cat.total.toFixed(0)}</Text>
                <View style={[styles.bar, { height: barHeight, backgroundColor: catColor.color }]} />
                <View style={[styles.barIcon, { backgroundColor: catColor.bg }]}>
                  <Ionicons name={getCategoryIcon(cat._id) as any} size={14} color={catColor.icon} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {categories.map(cat => {
          const catColor = getCategoryColor(cat._id);
          const percentage = total > 0 ? (cat.total / total) * 100 : 0;
          return (
            <View key={cat._id} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: catColor.bg }]}>
                <Ionicons name={getCategoryIcon(cat._id) as any} size={20} color={catColor.icon} />
              </View>
              <View style={styles.categoryInfo}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{cat._id}</Text>
                  <Text style={styles.categoryAmount}>${cat.total.toFixed(2)}</Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: catColor.color }]} />
                </View>
                <Text style={styles.categoryMeta}>{cat.count} transactions • {percentage.toFixed(1)}%</Text>
              </View>
            </View>
          );
        })}
      </View>

      {insights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: insight.changePercent > 0 ? '#FEE2E2' : '#D1FAE5' }]}>
                <Ionicons
                  name={insight.changePercent > 0 ? 'trending-up' : 'trending-down'}
                  size={20}
                  color={insight.changePercent > 0 ? '#DC2626' : '#059669'}
                />
              </View>
              <View style={styles.insightInfo}>
                <Text style={styles.insightText}>{insight.message}</Text>
                <Text style={styles.insightAmount}>
                  Current: ${insight.currentAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.black
  },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center'
  },
  periodTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg
  },
  periodTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm
  },
  periodTabActive: {
    backgroundColor: Colors.primary
  },
  periodText: {
    fontSize: FontSizes.sm,
    color: Colors.gray,
    fontWeight: '500'
  },
  periodTextActive: {
    color: Colors.white
  },
  totalCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg
  },
  totalLabel: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)'
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.white,
    marginVertical: Spacing.xs
  },
  totalPeriod: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.7)'
  },
  chartSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    height: 200
  },
  barContainer: {
    alignItems: 'center'
  },
  barValue: {
    fontSize: FontSizes.xs,
    color: Colors.gray,
    marginBottom: 4
  },
  bar: {
    width: 24,
    borderRadius: 12,
    marginBottom: 8
  },
  barIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  categoryInfo: {
    flex: 1,
    marginLeft: Spacing.md
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  categoryName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.black
  },
  categoryAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.black
  },
  progressContainer: {
    height: 6,
    backgroundColor: Colors.grayLight,
    borderRadius: 3,
    marginBottom: 4
  },
  progressBar: {
    height: 6,
    borderRadius: 3
  },
  categoryMeta: {
    fontSize: FontSizes.xs,
    color: Colors.gray
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  insightInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center'
  },
  insightText: {
    fontSize: FontSizes.sm,
    color: Colors.black,
    fontWeight: '500'
  },
  insightAmount: {
    fontSize: FontSizes.xs,
    color: Colors.gray,
    marginTop: 2
  }
});
