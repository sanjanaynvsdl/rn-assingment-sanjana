import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
}

export default function Home() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [monthlyRes, dailyRes, expensesRes] = await Promise.all([
        api.getMonthlyStats(),
        api.getDailyStats(),
        api.getExpenses({ page: 1 })
      ]);
      setMonthlyTotal(monthlyRes.total || 0);
      setTodayTotal(dailyRes.total || 0);
      setExpenses(expensesRes.expenses || []);
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
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

  const getCategoryColor = (category: string) => {
    return Colors.categories[category as keyof typeof Colors.categories] || Colors.categories.Other;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{user?.name || 'User'}!</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Monthly Spending</Text>
          <View style={styles.monthBadge}>
            <Text style={styles.monthText}>{new Date().toLocaleDateString('en-US', { month: 'short' })}</Text>
          </View>
        </View>
        <Text style={styles.balanceAmount}>${monthlyTotal.toFixed(2)}</Text>
        <View style={styles.balanceFooter}>
          <View style={styles.todaySpend}>
            <Ionicons name="trending-up" size={16} color={Colors.white} />
            <Text style={styles.todayText}>Today: ${todayTotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.categories.Food.bg }]}>
            <Ionicons name="restaurant" size={20} color={Colors.categories.Food.icon} />
          </View>
          <Text style={styles.statLabel}>Food</Text>
          <Text style={styles.statValue}>
            ${expenses.filter(e => e.category === 'Food').reduce((sum, e) => sum + e.amount, 0).toFixed(0)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.categories.Transport.bg }]}>
            <Ionicons name="car" size={20} color={Colors.categories.Transport.icon} />
          </View>
          <Text style={styles.statLabel}>Transport</Text>
          <Text style={styles.statValue}>
            ${expenses.filter(e => e.category === 'Transport').reduce((sum, e) => sum + e.amount, 0).toFixed(0)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.categories.Shopping.bg }]}>
            <Ionicons name="cart" size={20} color={Colors.categories.Shopping.icon} />
          </View>
          <Text style={styles.statLabel}>Shopping</Text>
          <Text style={styles.statValue}>
            ${expenses.filter(e => e.category === 'Shopping').reduce((sum, e) => sum + e.amount, 0).toFixed(0)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {expenses.slice(0, 5).map((expense) => {
          const catColor = getCategoryColor(expense.category);
          return (
            <View key={expense._id} style={styles.transactionCard}>
              <View style={[styles.transactionIcon, { backgroundColor: catColor.bg }]}>
                <Ionicons name={getCategoryIcon(expense.category) as any} size={20} color={catColor.icon} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>{expense.description || expense.category}</Text>
                <Text style={styles.transactionDate}>{formatDate(expense.date)}</Text>
              </View>
              <Text style={styles.transactionAmount}>-${expense.amount.toFixed(2)}</Text>
            </View>
          );
        })}

        {expenses.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.grayLight} />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your spending!</Text>
          </View>
        )}
      </View>
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
  greeting: {
    fontSize: FontSizes.md,
    color: Colors.gray
  },
  name: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.black
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center'
  },
  balanceCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm
  },
  balanceLabel: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)'
  },
  monthBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm
  },
  monthText: {
    fontSize: FontSizes.xs,
    color: Colors.white,
    fontWeight: '600'
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.md
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  todaySpend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  todayText: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.9)'
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center'
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.gray,
    marginBottom: 2
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.black
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.black
  },
  seeAll: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500'
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  transactionInfo: {
    flex: 1,
    marginLeft: Spacing.md
  },
  transactionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.black
  },
  transactionDate: {
    fontSize: FontSizes.xs,
    color: Colors.gray,
    marginTop: 2
  },
  transactionAmount: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.secondary
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.gray,
    marginTop: Spacing.md
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.grayLight,
    marginTop: 4
  }
});
