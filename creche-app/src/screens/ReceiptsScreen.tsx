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
  Divider,
  useToast,
  Icon,
  Badge,
  Modal,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { listReceipts, Receipt } from '../services/payments';

type ReceiptsScreenProps = {
  userId?: string;
  onNavigateBack?: () => void;
};

export default function ReceiptsScreen({
  userId,
  onNavigateBack,
}: ReceiptsScreenProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const toast = useToast();

  /**
   * Load receipts on mount
   */
  useEffect(() => {
    loadReceipts();
  }, [userId]);

  const loadReceipts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userReceipts = await listReceipts(userId);
      setReceipts(userReceipts);
      console.log('[ReceiptsScreen] Loaded receipts:', userReceipts.length);
    } catch (error) {
      console.error('[ReceiptsScreen] Error loading receipts:', error);
      toast.show({
        title: 'Error',
        description: 'Failed to load receipts',
        placement: 'top',
        bg: 'red.500',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open receipt detail modal
   */
  const openReceiptDetail = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowDetailModal(true);
  };

  /**
   * Close receipt detail modal
   */
  const closeReceiptDetail = () => {
    setShowDetailModal(false);
    setTimeout(() => setSelectedReceipt(null), 300);
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Format short date for display
   */
  const formatShortDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: Receipt['status']): string => {
    switch (status) {
      case 'success':
        return 'green.500';
      case 'failed':
        return 'red.500';
      case 'pending':
        return 'yellow.500';
      default:
        return 'gray.500';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: Receipt['status']): string => {
    switch (status) {
      case 'success':
        return 'check-circle';
      case 'failed':
        return 'error';
      case 'pending':
        return 'pending';
      default:
        return 'help';
    }
  };

  /**
   * Render individual receipt card
   */
  const renderReceiptCard = (receipt: Receipt) => {
    return (
      <Box key={receipt.id} mb={3}>
        <Box
          bg="white"
          rounded="xl"
          p={4}
          borderWidth={1}
          borderColor="gray.200"
          onTouchEnd={() => openReceiptDetail(receipt)}
        >
          <VStack space={3}>
            {/* Header Row */}
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack flex={1} space={1}>
                <HStack space={2} alignItems="center">
                  <Icon
                    as={Ionicons}
                    name="receipt"
                    size="sm"
                    color="brand.400"
                  />
                  <Text color="gray.600" fontSize="xs" fontWeight="600">
                    Receipt #{receipt.id.substring(0, 8)}
                  </Text>
                </HStack>
                <Text color="gray.800" fontSize="lg" fontWeight="bold">
                  R{receipt.amount.toFixed(2)}
                </Text>
              </VStack>
              <Badge
                bg={getStatusColor(receipt.status)}
                rounded="full"
                px={3}
                py={1}
              >
                <HStack space={1} alignItems="center">
                  <Icon
                    as={Ionicons}
                    name={getStatusIcon(receipt.status)}
                    color="gray.800"
                    size="xs"
                  />
                  <Text color="gray.800" fontSize="xs" fontWeight="600">
                    {receipt.status.toUpperCase()}
                  </Text>
                </HStack>
              </Badge>
            </HStack>

            <Divider bg="gray.100" />

            {/* Details Row */}
            <HStack justifyContent="space-between" alignItems="center">
              <VStack space={0.5}>
                <Text color="gray.500" fontSize="xs">
                  Payment Date
                </Text>
                <Text color="gray.700" fontSize="sm" fontWeight="500">
                  {formatShortDate(receipt.createdAt)}
                </Text>
              </VStack>
              <VStack space={0.5} alignItems="flex-end">
                <Text color="gray.500" fontSize="xs">
                  Items Paid
                </Text>
                <Text color="gray.700" fontSize="sm" fontWeight="500">
                  {receipt.orderIds.length} item{receipt.orderIds.length !== 1 ? 's' : ''}
                </Text>
              </VStack>
            </HStack>

            {/* Transaction ID */}
            <HStack space={2} alignItems="center">
              <Icon
                as={Ionicons}
                name="receipt-outline"
                size="xs"
                color="gray.500"
              />
              <Text color="gray.500" fontSize="xs" numberOfLines={1} flex={1}>
                Txn: {receipt.txnId}
              </Text>
            </HStack>

            {/* View Details Button */}
            <Button
              variant="outline"
              borderColor="primary.400"
              size="sm"
              onPress={() => openReceiptDetail(receipt)}
              _pressed={{ bg: 'primary.900' }}
            >
              <HStack space={2} alignItems="center">
                <Text color="primary.400" fontSize="xs" fontWeight="600">
                  View Details
                </Text>
                <Icon
                  as={Ionicons}
                  name="arrow-forward"
                  color="brand.400"
                  size="xs"
                />
              </HStack>
            </Button>
          </VStack>
        </Box>
      </Box>
    );
  };

  /**
   * Render receipt detail modal
   */
  const renderDetailModal = () => {
    if (!selectedReceipt) return null;

    return (
      <Modal isOpen={showDetailModal} onClose={closeReceiptDetail} size="lg">
        <Modal.Content bg="white" maxWidth="500px">
          <Modal.CloseButton />
          <Modal.Header bg="white" borderBottomWidth={0}>
            <HStack space={2} alignItems="center">
              <Icon
                as={Ionicons}
                name="receipt-outline"
                color="primary.400"
                size="md"
              />
              <Text color="gray.800" fontSize="lg" fontWeight="bold">
                Receipt Details
              </Text>
            </HStack>
          </Modal.Header>

          <Modal.Body>
            <VStack space={4}>
              {/* Receipt ID */}
              <Box bg="#F7F9FC" p={4} rounded="lg">
                <VStack space={2}>
                  <Text color="gray.500" fontSize="xs" fontWeight="600">
                    RECEIPT ID
                  </Text>
                  <Text color="gray.800" fontSize="md" fontWeight="600">
                    {selectedReceipt.id}
                  </Text>
                </VStack>
              </Box>

              {/* Amount & Status */}
              <HStack space={3}>
                <Box bg="#F7F9FC" p={4} rounded="lg" flex={1}>
                  <VStack space={2}>
                    <Text color="gray.500" fontSize="xs" fontWeight="600">
                      AMOUNT
                    </Text>
                    <Text color="brand.400" fontSize="2xl" fontWeight="bold">
                      R{selectedReceipt.amount.toFixed(2)}
                    </Text>
                  </VStack>
                </Box>
                <Box bg="#F7F9FC" p={4} rounded="lg" flex={1}>
                  <VStack space={2}>
                    <Text color="gray.500" fontSize="xs" fontWeight="600">
                      STATUS
                    </Text>
                    <Badge
                      bg={getStatusColor(selectedReceipt.status)}
                      alignSelf="flex-start"
                      rounded="full"
                      px={3}
                      py={1}
                    >
                      <HStack space={1} alignItems="center">
                        <Icon
                          as={Ionicons}
                          name={getStatusIcon(selectedReceipt.status)}
                          color="gray.800"
                          size="xs"
                        />
                        <Text color="gray.800" fontSize="xs" fontWeight="600">
                          {selectedReceipt.status.toUpperCase()}
                        </Text>
                      </HStack>
                    </Badge>
                  </VStack>
                </Box>
              </HStack>

              {/* Payment Details */}
              <Box bg="#F7F9FC" p={4} rounded="lg">
                <VStack space={3}>
                  <Text color="gray.800" fontSize="sm" fontWeight="bold">
                    Payment Information
                  </Text>
                  <Divider bg="gray.100" />
                  
                  <HStack justifyContent="space-between">
                    <Text color="gray.600" fontSize="sm">
                      Date & Time
                    </Text>
                    <Text color="gray.800" fontSize="sm" fontWeight="500">
                      {formatDate(selectedReceipt.createdAt)}
                    </Text>
                  </HStack>

                  <HStack justifyContent="space-between">
                    <Text color="gray.600" fontSize="sm">
                      Payment Method
                    </Text>
                    <Text color="gray.800" fontSize="sm" fontWeight="500">
                      {selectedReceipt.paymentMethod || 'Card'}
                    </Text>
                  </HStack>

                  <HStack justifyContent="space-between">
                    <Text color="gray.600" fontSize="sm">
                      Items Paid
                    </Text>
                    <Text color="gray.800" fontSize="sm" fontWeight="500">
                      {selectedReceipt.orderIds.length}
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Transaction ID */}
              <Box bg="#F7F9FC" p={4} rounded="lg">
                <VStack space={2}>
                  <Text color="gray.500" fontSize="xs" fontWeight="600">
                    TRANSACTION ID
                  </Text>
                  <Text color="gray.700" fontSize="sm" fontFamily="mono">
                    {selectedReceipt.txnId}
                  </Text>
                </VStack>
              </Box>

              {/* Order IDs */}
              {selectedReceipt.orderIds.length > 0 && (
                <Box bg="#F7F9FC" p={4} rounded="lg">
                  <VStack space={2}>
                    <Text color="gray.800" fontSize="sm" fontWeight="bold">
                      Paid Items ({selectedReceipt.orderIds.length})
                    </Text>
                    <Divider bg="gray.100" />
                    <VStack space={1}>
                      {selectedReceipt.orderIds.map((orderId, index) => (
                        <HStack key={index} space={2} alignItems="center">
                          <Icon
                            as={Ionicons}
                            name="checkmark-circle"
                            color="green.500"
                            size="xs"
                          />
                          <Text color="gray.600" fontSize="xs" flex={1} numberOfLines={1}>
                            {orderId}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Box>
              )}

              {/* Info Notice */}
              <Box bg="blue.900" p={3} rounded="lg" borderWidth={1} borderColor="blue.600">
                <HStack space={2} alignItems="center">
                  <Icon as={Ionicons} name="info" color="blue.400" size="sm" />
                  <Text color="blue.200" fontSize="xs" flex={1}>
                    Keep this receipt for your records. This is a mock payment for demonstration purposes.
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </Modal.Body>

          <Modal.Footer bg="white" borderTopWidth={0}>
            <Button
              flex={1}
              bg="primary.400"
              onPress={closeReceiptDetail}
              _pressed={{ bg: 'primary.500' }}
            >
              <Text color="gray.800" fontWeight="600">
                Close
              </Text>
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    );
  };

  return (
    <Box flex={1} bg="bg.900" safeArea>
      {/* Header */}
      <HStack
        px={6}
        py={4}
        bg="white"
        alignItems="center"
        space={3}
        borderBottomWidth={1}
        borderBottomColor="coolGray.700"
      >
        <Button
          variant="ghost"
          onPress={onNavigateBack}
          leftIcon={<Icon as={Ionicons} name="arrow-back" size="md" color="gray.800" />}
          _pressed={{ bg: 'coolGray.700' }}
        >
          <Text color="gray.800" fontSize="md">
            Back
          </Text>
        </Button>
        <Heading color="gray.800" size="lg" flex={1}>
          Receipts
        </Heading>
      </HStack>

      <ScrollView flex={1}>
        <VStack space={6} px={6} py={6}>
          {/* Info Banner */}
          <Box bg="white" p={4} rounded="xl" borderWidth={1} borderColor="gray.200">
            <HStack space={3} alignItems="center">
              <Icon as={Ionicons} name="receipt-outline" color="primary.400" size="lg" />
              <VStack flex={1}>
                <Text color="gray.800" fontSize="md" fontWeight="600">
                  Payment History
                </Text>
                <Text color="gray.600" fontSize="sm">
                  View all your payment receipts
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Box py={10} alignItems="center">
              <Spinner size="lg" color="primary.400" />
              <Text color="gray.600" mt={4} fontSize="md">
                Loading receipts...
              </Text>
            </Box>
          ) : receipts.length === 0 ? (
            /* No Receipts */
            <Box
              bg="white"
              p={8}
              rounded="xl"
              borderWidth={1}
              borderColor="gray.200"
              alignItems="center"
            >
              <Icon
                as={Ionicons}
                name="receipt-outline"
                size="4xl"
                color="gray.600"
              />
              <Text color="gray.800" fontSize="lg" fontWeight="600" mt={4}>
                No Receipts Yet
              </Text>
              <Text color="gray.600" fontSize="sm" mt={2} textAlign="center">
                Your payment receipts will appear here after you make a payment
              </Text>
            </Box>
          ) : (
            /* Receipt List */
            <>
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.600" fontSize="sm">
                  {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} found
                </Text>
                <Badge bg="primary.500" rounded="full" px={3} py={1}>
                  <Text color="gray.800" fontSize="xs" fontWeight="600">
                    Total: R{receipts.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                  </Text>
                </Badge>
              </HStack>

              <VStack space={0}>
                {receipts.map(receipt => renderReceiptCard(receipt))}
              </VStack>
            </>
          )}
        </VStack>
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}
    </Box>
  );
}
