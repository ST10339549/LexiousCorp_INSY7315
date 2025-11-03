import { sendAnnouncementPush } from './sendNotification';

async function testNotifications() {
  try {
    // Test 1: Send to single role (parents)
    console.log('🧪 Test 1: Sending to parents...');
    const parentResult = await sendAnnouncementPush('parent', {
      title: '[TEST] Parent Notification',
      body: 'This is a test notification for parents only.'
    });
    console.log('📊 Parent Test Results:', parentResult);

    // Test 2: Send to multiple roles (admin and staff)
    console.log('\n🧪 Test 2: Sending to admin and staff...');
    const staffResult = await sendAnnouncementPush(['admin', 'staff'], {
      title: '[TEST] Staff Notification',
      body: 'This is a test notification for admin and staff.'
    });
    console.log('📊 Staff Test Results:', staffResult);

    // Test 3: Send to all roles
    console.log('\n🧪 Test 3: Sending to all roles...');
    const allResult = await sendAnnouncementPush(['admin', 'staff', 'parent'], {
      title: '[TEST] All Users Notification',
      body: 'This is a test notification for all users.'
    });
    console.log('📊 All Users Test Results:', allResult);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testNotifications();