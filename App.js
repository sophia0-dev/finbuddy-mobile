import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.logo}>Finbuddy</Text>
      <Text style={styles.subtitle}>Student Financial Optimization Engine</Text>
      
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>✅ UI Engine Running</Text>
        <Text style={styles.statusText}>⏳ Waiting for Backend Sync...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000080', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    marginBottom: 40,
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginVertical: 5,
  }
});