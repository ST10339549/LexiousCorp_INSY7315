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
import { fetchChildrenOnce, Child } from '../services/children';
import {
  getActiveMenuForWeek,
  placeOrder,
  listOrdersByParent,
  getCurrentWeekMonday,
  getMondayOfWeek,
  formatWeekString,
  MenuItem,
  Menu,
  Order,
} from '../services/lunch';

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

interface Selection {
  day: DayOfWeek;
  itemId: string;
  itemName: string;
  price: number;
  qty: number;
}

type LunchOrderScreenProps = {
  userId?: string;
  onNavigateBack?: () => void;
};

export default function LunchOrderScreen({ userId, onNavigateBack }: LunchOrderScreenProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentWeekMonday());
  const [menu, setMenu] = useState<Menu | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);

  useEffect(() => {
    loadChildren();
    loadOrderHistory();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      loadMenu();
    }
  }, [selectedWeek]);

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

  const loadChildren = async () => {
    if (!userId) return;
    
    try {
      const childrenData = await fetchChildrenOnce(userId);
      setChildren(childrenData);
      
      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children');
    }
  };

  const loadMenu = async () => {
    setLoading(true);
    try {
      const menuData = await getActiveMenuForWeek(selectedWeek);
      setMenu(menuData);
      setSelections([]); // Reset selections when changing weeks
    } catch (error) {
      console.error('Error loading menu:', error);
      Alert.alert('Error', 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderHistory = async () => {
    if (!userId) return;
    
    try {
      const orders = await listOrdersByParent(userId);
      setOrderHistory(orders);
    } catch (error) {
      console.error('Error loading order history:', error);
    }
  };

  const changeWeek = (offset: number) => {
    const currentDate = new Date(selectedWeek);
    currentDate.setDate(currentDate.getDate() + (offset * 7));
    setSelectedWeek(getMondayOfWeek(currentDate));
  };

  const addToSelection = (item: MenuItem) => {
    const existing = selections.find(
      (s) => s.day === item.day && s.itemId === item.id
    );

    if (existing) {
      setSelections(
        selections.map((s) =>
          s.day === item.day && s.itemId === item.id
            ? { ...s, qty: s.qty + 1 }
            : s
        )
      );
    } else {
      setSelections([
        ...selections,
        {
          day: item.day,
          itemId: item.id,
          itemName: item.name,
          price: item.price,
          qty: 1,
        },
      ]);
    }
  };

  const updateQuantity = (itemId: string, day: DayOfWeek, qty: number) => {
    if (qty <= 0) {
      setSelections(
        selections.filter((s) => !(s.itemId === itemId && s.day === day))
      );
    } else {
      setSelections(
        selections.map((s) =>
          s.itemId === itemId && s.day === day ? { ...s, qty } : s
        )
      );
    }
  };

  const calculateTotal = () => {
    return selections.reduce((sum, s) => sum + s.price * s.qty, 0);
  };

  const submitOrder = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to place an order');
      return;
    }

    if (!selectedChildId) {
      Alert.alert('Error', 'Please select a child');
      return;
    }

    if (selections.length === 0) {
      Alert.alert('Error', 'Please add at least one item to your order');
      return;
    }

    // Check if order already exists for this child and week
    const existingOrder = orderHistory.find(
      (order) =>
        order.childId === selectedChildId &&
        order.weekOf === selectedWeek &&
        order.status !== 'cancelled'
    );

    if (existingOrder) {
      Alert.alert(
        'Order Exists',
        'An order already exists for this child and week. Please cancel it first or choose a different week.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Place order for ${formatWeekString(selectedWeek)}?\nTotal: R${calculateTotal().toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: async () => {
            setSubmitting(true);
            try {
              const orderSelections = selections.map((s) => ({
                day: s.day,
                itemId: s.itemId,
                qty: s.qty,
              }));

              await placeOrder(
                userId,
                selectedChildId,
                selectedWeek,
                orderSelections,
                calculateTotal()
              );

              Alert.alert('Success', 'Order placed successfully!');
              setSelections([]);
              await loadOrderHistory();
            } catch (error) {
              console.error('Error placing order:', error);
              Alert.alert('Error', 'Failed to place order');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getItemsForDay = (day: DayOfWeek): MenuItem[] => {
    if (!menu) return [];
    return menu.items.filter((item) => item.day === day);
  };

  const getSelectionsForDay = (day: DayOfWeek): Selection[] => {
    return selections.filter((s) => s.day === day);
  };

  const getChildName = (childId: string): string => {
    const child = children.find((c) => c.id === childId);
    return child?.name || 'Unknown';
  };

  if (children.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noChildrenText}>
          You need to add a child before ordering lunch
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onNavigateBack && onNavigateBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getSelectedChildName = () => {
    const child = children.find((c) => c.id === selectedChildId);
    return child?.name || 'Select Child';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* Child Picker Modal */}
      <Modal
        visible={showChildPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChildPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Child</Text>
            <ScrollView>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childOption,
                    selectedChildId === child.id && styles.childOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedChildId(child.id);
                    setShowChildPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.childOptionText,
                      selectedChildId === child.id && styles.childOptionTextSelected,
                    ]}
                  >
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowChildPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Lunch Orders</Text>
      </View>

      <View style={styles.subHeader}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.historyButtonText}>
            {showHistory ? '📋 New Order' : '📜 Order History'}
          </Text>
        </TouchableOpacity>
      </View>

      {showHistory ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>Order History</Text>
          {orderHistory.length === 0 ? (
            <Text style={styles.noOrdersText}>No orders yet</Text>
          ) : (
            orderHistory.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <Text style={styles.orderWeek}>
                  Week of {formatWeekString(order.weekOf)}
                </Text>
                <Text style={styles.orderChild}>
                  Child: {getChildName(order.childId)}
                </Text>
                <Text style={styles.orderTotal}>
                  Total: R{order.total.toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.orderStatus,
                    order.status === 'paid' && styles.statusPaid,
                    order.status === 'cancelled' && styles.statusCancelled,
                  ]}
                >
                  Status: {order.status.toUpperCase()}
                </Text>
                <Text style={styles.orderDate}>
                  Placed: {order.createdAt.toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <>
          <View style={styles.orderForm}>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Select Child:</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowChildPicker(true)}
              >
                <Text style={styles.pickerButtonText}>{getSelectedChildName()}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekSelector}>
              <TouchableOpacity
                style={styles.weekButton}
                onPress={() => changeWeek(-1)}
              >
                <Text style={styles.weekButtonText}>← Prev</Text>
              </TouchableOpacity>

              <Text style={styles.weekText}>
                {formatWeekString(selectedWeek)}
              </Text>

              <TouchableOpacity
                style={styles.weekButton}
                onPress={() => changeWeek(1)}
              >
                <Text style={styles.weekButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : !menu ? (
            <View style={styles.centered}>
              <Text style={styles.noMenuText}>
                No menu available for this week
              </Text>
            </View>
          ) : (
            <>
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
              >
                {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as DayOfWeek[]).map(
                  (day) => {
                    const dayItems = getItemsForDay(day);
                    const daySelections = getSelectionsForDay(day);

                    return (
                      <View key={day} style={styles.daySection}>
                        <Text style={styles.dayTitle}>{day}</Text>

                        {dayItems.length === 0 ? (
                          <Text style={styles.noItemsText}>
                            No items available
                          </Text>
                        ) : (
                          dayItems.map((item) => {
                            const selection = daySelections.find(
                              (s) => s.itemId === item.id
                            );

                            return (
                              <View key={item.id} style={styles.menuItem}>
                                <View style={styles.itemInfo}>
                                  <Text style={styles.itemName}>
                                    {item.name}
                                  </Text>
                                  <Text style={styles.itemPrice}>
                                    R{item.price.toFixed(2)}
                                  </Text>
                                  {item.allergens &&
                                    item.allergens.length > 0 && (
                                      <Text style={styles.allergens}>
                                        Allergens: {item.allergens.join(', ')}
                                      </Text>
                                    )}
                                </View>

                                {selection ? (
                                  <View style={styles.quantityControl}>
                                    <TouchableOpacity
                                      style={styles.qtyButton}
                                      onPress={() =>
                                        updateQuantity(
                                          item.id,
                                          day,
                                          selection.qty - 1
                                        )
                                      }
                                    >
                                      <Text style={styles.qtyButtonText}>
                                        -
                                      </Text>
                                    </TouchableOpacity>
                                    <Text style={styles.qtyText}>
                                      {selection.qty}
                                    </Text>
                                    <TouchableOpacity
                                      style={styles.qtyButton}
                                      onPress={() =>
                                        updateQuantity(
                                          item.id,
                                          day,
                                          selection.qty + 1
                                        )
                                      }
                                    >
                                      <Text style={styles.qtyButtonText}>
                                        +
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => addToSelection(item)}
                                  >
                                    <Text style={styles.addButtonText}>
                                      Add
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })
                        )}
                      </View>
                    );
                  }
                )}
              </ScrollView>

              <View style={styles.footer}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>
                    R{calculateTotal().toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (submitting || selections.length === 0) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={submitOrder}
                  disabled={submitting || selections.length === 0}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Place Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
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
    padding: 20,
  },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  historyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  orderForm: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  picker: {
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
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
  childOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    borderRadius: 6,
    marginBottom: 4,
  },
  childOptionSelected: {
    backgroundColor: '#007AFF15',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  childOptionText: {
    fontSize: 16,
    color: '#333',
  },
  childOptionTextSelected: {
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
  weekSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  weekButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 16,
    marginBottom: 8,
    color: '#333',
  },
  daySection: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  noItemsText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  allergens: {
    fontSize: 12,
    color: '#FF3B30',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#34C759',
    padding: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noChildrenText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  noMenuText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noOrdersText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
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
  orderWeek: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  orderChild: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 3,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
    color: '#FF9500',
  },
  statusPaid: {
    color: '#34C759',
  },
  statusCancelled: {
    color: '#FF3B30',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
});
