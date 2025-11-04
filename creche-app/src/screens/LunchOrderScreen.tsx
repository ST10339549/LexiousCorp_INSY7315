import React, { useState, useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Button,
  Spinner,
  Modal,
  Pressable,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderMenuItems, setOrderMenuItems] = useState<{ [key: string]: MenuItem }>({});

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
      setSelections([]);
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

  const handleOrderClick = async (order: Order) => {
    setSelectedOrder(order);
    
    try {
      const orderMenu = await getActiveMenuForWeek(order.weekOf);
      if (orderMenu) {
        const itemsMap: { [key: string]: MenuItem } = {};
        orderMenu.items.forEach(item => {
          itemsMap[item.id] = item;
        });
        setOrderMenuItems(itemsMap);
      }
    } catch (error) {
      console.error('Error loading menu for order:', error);
    }
  };

  const getSelectedChildName = () => {
    const child = children.find((c) => c.id === selectedChildId);
    return child?.name || 'Select Child';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success.600';
      case 'pending': return 'warning.600';
      case 'cancelled': return 'danger.600';
      default: return 'gray.600';
    }
  };

  if (children.length === 0) {
    return (
      <Box flex={1} bg="#F7F9FC" justifyContent="center" alignItems="center" p={5} safeArea>
        <Text fontSize="md" color="gray.600" textAlign="center" mb={5}>
          You need to add a child before ordering lunch
        </Text>
        <Button
          bg="primary.400"
          _pressed={{ bg: 'primary.500' }}
          onPress={() => onNavigateBack && onNavigateBack()}
        >
          <Text color="white" fontWeight="semibold">Go Back</Text>
        </Button>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="#F7F9FC" safeArea>
      {/* Order Details Modal */}
      <Modal isOpen={selectedOrder !== null} onClose={() => setSelectedOrder(null)}>
        <Modal.Content maxWidth="400px" maxHeight="80%" bg="white">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">Order Receipt</Text>
          </Modal.Header>
          <Modal.Body bg="white">
            {selectedOrder && (
              <ScrollView>
                <VStack space={3}>
                  {/* Receipt Header */}
                  <Box bg="gray.50" p={4} borderRadius="md">
                    <Text fontSize="md" fontWeight="bold" color="gray.800" mb={2}>
                      Week of {formatWeekString(selectedOrder.weekOf)}
                    </Text>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Child: {getChildName(selectedOrder.childId)}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Placed: {selectedOrder.createdAt.toLocaleDateString()}
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold" color={getStatusColor(selectedOrder.status)} mt={1}>
                      Status: {selectedOrder.status.toUpperCase()}
                    </Text>
                  </Box>

                  {/* Order Items */}
                  <Text fontSize="md" fontWeight="bold" color="gray.800">Order Items:</Text>
                  {selectedOrder.selections.map((sel, index) => {
                    const menuItem = orderMenuItems[sel.itemId];
                    return (
                      <Box key={index} bg="gray.50" p={3} borderRadius="md">
                        <HStack justifyContent="space-between" mb={2}>
                          <Text fontSize="sm" fontWeight="bold" color="primary.600">{sel.day}</Text>
                          <Text fontSize="xs" color="gray.600" fontWeight="semibold">Qty: {sel.qty}</Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.800" mb={1}>
                          {menuItem?.name || 'Item unavailable'}
                        </Text>
                        {menuItem && (
                          <Text fontSize="xs" color="gray.600">
                            R{menuItem.price.toFixed(2)} × {sel.qty} = R{(menuItem.price * sel.qty).toFixed(2)}
                          </Text>
                        )}
                      </Box>
                    );
                  })}

                  {/* Total */}
                  <Box bg="primary.50" p={4} borderRadius="md">
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="md" fontWeight="bold" color="gray.800">Total Amount:</Text>
                      <Text fontSize="xl" fontWeight="bold" color="primary.600">
                        R{selectedOrder.total.toFixed(2)}
                      </Text>
                    </HStack>
                  </Box>
                </VStack>
              </ScrollView>
            )}
          </Modal.Body>
          <Modal.Footer bg="white" borderTopWidth={1} borderTopColor="gray.200">
            <Button variant="ghost" onPress={() => setSelectedOrder(null)}>
              <Text color="gray.600" fontWeight="semibold">Close</Text>
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Child Picker Modal */}
      <Modal isOpen={showChildPicker} onClose={() => setShowChildPicker(false)}>
        <Modal.Content maxWidth="400px" bg="white">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">Select Child</Text>
          </Modal.Header>
          <Modal.Body bg="white">
            <VStack space={2}>
              {children.map((child) => (
                <Pressable
                  key={child.id}
                  bg={selectedChildId === child.id ? 'primary.50' : 'white'}
                  borderWidth={selectedChildId === child.id ? 2 : 1}
                  borderColor={selectedChildId === child.id ? 'primary.400' : 'gray.200'}
                  borderRadius="md"
                  p={4}
                  onPress={() => {
                    setSelectedChildId(child.id);
                    setShowChildPicker(false);
                  }}
                >
                  <Text
                    fontSize="md"
                    fontWeight={selectedChildId === child.id ? 'bold' : 'normal'}
                    color={selectedChildId === child.id ? 'primary.600' : 'gray.800'}
                  >
                    {child.name}
                  </Text>
                </Pressable>
              ))}
            </VStack>
          </Modal.Body>
          <Modal.Footer bg="white" borderTopWidth={1} borderTopColor="gray.200">
            <Button variant="ghost" onPress={() => setShowChildPicker(false)}>
              <Text color="gray.600" fontWeight="semibold">Close</Text>
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Header */}
      <Box bg="white" px={5} py={4} borderBottomWidth={1} borderBottomColor="gray.200">
        <Text fontSize="2xl" fontWeight="bold" color="gray.800" textAlign="center">
          Lunch Orders
        </Text>
      </Box>

      {/* Toggle Button */}
      <Box bg="white" px={4} py={3} borderBottomWidth={1} borderBottomColor="gray.200" alignItems="center">
        <Button
          bg="primary.400"
          _pressed={{ bg: 'primary.500' }}
          borderRadius="full"
          px={4}
          py={2}
          onPress={() => setShowHistory(!showHistory)}
          leftIcon={<Ionicons name={showHistory ? 'add-circle-outline' : 'receipt-outline'} size={18} color="white" />}
        >
          <Text color="white" fontWeight="semibold" fontSize="sm">
            {showHistory ? 'New Order' : 'Order History'}
          </Text>
        </Button>
      </Box>

      {showHistory ? (
        <ScrollView flex={1} bg="#F7F9FC">
          <VStack space={3} px={3} py={3}>
            <Text fontSize="lg" fontWeight="bold" color="gray.800" px={1}>Order History</Text>
            {orderHistory.length === 0 ? (
              <Text fontSize="md" color="gray.500" textAlign="center" mt={5} fontStyle="italic">
                No orders yet
              </Text>
            ) : (
              orderHistory.map((order) => (
                <Pressable
                  key={order.id}
                  bg="white"
                  borderRadius="lg"
                  p={4}
                  shadow={1}
                  borderWidth={1}
                  borderColor="gray.200"
                  onPress={() => handleOrderClick(order)}
                >
                  <VStack space={2}>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      Week of {formatWeekString(order.weekOf)}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Child: {getChildName(order.childId)}
                    </Text>
                    <Text fontSize="md" fontWeight="semibold" color="primary.600">
                      Total: R{order.total.toFixed(2)}
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold" color={getStatusColor(order.status)}>
                      Status: {order.status.toUpperCase()}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Placed: {order.createdAt.toLocaleDateString()}
                    </Text>
                    <Text fontSize="xs" color="primary.600" fontStyle="italic" mt={1}>
                      Tap to view receipt
                    </Text>
                  </VStack>
                </Pressable>
              ))
            )}
          </VStack>
        </ScrollView>
      ) : (
        <>
          {/* Order Form */}
          <Box bg="white" px={4} py={3} borderBottomWidth={1} borderBottomColor="gray.200">
            <VStack space={3}>
              {/* Child Picker */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                  Select Child:
                </Text>
                <Pressable
                  bg="white"
                  borderWidth={1}
                  borderColor="gray.300"
                  borderRadius="md"
                  p={3}
                  onPress={() => setShowChildPicker(true)}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="md" color="gray.800">{getSelectedChildName()}</Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#718096" />
                  </HStack>
                </Pressable>
              </Box>

              {/* Week Selector */}
              <HStack justifyContent="space-between" alignItems="center">
                <Button
                  size="sm"
                  bg="primary.400"
                  _pressed={{ bg: 'primary.500' }}
                  onPress={() => changeWeek(-1)}
                  leftIcon={<Ionicons name="chevron-back-outline" size={16} color="white" />}
                >
                  <Text color="white" fontWeight="semibold" fontSize="sm">Prev</Text>
                </Button>

                <Text fontSize="md" fontWeight="semibold" color="gray.800">
                  {formatWeekString(selectedWeek)}
                </Text>

                <Button
                  size="sm"
                  bg="primary.400"
                  _pressed={{ bg: 'primary.500' }}
                  onPress={() => changeWeek(1)}
                  rightIcon={<Ionicons name="chevron-forward-outline" size={16} color="white" />}
                >
                  <Text color="white" fontWeight="semibold" fontSize="sm">Next</Text>
                </Button>
              </HStack>
            </VStack>
          </Box>

          {loading ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Spinner size="lg" color="primary.400" />
            </Box>
          ) : !menu ? (
            <Box flex={1} justifyContent="center" alignItems="center" p={5}>
              <Text fontSize="md" color="gray.500" textAlign="center">
                No menu available for this week
              </Text>
            </Box>
          ) : (
            <>
              <ScrollView flex={1} bg="#F7F9FC">
                <VStack space={3} px={3} py={3}>
                  {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as DayOfWeek[]).map((day) => {
                    const dayItems = getItemsForDay(day);
                    const daySelections = getSelectionsForDay(day);

                    return (
                      <Box
                        key={day}
                        bg="white"
                        borderRadius="lg"
                        p={4}
                        shadow={1}
                        borderWidth={1}
                        borderColor="gray.200"
                      >
                        <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={3}>
                          {day}
                        </Text>

                        {dayItems.length === 0 ? (
                          <Text fontSize="sm" color="gray.500" fontStyle="italic" textAlign="center">
                            No items available
                          </Text>
                        ) : (
                          <VStack space={3}>
                            {dayItems.map((item) => {
                              const selection = daySelections.find((s) => s.itemId === item.id);

                              return (
                                <Box
                                  key={item.id}
                                  borderBottomWidth={1}
                                  borderBottomColor="gray.100"
                                  pb={3}
                                >
                                  <HStack justifyContent="space-between" alignItems="center">
                                    <VStack flex={1} mr={3}>
                                      <Text fontSize="md" fontWeight="semibold" color="gray.800" mb={1}>
                                        {item.name}
                                      </Text>
                                      <Text fontSize="sm" color="gray.600" mb={1}>
                                        R{item.price.toFixed(2)}
                                      </Text>
                                      {item.allergens && item.allergens.length > 0 && (
                                        <Text fontSize="xs" color="danger.600" fontStyle="italic">
                                          Allergens: {item.allergens.join(', ')}
                                        </Text>
                                      )}
                                    </VStack>

                                    {selection ? (
                                      <HStack space={3} alignItems="center">
                                        <Pressable
                                          bg="primary.400"
                                          w={8}
                                          h={8}
                                          borderRadius="full"
                                          justifyContent="center"
                                          alignItems="center"
                                          onPress={() => updateQuantity(item.id, day, selection.qty - 1)}
                                        >
                                          <Text color="white" fontSize="lg" fontWeight="bold">-</Text>
                                        </Pressable>
                                        <Text fontSize="md" fontWeight="semibold" color="gray.800" minW={8} textAlign="center">
                                          {selection.qty}
                                        </Text>
                                        <Pressable
                                          bg="primary.400"
                                          w={8}
                                          h={8}
                                          borderRadius="full"
                                          justifyContent="center"
                                          alignItems="center"
                                          onPress={() => updateQuantity(item.id, day, selection.qty + 1)}
                                        >
                                          <Text color="white" fontSize="lg" fontWeight="bold">+</Text>
                                        </Pressable>
                                      </HStack>
                                    ) : (
                                      <Button
                                        size="sm"
                                        bg="success.500"
                                        _pressed={{ bg: 'success.600' }}
                                        onPress={() => addToSelection(item)}
                                      >
                                        <Text color="white" fontWeight="semibold" fontSize="sm">Add</Text>
                                      </Button>
                                    )}
                                  </HStack>
                                </Box>
                              );
                            })}
                          </VStack>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </ScrollView>

              {/* Footer */}
              <Box bg="white" p={4} borderTopWidth={1} borderTopColor="gray.300" shadow={3}>
                <HStack justifyContent="space-between" alignItems="center" mb={4}>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">Total:</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="primary.600">
                    R{calculateTotal().toFixed(2)}
                  </Text>
                </HStack>

                <Button
                  bg={submitting || selections.length === 0 ? 'gray.400' : 'primary.400'}
                  _pressed={{ bg: 'primary.500' }}
                  py={4}
                  borderRadius="md"
                  onPress={submitOrder}
                  isDisabled={submitting || selections.length === 0}
                  isLoading={submitting}
                  isLoadingText="Placing Order..."
                >
                  <Text color="white" fontSize="lg" fontWeight="bold">Place Order</Text>
                </Button>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}
