import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
} from 'react-native';
import {
  createMenu,
  updateMenu,
  getActiveMenuForWeek,
  getCurrentWeekMonday,
  getMondayOfWeek,
  formatWeekString,
  MenuItem,
  Menu,
} from '../services/lunch';

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface MenuItemInput {
  day: DayOfWeek;
  name: string;
  price: string;
  allergens: string;
}

export default function ManageMenuScreen({ navigation }: any) {
  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentWeekMonday());
  const [existingMenu, setExistingMenu] = useState<Menu | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMenu();
  }, [selectedWeek]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const menu = await getActiveMenuForWeek(selectedWeek);
      setExistingMenu(menu);
      
      if (menu && menu.items.length > 0) {
        const items: MenuItemInput[] = menu.items.map((item) => ({
          day: item.day,
          name: item.name,
          price: item.price.toString(),
          allergens: item.allergens?.join(', ') || '',
        }));
        setMenuItems(items);
      } else {
        // Initialize with empty items for each day
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      Alert.alert('Error', 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = (day: DayOfWeek) => {
    setMenuItems([
      ...menuItems,
      { day, name: '', price: '', allergens: '' },
    ]);
  };

  const removeMenuItem = (index: number) => {
    const newItems = [...menuItems];
    newItems.splice(index, 1);
    setMenuItems(newItems);
  };

  const updateMenuItem = (
    index: number,
    field: keyof MenuItemInput,
    value: string
  ) => {
    const newItems = [...menuItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setMenuItems(newItems);
  };

  const validateAndSaveMenu = async () => {
    // Validate
    if (menuItems.length === 0) {
      Alert.alert('Error', 'Please add at least one menu item');
      return;
    }

    for (const item of menuItems) {
      if (!item.name.trim()) {
        Alert.alert('Error', 'All items must have a name');
        return;
      }
      if (!item.price.trim() || isNaN(parseFloat(item.price))) {
        Alert.alert('Error', 'All items must have a valid price');
        return;
      }
    }

    setSaving(true);
    try {
      const items: Omit<MenuItem, 'id'>[] = menuItems.map((item) => ({
        day: item.day,
        name: item.name.trim(),
        price: parseFloat(item.price),
        allergens: item.allergens
          ? item.allergens.split(',').map((a) => a.trim()).filter(Boolean)
          : undefined,
      }));

      if (existingMenu) {
        await updateMenu(existingMenu.id, items);
        Alert.alert('Success', 'Menu updated successfully');
      } else {
        await createMenu(selectedWeek, items);
        Alert.alert('Success', 'Menu created successfully');
      }

      await loadMenu();
    } catch (error) {
      console.error('Error saving menu:', error);
      Alert.alert('Error', 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const changeWeek = (offset: number) => {
    const currentDate = new Date(selectedWeek);
    currentDate.setDate(currentDate.getDate() + (offset * 7));
    setSelectedWeek(getMondayOfWeek(currentDate));
  };

  const getItemsForDay = (day: DayOfWeek) => {
    return menuItems
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.day === day);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Manage Weekly Menu</Text>
        </View>

        <View style={styles.weekSelector}>
          <TouchableOpacity
            style={styles.weekButton}
            onPress={() => changeWeek(-1)}
          >
            <Text style={styles.weekButtonText}>← Prev</Text>
          </TouchableOpacity>
          
          <View style={styles.weekInfo}>
            <Text style={styles.weekText}>{formatWeekString(selectedWeek)}</Text>
            {existingMenu && (
              <Text style={styles.existingMenuText}>Editing menu</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.weekButton}
            onPress={() => changeWeek(1)}
          >
            <Text style={styles.weekButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {DAYS.map((day) => (
          <View key={day} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addMenuItem(day)}
              >
                <Text style={styles.addButtonText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>

            {getItemsForDay(day).map((item) => (
              <View key={item.index} style={styles.menuItemCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Item name"
                  value={item.name}
                  onChangeText={(text) =>
                    updateMenuItem(item.index, 'name', text)
                  }
                />
                
                <TextInput
                  style={styles.priceInput}
                  placeholder="Price"
                  value={item.price}
                  keyboardType="decimal-pad"
                  onChangeText={(text) =>
                    updateMenuItem(item.index, 'price', text)
                  }
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Allergens (comma-separated)"
                  value={item.allergens}
                  onChangeText={(text) =>
                    updateMenuItem(item.index, 'allergens', text)
                  }
                />
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMenuItem(item.index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            {getItemsForDay(day).length === 0 && (
              <Text style={styles.noItemsText}>No items for this day</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={validateAndSaveMenu}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {existingMenu ? 'Update Menu' : 'Create Menu'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  weekSelector: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  weekButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    minWidth: 70,
  },
  weekButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  existingMenuText: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
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
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  menuItemCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 8,
    fontSize: 16,
  },
  priceInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 8,
    fontSize: 16,
    width: 120,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  noItemsText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
