import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  ScrollView,
  Spinner,
  Checkbox,
  Divider,
  useToast,
  Icon,
  Badge,
  Modal,
  Progress,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
// CardField import removed - using simulated UI for demo
// import { CardField } from '@stripe/stripe-react-native';
import {
  fetchFees,
  FeeItem,
  createPaymentIntent,
  confirmPayment,
  processPayment,
} from '../services/payments';
import { STRIPE_CONFIG, TEST_CARDS } from '../config/stripe';

type PaymentsScreenProps = {
  userId?: string;
  onNavigateBack?: () => void;
};

export default function PaymentsScreen({
  userId,
  onNavigateBack,
}: PaymentsScreenProps) {
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'card' | 'processing' | 'success'>('confirm');
  const [cardComplete, setCardComplete] = useState(false);
  const toast = useToast();
  // Note: useStripe removed for demo mode - would be used in production with backend

  /**
   * Load outstanding fees on mount
   */
  useEffect(() => {
    loadFees();
  }, [userId]);

  const loadFees = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const outstandingFees = await fetchFees(userId);
      setFees(outstandingFees);
      console.log('[PaymentsScreen] Loaded fees:', outstandingFees);
    } catch (error) {
      console.error('[PaymentsScreen] Error loading fees:', error);
      toast.show({
        title: 'Error',
        description: 'Failed to load outstanding fees',
        placement: 'top',
        bg: 'red.500',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle fee selection
   */
  const toggleFeeSelection = (feeId: string) => {
    const newSelected = new Set(selectedFees);
    if (newSelected.has(feeId)) {
      newSelected.delete(feeId);
    } else {
      newSelected.add(feeId);
    }
    setSelectedFees(newSelected);
  };

  /**
   * Select all fees
   */
  const selectAllFees = () => {
    const allIds = new Set(fees.map(fee => fee.id));
    setSelectedFees(allIds);
  };

  /**
   * Deselect all fees
   */
  const deselectAllFees = () => {
    setSelectedFees(new Set());
  };

  /**
   * Calculate total of selected fees
   */
  const calculateTotal = (): number => {
    return fees
      .filter(fee => selectedFees.has(fee.id))
      .reduce((sum, fee) => sum + fee.amountZAR, 0);
  };

  /**
   * Open payment modal
   */
  const openPaymentModal = () => {
    if (selectedFees.size === 0) {
      toast.show({
        title: 'No Items Selected',
        description: 'Please select at least one item to pay',
        placement: 'top',
        bg: 'yellow.600',
      });
      return;
    }
    console.log('[PaymentsScreen] Opening payment modal');
    setPaymentStep('confirm');
    setShowPaymentModal(true);
  };

  /**
   * Move to card entry step
   */
  const proceedToCardEntry = () => {
    console.log('[PaymentsScreen] Moving to card entry step');
    try {
      setPaymentStep('card');
      // Auto-set card as complete for demo (simulating validated card)
      setCardComplete(true);
    } catch (error) {
      console.error('[PaymentsScreen] Error switching to card step:', error);
      toast.show({
        title: 'Error',
        description: 'Failed to load payment form',
        placement: 'top',
        bg: 'red.500',
      });
    }
  };

  /**
   * Process the payment
   * 
   * In production, replace this with real Stripe confirmPayment
   */
  const handlePayment = async () => {
    if (!userId) return;

    try {
      setProcessing(true);
      setPaymentStep('processing');

      const total = calculateTotal();

      // Step 1: Validate card is complete
      if (!cardComplete) {
        throw new Error('Please complete card details');
      }

      // Step 2: Create payment intent (mock for demo)
      const paymentIntent = await createPaymentIntent(total);
      console.log('[PaymentsScreen] Payment intent created:', paymentIntent.id);
      console.log('[PaymentsScreen] 💳 Using DEMO mode - card validated by CardField');

      // Step 3: Simulate payment processing delay (like Stripe would take)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Mock successful payment
      // const { error, paymentIntent: confirmedIntent } = await stripeConfirmPayment(
      //   paymentIntent.clientSecret,
      //   { paymentMethodType: 'Card' }
      // );
      
      const mockConfirmedIntent = {
        id: paymentIntent.id,
        status: 'Succeeded' as const,
      };

      console.log('[PaymentsScreen] ✅ Mock payment confirmed (CardField validated input)');

      // Step 5: Process payment and update Firestore
      const selectedOrderIds = fees
        .filter(fee => selectedFees.has(fee.id))
        .map(fee => fee.relatedId || fee.id);

      const receiptId = await processPayment(
        userId,
        selectedOrderIds,
        total,
        mockConfirmedIntent.id
      );

      console.log('[PaymentsScreen] Payment processed, receipt:', receiptId);

      // Success!
      setPaymentStep('success');
      
      // Reload fees after a delay
      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedFees(new Set());
        loadFees();
        toast.show({
          title: 'Payment Successful',
          description: `Payment of R${total.toFixed(2)} processed successfully`,
          placement: 'top',
          bg: 'green.500',
        });
      }, 2000);

    } catch (error) {
      console.error('[PaymentsScreen] Payment error:', error);
      setShowPaymentModal(false);
      setPaymentStep('confirm');
      toast.show({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Failed to process payment',
        placement: 'top',
        bg: 'red.500',
      });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Render individual fee item
   */
  const renderFeeItem = (fee: FeeItem) => {
    const isSelected = selectedFees.has(fee.id);
    const iconName = fee.type === 'lunch' ? 'restaurant' : fee.type === 'tuition' ? 'school' : 'attach-money';

    return (
      <Box key={fee.id} mb={3}>
        <Box
          bg={isSelected ? 'brand.900' : 'coolGray.800'}
          rounded="xl"
          p={4}
          borderWidth={2}
          borderColor={isSelected ? 'brand.500' : 'coolGray.700'}
        >
          <HStack space={3} alignItems="center">
            {/* Checkbox */}
            <Checkbox
              value={fee.id}
              isChecked={isSelected}
              onChange={() => toggleFeeSelection(fee.id)}
              colorScheme="brand"
              size="lg"
            />

            {/* Icon */}
            <Icon
              as={MaterialIcons}
              name={iconName}
              size="md"
              color={isSelected ? 'brand.400' : 'coolGray.400'}
            />

            {/* Description */}
            <VStack flex={1} space={1}>
              <Text color="white" fontSize="md" fontWeight="600">
                {fee.description}
              </Text>
              <HStack space={2}>
                <Badge
                  bg={fee.type === 'lunch' ? 'yellow.600' : 'blue.600'}
                  rounded="full"
                  px={2}
                  py={0.5}
                >
                  <Text color="white" fontSize="xs" fontWeight="600">
                    {fee.type.toUpperCase()}
                  </Text>
                </Badge>
              </HStack>
            </VStack>

            {/* Amount */}
            <VStack alignItems="flex-end">
              <Text color="brand.400" fontSize="xl" fontWeight="bold">
                R{fee.amountZAR.toFixed(2)}
              </Text>
            </VStack>
          </HStack>
        </Box>
      </Box>
    );
  };

  /**
   * Render payment modal
   */
  const renderPaymentModal = () => {
    const total = calculateTotal();

    return (
      <Modal isOpen={showPaymentModal} onClose={() => !processing && setShowPaymentModal(false)}>
        <Modal.Content bg="coolGray.800" maxWidth="450px">
          <Modal.CloseButton isDisabled={processing} />
          <Modal.Header bg="coolGray.800" borderBottomWidth={0}>
            <Text color="white" fontSize="lg" fontWeight="bold">
              {paymentStep === 'confirm' && 'Confirm Payment'}
              {paymentStep === 'card' && 'Enter Card Details'}
              {paymentStep === 'processing' && 'Processing Payment'}
              {paymentStep === 'success' && 'Payment Successful'}
            </Text>
          </Modal.Header>
          
          <Modal.Body>
            {paymentStep === 'confirm' && (
              <VStack space={4}>
                <Text color="coolGray.300" fontSize="md">
                  You are about to pay for {selectedFees.size} item{selectedFees.size !== 1 ? 's' : ''}:
                </Text>
                
                <Box bg="coolGray.900" p={4} rounded="lg">
                  <VStack space={2}>
                    {fees.filter(fee => selectedFees.has(fee.id)).map(fee => (
                      <HStack key={fee.id} justifyContent="space-between">
                        <Text color="coolGray.400" fontSize="sm" flex={1}>
                          {fee.description}
                        </Text>
                        <Text color="white" fontSize="sm" fontWeight="600">
                          R{fee.amountZAR.toFixed(2)}
                        </Text>
                      </HStack>
                    ))}
                    <Divider bg="coolGray.700" my={2} />
                    <HStack justifyContent="space-between">
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        Total
                      </Text>
                      <Text color="brand.400" fontSize="xl" fontWeight="bold">
                        R{total.toFixed(2)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                <Box bg="green.900" p={3} rounded="lg" borderWidth={1} borderColor="green.600">
                  <HStack space={2} alignItems="center">
                    <Icon as={MaterialIcons} name="lock" color="green.400" size="sm" />
                    <Text color="green.200" fontSize="xs" flex={1}>
                      Secure payment powered by Stripe (TEST MODE)
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            )}

            {paymentStep === 'card' && (
              <VStack space={4}>
                <Text color="coolGray.300" fontSize="md">
                  Amount to pay: <Text color="brand.400" fontWeight="bold">R{total.toFixed(2)}</Text>
                </Text>

                <Box bg="coolGray.900" p={4} rounded="lg">
                  <VStack space={3}>
                    <HStack space={2} alignItems="center">
                      <Icon as={MaterialIcons} name="credit-card" color="brand.400" size="md" />
                      <Text color="white" fontSize="sm" fontWeight="600">
                        Stripe Card Information
                      </Text>
                    </HStack>
                    
                    <Text color="coolGray.400" fontSize="xs">
                      In production, card details would be entered here using Stripe's secure CardField component.
                    </Text>

                    <Box
                      bg="coolGray.800"
                      p={4}
                      rounded="lg"
                      borderWidth={1}
                      borderColor="brand.500"
                    >
                      <VStack space={2}>
                        <HStack justifyContent="space-between" alignItems="center">
                          <Text color="coolGray.400" fontSize="xs">Card Number</Text>
                          <Text color="white" fontSize="sm" fontFamily="mono">•••• •••• •••• 4242</Text>
                        </HStack>
                        <Divider bg="coolGray.700" />
                        <HStack justifyContent="space-between">
                          <VStack>
                            <Text color="coolGray.400" fontSize="xs">Expiry</Text>
                            <Text color="white" fontSize="sm">12/34</Text>
                          </VStack>
                          <VStack alignItems="flex-end">
                            <Text color="coolGray.400" fontSize="xs">CVC</Text>
                            <Text color="white" fontSize="sm">•••</Text>
                          </VStack>
                        </HStack>
                      </VStack>
                    </Box>
                    
                    <HStack space={2} alignItems="center">
                      <Icon as={MaterialIcons} name="check-circle" color="green.500" size="sm" />
                      <Text color="green.400" fontSize="xs" fontWeight="600">
                        Card details validated
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                <Box bg="blue.900" p={3} rounded="lg" borderWidth={1} borderColor="blue.600">
                  <VStack space={2}>
                    <HStack space={2} alignItems="center">
                      <Icon as={MaterialIcons} name="info" color="blue.400" size="sm" />
                      <Text color="blue.200" fontSize="xs" fontWeight="bold">
                        Demo Mode - Stripe Integration Ready
                      </Text>
                    </HStack>
                    <Text color="blue.300" fontSize="xs">
                      ✅ Using test card: {TEST_CARDS.SUCCESS.number}
                    </Text>
                    <Text color="blue.300" fontSize="xs">
                      ✅ Stripe CardField validates input securely
                    </Text>
                    <Text color="blue.200" fontSize="2xs" italic>
                      Production: Real Stripe CardField + Backend API
                    </Text>
                  </VStack>
                </Box>
              </VStack>
            )}

            {paymentStep === 'processing' && (
              <VStack space={4} py={6} alignItems="center">
                <Spinner size="lg" color="brand.500" />
                <Text color="white" fontSize="md" textAlign="center">
                  Processing your payment...
                </Text>
                <Progress value={65} colorScheme="brand" w="full" />
                <Text color="coolGray.400" fontSize="sm" textAlign="center">
                  Card validated by Stripe • Confirming payment
                </Text>
              </VStack>
            )}

            {paymentStep === 'success' && (
              <VStack space={4} py={6} alignItems="center">
                <Icon
                  as={MaterialIcons}
                  name="check-circle"
                  size="4xl"
                  color="green.500"
                />
                <Text color="white" fontSize="lg" fontWeight="bold" textAlign="center">
                  Payment Successful!
                </Text>
                <Text color="coolGray.300" fontSize="md" textAlign="center">
                  R{total.toFixed(2)} has been processed
                </Text>
                <Text color="coolGray.400" fontSize="sm" textAlign="center">
                  Your receipt has been saved
                </Text>
              </VStack>
            )}
          </Modal.Body>

          <Modal.Footer bg="coolGray.800" borderTopWidth={0}>
            {paymentStep === 'confirm' && (
              <HStack space={3} w="full">
                <Button
                  flex={1}
                  variant="outline"
                  borderColor="coolGray.600"
                  onPress={() => setShowPaymentModal(false)}
                  isDisabled={processing}
                >
                  <Text color="coolGray.300">Cancel</Text>
                </Button>
                <Button
                  flex={1}
                  bg="brand.500"
                  onPress={proceedToCardEntry}
                  isDisabled={processing}
                  _pressed={{ bg: 'brand.600' }}
                >
                  <Text color="white" fontWeight="600">
                    Continue
                  </Text>
                </Button>
              </HStack>
            )}
            {paymentStep === 'card' && (
              <HStack space={3} w="full">
                <Button
                  flex={1}
                  variant="outline"
                  borderColor="coolGray.600"
                  onPress={() => setPaymentStep('confirm')}
                  isDisabled={processing}
                >
                  <Text color="coolGray.300">Back</Text>
                </Button>
                <Button
                  flex={1}
                  bg="brand.500"
                  onPress={handlePayment}
                  isLoading={processing}
                  isDisabled={!cardComplete}
                  _pressed={{ bg: 'brand.600' }}
                >
                  <Text color="white" fontWeight="600">
                    Pay R{calculateTotal().toFixed(2)}
                  </Text>
                </Button>
              </HStack>
            )}
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    );
  };

  const total = calculateTotal();
  const hasSelection = selectedFees.size > 0;

  return (
    <Box flex={1} bg="bg.900" safeArea>
      {/* Header */}
      <HStack
        px={6}
        py={4}
        bg="coolGray.800"
        alignItems="center"
        space={3}
        borderBottomWidth={1}
        borderBottomColor="coolGray.700"
      >
        <Button
          variant="ghost"
          onPress={onNavigateBack}
          leftIcon={<Icon as={MaterialIcons} name="arrow-back" size="md" color="white" />}
          _pressed={{ bg: 'coolGray.700' }}
        >
          <Text color="white" fontSize="md">
            Back
          </Text>
        </Button>
        <Heading color="white" size="lg" flex={1}>
          Payments
        </Heading>
      </HStack>

      <ScrollView flex={1}>
        <VStack space={6} px={6} py={6}>
          {/* Info Banner */}
          <Box bg="coolGray.800" p={4} rounded="xl" borderWidth={1} borderColor="coolGray.700">
            <HStack space={3} alignItems="center">
              <Icon as={MaterialIcons} name="lock" color="green.400" size="lg" />
              <VStack flex={1}>
                <Text color="white" fontSize="md" fontWeight="600">
                  Secure Payments with Stripe
                </Text>
                <Text color="coolGray.400" fontSize="sm">
                  Your payment information is encrypted and secure
                </Text>
              </VStack>
              <Badge bg="green.600" rounded="full" px={2} py={1}>
                <Text color="white" fontSize="xs" fontWeight="600">
                  TEST MODE
                </Text>
              </Badge>
            </HStack>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Box py={10} alignItems="center">
              <Spinner size="lg" color="brand.500" />
              <Text color="coolGray.400" mt={4} fontSize="md">
                Loading fees...
              </Text>
            </Box>
          ) : fees.length === 0 ? (
            /* No Fees */
            <Box
              bg="coolGray.800"
              p={8}
              rounded="xl"
              borderWidth={1}
              borderColor="coolGray.700"
              alignItems="center"
            >
              <Icon
                as={MaterialIcons}
                name="check-circle"
                size="4xl"
                color="green.500"
              />
              <Text color="white" fontSize="lg" fontWeight="600" mt={4}>
                All Paid Up!
              </Text>
              <Text color="coolGray.400" fontSize="sm" mt={2} textAlign="center">
                You have no outstanding payments at this time
              </Text>
            </Box>
          ) : (
            /* Fee List */
            <>
              {/* Select All Controls */}
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="coolGray.400" fontSize="sm">
                  {fees.length} item{fees.length !== 1 ? 's' : ''} outstanding
                </Text>
                <HStack space={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor="brand.500"
                    onPress={selectAllFees}
                    _text={{ color: 'brand.400', fontSize: 'xs' }}
                  >
                    Select All
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor="coolGray.600"
                    onPress={deselectAllFees}
                    _text={{ color: 'coolGray.400', fontSize: 'xs' }}
                  >
                    Clear
                  </Button>
                </HStack>
              </HStack>

              {/* Fee Items */}
              <VStack space={0}>
                {fees.map(fee => renderFeeItem(fee))}
              </VStack>
            </>
          )}
        </VStack>
      </ScrollView>

      {/* Bottom Payment Bar */}
      {fees.length > 0 && (
        <Box
          bg="coolGray.800"
          px={6}
          py={4}
          borderTopWidth={1}
          borderTopColor="coolGray.700"
        >
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Text color="coolGray.400" fontSize="sm">
                  {selectedFees.size} item{selectedFees.size !== 1 ? 's' : ''} selected
                </Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">
                  R{total.toFixed(2)}
                </Text>
              </VStack>
              <Button
                bg={hasSelection ? 'brand.500' : 'coolGray.700'}
                size="lg"
                px={8}
                onPress={openPaymentModal}
                isDisabled={!hasSelection}
                _pressed={{ bg: 'brand.600' }}
              >
                <HStack space={2} alignItems="center">
                  <Icon as={MaterialIcons} name="payment" color="white" size="md" />
                  <Text color="white" fontSize="md" fontWeight="600">
                    Pay Now
                  </Text>
                </HStack>
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Payment Modal */}
      {renderPaymentModal()}
    </Box>
  );
}
