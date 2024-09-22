import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../constants';
import CustomButton from '../components/CustomButton';
import { User, onAuthStateChanged } from 'firebase/auth'
import { useState, useEffect } from "react";
import { FIREBASE_AUTH } from "@/FirebaseConfig";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() =>  {
    onAuthStateChanged(FIREBASE_AUTH, (user) => {
    });
  }, []);

  return (

    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: '100%'}}>
        <View className="w-full justify-center items-center min-h-[80vh] px-4">
          <Image
            source={images.logo}
            className="w-[250px] h-[100px]"
            resizeMode="contain"
          />

          <Image
            source={images.earth}
            className="max-w--[380px] w-full h-[300px]"
            resizeMode="contain"
          />
          <View className="relative mt-5">
            <Text className="text-3xl text-white font-bold text-center"> Help the world by completing your tasks with 
              <Text className="text-secondary"> Sapling </Text>
            </Text>
          </View>
          <CustomButton 
            title="Continue With Email"
            handlePress={() => router.push('/sign-in')}
            containerStyles="w-full mt-7 mt-7 border-b-8 border-gray-100"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

