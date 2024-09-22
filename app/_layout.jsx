import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import "react-native-url-polyfill/auto";
import { SplashScreen, Stack, router } from "expo-router";
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from "@/FirebaseConfig";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false); // Track when both fonts and auth are ready
  const [authChecked, setAuthChecked] = useState(false); // Track if auth state has been checked

  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAuthChecked(true); // Set auth checked to true after a timeout period
    }, 5000); // 5 seconds timeout, adjust as needed

    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setUser(user);
      setAuthChecked(true); // Mark auth check as complete when user is found
      clearTimeout(timeout); // Clear timeout when user is found
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (error) throw error;

    // Check if fonts are loaded
    if (fontsLoaded && authChecked) {
      SplashScreen.hideAsync().then(() => {
        setIsReady(true); // Mark the app as ready after hiding splash screen
      });
    }
  }, [fontsLoaded, error, authChecked]);

  useEffect(() => {
    // Perform navigation only after the component is ready
    if (isReady) {
      if (user) {
        router.replace('/schedule');
      } else {
        router.replace('/');
      }
    }
  }, [isReady, user]);

  if (!isReady) {
    return null; // Render nothing until ready
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default RootLayout;
