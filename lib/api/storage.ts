import { app } from "@/config/firebase";
import {
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

const uploadToStorage = (
  file: File,
  userId: string,
  fileName: string,
  filePath: string,
  category: string,
  subcategory: string,
  metadata: any,
  onProgress?: (progress: number) => void
): Promise<{ uri: string; name: string; type: string }> => {
  const contentType = file.type;
  const storageRef = ref(
    getStorage(),
    `${category}/${subcategory}/${userId}/${fileName}`
  );
  const uploadMetadata = {
    contentType,
    customMetadata: {
      userId,
      ...metadata,
    },
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }
      },
      (error) => {
        console.error("Error uploading document to storage:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ uri: downloadURL, name: fileName, type: contentType });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

function categorizeFile(file: string): {
  contentType: string | undefined;
  type: string | undefined;
} {
  const fileType = file?.split(".").pop() || ""; // Safe-guarding against undefined

  let contentType;
  let type;

  if (fileType === "pdf") {
    contentType = "application/pdf";
    type = "document";
  }
  if (fileType === "doc") {
    contentType = "application/msword";
    type = "document";
  }
  if (fileType === "docx") {
    contentType = "application/msword";
    type = "document";
  }
  if (fileType === "xls") {
    contentType = "application/vnd.ms-excel";
    type = "document";
  }
  if (fileType === "xlsx") {
    contentType = "application/vnd.ms-excel";
    type = "document";
  }
  if (fileType === "ppt") {
    contentType = "application/vnd.ms-powerpoint";
    type = "document";
  }
  if (fileType === "pptx") {
    contentType = "application/vnd.ms-powerpoint";
    type = "document";
  }
  if (fileType === "jpg") {
    contentType = "image/jpeg";
    type = "image";
  }
  if (fileType === "jpeg") {
    contentType = "image/jpeg";
    type = "image";
  }
  if (fileType === "png") {
    contentType = "image/png";
    type = "image";
  }
  if (fileType === "gif") {
    contentType = "image/gif";
    type = "image";
  }
  if (fileType === "mp4") {
    contentType = "video/mp4";
    type = "video";
  }
  if (fileType === "mp3") {
    contentType = "audio/mp4";
    type = "audio";
  }
  if (fileType === "gif") {
    contentType = "image/gif";
    type = "image";
  }

  return { contentType, type };
}

async function fetchAllAvatars() {
  try {
    // Reference to the storage service
    // Reference to the folder '/profile-bg-pictures'
    const folderRef = ref(getStorage(), "/app-images/avatars");

    // List all items in the folder
    const result = await listAll(folderRef);

    // Create an array of promises to fetch download URLs
    const imageUrls = await Promise.all(
      result.items.map(async (itemRef) => {
        // Get the download URL for each item
        return await getDownloadURL(itemRef);
      })
    );

    return imageUrls; // Return the array of image URLs
  } catch (error) {
    console.error("Error fetching images from folder:", error);
    throw error; // Rethrow or handle the error as needed
  }
}

export {
  categorizeFile,
  uploadToStorage,
  fetchAllAvatars,
};
