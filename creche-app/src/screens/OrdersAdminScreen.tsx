import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  BackHandler,
  SafeAreaView,
} from 'react-native';
import {
  listOrdersByAdmin,
  updateOrderStatus,
  getCurrentWeekMonday,
  getMondayOfWeek,
  formatWeekString,
  Order,
} from '../services/lunch';
import { fetchAllChildren, Child } from '../services/children';

type OrdersAdminScreenProps = {
  onNavigateBack?: () => void;
};

export default function OrdersAdminScreen({ onNavigateBack }: OrdersAdminScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(getCurrentWeekMonday());
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'paid' | 'cancelled' | undefined>(undefined);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedWeek, selectedStatus]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onNavigateBack) {
        onNavigateBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [onNavigateBack]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, childrenData] = await Promise.all([
        listOrdersByAdmin(selectedWeek, selectedStatus),
        fetchAllChildren(),
      ]);
      setOrders(ordersData);
      setChildren(childrenData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const changeWeek = (offset: number) => {
    if (!selectedWeek) {
      setSelectedWeek(getCurrentWeekMonday());
      return;
    }
    const currentDate = new Date(selectedWeek);
    currentDate.setDate(currentDate.getDate() + (offset * 7));
    setSelectedWeek(getMondayOfWeek(currentDate));
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: 'pending' | 'paid' | 'cancelled'
  ) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      Alert.alert('Success', `Order status updated to ${newStatus}`);
      await loadData();
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const confirmStatusChange = (orderId: string, newStatus: 'pending' | 'paid' | 'cancelled') => {
    Alert.alert(
      'Confirm Status Change',
      `Change order status to ${newStatus.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => handleUpdateStatus(orderId, newStatus),
        },
      ]
    );
  };

  const getChildName = (childId: string): string => {
    const child = children.find((c) => c.id === childId);
    return child?.name || 'Unknown Child';
  };

  const calculateTotalRevenue = (): number => {
    return orders
      .filter((order) => order.status === 'paid')
      .reduce((sum, order) => sum + order.total, 0);
  };

  const getWeekOptions = () => {
    const weeks: string[] = [];
    const today = new Date();
    
    // Generate 8 weeks (4 past, current, 3 future)
    for (let i = -4; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + (i * 7));
      weeks.push(getMondayOfWeek(date));
    }
    
    return weeks;
  };

  const getStatusLabel = () => {
    if (selectedStatus === undefined) return 'All Statuses';
    return selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1);
  };

  const getWeekLabel = () => {
    if (selectedWeek === undefined) return 'All Weeks';
    return formatWeekString(selectedWeek);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* Week Picker Modal */}
      <Modal
        visible={showWeekPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeekPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Week</Text>
            <ScrollView>
              <TouchableOpacity
                style={[
                  styles.option,
                  selectedWeek === undefined && styles.optionSelected,
                ]}
                onPress={() => {
                  setSelectedWeek(undefined);
                  setShowWeekPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedWeek === undefined && styles.optionTextSelected,
                  ]}
                >
                  All Weeks
                </Text>
              </TouchableOpacity>
              {getWeekOptions().map((week) => (
                <TouchableOpacity
                  key={week}
                  style={[
                    styles.option,
                    selectedWeek === week && styles.optionSelected,
                  ]}
                  onPress={() => {
                    setSelectedWeek(week);
                    setShowWeekPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedWeek === week && styles.optionTextSelected,
                    ]}
                  >
                    {formatWeekString(week)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowWeekPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Status</Text>
            <TouchableOpacity
              style={[
                styles.option,
                selectedStatus === undefined && styles.optionSelected,
              ]}
              onPress={() => {
                setSelectedStatus(undefined);
                setShowStatusPicker(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedStatus === undefined && styles.optionTextSelected,
                ]}
              >
                All Statuses
              </Text>
            </TouchableOpacity>
            {(['pending', 'paid', 'cancelled'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.option,
                  selectedStatus === status && styles.optionSelected,
                ]}
                onPress={() => {
                  setSelectedStatus(status);
                  setShowStatusPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedStatus === status && styles.optionTextSelected,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStatusPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Lunch Orders</Text>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowWeekPicker(true)}
        >
          <Text style={styles.filterLabel}>Week:</Text>
          <Text style={styles.filterValue}>{getWeekLabel()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowStatusPicker(true)}
        >
          <Text style={styles.filterLabel}>Status:</Text>
          <Text style={styles.filterValue}>{getStatusLabel()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Orders</Text>
          <Text style={styles.statValue}>{orders.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Revenue (Paid)</Text>
          <Text style={styles.statValue}>R{calculateTotalRevenue().toFixed(2)}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.noOrdersText}>No orders found</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderWeek}>
                  {formatWeekString(order.weekOf)}
                </Text>
                <Text
                  style={[
                    styles.orderStatus,
                    order.status === 'paid' && styles.statusPaid,
                    order.status === 'pending' && styles.statusPending,
                    order.status === 'cancelled' && styles.statusCancelled,
                  ]}
                >
                  {order.status.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.orderChild}>Child: {getChildName(order.childId)}</Text>
              <Text style={styles.orderTotal}>Total: R{order.total.toFixed(2)}</Text>
              <Text style={styles.orderDate}>
                Placed: {order.createdAt.toLocaleDateString()}
              </Text>

              <View style={styles.orderActions}>
                {order.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.paidButton]}
                      onPress={() => confirmStatusChange(order.id, 'paid')}
                    >
                      <Text style={styles.actionButtonText}>Mark Paid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => confirmStatusChange(order.id, 'cancelled')}
                    >
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
                {order.status === 'paid' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.refundButton]}
                    onPress={() => confirmStatusChange(order.id, 'cancelled')}
                  >
                    <Text style={styles.actionButtonText}>Refund/Cancel</Text>
                  </TouchableOpacity>
                )}
                {order.status === 'cancelled' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.restoreButton]}
                    onPress={() => confirmStatusChange(order.id, 'pending')}
                  >
                    <Text style={styles.actionButtonText}>Restore</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  filters: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  filterLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  filterValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  stats: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderWeek: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
  },
  statusPaid: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
  statusCancelled: {
    backgroundColor: '#F8D7DA',
    color: '#721C24',
  },
  orderChild: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  paidButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  refundButton: {
    backgroundColor: '#FF9500',
  },
  restoreButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  noOrdersText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    borderRadius: 6,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: '#007AFF15',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
