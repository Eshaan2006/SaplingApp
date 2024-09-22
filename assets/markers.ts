import { onSnapshot, collection } from 'firebase/firestore';
import { FIRESTORE_DB } from '@/FirebaseConfig'; // Your Firebase config
import icons from '@/constants/icons'; // Ensure correct import of icons

// Define the initial state for markers
let markers: any[] = [];

// Firestore collection reference for 'allTrees'
const collectionRef = collection(FIRESTORE_DB, 'allTrees');

// Function to set up a real-time listener for the 'allTrees' collection
const listenForMarkers = () => {
  // Set up an onSnapshot listener on the 'allTrees' collection
  onSnapshot(
    collectionRef,
    (snapshot) => {
      // Create a temporary array to hold the updated markers
      const updatedMarkers: any[] = [];

      // Iterate over each document in the snapshot and add it to the updated markers array
      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // Ensure that icon is fetched correctly from the icons object
        const icon = icons[data.icon]; // Correctly use the data.icon as a key for the icons object

        updatedMarkers.push({
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
          name: data.name,
          icon: icon || 'bonsai', // Use the appropriate icon or default to 'tree2'
        });
      });

      // Update the markers array with the new data
      markers = updatedMarkers;
    },
  );
};

// Call the listenForMarkers function to start listening for changes
listenForMarkers();

// Export the markers array so it can be used in other parts of the application
export { markers };
