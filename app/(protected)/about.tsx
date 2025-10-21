import AboutDescription from "@/components/about/AboutDescripition";
import AccountDeletion from "@/components/about/AccountDeletion";
import ContactForm from "@/components/about/ContactForm";
import Faq from "@/components/about/Faq";
import { PartnerProgramIntro } from "@/components/about/PartnerProgramIntro";
import ParallaxScrollView from "@/components/ParallaxScrollView";

export default function AboutScreen() {
  return (
    <ParallaxScrollView classNames="p-10 bg-[#077f5f] rounded-lg">
      <AboutDescription />
      <ContactForm />
      {/*<PartnerProgramIntro />*/}
      <Faq />
      <AccountDeletion />
    </ParallaxScrollView>
  );
}
