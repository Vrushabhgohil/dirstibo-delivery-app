import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Phone,
  Mail,
  Truck,
  Package,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Button } from '@/components/common/Button';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'workflow' | 'issues';
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    category: 'workflow',
    question: 'How do I view assigned deliveries?',
    answer:
      'Open the "My Deliveries" tab at the bottom navigation bar or check the shift overview on your Dashboard. Every approved order assigned to your fleet account by the central administrator is displayed with the store name, delivery address, and SKU count.',
  },
  {
    id: '2',
    category: 'workflow',
    question: 'How do I confirm warehouse pickup?',
    answer:
      'Tap on the assigned delivery and click "Collect at Warehouse (Pickup)". Verify the physical carton and unit count against the origin godown packing slip, then tap "Confirm Warehouse Pickup". This updates the system that the consignment is loaded in your vehicle and sets the order status to "Out for Delivery".',
  },
  {
    id: '3',
    category: 'workflow',
    question: 'How do I start a delivery & navigate to a store?',
    answer:
      'Once warehouse pickup is completed, the delivery status changes to In Transit. From the delivery screen, tap "Directions" to open the store\'s GPS coordinates in Google Maps or Apple Maps, or tap "Call Store" to notify the storekeeper of your arrival.',
  },
  {
    id: '4',
    category: 'workflow',
    question: 'How do I record delivered quantities?',
    answer:
      'At the store drop, tap "Execute Delivery Drop". Each SKU has a quantity stepper. If the store accepts the entire consignment, tap "Mark All Full". If only specific units are unloaded, adjust the stepper to the exact quantity accepted by the storekeeper.',
  },
  {
    id: '5',
    category: 'workflow',
    question: 'How do I complete a partial delivery?',
    answer:
      'If some items cannot be delivered (e.g. damaged in transit, store rejected, or store cash shortage), enter the actual quantity accepted by the retailer. The app automatically calculates the remaining units and requires you to enter a short reason. Tap "Complete Partial Delivery". The undelivered balance is recorded for Admin follow-up.',
  },
  {
    id: '6',
    category: 'workflow',
    question: 'How do I view delivery history?',
    answer:
      'Navigate to the "History" tab in the bottom bar. You can view all previously completed trips, filter by fully delivered or partially delivered drops, and inspect itemized quantity receipts.',
  },
  {
    id: '7',
    category: 'issues',
    question: 'What should I do if an assigned order is missing?',
    answer:
      'If an order is not appearing in your app, confirm with the warehouse dispatcher that the order has been approved by the Admin and specifically assigned to your Employee ID. Also pull down on the Deliveries screen to refresh the list from Supabase.',
  },
  {
    id: '8',
    category: 'issues',
    question: 'What should I do if the application is offline or not syncing?',
    answer:
      'Distribo Delivery is built with offline support. If network connectivity drops in rural or basement godown areas, your pickups and deliveries are saved locally. Once internet is restored, tap "Sync Now" on the banner or in your Profile to push updates to the central cloud.',
  },
];

export default function HelpScreen() {
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:9811002233');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:admin@aarvienterprise.com?subject=Delivery%20Fleet%20Support');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Support Header Banner */}
        <View style={styles.bannerCard}>
          <HelpCircle size={28} color={Colors.primaryDark} />
          <Text style={styles.bannerTitle}>Delivery Pilot Operations Guide</Text>
          <Text style={styles.bannerSubtitle}>
            Step-by-step instructions for warehouse dispatch, transit navigation, and store drop execution.
          </Text>
        </View>

        {/* FAQs Accordion */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {FAQS.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <View key={faq.id} style={styles.accordionCard}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleExpand(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.questionText}>{faq.question}</Text>
                  {isExpanded ? (
                    <ChevronUp size={18} color={Colors.primaryDark} />
                  ) : (
                    <ChevronDown size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Central Dispatch Contact Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Warehouse Dispatch Hotline</Text>
          <Text style={styles.contactSubtitle}>
            For urgent route adjustments, damaged carton reporting, or godown gate clearance:
          </Text>

          <View style={styles.contactRow}>
            <Button
              title="Call Dispatch (9811002233)"
              onPress={handleCallSupport}
              variant="primary"
              size="md"
              icon={<Phone size={16} color={Colors.primaryDark} />}
              style={{ flex: 1 }}
            />
          </View>

          <View style={styles.contactRow}>
            <Button
              title="Email Fleet Admin"
              onPress={handleEmailSupport}
              variant="outline"
              size="md"
              icon={<Mail size={16} color={Colors.text} />}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  bannerCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  bannerTitle: {
    ...Typography.heading2,
    fontSize: 18,
    color: Colors.text,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  bannerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  faqSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    marginBottom: Spacing.md,
  },
  accordionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  questionText: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  accordionBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.sm,
  },
  answerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontSize: 12,
  },
  contactCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactTitle: {
    ...Typography.heading3,
    color: Colors.text,
  },
  contactSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
});

