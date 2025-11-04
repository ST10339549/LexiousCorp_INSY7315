import React, { useState, useEffect } from 'react';
import { Alert, FlatList } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Button,
  Input,
  Modal,
  Spinner,
  Pressable,
  Select,
  FormControl,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import {
  Fee,
  FeeTemplate,
  getAllFees,
  createFee,
  updateFee,
  deleteFee,
  createFeeTemplate,
  getAllFeeTemplates,
  assignFeeFromTemplate,
  getUsersForFeeAssignment,
} from '../services/fees';

interface FeeWithUserName extends Fee {
  userName?: string;
  childName?: string;
}

export default function ManageFeesScreen() {
  const [fees, setFees] = useState<FeeWithUserName[]>([]);
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAllFeesModal, setShowAllFeesModal] = useState(false);
  
  // Form states for creating fee
  const [newFee, setNewFee] = useState({
    userId: '',
    childId: '',
    type: 'tuition' as Fee['type'],
    description: '',
    amount: '',
    dueDate: new Date(),
  });
  
  // Template form states
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'tuition' as Fee['type'],
    description: '',
    amount: '',
    recurring: 'once' as FeeTemplate['recurring'],
  });
  
  // Assign template states
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignChildId, setAssignChildId] = useState('');
  const [assignAmount, setAssignAmount] = useState('');
  const [assignDueDate, setAssignDueDate] = useState(new Date());
  
  // Date picker visibility states
  const [showCreateDueDatePicker, setShowCreateDueDatePicker] = useState(false);
  const [showAssignDueDatePicker, setShowAssignDueDatePicker] = useState(false);
  
  // Available users for assignment
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string, email: string}>>([]);

  // Helper function to generate calendar days
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<Date | null> = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allFees, allTemplates, users] = await Promise.all([
        getAllFees(filterStatus === 'all' ? undefined : filterStatus),
        getAllFeeTemplates(),
        getUsersForFeeAssignment(),
      ]);
      
      setFees(allFees);
      setTemplates(allTemplates);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading fees data:', error);
      Alert.alert('Error', 'Failed to load fees data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFee = async () => {
    try {
      if (!newFee.userId || !newFee.description || !newFee.amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      await createFee({
        userId: newFee.userId,
        childId: newFee.childId || undefined,
        type: newFee.type,
        description: newFee.description,
        amount: parseFloat(newFee.amount),
        dueDate: newFee.dueDate,
        status: 'pending',
        createdBy: 'admin',
      });

      Alert.alert('Success', 'Fee created successfully');
      setShowCreateModal(false);
      setNewFee({
        userId: '',
        childId: '',
        type: 'tuition',
        description: '',
        amount: '',
        dueDate: new Date(),
      });
      loadData();
    } catch (error) {
      console.error('Error creating fee:', error);
      Alert.alert('Error', 'Failed to create fee');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!newTemplate.name || !newTemplate.description || !newTemplate.amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      await createFeeTemplate({
        name: newTemplate.name,
        type: newTemplate.type,
        description: newTemplate.description,
        amount: parseFloat(newTemplate.amount),
        recurring: newTemplate.recurring,
        active: true,
        createdBy: 'admin',
      });

      Alert.alert('Success', 'Template created successfully');
      setShowTemplateModal(false);
      setNewTemplate({
        name: '',
        type: 'tuition',
        description: '',
        amount: '',
        recurring: 'once',
      });
      loadData();
    } catch (error) {
      console.error('Error creating template:', error);
      Alert.alert('Error', 'Failed to create template');
    }
  };

  const handleAssignTemplate = async () => {
    try {
      if (!selectedTemplateId || !assignUserId || !assignAmount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      await assignFeeFromTemplate(
        selectedTemplateId,
        assignUserId,
        assignChildId || '',
        '',
        assignDueDate,
        'admin'
      );

      Alert.alert('Success', 'Fee assigned successfully');
      setShowAssignModal(false);
      setSelectedTemplateId('');
      setAssignUserId('');
      setAssignChildId('');
      setAssignAmount('');
      setAssignDueDate(new Date());
      loadData();
    } catch (error) {
      console.error('Error assigning template:', error);
      Alert.alert('Error', 'Failed to assign fee');
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this fee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFee(feeId);
              Alert.alert('Success', 'Fee deleted successfully');
              loadData();
            } catch (error) {
              console.error('Error deleting fee:', error);
              Alert.alert('Error', 'Failed to delete fee');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return { bg: 'success.500', color: 'white' };
      case 'overdue': return { bg: 'danger.500', color: 'white' };
      case 'pending': return { bg: 'warning.500', color: 'white' };
      default: return { bg: 'gray.500', color: 'white' };
    }
  };

  const renderFeeItem = ({ item }: { item: FeeWithUserName }) => {
    const statusColors = getStatusColor(item.status);
    
    return (
      <Box bg="white" borderRadius="lg" p={4} mb={3} shadow={1} borderWidth={1} borderColor="gray.200">
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <Text fontSize="xs" fontWeight="bold" color="gray.600">
            {item.type.toUpperCase()}
          </Text>
          <Box bg={statusColors.bg} px={2} py={1} borderRadius="md">
            <Text fontSize="xs" fontWeight="bold" color={statusColors.color}>
              {item.status}
            </Text>
          </Box>
        </HStack>
        
        <Text fontSize="md" fontWeight="bold" color="gray.800" mb={2}>
          {item.description}
        </Text>
        
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <Text fontSize="lg" fontWeight="bold" color="primary.600">
            R {item.amount.toFixed(2)}
          </Text>
          {item.dueDate && (
            <Text fontSize="sm" color="gray.600">
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
        </HStack>
        
        {item.userName && (
          <Text fontSize="sm" color="gray.600" mb={1}>Parent: {item.userName}</Text>
        )}
        {item.childName && (
          <Text fontSize="sm" color="gray.600" mb={2}>Child: {item.childName}</Text>
        )}
        
        {item.status === 'pending' && (
          <Button
            size="sm"
            bg="danger.500"
            _pressed={{ bg: 'danger.600' }}
            mt={2}
            onPress={() => handleDeleteFee(item.id)}
            leftIcon={<Ionicons name="trash-outline" size={16} color="white" />}
          >
            <Text color="white" fontWeight="semibold" fontSize="sm">Delete</Text>
          </Button>
        )}
      </Box>
    );
  };

  const renderTemplateItem = ({ item }: { item: FeeTemplate }) => (
    <Box bg="white" borderRadius="lg" p={4} mr={3} w={200} shadow={1} borderWidth={1} borderColor="gray.200">
      <Text fontSize="md" fontWeight="bold" color="gray.800" mb={1}>
        {item.name}
      </Text>
      <Text fontSize="xs" color="gray.600" mb={2}>
        {item.type}
      </Text>
      <Text fontSize="sm" color="gray.700" mb={2}>
        {item.description}
      </Text>
      <Text fontSize="md" fontWeight="bold" color="primary.600">
        Default: R {item.amount.toFixed(2)}
      </Text>
    </Box>
  );

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="#F7F9FC">
        <Spinner size="lg" color="primary.400" />
      </Box>
    );
  }

  return (
    <Box flex={1} bg="#F7F9FC" safeArea>
      {/* Header */}
      <Box bg="white" px={5} py={4} borderBottomWidth={1} borderBottomColor="gray.200">
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Manage Fees
        </Text>
      </Box>

      {/* Action Buttons */}
      <HStack px={3} py={3} space={2} flexWrap="wrap">
        <Button
          flex={1}
          minW="100px"
          size="sm"
          bg="primary.400"
          _pressed={{ bg: 'primary.500' }}
          onPress={() => setShowCreateModal(true)}
          leftIcon={<Ionicons name="add-circle-outline" size={16} color="white" />}
        >
          <Text color="white" fontWeight="bold" fontSize="xs">Create Fee</Text>
        </Button>
        
        <Button
          flex={1}
          minW="100px"
          size="sm"
          bg="primary.400"
          _pressed={{ bg: 'primary.500' }}
          onPress={() => setShowTemplateModal(true)}
          leftIcon={<Ionicons name="document-text-outline" size={16} color="white" />}
        >
          <Text color="white" fontWeight="bold" fontSize="xs">New Template</Text>
        </Button>
        
        <Button
          flex={1}
          minW="100px"
          size="sm"
          bg="primary.400"
          _pressed={{ bg: 'primary.500' }}
          onPress={() => setShowAssignModal(true)}
          leftIcon={<Ionicons name="person-add-outline" size={16} color="white" />}
        >
          <Text color="white" fontWeight="bold" fontSize="xs">Assign Fee</Text>
        </Button>
      </HStack>

      {/* Fees List - Show only 2 */}
      <HStack justifyContent="space-between" alignItems="center" px={3} pt={3} pb={2}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Fees ({fees.length})
        </Text>
        {fees.length > 2 && (
          <Button
            size="xs"
            bg="primary.400"
            _pressed={{ bg: 'primary.500' }}
            borderRadius="full"
            onPress={() => setShowAllFeesModal(true)}
            rightIcon={<Ionicons name="arrow-forward-outline" size={14} color="white" />}
          >
            <Text color="white" fontWeight="bold" fontSize="xs">View All</Text>
          </Button>
        )}
      </HStack>
      
      <Box px={3}>
        {fees.length === 0 ? (
          <Text fontSize="md" color="gray.500" textAlign="center" py={5}>
            No fees found
          </Text>
        ) : (
          <VStack space={0}>
            {fees.slice(0, 2).map((item) => (
              <Box key={item.id}>
                {renderFeeItem({ item })}
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Templates Section */}
      <Text fontSize="lg" fontWeight="bold" color="gray.800" px={3} pt={4} pb={2}>
        Fee Templates ({templates.length})
      </Text>
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id!}
        renderItem={renderTemplateItem}
        horizontal
        contentContainerStyle={{ paddingHorizontal: 12 }}
        ListEmptyComponent={
          <Text fontSize="md" color="gray.500" py={5} px={3}>
            No templates created
          </Text>
        }
      />

      {/* Create Fee Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <Modal.Content maxWidth="400px" maxHeight="90%" bg="white">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">Create New Fee</Text>
          </Modal.Header>
          <Modal.Body bg="white">
            <ScrollView>
              <VStack space={3}>
                <FormControl isRequired>
                  <FormControl.Label>Parent</FormControl.Label>
                  <Select
                    selectedValue={newFee.userId}
                    placeholder="Select Parent"
                    onValueChange={(value) => setNewFee({ ...newFee, userId: value })}
                    bg="white"
                    borderColor="gray.300"
                  >
                    {availableUsers.map(user => (
                      <Select.Item key={user.id} label={`${user.name} (${user.email})`} value={user.id} />
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Fee Type</FormControl.Label>
                  <Select
                    selectedValue={newFee.type}
                    onValueChange={(value) => setNewFee({ ...newFee, type: value as Fee['type'] })}
                    bg="white"
                    borderColor="gray.300"
                  >
                    <Select.Item label="Tuition" value="tuition" />
                    <Select.Item label="Registration" value="registration" />
                    <Select.Item label="Activity" value="activity" />
                    <Select.Item label="Late Fee" value="late_fee" />
                    <Select.Item label="Other" value="other" />
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Description</FormControl.Label>
                  <Input
                    value={newFee.description}
                    onChangeText={(text) => setNewFee({ ...newFee, description: text })}
                    placeholder="e.g., Monthly Tuition - January 2024"
                    bg="white"
                    borderColor="gray.300"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Amount (ZAR)</FormControl.Label>
                  <Input
                    value={newFee.amount}
                    onChangeText={(text) => setNewFee({ ...newFee, amount: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    bg="white"
                    borderColor="gray.300"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Due Date</FormControl.Label>
                  <Pressable
                    bg="white"
                    borderWidth={1}
                    borderColor="gray.300"
                    borderRadius="md"
                    p={3}
                    onPress={() => setShowCreateDueDatePicker(true)}
                  >
                    <Text fontSize="md" color="gray.800">
                      {newFee.dueDate.toLocaleDateString()}
                    </Text>
                  </Pressable>
                </FormControl>
              </VStack>
            </ScrollView>
          </Modal.Body>
          <Modal.Footer bg="white" borderTopWidth={1} borderTopColor="gray.200">
            <HStack space={2} w="100%">
              <Button
                flex={1}
                variant="ghost"
                onPress={() => setShowCreateModal(false)}
              >
                <Text color="gray.600" fontWeight="semibold">Cancel</Text>
              </Button>
              <Button
                flex={1}
                bg="primary.400"
                _pressed={{ bg: 'primary.500' }}
                onPress={handleCreateFee}
              >
                <Text color="white" fontWeight="bold">Create</Text>
              </Button>
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Create Template Modal */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)}>
        <Modal.Content maxWidth="400px" maxHeight="90%" bg="white">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">Create Fee Template</Text>
          </Modal.Header>
          <Modal.Body bg="white">
            <ScrollView>
              <VStack space={3}>
                <FormControl isRequired>
                  <FormControl.Label>Template Name</FormControl.Label>
                  <Input
                    value={newTemplate.name}
                    onChangeText={(text) => setNewTemplate({ ...newTemplate, name: text })}
                    placeholder="e.g., Monthly Tuition"
                    bg="white"
                    borderColor="gray.300"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Fee Type</FormControl.Label>
                  <Select
                    selectedValue={newTemplate.type}
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value as Fee['type'] })}
                    bg="white"
                    borderColor="gray.300"
                  >
                    <Select.Item label="Tuition" value="tuition" />
                    <Select.Item label="Registration" value="registration" />
                    <Select.Item label="Activity" value="activity" />
                    <Select.Item label="Late Fee" value="late_fee" />
                    <Select.Item label="Other" value="other" />
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Description</FormControl.Label>
                  <Input
                    value={newTemplate.description}
                    onChangeText={(text) => setNewTemplate({ ...newTemplate, description: text })}
                    placeholder="e.g., Monthly tuition fee"
                    bg="white"
                    borderColor="gray.300"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Default Amount (ZAR)</FormControl.Label>
                  <Input
                    value={newTemplate.amount}
                    onChangeText={(text) => setNewTemplate({ ...newTemplate, amount: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    bg="white"
                    borderColor="gray.300"
                  />
                </FormControl>
              </VStack>
            </ScrollView>
          </Modal.Body>
          <Modal.Footer bg="white" borderTopWidth={1} borderTopColor="gray.200">
            <HStack space={2} w="100%">
              <Button
                flex={1}
                variant="ghost"
                onPress={() => setShowTemplateModal(false)}
              >
                <Text color="gray.600" fontWeight="semibold">Cancel</Text>
              </Button>
              <Button
                flex={1}
                bg="primary.400"
                _pressed={{ bg: 'primary.500' }}
                onPress={handleCreateTemplate}
              >
                <Text color="white" fontWeight="bold">Create</Text>
              </Button>
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Assign Template Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <Modal.Content maxWidth="400px" maxHeight="90%" bg="white">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">Assign Fee from Template</Text>
          </Modal.Header>
          <Modal.Body bg="white">
            <ScrollView>
              <VStack space={3}>
                <FormControl isRequired>
                  <FormControl.Label>Select Template</FormControl.Label>
                  <Select
                    selectedValue={selectedTemplateId}
                    placeholder="Select Template"
                    onValueChange={(value: string) => {
                      setSelectedTemplateId(value);
                      const template = templates.find(t => t.id === value);
                      if (template) {
                        setAssignAmount(template.amount.toString());
                      }
                    }}
                    bg="white"
                    borderColor="gray.300"
                  >
                    {templates.map(template => (
                      <Select.Item key={template.id} label={template.name} value={template.id!} />
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Parent</FormControl.Label>
                  <Select
                    selectedValue={assignUserId}
                    placeholder="Select Parent"
                    onValueChange={(value) => setAssignUserId(value)}
                    bg="white"
                    borderColor="gray.300"
                  >
                    {availableUsers.map(user => (
                      <Select.Item key={user.id} label={`${user.name} (${user.email})`} value={user.id} />
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Amount (ZAR)</FormControl.Label>
                  <Input
                    value={assignAmount}
                    onChangeText={setAssignAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    bg="white"
                    borderColor="gray.300"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormControl.Label>Due Date</FormControl.Label>
                  <Pressable
                    bg="white"
                    borderWidth={1}
                    borderColor="gray.300"
                    borderRadius="md"
                    p={3}
                    onPress={() => setShowAssignDueDatePicker(true)}
                  >
                    <Text fontSize="md" color="gray.800">
                      {assignDueDate.toLocaleDateString()}
                    </Text>
                  </Pressable>
                </FormControl>
              </VStack>
            </ScrollView>
          </Modal.Body>
          <Modal.Footer bg="white" borderTopWidth={1} borderTopColor="gray.200">
            <HStack space={2} w="100%">
              <Button
                flex={1}
                variant="ghost"
                onPress={() => setShowAssignModal(false)}
              >
                <Text color="gray.600" fontWeight="semibold">Cancel</Text>
              </Button>
              <Button
                flex={1}
                bg="primary.400"
                _pressed={{ bg: 'primary.500' }}
                onPress={handleAssignTemplate}
              >
                <Text color="white" fontWeight="bold">Assign</Text>
              </Button>
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Create Fee Date Picker Modal */}
      <Modal isOpen={showCreateDueDatePicker} onClose={() => setShowCreateDueDatePicker(false)}>
        <Modal.Content maxWidth="400px" bg="white">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <HStack justifyContent="space-between" alignItems="center" pr={8}>
              <Pressable
                onPress={() => {
                  const newDate = new Date(newFee.dueDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setNewFee({ ...newFee, dueDate: newDate });
                }}
                p={2}
              >
                <Ionicons name="chevron-back-outline" size={24} color="#4F46E5" />
              </Pressable>
              <Text fontSize="md" fontWeight="bold" color="gray.800">
                {newFee.dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable
                onPress={() => {
                  const newDate = new Date(newFee.dueDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setNewFee({ ...newFee, dueDate: newDate });
                }}
                p={2}
              >
                <Ionicons name="chevron-forward-outline" size={24} color="#4F46E5" />
              </Pressable>
            </HStack>
          </Modal.Header>
          <Modal.Body bg="white">
            <VStack space={2}>
              <HStack justifyContent="space-around">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} fontSize="xs" fontWeight="bold" color="gray.600" w="40px" textAlign="center">
                    {day}
                  </Text>
                ))}
              </HStack>

              <HStack flexWrap="wrap">
                {getCalendarDays(newFee.dueDate).map((day, index) => (
                  <Box key={index} w="14.28%" p={1}>
                    <Pressable
                      h={10}
                      justifyContent="center"
                      alignItems="center"
                      bg={day && day.toDateString() === newFee.dueDate.toDateString() ? 'primary.400' : 'transparent'}
                      borderRadius="full"
                      onPress={() => {
                        if (day) {
                          setNewFee({ ...newFee, dueDate: day });
                          setShowCreateDueDatePicker(false);
                        }
                      }}
                      isDisabled={!day}
                    >
                      <Text
                        fontSize="md"
                        color={day && day.toDateString() === newFee.dueDate.toDateString() ? 'white' : 'gray.800'}
                        fontWeight={day && day.toDateString() === newFee.dueDate.toDateString() ? 'bold' : 'normal'}
                      >
                        {day ? day.getDate() : ''}
                      </Text>
                    </Pressable>
                  </Box>
                ))}
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer bg="white" borderTopWidth={1} borderTopColor="gray.200">
            <Button
              w="100%"
              bg="primary.400"
              _pressed={{ bg: 'primary.500' }}
              onPress={() => setShowCreateDueDatePicker(false)}
            >
              <Text color="white" fontWeight="bold">Close</Text>
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Assign Fee Date Picker Modal */}
      <Modal isOpen={showAssignDueDatePicker} onClose={() => setShowAssignDueDatePicker(false)}>
        <Modal.Content maxWidth="400px" bg="white">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <HStack justifyContent="space-between" alignItems="center" pr={8}>
              <Pressable
                onPress={() => {
                  const newDate = new Date(assignDueDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setAssignDueDate(newDate);
                }}
                p={2}
              >
                <Ionicons name="chevron-back-outline" size={24} color="#4F46E5" />
              </Pressable>
              <Text fontSize="md" fontWeight="bold" color="gray.800">
                {assignDueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable
                onPress={() => {
                  const newDate = new Date(assignDueDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setAssignDueDate(newDate);
                }}
                p={2}
              >
                <Ionicons name="chevron-forward-outline" size={24} color="#4F46E5" />
              </Pressable>
            </HStack>
          </Modal.Header>
          <Modal.Body bg="white">
            <VStack space={2}>
              <HStack justifyContent="space-around">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} fontSize="xs" fontWeight="bold" color="gray.600" w="40px" textAlign="center">
                    {day}
                  </Text>
                ))}
              </HStack>

              <HStack flexWrap="wrap">
                {getCalendarDays(assignDueDate).map((day, index) => (
                  <Box key={index} w="14.28%" p={1}>
                    <Pressable
                      h={10}
                      justifyContent="center"
                      alignItems="center"
                      bg={day && day.toDateString() === assignDueDate.toDateString() ? 'primary.400' : 'transparent'}
                      borderRadius="full"
                      onPress={() => {
                        if (day) {
                          setAssignDueDate(day);
                          setShowAssignDueDatePicker(false);
                        }
                      }}
                      isDisabled={!day}
                    >
                      <Text
                        fontSize="md"
                        color={day && day.toDateString() === assignDueDate.toDateString() ? 'white' : 'gray.800'}
                        fontWeight={day && day.toDateString() === assignDueDate.toDateString() ? 'bold' : 'normal'}
                      >
                        {day ? day.getDate() : ''}
                      </Text>
                    </Pressable>
                  </Box>
                ))}
              </HStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer bg="white" borderTopWidth={1} borderTopColor="gray.200">
            <Button
              w="100%"
              bg="primary.400"
              _pressed={{ bg: 'primary.500' }}
              onPress={() => setShowAssignDueDatePicker(false)}
            >
              <Text color="white" fontWeight="bold">Close</Text>
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* View All Fees Modal */}
      <Modal isOpen={showAllFeesModal} onClose={() => setShowAllFeesModal(false)} size="full">
        <Modal.Content bg="#F7F9FC" maxWidth="100%" maxHeight="100%" flex={1}>
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              All Fees ({fees.length})
            </Text>
          </Modal.Header>
          <VStack flex={1} bg="#F7F9FC">
            <Box bg="white" px={3} py={3}>
              <FormControl>
                <FormControl.Label>Filter:</FormControl.Label>
                <Select
                  selectedValue={filterStatus}
                  onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}
                  bg="white"
                  borderColor="gray.300"
                >
                  <Select.Item label="All" value="all" />
                  <Select.Item label="Pending" value="pending" />
                  <Select.Item label="Paid" value="paid" />
                  <Select.Item label="Overdue" value="overdue" />
                </Select>
              </FormControl>
            </Box>

            <FlatList
              data={fees}
              keyExtractor={(item) => item.id}
              renderItem={renderFeeItem}
              contentContainerStyle={{ padding: 12 }}
              ListEmptyComponent={
                <Text fontSize="md" color="gray.500" textAlign="center" py={5}>
                  No fees found
                </Text>
              }
            />
          </VStack>
        </Modal.Content>
      </Modal>
    </Box>
  );
}
