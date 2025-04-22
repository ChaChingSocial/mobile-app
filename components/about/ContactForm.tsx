import { sendContactForm, subscribeNewsletter } from "@/lib/api/user-outreach";
import { useEffect, useState } from "react";
import { Box } from "../ui/box";
import { ButtonGroup, ButtonText } from "../ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "../ui/form-control";
import { Heading } from "../ui/heading";
import { HStack } from "../ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "../ui/input";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";
import { ContactIconsList } from "./ContactIconsList";
import { FontAwesome } from "@expo/vector-icons";
import { TextInput, TouchableOpacity } from "react-native";
import { Textarea, TextareaInput } from "../ui/textarea";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  //   const [opened, { toggle, close }] = useDisclosure(false);

  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  useEffect(() => {
    setSubscriberEmail(email);
  }, [email]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await sendContactForm(name, email, subject, message);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      console.log("Response from Airtable:", response);
      //   toggle();
    } catch (error) {
      console.debug("Error sending message:", error);
    }
  };

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await subscribeNewsletter(subscriberEmail);
      //   toggle();
      console.log("Subscribed to newsletter");
    } catch (error) {
      console.debug("Error subscribing to newsletter:", error);
    }
  };

  return (
    <Box className="bg-gradient-to-b from-white to-gray-100 rounded-lg mt-6">
      <Heading size="2xl" className="text-center mb-2">
        ☎️ Contact
      </Heading>
      <Box>
        <Box className="p-4 bg-[#00bf63] rounded-2xl">
          <Text size="xl" bold className="text-white my-6">
            Contact information
          </Text>

          <ContactIconsList />
        </Box>

        <FormControl className="p-4 rounded-lg border mt-4">
          <VStack space="xl">
            <Heading className="">Get in touch</Heading>
            <VStack space="xs">
              <FormControlLabel>
                <FormControlLabelText>Your name</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1 w-full" size="sm">
                <InputField
                  type="text"
                  placeholder="Your name"
                  // value={inputValue}
                  // onChangeText={(text) => setInputValue(text)}
                />
              </Input>
            </VStack>
            <VStack space="xs">
              <FormControlLabel>
                <FormControlLabelText>Your email</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1 w-full" size="sm">
                <InputField
                  type="text"
                  placeholder="hello@email.com"
                  // value={inputValue}
                  // onChangeText={(text) => setInputValue(text)}
                />
              </Input>
            </VStack>
            <VStack space="xs">
              <FormControlLabel>
                <FormControlLabelText>Subject</FormControlLabelText>
              </FormControlLabel>
              <Input className="my-1 w-full" size="sm">
                <InputField
                  type="text"
                  placeholder="Subject"
                  // value={inputValue}
                  // onChangeText={(text) => setInputValue(text)}
                />
              </Input>
            </VStack>
            <VStack space="xs">
              <FormControlLabel>
                <FormControlLabelText>Your message</FormControlLabelText>
              </FormControlLabel>
              <Textarea className="">
                <TextareaInput placeholder="Please include all relevant information" />
              </Textarea>
            </VStack>
            <TouchableOpacity className="bg-[#00bf63] rounded-lg p-2">
              <Text className="text-white text-center">Send message</Text>
            </TouchableOpacity>
          </VStack>
        </FormControl>
      </Box>

      {/* <Dialog
        opened={opened}
        withCloseButton
        onClose={close}
        size="lg"
        radius="md"
      >
        <Text size="sm" mb="xs" fw={500}>
          Your message has been sent! A member of our team will be in touch
          shortly. Subscribe to our newsletter to stay up to date with the
          latest news and updates.
        </Text>

        <HStack onSubmit={handleSubscribe}>
          <Group align="flex-end">
            <TextInput
              placeholder="hello@gluesticker.com"
              value={subscriberEmail}
              onChange={(event) =>
                setSubscriberEmail(event.currentTarget.value)
              }
              style={{ flex: 1 }}
            />
            <Button type="submit">Subscribe</Button>
          </Group>
        </HStack>
      </Dialog> */}
    </Box>
  );
}

export default ContactForm;
