import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import Toast from "react-native-toast-message";
import { fetchSignInMethodsForEmail } from "@react-native-firebase/auth";

// Main alert dialog component for account linking
function AccountLinkingAlert({
  isOpen,
  onClose,
  existingProvider,
  providerKey,
  userEmail,
  router,
  onTriggerProviderSignIn,
}) {
  // Determine if it's a password provider for routing logic
  const isPasswordProvider = providerKey === "password";

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} size="md">
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Heading className="text-typography-950 font-semibold" size="md">
            Account Already Exists
          </Heading>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <Text size="sm">
            You previously signed in with {existingProvider}. Would you like to:
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter className="flex-col space-y-2">
          {/* Option 1: Sign in with existing provider */}
          <Button
            variant="outline"
            action="primary"
            size="sm"
            className="w-full"
            onPress={() => {
              onClose();
              if (isPasswordProvider) {
                router.push(`/login?email=${encodeURIComponent(userEmail)}`);
              } else {
                onTriggerProviderSignIn(providerKey);
              }
            }}
          >
            <ButtonText>Sign in with {existingProvider}</ButtonText>
          </Button>

          {/* Option 2: Link accounts (explain process) */}
          <Button
            variant="outline"
            action="secondary"
            size="sm"
            className="w-full"
            onPress={() => {
              onClose();
              // Navigate to login with explanation
              router.push(
                `/login?email=${encodeURIComponent(userEmail)}&linking=true`
              );
            }}
          >
            <ButtonText>Link this account instead</ButtonText>
          </Button>

          {/* Option 3: Cancel */}
          <Button
            variant="outline"
            action="secondary"
            size="sm"
            className="w-full"
            onPress={onClose}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook to manage the alert dialog state and logic
export function useAccountLinkingAlert(router) {
  const [showLinkingAlert, setShowLinkingAlert] = useState(false);
  const [alertData, setAlertData] = useState({
    existingProvider: "",
    providerKey: "",
    userEmail: "",
  });

  // Provider name mapping
  const providerNames = {
    password: "Email/Password",
    "google.com": "Google",
    "apple.com": "Apple",
  };

  // Function to trigger provider-specific sign-in
  const triggerProviderSignIn = (providerKey) => {
    // You'll need to implement this based on your auth setup
    console.log(`Trigger sign in with: ${providerKey}`);

    switch (providerKey) {
      case "google.com":
        // Trigger Google sign-in
        // handleGoogleSignIn();
        break;
      case "apple.com":
        // Trigger Apple sign-in
        // handleAppleSignIn();
        break;
      default:
        console.log(`Provider ${providerKey} not implemented`);
    }
  };

  // Function to show the linking alert
  const showLinkingErrorAlert = async (authError, auth) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, authError.email);
      const providerKey = methods[0];
      const existingProvider = providerNames[providerKey] || providerKey;

      setAlertData({
        existingProvider,
        providerKey,
        userEmail: authError.email,
      });
      setShowLinkingAlert(true);
    } catch (error) {
      console.error("Error fetching sign-in methods:", error);
      // Fallback to simple alert
      Toast.show({
        type: "error",
        text1: "Account Exists",
        text2:
          "An account already exists with this email. Please use your original sign-in method.",
      });
    }
  };

  // Component to render the alert dialog
  const AccountLinkingAlertDialog = () => (
    <AccountLinkingAlert
      isOpen={showLinkingAlert}
      onClose={() => setShowLinkingAlert(false)}
      existingProvider={alertData.existingProvider}
      providerKey={alertData.providerKey}
      userEmail={alertData.userEmail}
      router={router}
      onTriggerProviderSignIn={triggerProviderSignIn}
    />
  );

  return {
    showLinkingErrorAlert,
    AccountLinkingAlertDialog,
    triggerProviderSignIn,
    isAlertVisible: showLinkingAlert,
    hideAlert: () => setShowLinkingAlert(false),
  };
}

// Usage example in your auth error handling
export function useAuthErrorHandler(router) {
  const { showLinkingErrorAlert, AccountLinkingAlertDialog } =
    useAccountLinkingAlert(router);

  const handleAuthError = async (error, auth) => {
    if (error.code === "auth/account-exists-with-different-credential") {
      await showLinkingErrorAlert(error, auth);
      return true; // Error was handled
    }

    // Handle other auth errors here
    return false; // Error was not handled
  };

  return {
    handleAuthError,
    AccountLinkingAlertDialog,
  };
}
