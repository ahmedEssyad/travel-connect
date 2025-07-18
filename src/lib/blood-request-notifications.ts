/**
 * Blood request notification helpers
 */

// Import sms-service dynamically to avoid client-side bundling issues

/**
 * Notify pending donors that a blood request has been fulfilled
 */
export async function notifyDonorsRequestFulfilled(
  bloodRequest: any,
  acceptedDonor: any
): Promise<void> {
  try {
    // Get all pending donors (who haven't responded yet)
    const pendingDonors = bloodRequest.matchedDonors.filter(
      (donor: any) => donor.status === 'pending' && donor.donorId !== acceptedDonor.donorId
    );

    if (pendingDonors.length === 0) {
      return;
    }

    // Create thank you message for pending donors
    const thankYouMessage = `🙏 Munqidh - منقذ

✅ MERCI! Demande de sang résolue!
✅ شكراً! تم حل طلب الدم!

🩸 Groupe sanguin: ${bloodRequest.patientInfo.bloodType}
🏥 Hôpital: ${bloodRequest.hospital.name || 'غير محدد'}
👤 Patient: ${bloodRequest.patientInfo.name}

✅ Un autre donneur a déjà répondu. Merci pour votre générosité!
✅ متبرع آخر قد استجاب بالفعل. شكراً لكرمكم!

❤️ Votre disponibilité sauve des vies!
❤️ استعدادكم ينقذ الأرواح!`;

    // Send notifications to all pending donors
    const notificationPromises = pendingDonors.map(async (donor: any) => {
      // We would need to get the donor's phone number from the User collection
      // For now, we'll log it
      console.log(`Would notify pending donor ${donor.donorName} that request is fulfilled`);
      
      // TODO: Fetch donor phone number and send SMS
      // const donorUser = await User.findById(donor.donorId);
      // if (donorUser?.phoneNumber) {
      //   await sendSMS(donorUser.phoneNumber, thankYouMessage);
      // }
    });

    await Promise.allSettled(notificationPromises);
    console.log(`✅ Notified ${pendingDonors.length} pending donors that request is fulfilled`);

  } catch (error) {
    console.error('❌ Failed to notify pending donors:', error);
    // Don't throw error to avoid disrupting the main flow
  }
}

/**
 * Send motivational reminder to pending donors
 */
export async function sendReminderToPendingDonors(
  bloodRequest: any,
  reminderType: 'urgent' | 'final'
): Promise<void> {
  try {
    const pendingDonors = bloodRequest.matchedDonors.filter(
      (donor: any) => donor.status === 'pending'
    );

    if (pendingDonors.length === 0) {
      return;
    }

    const urgencyEmoji = bloodRequest.urgencyLevel === 'critical' ? '🆘🔥' : 
                        bloodRequest.urgencyLevel === 'urgent' ? '⚠️' : '🩸';

    const reminderMessage = reminderType === 'final' 
      ? `${urgencyEmoji} Munqidh - منقذ

⏰ DERNIER APPEL! Last call!
⏰ النداء الأخير!

🩸 ${bloodRequest.patientInfo.bloodType} blood urgently needed!
🩸 دم ${bloodRequest.patientInfo.bloodType} مطلوب بشدة!

👤 Patient: ${bloodRequest.patientInfo.name}
🏥 ${bloodRequest.hospital.name || 'غير محدد'}
⏰ Deadline: ${new Date(bloodRequest.deadline).toLocaleString('fr-FR')}

💔 Still no response! Please help if you can!
💔 لا توجد استجابة بعد! الرجاء المساعدة إذا أمكن!

📱 Open app to respond / افتح التطبيق للرد`

      : `${urgencyEmoji} Munqidh - منقذ

⏰ RAPPEL URGENT! Urgent reminder!
⏰ تذكير عاجل!

🩸 ${bloodRequest.patientInfo.bloodType} blood still needed!
🩸 لا يزال دم ${bloodRequest.patientInfo.bloodType} مطلوباً!

👤 ${bloodRequest.patientInfo.name} needs your help!
👤 ${bloodRequest.patientInfo.name} يحتاج مساعدتكم!

⏰ Time is running out!
⏰ الوقت ينفد!

📱 Please respond in the app / الرجاء الرد في التطبيق`;

    console.log(`📢 Sending ${reminderType} reminder to ${pendingDonors.length} pending donors`);

  } catch (error) {
    console.error('❌ Failed to send reminder to pending donors:', error);
  }
}