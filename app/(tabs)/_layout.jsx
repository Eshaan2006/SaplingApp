import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View style={styles.iconContainer}>
      <Image
        source={icon}
        resizeMode="contain"
        style={[styles.icon, { tintColor: color }]}
      />
      <Text style={[styles.iconText, focused ? styles.focusedText : styles.regularText, { color }]}>
        {name}
      </Text>
    </View>
  );
};

const TabsLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#66BB6A',
          tabBarInactiveTintColor: '#E8F5E9',
          tabBarStyle: {
            backgroundColor: '#604B44',
            borderTopWidth: 1,
            borderTopColor: '#604B44',
            height: Platform.OS === 'ios' ? 80 : 110, // Slimmer height for iPhones
            paddingTop: Platform.OS === 'ios' ? 5 : 10, // Less padding for iPhones
            paddingBottom: Platform.OS === 'ios' ? 10 : 10,
          },
        }}
      >
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <FontAwesome5 name="calendar-day" size={26} color={color} />
                <Text style={[styles.iconText, focused ? styles.focusedText : styles.regularText, { color }]}>
                  Calendar
                </Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="map-marker-radius" size={26} color={color} />
                <Text style={[styles.iconText, focused ? styles.focusedText : styles.regularText, { color }]}>
                  Map
                </Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="followed"
          options={{
            title: 'Followed',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons name="person-add" size={26} color={color} />
                <Text style={[styles.iconText, focused ? styles.focusedText : styles.regularText, { color }]}>
                  Followed
                </Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <FontAwesome name="gear" size={30} color={color} />
                <Text style={[styles.iconText, focused ? styles.focusedText : styles.regularText, { color }]}>
                  Settings
                </Text>
              </View>
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  icon: {
    width: 26,
    height: 26,
  },
  iconText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  focusedText: {
    fontWeight: '600',
  },
  regularText: {
    fontWeight: '400',
  },
});

export default TabsLayout;