import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import { getAuth } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { FIREBASE_APP, FIRESTORE_DB } from '@/FirebaseConfig';
import FormField from '@/components/FormField';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');
const isIpad = width >= 768 && height >= 1024;

export default function Friends() {
  const [people, setPeople] = useState([]);
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [removeFriendModalOpen, setRemoveFriendModalOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataArray, setDataArray] = useState([]);
  const [friendStatsModalOpen, setFriendStatsModalOpen] = useState(false);
  const [selectedFriendEmail, setSelectedFriendEmail] = useState('');
  const [friendStats, setFriendStats] = useState({
    tasksCompleted: 0,
    credits: 0,
    requestedTrees: [],
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const auth = getAuth(FIREBASE_APP);
  const user = auth.currentUser;
  const friendListRef = doc(FIRESTORE_DB, 'users', user?.uid, 'friends', 'friendList');

  useEffect(() => {
    let isMounted = true;
    const fetchFriendList = async () => {
      if (user && isMounted) {
        setLoading(true);
        try {
          const docSnap = await getDoc(friendListRef);
          if (!docSnap.exists()) {
            await setDoc(friendListRef, { friend: [] });
          } else {
            const data = docSnap.data();
            if (isMounted) setDataArray(data.friend || []);
          }
        } catch (error) {
          console.error('Error fetching friend list:', error);
          Alert.alert('Error', 'Failed to load friends list. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFriendList();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleTextChange = (text) => {
    setNewFriendEmail(text);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkConnectionAndProceed = async (callback) => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      callback();
    } else {
      Alert.alert('No internet connection', 'Please check your connection and try again.');
    }
  };

  const addFriendToFirestore = async () => {
    const userDocRef = doc(FIRESTORE_DB, 'users', user?.uid, 'friends', 'friendList');
    await updateDoc(userDocRef, {
      friend: arrayUnion(newFriendEmail),
    });
  };

  const addFriend = async () => {
    if (!newFriendEmail.trim() || !validateEmail(newFriendEmail)) {
      Alert.alert('Please enter a valid email');
      return;
    }

    if (newFriendEmail === user.email) {
      Alert.alert('You cannot add yourself');
      return;
    }

    checkConnectionAndProceed(async () => {
      try {
        setLoading(true);
        const usersRef = collection(FIRESTORE_DB, 'users');
        const q = query(usersRef, where('email', '==', newFriendEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          await addFriendToFirestore();
          setPeople([...people, { email: newFriendEmail, id: people.length.toString() }]);
          setAddFriendModalOpen(false);
          setNewFriendEmail('');
          const docSnap = await getDoc(friendListRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setDataArray(data.friend || []);
          }
        } else {
          Alert.alert('Email not found');
        }
      } catch (error) {
        console.error('Error adding friend:', error);
        Alert.alert('Error', 'Failed to add friend. Please try again later.');
      } finally {
        setLoading(false);
      }
    });
  };

  const removeFriend = async () => {
    if (!friendToRemove) return;

    checkConnectionAndProceed(async () => {
      try {
        setLoading(true);
        const userDocRef = doc(FIRESTORE_DB, 'users', user?.uid, 'friends', 'friendList');
        await updateDoc(userDocRef, {
          friend: arrayRemove(friendToRemove),
        });
        setRemoveFriendModalOpen(false);
        const docSnap = await getDoc(friendListRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDataArray(data.friend || []);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to remove friend. Please try again later.');
      } finally {
        setLoading(false);
      }
    });
  };

  const fetchFriendStats = async (friendEmail) => {
    setStatsLoading(true);
    try {
      const usersRef = collection(FIRESTORE_DB, 'users');
      const q = query(usersRef, where('email', '==', friendEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const friendDoc = querySnapshot.docs[0]; // Assuming email is unique
        const statsRef = doc(FIRESTORE_DB, 'users', friendDoc.id, 'stats', 'userStats');
        const statsSnap = await getDoc(statsRef);

        let tasksCompleted = 0;
        let credits = 0;
        if (statsSnap.exists()) {
          const statsData = statsSnap.data();
          tasksCompleted = statsData.tasksCompleted || 0;
          credits = statsData.credits || 0;
        }

        const treesRef = collection(FIRESTORE_DB, 'users', friendDoc.id, 'trees');
        const requestedTreesDoc = await getDoc(doc(treesRef, 'requestedTrees'));

        let requestedTrees = [];
        if (requestedTreesDoc.exists()) {
          const data = requestedTreesDoc.data();
          requestedTrees = data.trees || []; // Get the list of requested trees
        }

        setFriendStats({
          tasksCompleted,
          credits,
          requestedTrees,
        });
      } else {
        Alert.alert('Error', 'User not found');
      }
    } catch (error) {
      console.error('Error fetching friend stats:', error);
      Alert.alert('Error', 'Failed to fetch friend stats');
    } finally {
      setStatsLoading(false);
      setFriendStatsModalOpen(true);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        onPress={() => {
          setSelectedFriendEmail(item);
          fetchFriendStats(item);
        }}
      >
        <Text style={styles.itemText}>{item}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Followed</Text>
        <AntDesign name="adduser" size={24} color="green" onPress={() => setAddFriendModalOpen(true)} />
      </View>
      {loading && <ActivityIndicator size="large" color="#66BB6A" />}

      <Modal visible={addFriendModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeIconContainer} onPress={() => setAddFriendModalOpen(false)}>
              <AntDesign name="closecircleo" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Follow people here</Text>
            <FormField
              placeholder="Enter friend's email"
              value={newFriendEmail}
              onChangeText={handleTextChange}
              placeholderTextColor="#7a7a7a"
            />
            <TouchableOpacity style={styles.addButton} onPress={addFriend}>
              <Text style={styles.addButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={removeFriendModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeIconContainer} onPress={() => setRemoveFriendModalOpen(false)}>
              <AntDesign name="closecircleo" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Are you sure you want to unfollow {friendToRemove}?</Text>
            <TouchableOpacity style={styles.addButton} onPress={removeFriend}>
              <Text style={styles.addButtonText}>Unfollow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={friendStatsModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeIconContainer} onPress={() => setFriendStatsModalOpen(false)}>
              <AntDesign name="closecircleo" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Stats for {selectedFriendEmail}</Text>
            {statsLoading ? (
              <ActivityIndicator size="large" color="#66BB6A" />
            ) : (
              <>
                <Text style={styles.statText}>Tasks Completed: {friendStats.tasksCompleted}</Text>
                <Text style={styles.statText}>Credits: {friendStats.credits}</Text>
                <Text style={styles.statText}>Requested Trees:</Text>
                {friendStats.requestedTrees.length > 0 ? (
                  friendStats.requestedTrees.map((tree, index) => (
                    <Text key={index} style={styles.statText}>
                      {tree.title} - Price: {tree.price}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.statText}>No trees requested</Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <View style={[styles.flatlistContainer, isIpad && styles.flatlistContainerIpad]}>
        {dataArray.length === 0 ? (
          <Text>No friends added yet.</Text>
        ) : (
          <FlatList
            data={dataArray}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8F3CD',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  closeIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 15,
    textAlign: 'center',
  },
  flatlistContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#C8E6C9',
    borderRadius: 15,
  },
  flatlistContainerIpad: {
    padding: 25,
  },
  itemContainer: {
    marginVertical: 8,
    padding: 15,
    backgroundColor: '#66BB6A',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  itemText: {
    fontSize: isIpad ? 25 : 16,
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#388E3C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: isIpad ? 50 : 28,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  statText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#388E3C',
    marginVertical: 5,
    textAlign: 'center',
  },
});
