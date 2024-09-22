import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from '@/FirebaseConfig';
import CustomButton from '@/components/CustomButton';
import { router } from 'expo-router';
import { doc, deleteDoc } from 'firebase/firestore';

const Setting = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSignOut = async () => {
    try {
      await FIREBASE_AUTH.signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const deleteUserDocument = async (uid) => {
    try {
      const userDocRef = doc(FIRESTORE_DB, 'users', uid); // Adjust the path based on your Firestore structure
      await deleteDoc(userDocRef);
    } catch (error) {
      console.error('Error deleting user document:', error);
      throw error; // Rethrow to prevent further actions if document deletion fails
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (user) {
        // Delete the user's document first
        await deleteUserDocument(user.uid);

        // Delete the user account
        await user.delete();
        router.push('/');
      } else {
        console.error('No user is currently signed in.');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('Please sign in again to delete your account.');
        router.push('/sign-in'); // Redirect to sign-in page to re-authenticate
      }
    }
  };

  const confirmDeleteAccount = () => {
    setModalVisible(true);
  };

  const handleConfirmDelete = () => {
    setModalVisible(false);
    handleDeleteAccount();
  };

  const handleCancelDelete = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <CustomButton
        title="Sign Out"
        handlePress={handleSignOut}
        containerStyles="mt-20 bg-test-100 border-b-8 border-green-500"
        textStyles={"text-white font-psemibold"}
        
      />
      <CustomButton
        title="Delete Account"
        handlePress={confirmDeleteAccount}
        containerStyles="mt-20 bg-red-600 border-b-8 border-red-800"
        textStyles={"text-white font-psemibold"}
      />
      <Text style={styles.glazingText}>
        Thank you for using Sapling!
      </Text>

      {/* Modal for confirming account deletion */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to delete your account?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleConfirmDelete}>
                <Text style={styles.modalButtonText}>Yes, Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={handleCancelDelete}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8F3CD',
    padding: 20,
  },
  glazingText: {
    marginTop: 30,
    marginBottom: 30,
    fontSize: 50,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonConfirm: {
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  modalButtonCancel: {
    backgroundColor: '#cccccc',
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Setting;
