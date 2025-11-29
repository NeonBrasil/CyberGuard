
// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAY7gBP_ygNQ5P2if_j7ad-P5udblblnzA",
  authDomain: "cyberguard-pro-27c29.firebaseapp.com",
  projectId: "cyberguard-pro-27c29",
  storageBucket: "cyberguard-pro-27c29.firebasestorage.app",
  messagingSenderId: "891637083155",
  appId: "1:891637083155:web:b1f3fb09f84d25bcee63e6"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.auth = firebase.auth();
