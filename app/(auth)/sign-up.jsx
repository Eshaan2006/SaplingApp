import { View, Text, ScrollView, Dimensions, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { FIREBASE_APP, FIREBASE_AUTH } from '../../FirebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from "../../constants";
import CustomButton from '../../components/CustomButton';
import FormField from "../../components/FormField";
import { createUserWithEmailAndPassword } from 'firebase/auth';

const signUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = FIREBASE_AUTH;

    const signUp = async () => {
        setLoading(true);
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            
        } catch (error) {

            alert('Sign Up Failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="bg-primary h-full">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView>
                    <View
                        className="w-full flex justify-center h-full px-4 my-6"
                        style={{
                            minHeight: Dimensions.get("window").height - 100,
                        }}
                    >
                        <Image
                            source={images.logo}
                            resizeMode="contain"
                            className="w-[115px] h-[34px]"
                        />

                        <Text className="text-2xl font-semibold text-white mt-10 font-psemibold">
                            Sign Up to Sapling
                        </Text>
                        <FormField
                            title="Email"
                            value={email}
                            handleChangeText={(e) => setEmail(e)}
                            otherStyles="mt-7"
                            keyboardType="email-address"
                        />

                        <FormField
                            title="Password"
                            value={password}
                            handleChangeText={(e) => setPassword(e)}
                            otherStyles="mt-7"
                        />

                        <CustomButton
                            title="Sign Up"
                            handlePress={signUp}
                            containerStyles="mt-7 border-b-8 border-gray-100"
                        />
                        <View className="flex justify-center pt-5 flex-row gap-2">
                            <Text className="text-lg text-gray-100 font-pregular">
                                Have an account already?
                            </Text>
                            <Link
                                href="/sign-in"
                                className="text-lg font-psemibold text-secondary"
                            >
                                Login
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default signUp;
