import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { NoteEditorScreen } from '../screens/NoteEditorScreen';
import { NavigationParamList } from '../types';

const Stack = createStackNavigator<NavigationParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#e9ecef',
          },
          headerTintColor: '#2c3e50',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false, // We'll handle the header in the component
          }}
        />
        <Stack.Screen
          name="Record"
          component={RecordScreen}
          options={{
            title: 'New Recording',
            headerShown: false, // We'll handle the header in the component
          }}
        />
        <Stack.Screen
          name="NoteEditor"
          component={NoteEditorScreen}
          options={{
            title: 'Edit Note',
            headerShown: false, // We'll handle the header in the component
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};