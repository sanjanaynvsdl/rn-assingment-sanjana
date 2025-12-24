import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { CATEGORIES, PAYMENT_METHODS } from '../../constants/categories';

export default function AddExpense() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !selectedCategory || !selectedPayment) {
      Alert.alert('Error', 'Please fill amount, category and payment method');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await api.addExpense({
        amount: numAmount,
        category: selectedCategory,
        paymentMethod: selectedPayment,
        description: description.trim()
      });
      Alert.alert('Success', 'Expense added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      setAmount('');
      setDescription('');
      setSelectedCategory('');
      setSelectedPayment('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    return Colors.categories[categoryId as keyof typeof Colors.categories] || Colors.categories.Other;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Expense</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor={Colors.grayLight}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="What did you spend on?"
          placeholderTextColor={Colors.gray}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.optionsGrid}>
          {CATEGORIES.map(cat => {
            const catColor = getCategoryColor(cat.id);
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.optionCard,
                  isSelected && { backgroundColor: catColor.bg, borderColor: catColor.color }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View style={[styles.optionIcon, { backgroundColor: isSelected ? catColor.color : catColor.bg }]}>
                  <Ionicons name={cat.icon as any} size={20} color={isSelected ? Colors.white : catColor.icon} />
                </View>
                <Text style={[styles.optionLabel, isSelected && { color: catColor.color }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.paymentOptions}>
          {PAYMENT_METHODS.map(method => {
            const isSelected = selectedPayment === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.paymentChip, isSelected && styles.paymentChipActive]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <Ionicons
                  name={method.icon as any}
                  size={16}
                  color={isSelected ? Colors.white : Colors.gray}
                />
                <Text style={[styles.paymentText, isSelected && styles.paymentTextActive]}>
                  {method.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="add-circle" size={22} color={Colors.white} />
            <Text style={styles.submitText}>Add Expense</Text>
          </>
        )}
      </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.black
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg
  },
  currency: {
    fontSize: 40,
    fontWeight: '300',
    color: Colors.gray,
    marginRight: 4
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.black,
    minWidth: 150,
    textAlign: 'center'
  },
  inputSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: Spacing.sm
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.black
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm
  },
  optionCard: {
    width: '23%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  optionLabel: {
    fontSize: FontSizes.xs,
    color: Colors.gray,
    textAlign: 'center'
  },
  paymentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.grayLight
  },
  paymentChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  paymentText: {
    fontSize: FontSizes.sm,
    color: Colors.gray
  },
  paymentTextActive: {
    color: Colors.white,
    fontWeight: '500'
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: 120
  },
  submitText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.white
  }
});
