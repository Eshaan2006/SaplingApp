import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, KeyboardAvoidingView, Modal, Dimensions } from 'react-native';
import { Agenda, Calendar } from 'react-native-calendars';
import { FAB } from 'react-native-paper';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DatePicker from '../../components/DatePicker'
import CustomButton from '../../components/CustomButton'
import { TimerPickerModal } from 'react-native-timer-picker';
import { FIRESTORE_DB, FIREBASE_AUTH, FIREBASE_APP} from '@/FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, setDoc, getDoc, updateDoc, arrayRemove, doc, increment, deleteDoc, onSnapshot} from 'firebase/firestore';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import FormField from '@/components/FormField';



const { width, height } = Dimensions.get('window');
const isIpad = width >= 768 && height >= 1024; // Detect iPad based on screen dimensions


const schedule = () => {
  const [items, setItems] = useState({});
  const [tasks, setTasks] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');  // Months are zero-based
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;  // Format as YYYY-MM-DD
  });
  const [taskName, setTaskName] = useState('');
  const [selectedDates, setSelectedDates] = useState({});
  const [timerDuration, setTimerDuration] = useState({ hours: 0, minutes: 0 });
  const [timerKey, setTimerKey] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [alarmString, setAlarmString] = useState<
        string | null
    >(null);
  const snapPoints = useMemo(() => ['90%'], []);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const auth = getAuth(FIREBASE_APP);
  const user = auth.currentUser;
  const [stats, setStats] = useState(1);
  const [credits, setCredits] = useState(0);
  const [modalVisible, setModalVisible] = useState(false); 
  const [taskNameInput, setTaskNameInput] = useState('');
  const [loading, setLoading] = useState(true); // To track loading state
 

  useEffect(() => {
    if (user) {
      const uid = user.uid;
      const statsRef = doc(FIRESTORE_DB, 'users', uid, 'stats', 'userStats');

      // Set up a real-time listener for the userStats document
      const unsubscribe = onSnapshot(statsRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCredits(data.credits || 0); // Update credits state
        }
      });

      // Clean up listener on component unmount
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadItems(selectedDate);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    const checkAndAddEmail = async () => {
      if (user) {
        const uid = user.uid;
        const userRef = collection(FIRESTORE_DB, 'users', uid, 'email');
        const q = query(userRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          const docRef = doc(FIRESTORE_DB, 'users', uid);
          await setDoc(docRef, {
            email: user.email,
          });
        }
      }
    };

    checkAndAddEmail();
  }, [user]);

  

  const loadItems = async (date) => {
    try {
      setLoading(true);
      setItems({});
      const taskRef = collection(FIRESTORE_DB, 'users', user.uid, 'tasks');
      const q = query(taskRef, where('dates', 'array-contains', date));
      const querySnapshot = await getDocs(q);

      const tasks = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!tasks[date]) {
          tasks[date] = [];
        }
        tasks[date].push({
          id: doc.id,
          ...data,
        });
      });

      if (Object.keys(tasks).length === 0) {
        tasks[date] = []; // Ensure there's an empty array for the date so the agenda bar stays visible
      }

      setItems(tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const removeDateFromTask = useCallback(async (taskId, date) => {
    try {
      const taskRef = doc(FIRESTORE_DB, 'users', user.uid, 'tasks', taskId);
      await updateDoc(taskRef, {
        dates: arrayRemove(date),
      });
      const updatedTaskDoc = await getDoc(taskRef);

      if (updatedTaskDoc.exists()) {
        const updatedTaskData = updatedTaskDoc.data();
        
        // Check if dates array is empty and delete the task if it is
        if (updatedTaskData.dates.length === 0) {
          await deleteDoc(taskRef);
        }
      }
      if (user) {
        const uid = user.uid;
        const statsRef = doc(FIRESTORE_DB, 'users', uid, 'stats', 'userStats');
        const statsDoc = await getDoc(statsRef);
        if (statsDoc.exists()) {
          await updateDoc(statsRef, {
            credits: increment(1),
          });
        } else {
          await setDoc(statsRef, {
            credits: 1,
          });
        }
      }
  
      await loadItems(selectedDate);
    } catch (error) {
      console.error('Error removing date from task:', error);
    }
  }, [selectedDate, user]);

  const renderItem = (item) => {
    const formatDuration = ({ hours, minutes }) => {
      const parts = [];
      if (hours) parts.push(`${hours} hour(s)`);
      if (minutes) parts.push(`${minutes} minute(s)`);
      return parts.join(' ');
    };
  
    return (
      <View key={item.id} style={styles.item}>
        <View style={styles.itemContentRow}>
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemDescription}>{formatDuration(item.duration)}</Text>
          </View>
          <View style={styles.checkboxContainer}>
            <BouncyCheckbox
              size={30}
              fillColor="green"
              unfillColor="#FFFFFF"
              iconStyle={{ borderColor: 'green' }}
              onPress={() => removeDateFromTask(item.id, selectedDate)}
            />
          </View>
        </View>
      </View>
    );
  };
  
  

  
  const renderEmptyDate = () => (
    <View style={styles.emptyDate}>
      <Text style={styles.emptyDateText}>No Tasks. Use the + to create a task!</Text>
    </View>
  );

  
  

  const renderDay = () => {
    return null;
  };

  const handleClosePress = useCallback(() => {
    if (!taskName.trim()) {
      Alert.alert("Validation Error", "Task name is required.");
      return;
    }
  
    if (Object.keys(selectedDates).length === 0) {
      Alert.alert("Validation Error", "Please select at least one date.");
      return;
    }
  
    if (timerDuration.hours === 0 && timerDuration.minutes === 0) {
      Alert.alert("Validation Error", "Please set a timer duration.");
      return;
    }
    bottomSheetRef.current?.close();
    const auth = getAuth(FIREBASE_APP);
    const user = auth.currentUser;
    if (user) {
        const uid = user.uid;
        const data = {
            name: taskName,
            dates: Object.keys(selectedDates),
            duration: timerDuration,
      };
      addDoc(collection(FIRESTORE_DB, 'users', uid, 'tasks'), data);
      loadItems(selectedDate)
    }
    // Reset form data
    setTaskName('');
    setSelectedDates({});
    setAlarmString(null);
    setTimerDuration({ hours: 0, minutes: 0 });
    setTimerKey(prevKey => prevKey + 1);
  });

  const handleOpenPress = () => bottomSheetRef.current?.expand()

  const formatTime = ({
    hours,
    minutes,
  }: {
    hours?: number;
    minutes?: number;
  }) => {
    const timeParts = [];

    if (hours !== undefined && hours > 0) {
      timeParts.push(`${hours}h`);
    }
    if (minutes !== undefined && minutes > 0) {
      timeParts.push(`${minutes}m`);
    }
    return timeParts.length > 0 ? timeParts.join(" ") : null;
  };

  return (
    <SafeAreaView style={styles.container}>
         <Agenda
          items={items}
          selected={selectedDate}
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          renderItem={renderItem}
          renderEmptyDate={renderEmptyDate}
          renderDay={renderDay}
          showClosingKnob={true}
          theme={{
            selectedDayBackgroundColor: '#66BB6A',
            reservationsBackgroundColor: '#C8F3CD',
            calendarBackground: '#C8F3CD',
            textSectionTitleColor: '#388E3C',
            agendaDayNumColor: 'yellow',
            agendaTodayColor: 'red',
            agendaKnobColor: '#000000',
          }}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowPicker(true)}
        color='#FFFFFF'
      />
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <View style={styles.creditsContainer}>
          <Text style={styles.creditsText}>Credits: {credits}</Text>
        </View>
      </TouchableOpacity>
      {modalVisible && (
        <Modal
          animationType="slide" // Animation type for the modal appearance
          transparent={true}    // Make the background transparent
          visible={modalVisible} // Controlled by state
          onRequestClose={() => setModalVisible(false)} // Close the modal on Android back button press
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>Complete tasks to earn credits</Text>
              {/* Button to close the modal */}
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      <BottomSheet ref={bottomSheetRef} snapPoints={snapPoints} index={-1} enablePanDownToClose={true} backgroundStyle={{backgroundColor: "#C4A484"}}>
        <BottomSheetScrollView contentContainerStyle={{ flexGrow: 1 }} scrollEnabled={true}>
            <View className='pt-0 px-3'>
              <View className="flex-row justify-between items-center mb-5">
                <Text className="text-3xl text-black font-bold">Create Task</Text>
                <TouchableOpacity style={styles.durationButton} onPress={() => setShowPicker(true)}>
                  <View style={{alignItems: "center"}}>
                    {alarmString !== null ? (
                      <Text style={{color: "#FFFFFF", fontSize: 18, fontWeight: "bold"}}>
                        Time: {alarmString}
                      </Text>
                    ) : null} 
                  </View>
                </TouchableOpacity>
              </View>
              <Text className="text-2xl text-test-100 mb-2 font-bold">Task Name:</Text>
              <BottomSheetTextInput
                placeholder='Enter Task Name'
                style={styles.textInput}
                value={taskName}
                onChangeText={(text) => setTaskName(text)}
              />
              <Text className="text-2xl text-test-100 mb-1 font-bold">When:</Text>
              <DatePicker
                selectedDates={selectedDates}
                setSelectedDates={setSelectedDates}
              />
            </View>
            <CustomButton   
              title="Done"
              handlePress={handleClosePress}
              containerStyles="w-40 mt-7 self-center bg-test-100 border-b-8 border-green-500"
              textStyles="text-white"
            />
        </BottomSheetScrollView> 
      </BottomSheet>
      <TimerPickerModal
        key={timerKey}
        visible={showPicker}
        hideSeconds
        setIsVisible={setShowPicker}
        onConfirm={(pickedDuration) => {
          const { hours, minutes } = pickedDuration;
      
          // Check if the selected duration is 0 hours and 0 minutes
          if (hours === 0 && minutes === 0) {
            Alert.alert(
              'Invalid Duration',  // Title of the alert
              'Please select a duration greater than 0 hours and 0 minutes.',  // Message of the alert
              [{ text: 'OK', onPress: () => {} }]  // Button for the alert
            );
            return;  // Return early to prevent further execution
          }
      
          // If the duration is valid, proceed as usual
          setAlarmString(formatTime(pickedDuration));
          setShowPicker(false);
          setTimerDuration(pickedDuration);
          handleOpenPress();
        }}
        modalTitle="Set Duration"
        onCancel={() => setShowPicker(false)}
        closeOnOverlayPress
        initialHours={0}
        initialMinutes={0}
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8F3CD',
  },
  item: {
    backgroundColor: '#66BB6A',
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#66BB6A',
  },
  itemContentRow: {
    flexDirection: 'row',            // Layout in a row
    alignItems: 'center',            // Center vertically
  },
  itemDetails: {
    flex: 1,                         // Take up available space
    paddingRight: 10,                // Add some padding to avoid overlap with the checkbox
  },
  checkboxContainer: {
    flexShrink: 0,                   // Prevent checkbox from shrinking
    justifyContent: 'flex-end',      // Align checkbox to the right
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    color: '#333',
  },
  emptyDate: {
    backgroundColor: '#C8F3CD',
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDateText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  textInput: {
    marginTop: 0,
    backgroundColor: '#A1785c',
    padding: 20,
    borderRadius: 5,
    fontSize: 18,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#604B44',
  },
  durationButton: {
    backgroundColor: '#604B44',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginTop: 0,
    marginLeft: 75,
    marginRight: 50,
  },
  durationButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  bottomSheet: {
    backgroundColor: '#C4A484'
  },
  creditsContainer: {
    position: 'absolute', // Position the container absolutely
    bottom: 20, // Position from the bottom; adjust this value to place it above the navigation bar
    left: 10, // Position from the left
    backgroundColor: '#604B44', // Semi-transparent background
    paddingVertical: 5, // Vertical padding for the text
    paddingHorizontal: 10, // Horizontal padding for the text
    borderRadius: 10, // Rounded corners
    zIndex: 0, // Ensure it appears above other content
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  creditsText: {
    color: '#ffffff', // White text color
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#604B44',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default schedule;