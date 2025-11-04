import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
    
    // Add empty slots for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
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
        createdBy: 'admin', // TODO: Get from auth context
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
        createdBy: 'admin', // TODO: Get from auth context
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
        '', // childName - will be looked up
        assignDueDate,
        'admin' // adminId - TODO: Get from auth context
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

  const renderFeeItem = ({ item }: { item: FeeWithUserName }) => {
    const statusColor = item.status === 'paid' ? '#4CAF50' : 
                       item.status === 'overdue' ? '#f44336' : '#FF9800';
    
    return (
      <View style={styles.feeCard}>
        <View style={styles.feeHeader}>
          <Text style={styles.feeType}>{item.type.toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <Text style={styles.feeDescription}>{item.description}</Text>
        
        <View style={styles.feeDetails}>
          <Text style={styles.feeAmount}>R {item.amount.toFixed(2)}</Text>
          {item.dueDate && (
            <Text style={styles.feeDueDate}>
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        {item.userName && (
          <Text style={styles.feeUser}>Parent: {item.userName}</Text>
        )}
        {item.childName && (
          <Text style={styles.feeChild}>Child: {item.childName}</Text>
        )}
        
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteFee(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTemplateItem = ({ item }: { item: FeeTemplate }) => (
    <View style={styles.templateCard}>
      <Text style={styles.templateName}>{item.name}</Text>
      <Text style={styles.templateType}>{item.type}</Text>
      <Text style={styles.templateDescription}>{item.description}</Text>
      <Text style={styles.templateAmount}>Default: R {item.amount.toFixed(2)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Manage Fees</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.actionButtonText}>+ Create Fee</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowTemplateModal(true)}
        >
          <Text style={styles.actionButtonText}>+ New Template</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowAssignModal(true)}
        >
          <Text style={styles.actionButtonText}>Assign Fee</Text>
        </TouchableOpacity>
      </View>

      {/* Fees List - Show only 2 */}
      <View style={styles.feesHeader}>
        <Text style={styles.sectionTitle}>Fees ({fees.length})</Text>
        {fees.length > 2 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => setShowAllFeesModal(true)}
          >
            <Text style={styles.viewAllButtonText}>View All →</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {fees.length === 0 ? (
        <Text style={styles.emptyText}>No fees found</Text>
      ) : (
        <View>
          {fees.slice(0, 2).map((item) => (
            <View key={item.id}>
              {renderFeeItem({ item })}
            </View>
          ))}
        </View>
      )}

      {/* Templates Section */}
      <Text style={styles.sectionTitle}>Fee Templates ({templates.length})</Text>
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id!}
        renderItem={renderTemplateItem}
        horizontal
        contentContainerStyle={styles.templateList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No templates created</Text>
        }
      />

      {/* Create Fee Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Create New Fee</Text>
              
              <Text style={styles.inputLabel}>Parent *</Text>
              <Picker
                selectedValue={newFee.userId}
                style={styles.input}
                onValueChange={(value) => setNewFee({ ...newFee, userId: value })}
              >
                <Picker.Item label="Select Parent" value="" />
                {availableUsers.map(user => (
                  <Picker.Item key={user.id} label={`${user.name} (${user.email})`} value={user.id} />
                ))}
              </Picker>
              
              <Text style={styles.inputLabel}>Fee Type *</Text>
              <Picker
                selectedValue={newFee.type}
                style={styles.input}
                onValueChange={(value) => setNewFee({ ...newFee, type: value as Fee['type'] })}
              >
                <Picker.Item label="Tuition" value="tuition" />
                <Picker.Item label="Registration" value="registration" />
                <Picker.Item label="Activity" value="activity" />
                <Picker.Item label="Late Fee" value="late_fee" />
                <Picker.Item label="Other" value="other" />
              </Picker>
              
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={styles.input}
                value={newFee.description}
                onChangeText={(text) => setNewFee({ ...newFee, description: text })}
                placeholder="e.g., Monthly Tuition - January 2024"
              />
              
              <Text style={styles.inputLabel}>Amount (ZAR) *</Text>
              <TextInput
                style={styles.input}
                value={newFee.amount}
                onChangeText={(text) => setNewFee({ ...newFee, amount: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Due Date *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowCreateDueDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {newFee.dueDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCreateFee}
                >
                  <Text style={styles.modalButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Create Fee Template</Text>
              
              <Text style={styles.inputLabel}>Template Name *</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.name}
                onChangeText={(text) => setNewTemplate({ ...newTemplate, name: text })}
                placeholder="e.g., Monthly Tuition"
              />
              
              <Text style={styles.inputLabel}>Fee Type *</Text>
              <Picker
                selectedValue={newTemplate.type}
                style={styles.input}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value as Fee['type'] })}
              >
                <Picker.Item label="Tuition" value="tuition" />
                <Picker.Item label="Registration" value="registration" />
                <Picker.Item label="Activity" value="activity" />
                <Picker.Item label="Late Fee" value="late_fee" />
                <Picker.Item label="Other" value="other" />
              </Picker>
              
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.description}
                onChangeText={(text) => setNewTemplate({ ...newTemplate, description: text })}
                placeholder="e.g., Monthly tuition fee"
                multiline
              />
              
              <Text style={styles.inputLabel}>Default Amount (ZAR) *</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.amount}
                onChangeText={(text) => setNewTemplate({ ...newTemplate, amount: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowTemplateModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCreateTemplate}
                >
                  <Text style={styles.modalButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assign Template Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Assign Fee from Template</Text>
              
              <Text style={styles.inputLabel}>Select Template *</Text>
              <Picker
                selectedValue={selectedTemplateId}
                style={styles.input}
                onValueChange={(value: string) => {
                  setSelectedTemplateId(value);
                  const template = templates.find(t => t.id === value);
                  if (template) {
                    setAssignAmount(template.amount.toString());
                  }
                }}
              >
                <Picker.Item label="Select Template" value="" />
                {templates.map(template => (
                  <Picker.Item key={template.id} label={template.name} value={template.id!} />
                ))}
              </Picker>
              
              <Text style={styles.inputLabel}>Parent *</Text>
              <Picker
                selectedValue={assignUserId}
                style={styles.input}
                onValueChange={(value) => setAssignUserId(value)}
              >
                <Picker.Item label="Select Parent" value="" />
                {availableUsers.map(user => (
                  <Picker.Item key={user.id} label={`${user.name} (${user.email})`} value={user.id} />
                ))}
              </Picker>
              
              <Text style={styles.inputLabel}>Amount (ZAR) *</Text>
              <TextInput
                style={styles.input}
                value={assignAmount}
                onChangeText={setAssignAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Due Date *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowAssignDueDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {assignDueDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAssignModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleAssignTemplate}
                >
                  <Text style={styles.modalButtonText}>Assign</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Fee Date Picker Modal */}
      <Modal
        visible={showCreateDueDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateDueDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(newFee.dueDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setNewFee({ ...newFee, dueDate: newDate });
                }}
              >
                <Text style={styles.calendarNavButton}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthYear}>
                {newFee.dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(newFee.dueDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setNewFee({ ...newFee, dueDate: newDate });
                }}
              >
                <Text style={styles.calendarNavButton}>▶</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarDaysHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {getCalendarDays(newFee.dueDate).map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    day && day.toDateString() === newFee.dueDate.toDateString() && styles.selectedDay,
                  ]}
                  onPress={() => {
                    if (day) {
                      setNewFee({ ...newFee, dueDate: day });
                      setShowCreateDueDatePicker(false);
                    }
                  }}
                  disabled={!day}
                >
                  <Text style={[
                    styles.calendarDayText,
                    day && day.toDateString() === newFee.dueDate.toDateString() && styles.selectedDayText,
                  ]}>
                    {day ? day.getDate() : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.calendarCloseButton}
              onPress={() => setShowCreateDueDatePicker(false)}
            >
              <Text style={styles.calendarCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assign Fee Date Picker Modal */}
      <Modal
        visible={showAssignDueDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignDueDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(assignDueDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setAssignDueDate(newDate);
                }}
              >
                <Text style={styles.calendarNavButton}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthYear}>
                {assignDueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(assignDueDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setAssignDueDate(newDate);
                }}
              >
                <Text style={styles.calendarNavButton}>▶</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarDaysHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {getCalendarDays(assignDueDate).map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    day && day.toDateString() === assignDueDate.toDateString() && styles.selectedDay,
                  ]}
                  onPress={() => {
                    if (day) {
                      setAssignDueDate(day);
                      setShowAssignDueDatePicker(false);
                    }
                  }}
                  disabled={!day}
                >
                  <Text style={[
                    styles.calendarDayText,
                    day && day.toDateString() === assignDueDate.toDateString() && styles.selectedDayText,
                  ]}>
                    {day ? day.getDate() : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.calendarCloseButton}
              onPress={() => setShowAssignDueDatePicker(false)}
            >
              <Text style={styles.calendarCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View All Fees Modal */}
      <Modal
        visible={showAllFeesModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAllFeesModal(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>All Fees ({fees.length})</Text>
          </View>

          {/* Filter */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter:</Text>
            <Picker
              selectedValue={filterStatus}
              style={styles.picker}
              onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Paid" value="paid" />
              <Picker.Item label="Overdue" value="overdue" />
            </Picker>
          </View>

          <FlatList
            data={fees}
            keyExtractor={(item) => item.id}
            renderItem={renderFeeItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No fees found</Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#6200ea',
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: '#6200ea',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  picker: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    paddingTop: 15,
  },
  listContent: {
    padding: 10,
  },
  feeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  feeDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  feeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  feeDueDate: {
    fontSize: 14,
    color: '#666',
  },
  feeUser: {
    fontSize: 14,
    color: '#666',
  },
  feeChild: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  templateList: {
    padding: 10,
  },
  templateCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    width: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  templateType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  templateDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  templateAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  submitButton: {
    backgroundColor: '#6200ea',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  calendarModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarNavButton: {
    fontSize: 24,
    color: '#6200ea',
    fontWeight: 'bold',
    padding: 10,
  },
  calendarMonthYear: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarDayHeader: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  selectedDay: {
    backgroundColor: '#6200ea',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarCloseButton: {
    backgroundColor: '#6200ea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  calendarCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  feesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  viewAllButton: {
    backgroundColor: '#6200ea',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
