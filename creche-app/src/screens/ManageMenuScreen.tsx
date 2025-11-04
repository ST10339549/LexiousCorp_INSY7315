import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Heading,
  ScrollView,
  Spinner,
  Divider,
  IconButton,
  FormControl,
  Badge,
} from 'native-base';
import { BackHandler, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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

type ManageMenuScreenProps = {
  navigation?: any;
  onBack?: () => void;
};

export default function ManageMenuScreen({ navigation, onBack }: ManageMenuScreenProps) {
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
      if (onBack) {
        onBack();
      } else if (navigation) {
        navigation.goBack();
      }
      return true;
    });

    return () => backHandler.remove();
  }, [navigation, onBack]);

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
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      Alert.alert('Error', 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    const currentDate = new Date(selectedWeek);
    currentDate.setDate(currentDate.getDate() - 7);
    const newMonday = getMondayOfWeek(currentDate);
    setSelectedWeek(newMonday);
  };

  const handleNextWeek = () => {
    const currentDate = new Date(selectedWeek);
    currentDate.setDate(currentDate.getDate() + 7);
    const newMonday = getMondayOfWeek(currentDate);
    setSelectedWeek(newMonday);
  };

  const addMenuItem = (day: DayOfWeek) => {
    setMenuItems([...menuItems, { day, name: '', price: '', allergens: '' }]);
  };

  const updateMenuItem = (index: number, field: keyof MenuItemInput, value: string) => {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], [field]: value };
    setMenuItems(updated);
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleSaveMenu = async () => {
    // Validate
    const invalidItems = menuItems.filter((item) => !item.name || !item.price);
    if (invalidItems.length > 0) {
      Alert.alert('Validation Error', 'Please fill in name and price for all menu items');
      return;
    }

    setSaving(true);
    try {
      const items = menuItems.map((item) => ({
        day: item.day,
        name: item.name.trim(),
        price: parseFloat(item.price),
        allergens: item.allergens
          ? item.allergens.split(',').map((a) => a.trim()).filter(Boolean)
          : [],
      }));

      if (existingMenu) {
        await updateMenu(existingMenu.id, items);
        Alert.alert('Success', 'Menu updated successfully');
      } else {
        await createMenu(selectedWeek, items);
        Alert.alert('Success', 'Menu created successfully');
      }
      
      loadMenu();
    } catch (error) {
      console.error('Error saving menu:', error);
      Alert.alert('Error', 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const getItemsForDay = (day: DayOfWeek) => {
    return menuItems.filter((item) => item.day === day);
  };

  return (
    <Box flex={1} bg="#F7F9FC" safeArea>
      {/* Header */}
      <HStack
        bg="white"
        px={4}
        py={3}
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor="gray.200"
        shadow={1}
      >
        {(onBack || navigation) && (
          <IconButton
            icon={<Ionicons name="arrow-back-outline" size={24} color="#1F2937" />}
            onPress={() => {
              if (onBack) onBack();
              else if (navigation) navigation.goBack();
            }}
            mr={2}
          />
        )}
        <Heading size="lg" color="gray.800" flex={1}>
          🍽️ Manage Menu
        </Heading>
      </HStack>

      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Spinner size="lg" color="primary.400" />
          <Text mt={4} color="gray.600">Loading menu...</Text>
        </Box>
      ) : (
        <ScrollView flex={1}>
          <VStack space={4} px={4} py={4}>
            {/* Week Selector */}
            <Box bg="white" p={4} rounded="xl" shadow={1}>
              <Text fontSize="sm" fontWeight="600" color="gray.600" mb={2}>
                Select Week
              </Text>
              <HStack space={2} alignItems="center" justifyContent="space-between">
                <IconButton
                  icon={<Ionicons name="chevron-back-outline" size={24} color="#3B82F6" />}
                  onPress={handlePreviousWeek}
                  variant="ghost"
                />
                <VStack flex={1} alignItems="center">
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {formatWeekString(selectedWeek)}
                  </Text>
                  {existingMenu && (
                    <Badge colorScheme="success" rounded="full" mt={1}>
                      Menu Exists
                    </Badge>
                  )}
                </VStack>
                <IconButton
                  icon={<Ionicons name="chevron-forward-outline" size={24} color="#3B82F6" />}
                  onPress={handleNextWeek}
                  variant="ghost"
                />
              </HStack>
            </Box>

            {/* Menu Items by Day */}
            {DAYS.map((day) => {
              const dayItems = getItemsForDay(day);
              return (
                <Box key={day} bg="white" p={4} rounded="xl" shadow={1}>
                  <HStack justifyContent="space-between" alignItems="center" mb={3}>
                    <Heading size="md" color="gray.800">
                      {day}
                    </Heading>
                    <Button
                      size="sm"
                      onPress={() => addMenuItem(day)}
                      leftIcon={<Ionicons name="add-outline" size={16} color="white" />}
                      bg="primary.400"
                      _pressed={{ bg: 'primary.500' }}
                    >
                      Add Item
                    </Button>
                  </HStack>

                  {dayItems.length === 0 ? (
                    <Box bg="gray.50" p={4} rounded="lg" alignItems="center">
                      <Ionicons name="fast-food-outline" size={32} color="#9CA3AF" />
                      <Text color="gray.500" fontSize="sm" mt={2}>
                        No items for this day
                      </Text>
                    </Box>
                  ) : (
                    <VStack space={3}>
                      {menuItems.map((item, index) => {
                        if (item.day !== day) return null;
                        return (
                          <Box
                            key={index}
                            bg="gray.50"
                            p={3}
                            rounded="lg"
                            borderWidth={1}
                            borderColor="gray.200"
                          >
                            <HStack justifyContent="space-between" alignItems="center" mb={2}>
                              <Text fontSize="sm" fontWeight="600" color="gray.700">
                                Item {menuItems.filter((i) => i.day === day).indexOf(item) + 1}
                              </Text>
                              <IconButton
                                icon={<Ionicons name="trash-outline" size={20} color="#EF4444" />}
                                onPress={() => removeMenuItem(index)}
                                size="sm"
                                variant="ghost"
                              />
                            </HStack>

                            <VStack space={2}>
                              <FormControl>
                                <FormControl.Label>
                                  <Text fontSize="xs" color="gray.600">Item Name</Text>
                                </FormControl.Label>
                                <Input
                                  value={item.name}
                                  onChangeText={(value) => updateMenuItem(index, 'name', value)}
                                  placeholder="e.g., Chicken Sandwich"
                                  bg="white"
                                  borderColor="gray.300"
                                  _focus={{ borderColor: 'primary.400', bg: 'white' }}
                                />
                              </FormControl>

                              <FormControl>
                                <FormControl.Label>
                                  <Text fontSize="xs" color="gray.600">Price (R)</Text>
                                </FormControl.Label>
                                <Input
                                  value={item.price}
                                  onChangeText={(value) => updateMenuItem(index, 'price', value)}
                                  placeholder="0.00"
                                  keyboardType="decimal-pad"
                                  bg="white"
                                  borderColor="gray.300"
                                  _focus={{ borderColor: 'primary.400', bg: 'white' }}
                                />
                              </FormControl>

                              <FormControl>
                                <FormControl.Label>
                                  <Text fontSize="xs" color="gray.600">Allergens (comma separated)</Text>
                                </FormControl.Label>
                                <Input
                                  value={item.allergens}
                                  onChangeText={(value) => updateMenuItem(index, 'allergens', value)}
                                  placeholder="e.g., Dairy, Gluten"
                                  bg="white"
                                  borderColor="gray.300"
                                  _focus={{ borderColor: 'primary.400', bg: 'white' }}
                                />
                              </FormControl>
                            </VStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                </Box>
              );
            })}

            {/* Save Button */}
            <Button
              size="lg"
              bg="primary.400"
              _pressed={{ bg: 'primary.500' }}
              onPress={handleSaveMenu}
              isLoading={saving}
              isLoadingText="Saving..."
              leftIcon={<Ionicons name="checkmark-outline" size={20} color="white" />}
              mt={4}
              mb={8}
            >
              {existingMenu ? 'Update Menu' : 'Create Menu'}
            </Button>
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
}
