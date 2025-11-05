import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import React from "react";
import { Modal, View, Pressable, StyleSheet } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";

export interface OinkInfoProps {
    visible: boolean;
    onClose: () => void;
}

const OinkInfo: React.FC<OinkInfoProps> = ({ visible, onClose }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <View style={styles.modalContent}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <View className="bg-white rounded-lg p-6">
                            <Text className="mb-4 font-semibold text-lg">
                                You don't have any oinks yet!
                            </Text>
                            <Text className="mb-2">
                                Oinks are points you earn by participating in the community. You can earn oinks by:
                            </Text>
                            <VStack space="md" className="my-3">
                                <Text>• Posting content</Text>
                                <Text>• Commenting on posts</Text>
                                <Text>• Receiving oink gifts from other members</Text>
                            </VStack>
                            <Text className="mt-4 mb-4">
                                The more you engage, the more oinks you earn! Start by creating a post or commenting on existing ones to get your first oinks.
                            </Text>
                            <Button onPress={onClose} className="mt-2">
                                <ButtonText>Got it!</ButtonText>
                            </Button>
                        </View>
                    </Pressable>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 400,
    },
});

export default OinkInfo;
