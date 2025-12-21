import { Button, ButtonText } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useStorageState } from "@/hooks/useStorageState";
import { loginWithEmail, registerWithEmail } from "@/lib/api/auth";
import { useSession } from "@/lib/providers/AuthContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import { Center } from "@/components/ui/center";
import { useUserStore } from "@/lib/store/user";
import { userApi } from "@/config/backend";
import generateRandomUsername from "@/lib/utils/generator";
import { Status, User } from "@/_sdk";
import { defaultProfilePic } from "@/lib/constants";

export default function RegisterFormScreen() {
  const [_, setSession] = useStorageState("session");
  const { session, signUp } = useSession();
  const { setUser } = useUserStore.getState();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    try {
      console.log("email", email);
      console.log("password", password);
      let user;

      await userApi.checkIfEmailExists({ email }).then(async (res) => {
        if (res) {
          // setError("Email already exists. Please login with your email.");
          user = await loginWithEmail(email, password);
          await userApi.getUserById({ userId: user.uid }).then((res) => {
            setUser(res);
            setSession({
              uid: res.id ?? "",
              email: res.email ?? "",
              displayName: res.username ?? "",
              profilePic: res.profilePic ?? "",
            });
            console.log("session in register with email", session);
            console.log("user get user but ni ID", res);
          });
        } else {
          user = await registerWithEmail(email, password);
          console.log("SeSSSIon INOF NEXT", session);
          console.log("res Register", user);
          const username = generateRandomUsername();

          setUser({
            username,
            email: user.email ?? "",
            profilePic: user.photoURL || defaultProfilePic,
            id: user.uid,
          });

          setSession({
            uid: user.uid,
            email: user.email,
            displayName: username,
            profilePic: user.photoURL || defaultProfilePic,
          });

          const updatedUser: User = {
            id: user.uid,
            username,
            email,
            interests: [],
            profilePic: user.photoURL || defaultProfilePic,
            bio: "",
            socials: {
              twitter: "",
              instagram: "",
              linkedin: "",
              youtube: "",
              website: "",
            },
            persona: [""],
            industry: "",
            status: Status.Pending,
            finfluencer: false,
          };
          console.log(updatedUser);
          const response = await userApi.updateUser({ user: updatedUser });

          if (response) {
            console.log("User created successfully:", response);
          } else {
            console.error("Error creating user:", response);
          }
        }
      });

      signUp()
    } catch (error) {
      console.log("error", error);
      const code = (error as any)?.code || "";
      let uiMessage = "Unable to log in. Please try again.";

      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password"
      ) {
        uiMessage = "Incorrect email or password.";
      } else if (code === "auth/invalid-email") {
        uiMessage = "Please enter a valid email address.";
      } else if (code === "auth/user-disabled") {
        uiMessage = "This account has been disabled.";
      } else if (code === "auth/user-not-found") {
        uiMessage = "No account found with that email.";
      } else if (code === "auth/too-many-requests") {
        uiMessage = "Too many attempts. Please try again later.";
      }

      setError(uiMessage);
    }
  };

  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  return (
    <Center className="flex-1 bg-[#7ad8bd]">
      <FormControl className="p-4 mx-6 flex-1 justify-between items-center">
        <VStack space="xl" className="mt-12">
          <Heading className="text-center">Sign Up</Heading>

          <Input
            size="xl"
            className="min-w-[250px] text-typography-black rounded-full pl-2 bg-white"
          >
            <InputField
              type="text"
              onChangeText={setEmail}
              placeholder="jane.doe@hotmail.com"
              placeholderTextColor="#181718"
            />
          </Input>

          <Input
            size="xl"
            className="text-center text-typography-black rounded-full w-full pl-2 bg-white"
          >
            <InputField
              type={showPassword ? "text" : "password"}
              onChangeText={setPassword}
              placeholder="password"
              placeholderTextColor="#181718"
            />
            <InputSlot className="pr-3" onPress={handleState}>
              <FontAwesome5 name={showPassword ? "eye" : "eye-slash"} />
            </InputSlot>
          </Input>
          <Button
            size="xl"
            className="w-full bg-white rounded-full"
            onPress={handleRegister}
          >
            <ButtonText className="flex-1 text-center text-black">
              Register
            </ButtonText>
          </Button>
        </VStack>

        {error && <Text className="text-red-500 mt-2">{error}</Text>}
      </FormControl>
    </Center>
  );
}
