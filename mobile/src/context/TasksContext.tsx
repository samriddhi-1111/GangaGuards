import React, { createContext, useContext, useState, ReactNode } from "react";
import { Alert, Platform } from "react-native";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

export interface Incident {
    _id: string;
    imageBeforeUrl: string;
    addressText?: string;
    location?: { coordinates: [number, number] };
    isDummy?: boolean;
    status?: "PENDING" | "CLAIMED" | "CLEANED";
    imageAfterUrl?: string; // For completion
}

// Initial Dummy Data
const DUMMY_INCIDENTS: Incident[] = [
    { _id: 'dm1', imageBeforeUrl: 'https://images.unsplash.com/photo-1626015383324-4ce8589c3f9a?w=400&q=80', addressText: 'Assi Ghat Steps', isDummy: true, status: 'PENDING', location: { coordinates: [83.003, 25.293] } },
    { _id: 'dm2', imageBeforeUrl: 'https://images.unsplash.com/photo-1596401057633-565652b5e28a?w=400&q=80', addressText: 'Lalita Ghat', isDummy: true, status: 'PENDING', location: { coordinates: [83.008, 25.310] } }
];

const INITIAL_NEARBY: Incident[] = DUMMY_INCIDENTS;

// Popular Varanasi Ghats
const GHAT_NAMES = [
    "Assi Ghat", "Dashashwamedh Ghat", "Manikarnika Ghat", "Harishchandra Ghat",
    "Chet Singh Ghat", "Darbhanga Ghat", "Scindia Ghat", "Panchganga Ghat",
    "Raj Ghat", "Kedar Ghat", "Tulsi Ghat", "Bhonsale Ghat", "Lalita Ghat",
    "Ahilyabai Ghat", "Munshi Ghat", "Rana Mahal Ghat", "Chausatti Ghat",
    "Narad Ghat", "Pandey Ghat", "Maan Mandir Ghat", "Tripura Bhairavi Ghat"
];

const getRandomGhat = () => GHAT_NAMES[Math.floor(Math.random() * GHAT_NAMES.length)];

interface TasksContextData {
    nearbyIncidents: Incident[];
    myTasks: Incident[];
    acceptTask: (id: string) => void;
    removeFromNearby: (id: string) => void;
    fetchNearbyIncidents: (lat: number, lng: number) => Promise<void>;
    completeTask: (id: string, imageUri: string) => Promise<void>;
    fetchUserTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextData>({} as TasksContextData);

// Socket Listeners for Real-time Updates
export const TasksProvider = ({ children }: { children: ReactNode }) => {
    const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
    const [myTasks, setMyTasks] = useState<Incident[]>([]);
    const { updateUserPoints, user } = useAuth();

    React.useEffect(() => {
        const socket = getSocket();

        const handleNewIncident = (newIncident: Incident) => {
            console.log("Socket: New Incident Received", newIncident._id);
            setNearbyIncidents((prev) => {
                // Prevent duplicates
                if (prev.find(i => i._id === newIncident._id)) return prev;
                // Assign random Ghat if missing
                const incidentWithGhat = {
                    ...newIncident,
                    addressText: newIncident.addressText || getRandomGhat()
                };
                return [incidentWithGhat, ...prev];
            });
        };

        const handleIncidentUpdated = (updatedIncident: Incident) => {
            console.log("Socket: Incident Updated", updatedIncident._id, updatedIncident.status);

            // Update in nearby list if present
            setNearbyIncidents((prev) => prev.map(i => i._id === updatedIncident._id ? updatedIncident : i));

            // Update in myTasks if present
            setMyTasks((prev) => prev.map(i => i._id === updatedIncident._id ? updatedIncident : i));

            // If status changed to CLAIMED by someone else, remove from nearby?
            // Logic depends on requirement, but generally if status is NOT pending, remove from nearby
            if (updatedIncident.status !== 'PENDING') {
                setNearbyIncidents((prev) => prev.filter(i => i._id !== updatedIncident._id));
            }
        };

        socket.on("incident:new", handleNewIncident);
        socket.on("incident:updated", handleIncidentUpdated);

        return () => {
            socket.off("incident:new", handleNewIncident);
            socket.off("incident:updated", handleIncidentUpdated);
        };
    }, []);

    const acceptTask = async (id: string) => {
        const task = nearbyIncidents.find((i) => i._id === id);
        if (!task) return; // Guard clause

        // Optimistic
        setNearbyIncidents((prev) => prev.filter((i) => i._id !== id));
        setMyTasks((prev) => [...prev, { ...task, status: "CLAIMED" }]);

        try {
            await api.client.post(`/incidents/${id}/accept`);
        } catch (err: any) {
            console.error("Accept failed", err.message);
            // Revert
            setMyTasks((prev) => prev.filter((i) => i._id !== id));
            // Don't put back in nearby immediately to avoid flicker/loops, 
            // but fetching nearby again would fix it.
            // Or careful restore:
            setNearbyIncidents((prev) => [...prev, task]);

            if (err.response) {
                if (err.response.status === 400 || err.response.status === 404) {
                    Alert.alert("Claim Failed", err.response.data.message || "Task unavailable.");
                }
            }
            throw err;
        }
    };

    const removeFromNearby = (id: string) => {
        setNearbyIncidents((prev) => prev.filter((i) => i._id !== id));
    }

    const completeTask = async (id: string, imageUri: string) => {
        try {
            console.log("Completing task:", id, "Image:", imageUri);

            // Prepare form data
            const formData = new FormData();

            const filename = imageUri.split('/').pop() || 'after.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : `image/jpeg`;

            formData.append('imageAfter', {
                uri: Platform.OS === 'android' && !imageUri.startsWith('file://') ? `file://${imageUri}` : imageUri,
                name: filename,
                type: type
            } as any);

            // Optimistic Update
            updateUserPoints(10);
            setMyTasks((prev) => prev.map(task => {
                if (task._id === id) {
                    return { ...task, status: "CLEANED", imageAfterUrl: imageUri };
                }
                return task;
            }));


            // Call API
            const response = await api.client.post(`/incidents/${id}/complete`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Accept": "application/json",
                },
                transformRequest: (data, headers) => {
                    // Initial check to see if this helps avoid axios messing up formData
                    return data;
                },
            });

            console.log("Complete success:", response.data);

        } catch (error: any) {
            console.error("Failed to complete task", error);
            if (error.response) {
                console.error("Server Error Response:", error.response.status, error.response.data);
                Alert.alert("Upload Failed", error.response.data.message || "Server rejected the image.");
            } else if (error.request) {
                console.error("No response received", error.request);
                Alert.alert("Network Error", "Could not reach the server. Check your connection.");
            } else {
                Alert.alert("Error", error.message);
            }

            // Revert optimistic update
            setMyTasks((prev) => prev.map(task => { // This logic is slightly flawed for revert if we want to go back to CLAIMED without image
                if (task._id === id) {
                    // Fetch original to be sure or just partial revert? 
                    // For now, let's just leave it or fetch again.
                    // fetchUserTasks(); // safest
                    return { ...task, status: "CLAIMED" }; // simplistic revert
                }
                return task;
            }));
            fetchUserTasks();
        }
    };

    const fetchNearbyIncidents = async (lat: number, lng: number) => {
        try {
            const { data } = await api.client.get("/incidents/nearby", {
                params: { lat, lng }
            });

            // Only use real data from API
            if (Array.isArray(data)) {

                // Filter out items that are already in 'myTasks' (accepted/completed)
                // 'myTasks' contains items we accepted. We should remove them from 'nearby'.
                const myTaskIds = new Set(myTasks.map(t => t._id));
                const finalNearby = data.filter((t: Incident) => !myTaskIds.has(t._id))
                    .map((t: Incident) => ({
                        ...t,
                        addressText: t.addressText || getRandomGhat()
                    }));

                setNearbyIncidents(finalNearby);
            } else {
                setNearbyIncidents([]);
            }

        } catch (error) {
            console.error("Failed to fetch nearby incidents", error);
            // On error, show empty list
            setNearbyIncidents([]);
        }
    };

    const fetchUserTasks = async () => {
        try {
            const { data } = await api.client.get("/incidents/my");
            if (Array.isArray(data)) {
                setMyTasks(data);
            }
        } catch (error) {
            console.error("Failed to fetch user tasks", error);
        }
    }

    // Load user tasks on mount/auth
    React.useEffect(() => {
        if (user) {
            fetchUserTasks();
        }
    }, [user]);

    return (
        <TasksContext.Provider value={{ nearbyIncidents, myTasks, acceptTask, removeFromNearby, fetchNearbyIncidents, completeTask, fetchUserTasks }}>
            {children}
        </TasksContext.Provider>
    );
};

export const useTasks = () => useContext(TasksContext);
