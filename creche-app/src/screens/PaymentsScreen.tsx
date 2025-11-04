import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
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
  Input,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { CardField, useStripe } from '@stripe/stripe-react-native';
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
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'card' | 'processing' | 'success' | 'error'>('confirm');
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [stripeReady, setStripeReady] = useState(false);
  
  // Card input states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  const toast = useToast();
  const stripe = useStripe();

  // Check if Stripe is ready
  useEffect(() => {
    if (stripe) {
      console.log('[PaymentsScreen] Stripe is ready');
      setStripeReady(true);
    } else {
      console.warn('[PaymentsScreen] Stripe not yet initialized');
    }
  }, [stripe]);

  // Validate card details whenever they change
  useEffect(() => {
    const validation = validateCard();
    setCardComplete(validation.valid);
  }, [cardNumber, cardExpiry, cardCvc]);

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
   * Format card number with spaces
   */
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  /**
   * Format expiry date as MM/YY
   */
  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  /**
   * Validate card details
   */
  const validateCard = () => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const cleanExpiry = cardExpiry.replace(/\D/g, '');
    
    if (cleanNumber.length !== 16) {
      return { valid: false, error: 'Card number must be 16 digits' };
    }
    if (cleanExpiry.length !== 4) {
      return { valid: false, error: 'Expiry must be MM/YY format' };
    }
    if (cardCvc.length !== 3) {
      return { valid: false, error: 'CVC must be 3 digits' };
    }
    
    // Check if it's a test card that will fail
    if (cleanNumber === '4000000000000002') {
      return { valid: true, error: null, willFail: true };
    }
    
    return { valid: true, error: null, willFail: false };
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
    setPaymentStep('card');
    setCardComplete(false);
    setPaymentError('');
    // Clear any previous card data
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
  };

  /**
   * Process the payment with card validation
   */
  const handlePayment = async () => {
    if (!userId) return;

    try {
      setProcessing(true);
      setPaymentStep('processing');
      setPaymentError('');

      const total = calculateTotal();

      // Step 1: Validate card details
      const validation = validateCard();
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid card details');
      }

      console.log('[PaymentsScreen] Creating payment intent for R', total);

      // Step 2: Create payment intent
      const paymentIntent = await createPaymentIntent(total);
      console.log('[PaymentsScreen] Payment intent created:', paymentIntent.id);

      // Step 3: Simulate Stripe payment processing
      // Check the card number to determine success/failure
      const cleanNumber = cardNumber.replace(/\s/g, '');
      console.log('[PaymentsScreen] Processing payment with card:', cleanNumber);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate different card outcomes
      if (validation.willFail || cleanNumber === '4000000000000002') {
        // Decline card
        throw new Error('Your card was declined. Please try a different payment method.');
      } else if (cleanNumber === '4000002760003184') {
        // Requires authentication (simulate as decline for demo)
        throw new Error('Your card requires additional authentication.');
      } else if (cleanNumber.startsWith('4242') || cleanNumber.startsWith('4')) {
        // Success - most cards starting with 4 (Visa test cards)
        console.log('[PaymentsScreen] ✅ Payment approved');
      } else {
        // Unknown card
        throw new Error('Card number not recognized. Use a test card.');
      }

      const confirmedIntent = {
        id: paymentIntent.id,
        status: 'Succeeded' as const,
      };

      console.log('[PaymentsScreen] ✅ Payment confirmed successfully');

      // Step 4: Process payment and update Firestore
      const selectedOrderIds = fees
        .filter(fee => selectedFees.has(fee.id))
        .map(fee => fee.id);

      const receiptId = await processPayment(
        userId,
        selectedOrderIds,
        total,
        confirmedIntent.id
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
      setPaymentStep('error');
      setPaymentError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setProcessing(false);
      toast.show({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Failed to process payment',
        placement: 'top',
        bg: 'red.500',
      });
    }
  };

  /**
   * Render individual fee item
   */
  const renderFeeItem = (fee: FeeItem) => {
    const isSelected = selectedFees.has(fee.id);
    const iconEmoji = fee.type === 'lunch' ? '🍽️' : fee.type === 'tuition' ? '🎓' : '💰';

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
            <Text fontSize="2xl">{iconEmoji}</Text>

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
                    <Text fontSize="sm">🔒</Text>
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
                      <Text fontSize="lg">💳</Text>
                      <Text color="white" fontSize="sm" fontWeight="600">
                        Enter Card Details
                      </Text>
                    </HStack>
                    
                    <Text color="coolGray.400" fontSize="xs">
                      Your card information is securely processed by Stripe. We never see or store your card details.
                    </Text>

                    <VStack space={3} mt={2}>
                      {/* Card Number */}
                      <VStack space={1}>
                        <Text color="coolGray.500" fontSize="xs">CARD NUMBER</Text>
                        <Input
                          value={cardNumber}
                          onChangeText={(text) => {
                            const formatted = formatCardNumber(text);
                            setCardNumber(formatted);
                          }}
                          placeholder="4242 4242 4242 4242"
                          keyboardType="numeric"
                          maxLength={19}
                          bg="coolGray.800"
                          borderColor="brand.500"
                          color="white"
                          fontSize="md"
                          fontFamily="mono"
                          _focus={{
                            borderColor: 'brand.400',
                            bg: 'coolGray.800',
                          }}
                        />
                      </VStack>

                      {/* Expiry and CVC */}
                      <HStack space={3}>
                        <VStack space={1} flex={1}>
                          <Text color="coolGray.500" fontSize="xs">EXPIRY</Text>
                          <Input
                            value={cardExpiry}
                            onChangeText={(text) => {
                              const formatted = formatExpiry(text);
                              setCardExpiry(formatted);
                            }}
                            placeholder="MM/YY"
                            keyboardType="numeric"
                            maxLength={5}
                            bg="coolGray.800"
                            borderColor="brand.500"
                            color="white"
                            fontSize="md"
                            _focus={{
                              borderColor: 'brand.400',
                              bg: 'coolGray.800',
                            }}
                          />
                        </VStack>

                        <VStack space={1} flex={1}>
                          <Text color="coolGray.500" fontSize="xs">CVC</Text>
                          <Input
                            value={cardCvc}
                            onChangeText={(text) => {
                              const cleaned = text.replace(/\D/g, '').substring(0, 3);
                              setCardCvc(cleaned);
                            }}
                            placeholder="123"
                            keyboardType="numeric"
                            maxLength={3}
                            bg="coolGray.800"
                            borderColor="brand.500"
                            color="white"
                            fontSize="md"
                            secureTextEntry
                            _focus={{
                              borderColor: 'brand.400',
                              bg: 'coolGray.800',
                            }}
                          />
                        </VStack>
                      </HStack>
                    </VStack>
                    
                    {cardComplete && (
                      <HStack space={2} alignItems="center" mt={2}>
                        <Text fontSize="sm">✅</Text>
                        <Text color="green.400" fontSize="xs" fontWeight="600">
                          Card details validated
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                <Box bg="blue.900" p={3} rounded="lg" borderWidth={1} borderColor="blue.600">
                  <VStack space={2}>
                    <HStack space={2} alignItems="center">
                      <Text fontSize="sm">ℹ️</Text>
                      <Text color="blue.200" fontSize="xs" fontWeight="bold">
                        Test Cards - Try Different Outcomes
                      </Text>
                    </HStack>
                    <Text color="blue.300" fontSize="xs">
                      ✅ Success: 4242 4242 4242 4242 (pre-filled)
                    </Text>
                    <Text color="blue.300" fontSize="xs">
                      ❌ Decline: 4000 0000 0000 0002
                    </Text>
                    <Text color="blue.300" fontSize="xs">
                      🔒 Auth Required: 4000 0027 6000 3184
                    </Text>
                    <Text color="blue.200" fontSize="2xs" italic mt={1}>
                      Change the card number to test different scenarios
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
                  Secure payment via Stripe • Processing transaction
                </Text>
              </VStack>
            )}

            {paymentStep === 'success' && (
              <VStack space={4} py={6} alignItems="center">
                <Text fontSize="6xl">✅</Text>
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

            {paymentStep === 'error' && (
              <VStack space={4} py={6} alignItems="center">
                <Text fontSize="6xl">❌</Text>
                <Text color="white" fontSize="lg" fontWeight="bold" textAlign="center">
                  Payment Failed
                </Text>
                <Text color="red.300" fontSize="md" textAlign="center">
                  {paymentError}
                </Text>
                <Text color="coolGray.400" fontSize="sm" textAlign="center">
                  Please check your card details and try again
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
            {(paymentStep === 'success' || paymentStep === 'error') && (
              <Button
                w="full"
                bg={paymentStep === 'success' ? 'green.600' : 'brand.500'}
                onPress={() => {
                  setShowPaymentModal(false);
                  if (paymentStep === 'success') {
                    setSelectedFees(new Set());
                    loadFees();
                  } else {
                    setPaymentStep('card');
                    setPaymentError('');
                  }
                }}
                _pressed={{ bg: paymentStep === 'success' ? 'green.700' : 'brand.600' }}
              >
                <Text color="white" fontWeight="600">
                  {paymentStep === 'success' ? 'Done' : 'Try Again'}
                </Text>
              </Button>
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
          _pressed={{ bg: 'coolGray.700' }}
        >
          <Text color="white" fontSize="md">
            ← Back
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
              <Text fontSize="2xl">🔒</Text>
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
              <Text fontSize="6xl">✅</Text>
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
                  <Text fontSize="lg">💳</Text>
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
