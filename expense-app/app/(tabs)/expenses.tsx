import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { CATEGORIES } from '../../constants/categories';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const params = selectedCategory ? { category: selectedCategory } : {};
      const res = await api.getExpenses(params);
      setExpenses(res.expenses || []);
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [selectedCategory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteExpense(id);
            setExpenses(expenses.filter(e => e._id !== id));
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        }
      }
    ]);
  };

  const getCategoryColor = (category: string) => {
    return Colors.categories[category as keyof typeof Colors.categories] || Colors.categories.Other;
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat?.icon || 'ellipsis-horizontal';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderExpense = ({ item }: { item: Expense }) => {
    const catColor = getCategoryColor(item.category);
    return (
      <TouchableOpacity
        style={styles.expenseCard}
        onLongPress={() => handleDelete(item._id)}
      >
        <View style={[styles.expenseIcon, { backgroundColor: catColor.bg }]}>
          <Ionicons name={getCategoryIcon(item.category) as any} size={22} color={catColor.icon} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.description || item.category}</Text>
          <Text style={styles.expenseCategory}>{item.category} • {item.paymentMethod}</Text>
          <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.expenseAmount}>-${item.amount.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.slice(0, 5).map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <Text style={[styles.filterText, selectedCategory === cat.id && styles.filterTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        renderItem={renderExpense}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={Colors.grayLight} />
              <Text style={styles.emptyText}>No expenses found</Text>
              <Text style={styles.emptySubtext}>
                {selectedCategory ? `No ${selectedCategory} expenses` : 'Start adding your expenses'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.black
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: Spacing.xs
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grayLight
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  filterText: {
    fontSize: FontSizes.sm,
    color: Colors.gray
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: '500'
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  expenseInfo: {
    flex: 1,
    marginLeft: Spacing.md
  },
  expenseTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.black
  },
  expenseCategory: {
    fontSize: FontSizes.xs,
    color: Colors.gray,
    marginTop: 2
  },
  expenseDate: {
    fontSize: FontSizes.xs,
    color: Colors.grayLight,
    marginTop: 2
  },
  expenseAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.secondary
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2
  },
  emptyText: {
    fontSize: FontSizes.lg,
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
