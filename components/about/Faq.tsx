import React from "react";
import { Box } from "../ui/box";
import { Heading } from "../ui/heading";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  AccordionContentText,
  AccordionTitleText,
} from "../ui/accordion";
import { faq } from "@/lib/constants/Questions";
import { FontAwesome5 } from "@expo/vector-icons";

export function Faq() {
  return (
    <Box className="bg-white rounded-lg border border-outline-200 mt-8">
      <Heading className="text-center mb-2 pt-4" size="2xl">
        ❓Frequently Asked Questions
      </Heading>

      <Accordion
        size="md"
        variant="filled"
        type="single"
        isCollapsible={true}
        isDisabled={false}
        className="rounded-b-lg"
      >
        {faq.map(({ question, answer }, idx) => (
          <AccordionItem key={idx} className="" value={idx.toString()}>
            <AccordionHeader>
              <AccordionTrigger>
                {({ isExpanded }) => {
                  return (
                    <>
                      <AccordionTitleText>{question}</AccordionTitleText>
                      {isExpanded ? (
                        <FontAwesome5 name="chevron-up" className="ml-3" />
                      ) : (
                        <FontAwesome5 name="chevron-down" className="ml-3" />
                      )}
                    </>
                  );
                }}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <AccordionContentText>{answer}</AccordionContentText>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
}

export default Faq;
