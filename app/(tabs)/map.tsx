import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Modal, Image, Alert } from 'react-native';
import { GestureHandlerRootView, FlatList } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { markers } from '../../assets/markers';
import { icons } from '../../constants'; 
import { FIRESTORE_DB, FIREBASE_APP } from '@/FirebaseConfig';
import { addDoc, collection, onSnapshot, deleteDoc, doc, arrayUnion, getDoc, updateDoc, where, query, getDocs, setDoc, arrayRemove} from 'firebase/firestore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth, User, onAuthStateChanged } from 'firebase/auth';
import AntDesign from '@expo/vector-icons/AntDesign';
import { TextInput } from 'react-native-paper';
import FormField from '@/components/FormField';



export interface Tree {
  title: string;
  id: string;
  price: number;
  icon : string;
}

const auth = getAuth(FIREBASE_APP);
const screenWidth = Dimensions.get('window').width;
const user = auth.currentUser;

const IMAGES = [
  { id: '1', src: icons.bonsai, price: 20},
  { id: '2', src: icons.palmTree, price: 25},
  // Add more images by importing and adding to this array
];

const USA_BOUNDS = {
  northEast: {
    latitude: 49.3457868,
    longitude: -66.9513812,
  },
  southWest: {
    latitude: 24.396308,
    longitude: -125.0,
  },
};

const Map: React.FC = () => {
  const mapViewRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 39.8283,
    longitude: -98.5795,
    latitudeDelta: 25.0,
    longitudeDelta: 60.0,
  });

  const [buyTreeModalOpen, setBuyTreeModalOpen] = useState(false);
  const [nameTreeModalOpen, setNameTreeModalOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);
  const [user, setUser] = useState<User | null>(null);
  const [dataArray, setDataArray] = useState<Tree[]>([]);
  const [treeToRemove, setTreeToRemove] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ id: string; src: any; price: number } | null>(null);
  const [creds , setCreds] = useState(0);
  const [credits, setCredits] = useState(0);



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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  const onRegionChangeComplete = (newRegion: Region) => {
    const lat = Math.max(
      Math.min(newRegion.latitude, USA_BOUNDS.northEast.latitude),
      USA_BOUNDS.southWest.latitude
    );
    const lon = Math.max(
      Math.min(newRegion.longitude, USA_BOUNDS.northEast.longitude),
      USA_BOUNDS.southWest.longitude
    );

    if (lat !== newRegion.latitude || lon !== newRegion.longitude) {
      mapViewRef.current?.animateToRegion(
        {
          ...newRegion,
          latitude: lat,
          longitude: lon,
        },
        1000
      );
    } else {
      setRegion(newRegion);
    }
  };

  const [tree, setTree] = useState('');
    
  // Function to add a tree to Firestore
  const addTreeToFirestore = async () => {
    if (user && tree.trim() !== '' && selectedImage) {
      try {
        // Fetch user's current credits
       const userStatsRef = doc(FIRESTORE_DB, 'users', user.uid, 'stats', 'userStats');
        const userStatsSnap = await getDoc(userStatsRef);
        
        if (userStatsSnap.exists()) {
          const userStats = userStatsSnap.data();
          setCreds(userStats.credits);
          
          // Check if user has enough credits
          if (userStats.credits >= selectedImage.price) {
            // Deduct the tree's price from user's credits
            const newCredits = userStats.credits - selectedImage.price; 
  
            // Update user's credits in Firestore
            await updateDoc(userStatsRef, {
              credits: newCredits,
            });
  
            // Add tree to user's requested trees
            const requestedTreesRef = doc(FIRESTORE_DB, 'users', user.uid, 'trees', 'requestedTrees');
            await updateDoc(requestedTreesRef, {
              trees: arrayUnion({ title: tree, id: Date.now().toString(), price: selectedImage.price, icon: selectedImage.src }),
            });
  
            setTree(''); // Clear the input field
            setSelectedImage(null); // Reset selected image
            Alert.alert('Success', 'Tree purchased successfully!');
          } else {
            // User doesn't have enough credits
            Alert.alert('Insufficient Credits', 'You do not have enough credits to buy this tree.');
          }
        } else {
          // User stats document doesn't exist
          Alert.alert('You do not have enough credits to buy this tree.');
        }
      } catch (error) {
        console.error('Error adding tree: ', error);
        Alert.alert('Error', 'An error occurred while processing your request. Please try again.');
      }
    } else {
      Alert.alert('Please name your Tree');
    }

  };

// Fetch requested trees from Firestore
  useEffect(() => {
    const user = auth.currentUser;
  
    if (user) {
      const requestedTreesRef = doc(FIRESTORE_DB, 'users', user.uid, 'trees', 'requestedTrees');
  
      const unsubscribe = onSnapshot(requestedTreesRef, (docSnap) => {
        if (!docSnap.exists()) {
          setDoc(requestedTreesRef, { trees: [] });
        } else {
          const data = docSnap.data();
          setDataArray(data.trees || []);
        }
      }, (error) => {
        console.error("Error fetching trees: ", error);
      });
  
      // Clean up the listener when the component unmounts
      return () => unsubscribe();
    }
  }, []); 


//Actually add Trees
const addTree = async () => {
  if (user) {
    await addTreeToFirestore();
    setTree(''); // Clears the input field
  } else {
    console.error('User is not logged in');
  }
};







const deleteTree = async (treeToDelete: Tree) => {
  if (user) {
    const uid = user.uid;
    const treeRef = doc(FIRESTORE_DB, 'users', uid, 'trees', 'requestedTrees');
    
    try {
      const docSnap = await getDoc(treeRef);
      if (docSnap.exists()) {
        const currentTrees = docSnap.data().trees || [];
        const updatedTrees = currentTrees.filter((tree: Tree) => tree.id !== treeToDelete.id);
        
        await updateDoc(treeRef, { trees: updatedTrees });
        
        // Update local state
        setDataArray(updatedTrees);
      }
    } catch (error) {
      console.error("Error deleting tree: ", error);
    }
  } else {
    console.error('User is not logged in');
  }
};

const renderTree = ({ item }: { item: Tree }) => (
  <View style={styles.treeContainer}>
    <Text style={styles.treeText}>{item.title}</Text>
    <Ionicons 
      name="trash-bin-outline" 
      size={24} 
      color="red" 
      onPress={() => {Alert.alert("Delete Confirmation", "Are you sure you want to delete this tree? (You will not receive credits spent on this tree)", [
        { text: "Cancel", onPress: () => console.log("Cancel Pressed"), style: "cancel" },
        { text: "OK", onPress: () => deleteTree(item) }
      ]);}} 
    />
  </View>
);


const renderImage = ({ item }: { item: { id: string; src: any; price: number } }) => (
  <View style={styles.imageContainer}>
    <TouchableOpacity onPress={() => {
      setNameTreeModalOpen(true);
      setBuyTreeModalOpen(false);
      setSelectedImage(item);
    }}>
      <Image source={item.src} style={[styles.image, { width: screenWidth / 2 - 40 }]} resizeMode="cover" />
      <Text style={styles.imagePrice}>Credits: {item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  </View>
);
  const onTreeSelected = (tree: any) => {
    setNameTreeModalOpen(true);
  };
  const onMarkerSelected = (marker: any) => {
    setSelectedMarker(marker);
    setShowTextInput(false);
    setBottomSheetIndex(1); // Open the bottom sheet
  };

  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    setBottomSheetIndex(index);
  }, []);

  const handleBuyTreePress = () => {
    setSelectedMarker(null);
    setShowTextInput(true);
    setBottomSheetIndex(1); // Open the bottom sheet
  };
  const handleOpenTreeModal = () => {
    setBuyTreeModalOpen(true);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.creditsContainer}>
        <Text style={styles.creditsText}>Credits: {credits}</Text>
      </View>
      <Modal visible={buyTreeModalOpen} animationType='fade' transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeaderText}>Store</Text>
            <FlatList
              data={IMAGES}
              renderItem={renderImage}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.listContainer}
            />
            <TouchableOpacity style={styles.closeIconContainer} onPress={() => setBuyTreeModalOpen(false)}>
              <AntDesign name='closecircleo' size={24} color='black' />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={nameTreeModalOpen} animationType='fade' transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View>
                          <Text style={styles.modalHeaderText}>Name Your Tree</Text>
                          {selectedImage && (
                              <Text style={styles.priceText}>Price: {selectedImage.price.toFixed(2)} creds</Text>
                            )}
                            <TextInput
                              placeholder='Tree Name'
                              onChangeText={(text: string) => setTree(text)}
                              value={tree}
                            />
                            
                          <TouchableOpacity style={styles.treeImporting} onPress={addTree}>
                            <Text style={styles.purchaseText}>Purchase</Text> 
                          </TouchableOpacity>
                          <View style={styles.underline}>

                          </View>
                          <Text style={styles.modalHeaderText}>Requested Trees</Text>
                          {dataArray.length > 0 && (
                            <FlatList
                              data={dataArray}
                              renderItem={renderTree}
                              keyExtractor={(item, index) => index.toString()}
                              style={styles.treeList}
                              contentContainerStyle={styles.treeListContent}
                            />
                          )}
                          <TouchableOpacity style={styles.closeIconContainer} onPress={() => setNameTreeModalOpen(false)}>
                            <AntDesign name='closecircleo' size={24} color='black' />
                          </TouchableOpacity>
                      </View>
                    </View>
                </View>
      </Modal>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {markers &&
          markers.map((marker, index) => (
            <Marker
              key={index.toString()}
              coordinate={marker}
              onPress={() => onMarkerSelected(marker)}
            >
              <View style={styles.customMarker}>
                <Image source={marker.icon} style={styles.markerImage} resizeMode="contain" />
              </View>
            </Marker>
          ))}
      </MapView>
      <TouchableOpacity
        style={styles.button}
        onPress={handleOpenTreeModal}
      >
        <Text style={styles.buttonText}>Buy A Tree</Text>
      </TouchableOpacity>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={bottomSheetIndex}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: '#1d0f4e' }}
        handleIndicatorStyle={{ backgroundColor: '#fff' }}
        enablePanDownToClose={true}
      >
        <BottomSheetView style={styles.contentContainer}>
          {selectedMarker ? (
            <View style={styles.markerContent}>
              <Text style={styles.bottomSheetWords}>Selected Marker:</Text>
              <Text style={styles.bottomSheetWords}>{selectedMarker.name}</Text>
            </View>
          ) : (
            <View style={styles.defaultContent}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.myTreesText}>My Trees:</Text>
              </View>
              {dataArray.length > 0 && (
                <FlatList
                  data={dataArray}
                  renderItem={renderTree}
                  keyExtractor={(tree: Tree) => tree.id}
                  style={styles.treeList}
                  contentContainerStyle={styles.treeListContent}
                />
              )}
              {showTextInput && (
                <FormField
                  placeholder='Tree Name'
                  onChangeText={(text: string) => setTree(text)}
                  value={tree}
                />
              )}
            </View>
          )}
        </BottomSheetView>
        {!selectedMarker && (
          <TouchableOpacity style={styles.treeImporting} onPress={addTree}>
            <Text>Buy</Text>
          </TouchableOpacity>
        )}
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetHeader: {
    marginBottom: 10,
    marginLeft: 10,
  },
  myTreesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#235347',
  },
  treeList: {
    width: '100%',
    height: '30%',
    backgroundColor: '#C4A484',
    marginTop: 40,
    borderRadius: 10,
  },
  treeListContent: {
    paddingLeft: 10,
    color: '#235347',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  button: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 30,
    padding: 30,
    borderRadius: 10,
    backgroundColor: '#604B44',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomSheetWords: {
    fontSize: 24,
    color: '#FFF',
  },
  input: {
    borderWidth: 0,
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
    marginTop: 10,
    backgroundColor: '#C8F3CD',
    fontSize: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  treeImporting: {
    paddingVertical: 20,
    paddingTop: 20,
    marginBottom: 30,
    backgroundColor: '#604B44',
    alignItems: 'center',
    marginTop: 10,
    fontWeight: 'bold',
    borderRadius: 10, // Rounded corners
    shadowColor: '#000', // Shadow settings
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderBottomWidth: 8,
    borderBottomColor: '#4D3C36',
  },
  treeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    shadowColor: '#604B44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: '#604B44',
  },
  treeText: {
    fontSize: 18,
    color: '#FFF',
    marginLeft: 10,
  },
  markerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#C4A484',
    width: '95%',
    height: '80%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#235347',
  },
  closeIconContainer: {
    position: 'absolute',
    top: 15,
    right: 20,
    zIndex: 1,
  },
  listContainer: {
    padding: 5,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: screenWidth > 600 ? 20 : 10, // Adjust margin based on screen size
  },
  image: {
    width: screenWidth > 600 ? screenWidth / 2 - 40 : screenWidth / 2 - 30, // Adjust size for larger screens like iPads
    height: screenWidth > 600 ? screenWidth / 2 - 40 : screenWidth / 2 - 30, // Maintain aspect ratio
    resizeMode: 'contain',
    borderRadius: 10,
  },
  modalHeaderText: {
    padding: 10,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#235347',
    alignContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  imagePrice: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    padding: 5,
    borderRadius: 5,
  },
  priceText: {
    fontSize: 18,
    color: '#000',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  markerSize: {
    width: 5,
    height: '50%',
    resizeMode: 'contain',
  },
  customMarker: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    width: 50,  // Adjust these values to change the size of your icon
    height: 50, // Adjust these values to change the size of your icon
  },
  purchaseText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  underline: {
    borderBottomWidth: 3,
    borderBottomColor: '#000',
    borderRadius: 10,
  },
  creditsContainer: {
    position: 'absolute', // Position the container absolutely
    top: 50, // Position from the bottom; adjust this value to place it above the navigation bar
    right: 20, // Position from the left
    backgroundColor: '#604B44', // Semi-transparent background
    paddingVertical: 5, // Vertical padding for the text
    paddingHorizontal: 10, // Horizontal padding for the text
    borderRadius: 10, // Rounded corners
    zIndex: 10, // Ensure it appears above other content
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  creditsText: {
    color: '#FFFFFF', // White text color
    fontSize: 16,
    fontWeight: 'bold',
  },


});

export default Map;