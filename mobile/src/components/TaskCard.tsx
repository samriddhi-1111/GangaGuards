import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";

export interface TaskCardProps {
  imageBeforeUrl: string;
  addressText?: string;
  distanceKm?: number;
  status?: string;
  onPressPrimary?: () => void;
  primaryLabel?: string;
  onPressSecondary?: () => void;
  secondaryLabel?: string;
}

// Helper to ensure image URL is absolute
const getAbsoluteImageUrl = (url: string | undefined): string => {
  if (!url) return "";
  
  // If already absolute, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Convert relative URL to absolute using the same logic as API service
  const expoConfig: any = (Constants.expoConfig as any) || (Constants.manifest as any) || {};
  
  // First priority: explicit API base URL from config
  const explicit = expoConfig?.extra?.apiBaseUrl || (Constants.manifest as any)?.extra?.apiBaseUrl;
  let baseUrl: string;
  
  if (explicit) {
    baseUrl = explicit;
  } else {
    // Second priority: infer from host URI
    const hostUri: string | undefined = expoConfig.hostUri || (Constants.manifest as any)?.hostUri;
    if (hostUri) {
      const host = hostUri.split(":")[0];
      baseUrl = `http://${host}:4000`;
    } else if (Platform.OS === "android") {
      baseUrl = "http://10.0.2.2:4000";
    } else {
      baseUrl = "http://localhost:4000";
    }
  }
  
  // Ensure URL starts with /
  const path = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = `${baseUrl}${path}`;
  
  return fullUrl;
};

const TaskCard: React.FC<TaskCardProps> = ({
  imageBeforeUrl,
  addressText,
  distanceKm,
  status,
  onPressPrimary,
  primaryLabel,
  onPressSecondary,
  secondaryLabel
}) => {
  const [imageError, setImageError] = React.useState(false);
  const absoluteImageUrl = getAbsoluteImageUrl(imageBeforeUrl);
  
  return (
    <View style={styles.card}>
      {!!absoluteImageUrl && !imageError ? (
        <Image 
          source={{ uri: absoluteImageUrl }} 
          style={styles.image} 
          resizeMode="cover"
          onError={() => {
            console.log("Image load error:", absoluteImageUrl);
            setImageError(true);
          }}
          onLoad={() => setImageError(false)}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>📸 Image</Text>
        </View>
      )}
      <View style={styles.content}>
        {addressText ? <Text style={styles.title}>{addressText}</Text> : null}
        <View style={styles.row}>
          {typeof distanceKm === "number" && (
            <Text style={styles.meta}>{distanceKm.toFixed(1)} km away</Text>
          )}
          {status && <Text style={[styles.meta, styles.status]}>{status}</Text>}
        </View>
        {(onPressPrimary || onPressSecondary) && (
          <View style={styles.buttonContainer}>
            {onPressPrimary && primaryLabel && (
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onPressPrimary}>
                <Text style={styles.buttonText}>{primaryLabel}</Text>
              </TouchableOpacity>
            )}
            {onPressSecondary && secondaryLabel && (
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onPressSecondary}>
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>{secondaryLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  image: {
    width: "100%",
    height: 180
  },
  content: {
    padding: 12
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
    color: "#0D1B2A"
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  meta: {
    fontSize: 12,
    color: "#6B7280"
  },
  status: {
    fontWeight: "700",
    color: "#2E7D32"
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10
  },
  primaryButton: {
    backgroundColor: "#1565C0"
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DC2626"
  },
  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700"
  },
  secondaryButtonText: {
    color: "#DC2626"
  },
  imagePlaceholder: {
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center"
  },
  placeholderText: {
    fontSize: 24,
    color: "#9CA3AF"
  }
});

export default TaskCard;


