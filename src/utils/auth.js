import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Función para manejar errores de Firebase
const handleFirebaseError = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Este email ya está registrado';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/invalid-email':
      return 'Email inválido';
    case 'auth/user-not-found':
      return 'Usuario no encontrado';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Inténtalo más tarde';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet';
    default:
      return error.message || 'Ha ocurrido un error';
  }
};

// Registrar nuevo usuario con los nuevos campos
export const registerUser = async (userData) => {
  try {
    // Validar datos antes de enviar
    const requiredFields = ['name', 'email', 'password', 'specialty', 'group', 'section'];
    const missingFields = requiredFields.filter(field => !userData[field] || !userData[field].toString().trim());
    
    if (missingFields.length > 0) {
      return { 
        success: false, 
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}` 
      };
    }

    console.log('Registering user with data:', {
      name: userData.name,
      email: userData.email,
      specialty: userData.specialty,
      group: userData.group,
      section: userData.section
      // No loggeamos la contraseña por seguridad
    });

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email.trim().toLowerCase(), 
      userData.password
    );
    const user = userCredential.user;
    
    // Guardar datos adicionales en Firestore con los nuevos campos
    const userDocData = {
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      specialty: userData.specialty.trim(),
      group: userData.group.trim(),
      section: userData.section.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Saving user document to Firestore:', userDocData);

    await setDoc(doc(db, 'users', user.uid), userDocData);
    
    console.log('User registered successfully');
    return { success: true, user };
  } catch (error) {
    console.error('Error en registerUser:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// Iniciar sesión (sin cambios necesarios)
export const loginUser = async (email, password) => {
  try {
    // Validar parámetros
    if (!email || !password) {
      return { success: false, error: 'Email y contraseña son requeridos' };
    }

    const userCredential = await signInWithEmailAndPassword(
      auth, 
      email.trim().toLowerCase(), 
      password
    );
    
    console.log('User logged in successfully');
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error en loginUser:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// Cerrar sesión (sin cambios necesarios)
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('User logged out successfully');
    return { success: true };
  } catch (error) {
    console.error('Error en logoutUser:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// Obtener datos del usuario (actualizado para nuevos campos)
export const getUserData = async (uid) => {
  try {
    if (!uid) {
      return { success: false, error: 'UID de usuario requerido' };
    }

    console.log('Getting user data for UID:', uid);
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      
      console.log('User data retrieved:', {
        name: userData.name,
        email: userData.email,
        specialty: userData.specialty,
        group: userData.group,
        section: userData.section
      });
      
      // Convertir timestamp a fecha legible si existe
      if (userData.createdAt) {
        userData.createdAt = userData.createdAt.toDate?.() || userData.createdAt;
      }
      if (userData.updatedAt) {
        userData.updatedAt = userData.updatedAt.toDate?.() || userData.updatedAt;
      }
      
      // Asegurar que todos los campos nuevos existan (para usuarios existentes)
      const completeUserData = {
        name: userData.name || '',
        email: userData.email || '',
        specialty: userData.specialty || '',
        group: userData.group || '', // Campo nuevo
        section: userData.section || '', // Campo nuevo
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        // Mantener compatibilidad con datos antiguos
        ...(userData.age && { age: userData.age }) // Solo si existe el campo age
      };
      
      return { success: true, data: completeUserData };
    } else {
      return { success: false, error: 'Usuario no encontrado en la base de datos' };
    }
  } catch (error) {
    console.error('Error en getUserData:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};

// Actualizar datos del usuario (actualizado para nuevos campos)
export const updateUserData = async (uid, userData) => {
  try {
    if (!uid) {
      return { success: false, error: 'UID de usuario requerido' };
    }

    if (!userData || Object.keys(userData).length === 0) {
      return { success: false, error: 'Datos para actualizar requeridos' };
    }

    console.log('Updating user data for UID:', uid, 'with data:', userData);

    const docRef = doc(db, 'users', uid);
    
    // Preparar datos para actualización con los nuevos campos
    const updateData = {
      updatedAt: serverTimestamp()
    };

    // Validar y limpiar datos según el campo
    if (userData.name !== undefined) {
      if (!userData.name || typeof userData.name !== 'string') {
        return { success: false, error: 'Nombre debe ser un texto válido' };
      }
      updateData.name = userData.name.toString().trim();
    }

    if (userData.specialty !== undefined) {
      if (!userData.specialty || typeof userData.specialty !== 'string') {
        return { success: false, error: 'Especialidad debe ser un texto válido' };
      }
      updateData.specialty = userData.specialty.toString().trim();
    }

    if (userData.group !== undefined) {
      if (!userData.group || typeof userData.group !== 'string') {
        return { success: false, error: 'Grupo debe ser un texto válido' };
      }
      updateData.group = userData.group.toString().trim();
    }

    if (userData.section !== undefined) {
      if (!userData.section || typeof userData.section !== 'string') {
        return { success: false, error: 'Sección debe ser un texto válido' };
      }
      updateData.section = userData.section.toString().trim();
    }

    // Mantener compatibilidad con el campo age si existe
    if (userData.age !== undefined) {
      const ageNum = parseInt(userData.age);
      if (isNaN(ageNum)) {
        return { success: false, error: 'Edad debe ser un número válido' };
      }
      updateData.age = ageNum;
    }

    console.log('Final update data:', updateData);
    await updateDoc(docRef, updateData);
    
    console.log('User data updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error en updateUserData:', error);
    return { success: false, error: handleFirebaseError(error) };
  }
};