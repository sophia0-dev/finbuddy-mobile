import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, StatusBar, Alert, Dimensions, Switch } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
// @ts-ignore
import  Paystack  from 'react-native-paystack-webview';

const PAYSTACK_PUBLIC_KEY = "pk_test_98f8cc28b78510671738e38c8ea8c9aeafb55a58"; 
const screenWidth = Dimensions.get("window").width;

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const [role, setRole] = useState('Student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [matricNumber, setMatricNumber] = useState('2022/250559');
  const [institution, setInstitution] = useState('University of Nigeria, Nsukka');
  const [degreeProgram, setDegreeProgram] = useState('Computer Science');

  const [budget, setBudget] = useState('50000');
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [expenseItems, setExpenseItems] = useState<any[]>([]);
  const [expenseName, setExpenseName] = useState('');
  const [expenseCost, setExpenseCost] = useState('');
  const [expenseUtility, setExpenseUtility] = useState('5');
  const [isFixed, setIsFixed] = useState(false);

  const [transferMatric, setTransferMatric] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const [amenityMatric, setAmenityMatric] = useState('');
  const [amenityName, setAmenityName] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  const [dailyLogName, setDailyLogName] = useState('');
  const [dailyLogAmount, setDailyLogAmount] = useState('');
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);

  const [recordMatric, setRecordMatric] = useState('');
  const [studentRecords, setStudentRecords] = useState<any>(null);
  const [isFetchingRecords, setIsFetchingRecords] = useState(false);

  const [requestTitle, setRequestTitle] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);

  const [globalRequests, setGlobalRequests] = useState<any[]>([]);
  const [isFetchingGlobal, setIsFetchingGlobal] = useState(false);

  // NEW: Sponsor Impact Tracking State
  const [impactRecords, setImpactRecords] = useState<any[]>([]);
  const [isFetchingImpact, setIsFetchingImpact] = useState(false);

  const paystackWebViewRef = useRef<any>(null); 

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert("Missing Fields", "Please enter email and password.");
    setIsLoading(true);
    const endpoint = isLogin ? '/api/login' : '/api/signup';
    const url = `https://finbuddy-backend-nr0v.onrender.com${endpoint}`;
    const payload = isLogin ? { email, password } : role === 'Student' ? { name, email, password, role, matricNumber, institution, degreeProgram } : { name, email, password, role }; 

    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      setIsLoading(false);
      if (!response.ok) return Alert.alert("Auth Failed ❌", data.message || "Something went wrong.");

      if (isLogin) {
        setUserToken(data.token);
        setUserProfile(data.user); 
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userProfile', JSON.stringify(data.user));
        if (data.user.expenseLogs) setDailyLogs(data.user.expenseLogs);
        if (data.user.sponsorshipRequests) setMyRequests(data.user.sponsorshipRequests);
      } else {
        Alert.alert("Account Created ✅", `You can now log in as a ${role}!`);
        setIsLogin(true);
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Network Error", "Check your backend server.");
    }
  };

const addExpense = () => {
  if (!expenseName || !expenseCost) return Alert.alert("Error", "Fill all fields.");
  
  let autoUtility = Number(expenseUtility);
  let autoFixed = isFixed;
  const name = expenseName.toLowerCase();
  
  if (name.includes('food') || name.includes('health') || name.includes('rent')) {
    autoUtility = 10;
    autoFixed = true; 
  } else if (name.includes('misc') || name.includes('flex')) {
    autoUtility = 2;
  }
  
  setExpenseItems([...expenseItems, { name: expenseName, cost: Number(expenseCost), utility: autoUtility, isFixed: autoFixed }]);
  setExpenseName(''); setExpenseCost('');
};

const runOptimization = async () => {
    if (expenseItems.length === 0) return Alert.alert("No Expenses", "Add at least one expense.");

    // ADD THE EXAMINER'S LOGIC HERE: Check if total cost exceeds budget
    const totalCost = expenseItems.reduce((sum, item) => sum + Number(item.cost), 0);
    if (totalCost > Number(budget)) {
      Alert.alert(
        "Budget Exceeded", 
        `You are ₦${totalCost - Number(budget)} over budget. The ILP engine will now step in to prioritize your essentials.`
      );
    }

    setIsOptimizing(true);
    try {
      const response = await fetch('https://finbuddy-backend-nr0v.onrender.com/api/optimize', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ totalIncome: Number(budget), expenseItems }) 
      });
      const data = await response.json();
      
      setIsOptimizing(false);
      if (data.success) setOptimizationResult(data.data);
      else Alert.alert("Error", data.error);
    } catch (error) {
      setIsOptimizing(false);
      Alert.alert("Network Error", "Failed to run ILP algorithm.");
    }
  };

  const initiatePayment = () => {
    if (!transferMatric || !transferAmount || Number(transferAmount) <= 0) return Alert.alert("Error", "Enter a valid matric number and amount.");
    if (PAYSTACK_PUBLIC_KEY === "pk_test_98f8cc28b78510671738e38c8ea8c9aeafb55a58") return Alert.alert("Setup Required", "Please paste your Paystack Public Key into the code.");
    paystackWebViewRef.current?.startTransaction();
  };

  const executeDatabaseTransfer = async () => {
    setIsTransferring(true);
    try {
      const response = await fetch('https://finbuddy-backend-nr0v.onrender.com/api/v1/wallet/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, body: JSON.stringify({ matricNumber: transferMatric, amount: Number(transferAmount) }) });
      const data = await response.json();
      setIsTransferring(false);
      if (data.success) {
        Alert.alert("Transfer Successful ✅", `Real funds processed and DB updated: ${data.message}`);
        setTransferMatric(''); setTransferAmount('');
      } else Alert.alert("Transfer Failed", data.message || data.error);
    } catch (error) {
      setIsTransferring(false);
      Alert.alert("Network Error", "Payment processed, but backend failed to update.");
    }
  };

  const handleGrantAmenity = async () => {
    if (!amenityMatric || !amenityName) return Alert.alert("Error", "Enter matric number and amenity.");
    setIsGranting(true);
    try {
      const response = await fetch('https://finbuddy-backend-nr0v.onrender.com/api/v1/amenity/grant', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, body: JSON.stringify({ matricNumber: amenityMatric, amenityName }) });
      const data = await response.json();
      setIsGranting(false);
      if (data.success) {
        Alert.alert("Amenity Granted ✅", data.message);
        setAmenityMatric(''); setAmenityName('');
      } else Alert.alert("Grant Failed", data.message || data.error);
    } catch (error) {
      setIsGranting(false);
      Alert.alert("Network Error", "Failed to connect to server.");
    }
  };

  const handleClaimAmenity = async (amenityId: string) => {
    try {
      const response = await fetch('https://finbuddy-backend-nr0v.onrender.com/api/v1/student/claim-amenity', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, body: JSON.stringify({ amenityId }) });
      const data = await response.json();
      if (data.success) {
        setUserProfile({ ...userProfile, amenities: data.amenities });
        Alert.alert("Success!", "You have confirmed collection of this amenity.");
      } else Alert.alert("Failed", data.message || data.error);
    } catch (error) {
      Alert.alert("Network Error", "Failed to connect to server.");
    }
  };

  const logDailyExpense = async () => {
    if (!dailyLogName || !dailyLogAmount) return Alert.alert("Error", "Enter what you bought and the amount.");
    try {
      const response = await fetch('https://finbuddy-backend-nr0v.onrender.com/api/v1/student/log-expense', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, body: JSON.stringify({ name: dailyLogName, amount: Number(dailyLogAmount) }) });
      const data = await response.json();
      if (data.success) {
        setDailyLogs(data.logs);
        setUserProfile({ ...userProfile, walletBalance: data.newBalance }); 
        setDailyLogName(''); setDailyLogAmount('');
        Alert.alert("Logged!", "Your daily expense has been securely recorded.");
      } else Alert.alert("Failed", data.message || data.error);
    } catch (error) {
      Alert.alert("Network Error", "Failed to connect to server.");
    }
  };

  const fetchStudentRecords = async () => {
    if (!recordMatric) return Alert.alert("Error", "Enter a matric number to fetch records.");
    setIsFetchingRecords(true);
    try {
      const response = await fetch(`https://finbuddy-backend-nr0v.onrender.com/api/v1/sponsor/records/${encodeURIComponent(recordMatric)}`, { method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await response.json();
      setIsFetchingRecords(false);
      if (data.success) setStudentRecords(data);
      else Alert.alert("Fetch Failed", data.message || data.error);
    } catch (error) {
      setIsFetchingRecords(false);
      Alert.alert("Network Error", "Failed to connect to server.");
    }
  };

  const submitSponsorshipRequest = async () => {
    if (!requestTitle || !requestAmount) return Alert.alert("Error", "Enter what you need and the amount.");
    try {
      const response = await fetch('https://finbuddy-backend-nr0v.onrender.com/api/v1/student/request-sponsorship', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, body: JSON.stringify({ title: requestTitle, amount: Number(requestAmount) }) });
      const data = await response.json();
      if (data.success) {
        setMyRequests(data.requests);
        setRequestTitle(''); setRequestAmount('');
        Alert.alert("Requested!", "Your sponsorship plea has been posted.");
      } else Alert.alert("Failed", data.message || data.error);
    } catch (error) {
      Alert.alert("Network Error", "Failed to connect to server.");
    }
  };

  const fetchGlobalRequests = async () => {
    setIsFetchingGlobal(true);
    try {
      const response = await fetch('https://finbuddy-backend-nr0v.onrender.com/api/v1/sponsor/all-requests', { method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await response.json();
      setIsFetchingGlobal(false);
      if (data.success) setGlobalRequests(data.students);
      else Alert.alert("Fetch Failed", data.message || data.error);
    } catch (error) {
      setIsFetchingGlobal(false);
      Alert.alert("Network Error", "Failed to connect to server.");
    }
  };

  const fetchImpactRecord = async () => {
    setIsFetchingImpact(true);
    try {
      const response = await fetch('https://finbuddy-backend-nr0v.onrender.com/api/v1/sponsor/track-record', { method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
      const data = await response.json();
      setIsFetchingImpact(false);
      if (data.success) setImpactRecords(data.impactRecord);
      else Alert.alert("Fetch Failed", data.message || data.error);
    } catch (error) {
      setIsFetchingImpact(false);
      Alert.alert("Network Error", "Failed to connect to server.");
    }
  };
  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userProfile');
    setUserToken(null);
    setUserProfile(null);
  };

  if (userToken && userProfile) {
    if (userProfile.role === 'Sponsor') {
      return (
        <ScrollView contentContainerStyle={styles.dashboardContainer}>
          <StatusBar barStyle="light-content" />
          <View style={{ flex: 1 }}>
            <Paystack  
              paystackKey={PAYSTACK_PUBLIC_KEY} amount={transferAmount} billingEmail={userProfile.email} billingName={userProfile.name}
              activityIndicatorColor="green" onCancel={(e: any) => Alert.alert("Payment Cancelled", "Transaction closed.")}
              onSuccess={(res: any) => executeDatabaseTransfer()} ref={paystackWebViewRef}
            />
          </View>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome, {userProfile.name}</Text>
            <Text style={styles.roleText}>Sponsor Portal</Text>
          </View>

          {/* NEW: SPONSOR IMPACT TRACKER */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Impact & Tracking</Text>
            <Text style={{color: '#E0E7FF', marginBottom: 15, fontSize: 13}}>Track students who have received your funds and claimed your amenities.</Text>
            <TouchableOpacity style={[styles.button, {backgroundColor: '#10B981'}]} onPress={fetchImpactRecord} disabled={isFetchingImpact}>
              <Text style={styles.buttonText}>{isFetchingImpact ? "Loading..." : "Track My Sponsorships"}</Text>
            </TouchableOpacity>
            {impactRecords.length > 0 && (
              <View style={{marginTop: 15}}>
                {impactRecords.map((record, idx) => (
                  <View key={idx} style={{marginBottom: 15, padding: 15, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10}}>
                    <Text style={{color: '#FFFFFF', fontWeight: 'bold', fontSize: 16}}>{record.name}</Text>
                    <Text style={{color: '#A5B4FC', fontSize: 12, marginBottom: 10}}>{record.matricNumber}</Text>
                    {record.fundsGranted.length > 0 && (
                      <View style={{marginBottom: 10}}>
                        <Text style={{color: '#34D399', fontWeight: 'bold', fontSize: 13}}>💸 Funds Provided:</Text>
                        {record.fundsGranted.map((fund: any, fIdx: number) => (
                          <Text key={fIdx} style={{color: '#FFFFFF', fontSize: 14}}>+₦{fund.amount} on {new Date(fund.date).toLocaleDateString()}</Text>
                        ))}
                      </View>
                    )}
                    {record.amenitiesGranted.length > 0 && (
                      <View>
                        <Text style={{color: '#FBBF24', fontWeight: 'bold', fontSize: 13}}>🎁 Amenities Provided:</Text>
                        {record.amenitiesGranted.map((amn: any, aIdx: number) => (
                          <Text key={aIdx} style={{color: '#FFFFFF', fontSize: 14}}>
                            {amn.name} - <Text style={{color: amn.status === 'Collected' ? '#34D399' : '#FCD34D', fontWeight: 'bold'}}>{amn.status || 'Pending'}</Text>
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Global Sponsorship Board</Text>
            <TouchableOpacity style={[styles.button, {backgroundColor: '#8B5CF6'}]} onPress={fetchGlobalRequests} disabled={isFetchingGlobal}>
              <Text style={styles.buttonText}>{isFetchingGlobal ? "Fetching Board..." : "View All Open Requests"}</Text>
            </TouchableOpacity>
            {globalRequests.length > 0 && (
              <View style={{marginTop: 15}}>
                {globalRequests.map((student, sIdx) => (
                  <View key={sIdx} style={{marginBottom: 15, padding: 15, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10}}>
                    <Text style={{color: '#FFFFFF', fontWeight: 'bold', fontSize: 16}}>{student.anonymousId || "Anonymous Student"}</Text>
<Text style={{color: '#A5B4FC', fontSize: 12, marginBottom: 10}}>{student.institution} • {student.degreeProgram}</Text>
                    {student.sponsorshipRequests.map((req: any, rIdx: number) => (
                      <View key={rIdx} style={[styles.listItem, {backgroundColor: 'rgba(251, 191, 36, 0.1)', marginTop: 5, padding: 10}]}>
                        <View>
                          <Text style={styles.listItemName}>{req.title}</Text>
                          <Text style={[styles.listItemSub, {color: '#FCD34D'}]}>{req.status}</Text>
                        </View>
                        <Text style={[styles.listItemCost, {color: '#FBBF24'}]}>₦{req.amount}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fund a Student Wallet</Text>
            <TextInput style={styles.input} placeholder="Student Matric Number" placeholderTextColor="#A5B4FC" value={transferMatric} onChangeText={setTransferMatric} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Amount to Send (₦)" placeholderTextColor="#A5B4FC" value={transferAmount} onChangeText={setTransferAmount} keyboardType="numeric" />
            <TouchableOpacity style={[styles.button, {backgroundColor: '#34D399'}]} onPress={initiatePayment} disabled={isTransferring}>
              <Text style={styles.buttonText}>{isTransferring ? "Processing..." : "Pay via Paystack"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Grant an Amenity</Text>
            <TextInput style={styles.input} placeholder="Student Matric Number" placeholderTextColor="#A5B4FC" value={amenityMatric} onChangeText={setAmenityMatric} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Amenity (e.g., Groceries)" placeholderTextColor="#A5B4FC" value={amenityName} onChangeText={setAmenityName} />
            <TouchableOpacity style={[styles.button, {backgroundColor: '#FBBF24'}]} onPress={handleGrantAmenity} disabled={isGranting}>
              <Text style={[styles.buttonText, {color: '#000000'}]}>{isGranting ? "Processing..." : "Grant Specific Amenity"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>View Student Needs & Records</Text>
            <TextInput style={styles.input} placeholder="Student Matric Number" placeholderTextColor="#A5B4FC" value={recordMatric} onChangeText={setRecordMatric} autoCapitalize="none" />
            <TouchableOpacity style={[styles.button, {backgroundColor: '#60A5FA'}]} onPress={fetchStudentRecords} disabled={isFetchingRecords}>
              <Text style={styles.buttonText}>{isFetchingRecords ? "Fetching..." : "Fetch Student Profile"}</Text>
            </TouchableOpacity>
            {studentRecords && (
              <View style={{marginTop: 15, padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8}}>
                <Text style={{color: '#FFFFFF', fontWeight: 'bold', fontSize: 16}}>{studentRecords.studentName}</Text>
                <Text style={{color: '#34D399', fontWeight: 'bold', marginBottom: 15}}>Current Wallet: ₦{studentRecords.walletBalance}</Text>
                {studentRecords.amenities && studentRecords.amenities.length > 0 && (
                  <View style={{marginBottom: 15}}>
                    <Text style={{color: '#FBBF24', fontWeight: 'bold', marginBottom: 5}}>🎁 Granted Amenities:</Text>
                    {studentRecords.amenities.map((amn: any, index: number) => (
                      <View key={index} style={styles.listItem}>
                        <View><Text style={styles.listItemName}>{amn.name}</Text><Text style={[styles.listItemSub, {color: amn.status === 'Collected' ? '#34D399' : '#FCD34D'}]}>Status: {amn.status || 'Pending'}</Text></View>
                      </View>
                    ))}
                  </View>
                )}
                {studentRecords.sponsorshipRequests && studentRecords.sponsorshipRequests.length > 0 && (
                  <View style={{marginBottom: 15}}>
                    <Text style={{color: '#FBBF24', fontWeight: 'bold', marginBottom: 5}}>⚠️ Active Help Requests:</Text>
                    {studentRecords.sponsorshipRequests.map((req: any, index: number) => (
                      <View key={index} style={[styles.listItem, {backgroundColor: 'rgba(251, 191, 36, 0.1)'}]}>
                        <View><Text style={styles.listItemName}>{req.title}</Text><Text style={[styles.listItemSub, {color: '#FCD34D'}]}>Status: {req.status}</Text></View>
                        <Text style={[styles.listItemCost, {color: '#FBBF24'}]}>₦{req.amount}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={{color: '#A5B4FC', fontWeight: 'bold', marginBottom: 5}}>Past Expense History:</Text>
                {(!studentRecords.expenseLogs || studentRecords.expenseLogs.length === 0) ? (
                  <Text style={{color: '#E0E7FF'}}>No expenses logged yet.</Text>
                ) : (
                  studentRecords.expenseLogs.map((log: any, index: number) => (
                    <View key={index} style={styles.listItem}>
                      <View><Text style={styles.listItemName}>{log.name}</Text><Text style={styles.listItemSub}>{new Date(log.date).toLocaleDateString()}</Text></View>
                      <Text style={[styles.listItemCost, {color: '#F87171'}]}>-₦{log.amount}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
          <TouchableOpacity style={[styles.button, {backgroundColor: '#EF4444', marginTop: 10}]} onPress={handleLogout}><Text style={styles.buttonText}>Log Out</Text></TouchableOpacity>
        </ScrollView>
      );
    }

  const chartLabels = optimizationResult ? optimizationResult.optimalAllocation.filter((item: any) => item.allocated > 0).map((item: any) => item.name) : [];
  const chartValues = optimizationResult ? optimizationResult.optimalAllocation.filter((item: any) => item.allocated > 0).map((item: any) => item.allocated) : [];
  
  const barChartData = {
    labels: chartLabels,
    datasets: [{ data: chartValues.length > 0 ? chartValues : [0] }] // Fallback to 0 if empty
  };
    return (
      <ScrollView contentContainerStyle={styles.dashboardContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome, {userProfile.name}</Text>
          <Text style={styles.walletText}>Wallet Balance: ₦{userProfile.walletBalance || 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ask for Sponsorship</Text>
          <TextInput style={styles.input} placeholder="What do you need? (e.g. Project Fee)" placeholderTextColor="#A5B4FC" value={requestTitle} onChangeText={setRequestTitle} />
          <TextInput style={styles.input} placeholder="Amount Needed (₦)" placeholderTextColor="#A5B4FC" value={requestAmount} onChangeText={setRequestAmount} keyboardType="numeric" />
          <TouchableOpacity style={[styles.button, {backgroundColor: '#8B5CF6'}]} onPress={submitSponsorshipRequest}><Text style={styles.buttonText}>Post Request to Sponsors</Text></TouchableOpacity>
          {myRequests.length > 0 && (
            <View style={{marginTop: 15}}>
              <Text style={{color: '#A5B4FC', fontWeight: 'bold', marginBottom: 10}}>My Pending Requests:</Text>
              {myRequests.map((req, index) => (
                <View key={index} style={styles.listItem}>
                  <View><Text style={styles.listItemName}>{req.title}</Text><Text style={styles.listItemSub}>Status: {req.status}</Text></View>
                  <Text style={styles.listItemCost}>₦{req.amount}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {userProfile.amenities && userProfile.amenities.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gifts & Amenities</Text>
            {userProfile.amenities.map((amenity: any, index: number) => (
              <View key={index} style={styles.listItem}>
                <View style={{flex: 1}}>
                  <Text style={styles.listItemName}>🎁 {amenity.name}</Text>
                  <Text style={styles.listItemSub}>From: {amenity.grantedBy}</Text>
                  <Text style={[styles.listItemSub, {color: amenity.status === 'Collected' ? '#34D399' : '#FBBF24', fontWeight: 'bold'}]}>{amenity.status || 'Pending'}</Text>
                </View>
                {(!amenity.status || amenity.status === 'Pending') ? (
                  <TouchableOpacity style={{backgroundColor: '#34D399', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5}} onPress={() => handleClaimAmenity(amenity._id)}>
                    <Text style={{color: '#000000', fontWeight: 'bold', fontSize: 12}}>Claim Item</Text>
                  </TouchableOpacity>
                ) : (<Text style={{fontSize: 20}}>✅</Text>)}
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Record Daily Expense</Text>
          <TextInput style={styles.input} placeholder="What did you buy? (e.g. Lunch)" placeholderTextColor="#A5B4FC" value={dailyLogName} onChangeText={setDailyLogName} />
          <TextInput style={styles.input} placeholder="Amount (₦)" placeholderTextColor="#A5B4FC" value={dailyLogAmount} onChangeText={setDailyLogAmount} keyboardType="numeric" />
          <TouchableOpacity style={[styles.button, {backgroundColor: '#F59E0B'}]} onPress={logDailyExpense}><Text style={styles.buttonText}>Log Expense Securely</Text></TouchableOpacity>
          {dailyLogs.length > 0 && (
            <View style={{marginTop: 15}}>
              <Text style={{color: '#A5B4FC', fontWeight: 'bold', marginBottom: 10}}>Recent Logs:</Text>
              {dailyLogs.map((log, index) => (
                <View key={index} style={styles.listItem}>
                  <View><Text style={styles.listItemName}>{log.name}</Text><Text style={styles.listItemSub}>{new Date(log.date).toLocaleDateString()}</Text></View>
                  <Text style={[styles.listItemCost, {color: '#F87171'}]}>-₦{log.amount}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Set Monthly  Income (₦)</Text>
          <TextInput style={styles.budgetInput} value={budget} onChangeText={setBudget} keyboardType="numeric" />
          <Text style={styles.cardTitle}>2. Add Planned Expenses</Text>
          <TextInput style={styles.input} placeholder="Expense Name" placeholderTextColor="#A5B4FC" value={expenseName} onChangeText={setExpenseName} />
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Cost (₦)" placeholderTextColor="#A5B4FC" value={expenseCost} onChangeText={setExpenseCost} keyboardType="numeric" />
            <TextInput style={[styles.input, {flex: 1}]} placeholder="Priority (1-10)" placeholderTextColor="#A5B4FC" value={expenseUtility} onChangeText={setExpenseUtility} keyboardType="numeric" />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Fixed (Mandatory) Expense</Text>
            <Switch value={isFixed} onValueChange={setIsFixed} trackColor={{ false: "#767577", true: "#34D399" }} />
          </View>
          <TouchableOpacity style={[styles.button, {backgroundColor: '#2563EB'}]} onPress={addExpense}><Text style={styles.buttonText}>+ Add to Plan</Text></TouchableOpacity>
        </View>
        {expenseItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Planned Expenses</Text>
            {expenseItems.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View><Text style={styles.listItemName}>{item.name} {item.isFixed ? '📌' : ''}</Text><Text style={styles.listItemSub}>Priority: {item.utility}/10</Text></View>
                <Text style={styles.listItemCost}>₦{item.cost}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.button} onPress={runOptimization} disabled={isOptimizing}><Text style={styles.buttonText}>{isOptimizing ? "Processing ILP Engine..." : "Run Allocation"}</Text></TouchableOpacity>
          </View>
        )}
        {optimizationResult && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Optimized Breakdown</Text>
            <Text style={styles.savingsText}>Leftover Savings: ₦{optimizationResult.leftoverSavings}</Text>
           {chartLabels.length > 0 && (
              <BarChart
                data={barChartData}
                width={screenWidth - 80}
                height={220}
                yAxisLabel="₦"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`, // Renders bars in your theme's green
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  barPercentage: 0.6,
                }}
                style={{ marginVertical: 10, borderRadius: 8 }}
              />
            )}
          </View>
        )}
        <TouchableOpacity style={[styles.button, {backgroundColor: '#EF4444', marginTop: 10}]} onPress={handleLogout}><Text style={styles.buttonText}>Secure Log Out</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.logo}>Finbuddy</Text>
      <Text style={styles.subtitle}>{isLogin ? "Welcome Back" : "Create Account"}</Text>
      <View style={styles.formContainer}>
        {!isLogin && (
          <>
            <View style={styles.roleToggleContainer}>
              <TouchableOpacity style={[styles.roleButton, role === 'Student' && styles.roleButtonActive]} onPress={() => setRole('Student')}><Text style={[styles.roleTextBase, role === 'Student' && styles.roleTextActive]}>Student</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.roleButton, role === 'Sponsor' && styles.roleButtonActive]} onPress={() => setRole('Sponsor')}><Text style={[styles.roleTextBase, role === 'Sponsor' && styles.roleTextActive]}>Sponsor</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#A5B4FC" value={name} onChangeText={setName} />
            {role === 'Student' && (
              <>
                <TextInput style={styles.input} placeholder="Matric Number" placeholderTextColor="#A5B4FC" value={matricNumber} onChangeText={setMatricNumber} />
                <TextInput style={styles.input} placeholder="Institution" placeholderTextColor="#A5B4FC" value={institution} onChangeText={setInstitution} />
                <TextInput style={styles.input} placeholder="Degree Program" placeholderTextColor="#A5B4FC" value={degreeProgram} onChangeText={setDegreeProgram} />
              </>
            )}
          </>
        )}
        <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#A5B4FC" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#A5B4FC" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={isLoading}><Text style={styles.buttonText}>{isLoading ? "Processing..." : (isLogin ? "Log In" : "Sign Up")}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}><Text style={styles.switchText}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#4C1D95', alignItems: 'center', paddingTop: 80, paddingHorizontal: 20, paddingBottom: 40 },
  dashboardContainer: { flexGrow: 1, backgroundColor: '#4C1D95', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginBottom: 30, width: '100%' },
  welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  walletText: { fontSize: 16, color: '#34D399', marginTop: 5, fontWeight: '600' },
  roleText: { fontSize: 16, color: '#A5B4FC', marginTop: 5, fontWeight: '600' },
  logo: { fontSize: 42, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#E0E7FF', marginBottom: 30 },
  formContainer: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 20, borderRadius: 15 },
  card: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 20, borderRadius: 15, marginBottom: 20 },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', borderRadius: 8, padding: 15, marginBottom: 10, fontSize: 16 },
  budgetInput: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', borderRadius: 8, padding: 15, marginBottom: 20, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  switchLabel: { color: '#E0E7FF', fontSize: 14 },
  button: { backgroundColor: '#4F46E5', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 5, width: '100%' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  switchText: { color: '#A5B4FC', textAlign: 'center', marginTop: 20, fontSize: 14 },
  savingsText: { color: '#34D399', fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, marginBottom: 10 },
  listItemName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  listItemSub: { color: '#A5B4FC', fontSize: 12, marginTop: 4 },
  listItemCost: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  roleToggleContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' },
  roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  roleButtonActive: { backgroundColor: '#FBBF24' },
  roleTextBase: { color: '#A5B4FC', fontWeight: 'bold' },
  roleTextActive: { color: '#000000' }
});