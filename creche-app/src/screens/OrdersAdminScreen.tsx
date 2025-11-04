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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid': return { bg: 'success.100', color: 'success.800' };
      case 'pending': return { bg: 'warning.100', color: 'warning.800' };
      case 'cancelled': return { bg: 'danger.100', color: 'danger.800' };
      default: return { bg: 'gray.100', color: 'gray.800' };
    }
  };

  return (
    <Box flex={1} bg="#F7F9FC" safeArea>
      {/* Week Picker Modal */}
      <Modal isOpen={showWeekPicker} onClose={() => setShowWeekPicker(false)}>
        <Modal.Content maxWidth="400px" bg="white">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">Select Week</Text>
          </Modal.Header>
          <Modal.Body bg="white">
            <ScrollView maxH="400px">
              <VStack space={2}>
                <Pressable
                  bg={selectedWeek === undefined ? 'primary.50' : 'white'}
                  borderWidth={selectedWeek === undefined ? 2 : 1}
                  borderColor={selectedWeek === undefined ? 'primary.400' : 'gray.200'}
                  borderRadius="md"
                  p={4}
                  onPress={() => {
                    setSelectedWeek(undefined);
                    setShowWeekPicker(false);
                  }}
                >
                  <Text
                    fontSize="md"
                    fontWeight={selectedWeek === undefined ? 'bold' : 'normal'}
                    color={selectedWeek === undefined ? 'primary.600' : 'gray.800'}
                  >
                    All Weeks
                  </Text>
                </Pressable>
                {getWeekOptions().map((week) => (
                  <Pressable
                    key={week}
                    bg={selectedWeek === week ? 'primary.50' : 'white'}
                    borderWidth={selectedWeek === week ? 2 : 1}
                    borderColor={selectedWeek === week ? 'primary.400' : 'gray.200'}
                    borderRadius="md"
                    p={4}
                    onPress={() => {
                      setSelectedWeek(week);
                      setShowWeekPicker(false);
                    }}
                  >
                    <Text
                      fontSize="md"
                      fontWeight={selectedWeek === week ? 'bold' : 'normal'}
                      color={selectedWeek === week ? 'primary.600' : 'gray.800'}
                    >
                      {formatWeekString(week)}
                    </Text>
                  </Pressable>
                ))}
              </VStack>
            </ScrollView>
          </Modal.Body>
          <Modal.Footer bg="white" borderTopWidth={1} borderTopColor="gray.200">
            <Button variant="ghost" onPress={() => setShowWeekPicker(false)}>
              <Text color="gray.600" fontWeight="semibold">Close</Text>
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Status Picker Modal */}
      <Modal isOpen={showStatusPicker} onClose={() => setShowStatusPicker(false)}>
        <Modal.Content maxWidth="400px" bg="white">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">Select Status</Text>
          </Modal.Header>
          <Modal.Body bg="white">
            <VStack space={2}>
              <Pressable
                bg={selectedStatus === undefined ? 'primary.50' : 'white'}
                borderWidth={selectedStatus === undefined ? 2 : 1}
                borderColor={selectedStatus === undefined ? 'primary.400' : 'gray.200'}
                borderRadius="md"
                p={4}
                onPress={() => {
                  setSelectedStatus(undefined);
                  setShowStatusPicker(false);
                }}
              >
                <Text
                  fontSize="md"
                  fontWeight={selectedStatus === undefined ? 'bold' : 'normal'}
                  color={selectedStatus === undefined ? 'primary.600' : 'gray.800'}
                >
                  All Statuses
                </Text>
              </Pressable>
              {(['pending', 'paid', 'cancelled'] as const).map((status) => (
                <Pressable
                  key={status}
                  bg={selectedStatus === status ? 'primary.50' : 'white'}
                  borderWidth={selectedStatus === status ? 2 : 1}
                  borderColor={selectedStatus === status ? 'primary.400' : 'gray.200'}
                  borderRadius="md"
                  p={4}
                  onPress={() => {
                    setSelectedStatus(status);
                    setShowStatusPicker(false);
                  }}
                >
                  <Text
                    fontSize="md"
                    fontWeight={selectedStatus === status ? 'bold' : 'normal'}
                    color={selectedStatus === status ? 'primary.600' : 'gray.800'}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </VStack>
          </Modal.Body>
          <Modal.Footer bg="white" borderTopWidth={1} borderTopColor="gray.200">
            <Button variant="ghost" onPress={() => setShowStatusPicker(false)}>
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

      {/* Filters */}
      <HStack bg="white" px={3} py={3} space={2} borderBottomWidth={1} borderBottomColor="gray.200">
        <Pressable
          flex={1}
          bg="gray.50"
          borderWidth={1}
          borderColor="gray.300"
          borderRadius="md"
          p={3}
          onPress={() => setShowWeekPicker(true)}
        >
          <Text fontSize="xs" color="gray.600" fontWeight="medium" mb={1}>
            WEEK:
          </Text>
          <Text fontSize="sm" fontWeight="bold" color="primary.600">
            {getWeekLabel()}
          </Text>
        </Pressable>

        <Pressable
          flex={1}
          bg="gray.50"
          borderWidth={1}
          borderColor="gray.300"
          borderRadius="md"
          p={3}
          onPress={() => setShowStatusPicker(true)}
        >
          <Text fontSize="xs" color="gray.600" fontWeight="medium" mb={1}>
            STATUS:
          </Text>
          <Text fontSize="sm" fontWeight="bold" color="primary.600">
            {getStatusLabel()}
          </Text>
        </Pressable>
      </HStack>

      {/* Stats */}
      <HStack bg="white" px={4} py={4} space={4} justifyContent="space-around" borderBottomWidth={1} borderBottomColor="gray.200">
        <VStack alignItems="center" flex={1}>
          <Text fontSize="xs" color="gray.600" fontWeight="medium" mb={1}>
            Total Orders
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="primary.600">
            {orders.length}
          </Text>
        </VStack>
        <VStack alignItems="center" flex={1}>
          <Text fontSize="xs" color="gray.600" fontWeight="medium" mb={1}>
            Revenue (Paid)
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="primary.600">
            R{calculateTotalRevenue().toFixed(2)}
          </Text>
        </VStack>
      </HStack>

      {/* Orders List */}
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Spinner size="lg" color="primary.400" />
        </Box>
      ) : orders.length === 0 ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text fontSize="md" color="gray.500">No orders found</Text>
        </Box>
      ) : (
        <ScrollView flex={1} bg="#F7F9FC">
          <VStack space={3} px={3} py={3}>
            {orders.map((order) => {
              const statusColors = getStatusBadgeColor(order.status);
              return (
                <Box
                  key={order.id}
                  bg="white"
                  borderRadius="lg"
                  p={4}
                  shadow={1}
                  borderWidth={1}
                  borderColor="gray.200"
                >
                  {/* Order Header */}
                  <HStack justifyContent="space-between" alignItems="center" mb={3}>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      {formatWeekString(order.weekOf)}
                    </Text>
                    <Box
                      bg={statusColors.bg}
                      px={3}
                      py={1}
                      borderRadius="md"
                    >
                      <Text fontSize="xs" fontWeight="semibold" color={statusColors.color}>
                        {order.status.toUpperCase()}
                      </Text>
                    </Box>
                  </HStack>

                  {/* Order Details */}
                  <VStack space={1} mb={3}>
                    <Text fontSize="sm" color="gray.600">
                      Child: {getChildName(order.childId)}
                    </Text>
                    <Text fontSize="md" fontWeight="semibold" color="primary.600">
                      Total: R{order.total.toFixed(2)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Placed: {order.createdAt.toLocaleDateString()}
                    </Text>
                  </VStack>

                  {/* Actions */}
                  <HStack space={2} flexWrap="wrap">
                    {order.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          bg="success.500"
                          _pressed={{ bg: 'success.600' }}
                          onPress={() => confirmStatusChange(order.id, 'paid')}
                          leftIcon={<Ionicons name="checkmark-circle-outline" size={16} color="white" />}
                        >
                          <Text color="white" fontWeight="semibold" fontSize="sm">Mark Paid</Text>
                        </Button>
                        <Button
                          size="sm"
                          bg="danger.500"
                          _pressed={{ bg: 'danger.600' }}
                          onPress={() => confirmStatusChange(order.id, 'cancelled')}
                          leftIcon={<Ionicons name="close-circle-outline" size={16} color="white" />}
                        >
                          <Text color="white" fontWeight="semibold" fontSize="sm">Cancel</Text>
                        </Button>
                      </>
                    )}
                    {order.status === 'paid' && (
                      <Button
                        size="sm"
                        bg="warning.500"
                        _pressed={{ bg: 'warning.600' }}
                        onPress={() => confirmStatusChange(order.id, 'cancelled')}
                        leftIcon={<Ionicons name="return-up-back-outline" size={16} color="white" />}
                      >
                        <Text color="white" fontWeight="semibold" fontSize="sm">Refund/Cancel</Text>
                      </Button>
                    )}
                    {order.status === 'cancelled' && (
                      <Button
                        size="sm"
                        bg="primary.400"
                        _pressed={{ bg: 'primary.500' }}
                        onPress={() => confirmStatusChange(order.id, 'pending')}
                        leftIcon={<Ionicons name="refresh-outline" size={16} color="white" />}
                      >
                        <Text color="white" fontWeight="semibold" fontSize="sm">Restore</Text>
                      </Button>
                    )}
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
}
