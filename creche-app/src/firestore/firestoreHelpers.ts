/**
 * Firestore Helper Functions
 * Collections:
 * - users: { uid, name, email, role }
 * - children: { parentId, name, dateOfBirth, allergies, createdAt }
 * - attendance: { childId, date, status, timestamp }
 *
 * Features:
 * - Add, update, and fetch children
 * - Mark and fetch attendance records
 */

import { collection, addDoc, setDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { doc } from "firebase/firestore";

export const addChild = async (parentId: string, name: string, dateOfBirth: string, allergies: string[]) => {
    try {
        const docRef = await addDoc(collection(db, "children"), {
            parentId,
            name,
            dateOfBirth,
            allergies,
            createdAt: serverTimestamp(),
        });
        console.log("Child added with ID:", docRef.id);
        return docRef.id;
    } catch (err) {
        console.error("Error adding child:", err);
    }
};

export const updateChild = async (childId: string, updatedData: Record<string, any>) => {
    try {
        const childDocRef = doc(db, "children", childId);
        await setDoc(childDocRef, {
            ...updatedData,
            updatedAt: serverTimestamp(),
        });
        console.log("Child updated with ID:", childId);
    } catch (err) {
        console.error("Error updating child:", err);
    }
};

export const fetchChildren = async (parentId: string) => {
    try {
        const q = query(collection(db, "children"), where("parentId", "==", parentId));
        const querySnapshot = await getDocs(q);
        const children = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched children:", children);
        return children;
    } catch (err) {
        console.error("Error fetching children:", err);
    }
};

export const markAttendance = async (childId: string, status: "present" | "absent") => {
    try {
        const docRef = await addDoc(collection(db, "attendance"), {
            childId,
            date: new Date().toISOString().split("T")[0],
            status,
            timestamp: serverTimestamp(),
        });
        console.log("Attendance marked:", docRef.id);
    } catch (err) {
        console.error("Error marking attendance:", err);
    }
};

export const fetchAttendance = async (childId: string) => {
    try {
        const q = query(collection(db, "attendance"), where("childId", "==", childId));
        const querySnapshot = await getDocs(q);
        const attendanceRecords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched attendance records:", attendanceRecords);
        return attendanceRecords;
    } catch (err) {
        console.error("Error fetching attendance records:", err);
    }
};