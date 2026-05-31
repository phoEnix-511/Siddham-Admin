import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import WebView from 'react-native-webview';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { Colors, Spacing, Radius, Fonts, Shadow } from '../constants/colors';
import { API_BASE_URL } from '../constants/config';

interface Address {
  name: string; email: string; phone: string;
  address: string; city: string; state: string; pincode: string;
}

const INDIA_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

function FormInput({
  label, value, onChangeText, placeholder, keyboardType, required,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: any; required?: boolean;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}{required && ' *'}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        keyboardType={keyboardType || 'default'}
        autoCorrect={false}
      />
    </View>
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [loading, setLoading] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState('');
  const [orderId, setOrderId] = useState('');

  const [addr, setAddr] = useState<Address>({
    name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
  });

  const shipping = total >= 999 ? 0 : 99;
  const grandTotal = total + shipping;

  const set = (key: keyof Address) => (val: string) => setAddr(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    if (!addr.name || !addr.email || !addr.phone || !addr.address || !addr.city || !addr.pincode) {
      Alert.alert('Missing Details', 'Please fill in all required fields.');
      return false;
    }
    if (!/^\d{10}$/.test(addr.phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(addr.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (!/^\d{6}$/.test(addr.pincode)) {
      Alert.alert('Invalid Pincode', 'Pincode must be 6 digits.');
      return false;
    }
    return true;
  };

  const handleProceedToPayment = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 1. Create DB order
      const orderRes = await api.orders.create({
        customer: { name: addr.name, email: addr.email, phone: addr.phone },
        shippingAddress: {
          address: addr.address, city: addr.city,
          state: addr.state || 'Not specified', pincode: addr.pincode,
        },
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        totalAmount: grandTotal,
        shippingAmount: shipping,
      });

      setOrderId(orderRes.order.id);

      // 2. Create Razorpay order
      const payRes = await api.payment.createOrder({
        amount: grandTotal,
        orderId: orderRes.order.id,
      });

      // 3. Build Razorpay Standard Checkout HTML
      const html = buildRazorpayHtml({
        key: payRes.keyId,
        amount: payRes.amount,
        orderId: payRes.razorpayOrderId,
        name: addr.name,
        email: addr.email,
        phone: addr.phone,
        dbOrderId: orderRes.order.id,
        orderNumber: orderRes.order.orderNumber,
      });

      setRazorpayHtml(html);
      setStep('payment');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'payment_success') {
        // Verify payment
        await api.payment.verify({
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
          orderId,
        });
        clearCart();
        router.replace({ pathname: '/order-success', params: { orderNumber: data.order_number || orderId } });
      } else if (data.type === 'payment_dismissed') {
        setStep('form');
      }
    } catch {
      Alert.alert('Verification Failed', 'Payment verification failed. Please contact support.');
      setStep('form');
    }
  };

  if (step === 'payment' && razorpayHtml) {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          source={{ html: razorpayHtml, baseUrl: API_BASE_URL }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          {items.map(item => (
            <View key={item.productId} style={styles.summaryRow}>
              <Text style={styles.summaryItemName} numberOfLines={1}>{item.name} × {item.quantity}</Text>
              <Text style={styles.summaryItemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={[styles.summaryValue, { color: shipping === 0 ? Colors.success : undefined }]}>
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Details</Text>
          <FormInput label="Full Name" value={addr.name} onChangeText={set('name')} placeholder="Raj Kumar" required />
          <FormInput label="Email" value={addr.email} onChangeText={set('email')} placeholder="raj@example.com" keyboardType="email-address" required />
          <FormInput label="Phone" value={addr.phone} onChangeText={set('phone')} placeholder="9876543210" keyboardType="phone-pad" required />
          <FormInput label="Address" value={addr.address} onChangeText={set('address')} placeholder="House/Flat, Street, Area" required />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormInput label="City" value={addr.city} onChangeText={set('city')} placeholder="Mumbai" required />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <FormInput label="Pincode" value={addr.pincode} onChangeText={set('pincode')} placeholder="400001" keyboardType="numeric" required />
            </View>
          </View>
          <FormInput label="State" value={addr.state} onChangeText={set('state')} placeholder="Maharashtra" />
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={styles.stickyBottom}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalAmount}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, (loading || items.length === 0) && styles.payBtnDisabled]}
          onPress={handleProceedToPayment}
          disabled={loading || items.length === 0}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.payBtnText}>Pay with Razorpay →</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function buildRazorpayHtml({
  key, amount, orderId, name, email, phone, dbOrderId, orderNumber,
}: {
  key: string; amount: number; orderId: string;
  name: string; email: string; phone: string;
  dbOrderId: string; orderNumber: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; background: #1a3d2b; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .box { background: #f8f4ee; border-radius: 16px; padding: 32px 24px; text-align: center; max-width: 360px; width: 90%; }
    h2 { color: #1a3d2b; font-family: serif; margin-bottom: 8px; }
    p { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    button { background: #c4852a; color: white; border: none; border-radius: 50px; padding: 14px 32px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%; }
    .amount { font-size: 28px; font-weight: 700; color: #1a3d2b; margin-bottom: 4px; }
    .loading { color: #4a7c59; font-size: 13px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="box">
    <h2>Siddham Wellness</h2>
    <div class="amount">₹${(amount / 100).toFixed(0)}</div>
    <p>Secure Payment via Razorpay</p>
    <button onclick="openRazorpay()">Pay Now</button>
    <div class="loading" id="status"></div>
  </div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function openRazorpay() {
      document.getElementById('status').textContent = 'Opening payment gateway...';
      var options = {
        key: '${key}',
        amount: ${amount},
        currency: 'INR',
        name: 'Siddham Wellness',
        description: 'Order Payment',
        order_id: '${orderId}',
        prefill: { name: '${name}', email: '${email}', contact: '${phone}' },
        theme: { color: '#1a3d2b' },
        handler: function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_success',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_number: '${orderNumber}',
          }));
        },
        modal: { ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'payment_dismissed' }));
        }}
      };
      var rzp = new Razorpay(options);
      rzp.open();
    }
    window.onload = function() { setTimeout(openRazorpay, 800); };
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  card: {
    backgroundColor: Colors.white,
    margin: Spacing.base,
    marginBottom: 0,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.forestDark,
    marginBottom: Spacing.base,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryItemName: { flex: 1, fontFamily: Fonts.sans, fontSize: 13, color: Colors.gray700, marginRight: 8 },
  summaryItemPrice: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.gray700 },
  summaryLabel: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.gray500 },
  summaryValue: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.gray700 },
  divider: { height: 1, backgroundColor: Colors.gray200, marginVertical: 10 },
  totalRow: { marginTop: 4 },
  totalLabel: { fontFamily: Fonts.sansBold, fontSize: 16, color: Colors.forestDark },
  totalAmount: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.forest },
  formGroup: { marginBottom: Spacing.md },
  formLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.gray700, marginBottom: 5 },
  formInput: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 11,
    fontFamily: Fonts.sans, fontSize: 14, color: Colors.gray800,
    backgroundColor: Colors.white,
  },
  row: { flexDirection: 'row' },
  stickyBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.gray200,
    padding: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.base,
    ...Shadow.lg,
  },
  bottomTotal: { flex: 1 },
  bottomTotalLabel: { fontSize: 12, fontFamily: Fonts.sans, color: Colors.gray500 },
  bottomTotalAmount: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.forestDark },
  payBtn: {
    flex: 2,
    backgroundColor: Colors.forest,
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: Colors.white, fontFamily: Fonts.sansBold, fontSize: 15 },
});
