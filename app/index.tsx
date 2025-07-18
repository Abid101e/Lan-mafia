import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from '../Screens/HomeScreen';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HomeScreen />
    </SafeAreaView>
  );
};

export default App;
