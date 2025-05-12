import { useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

const customStyles = {
  body: {
    whiteSpace: "normal" as "normal",
  },
  a: {
    color: "blue",
    textDecorationLine: "underline" as "underline",
  },
  p: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  mark: {
    backgroundColor: "#ffec99",
    color: "#000",
  },
  span: {
    backgroundColor: "purple",
    color: "#fff",
    padding: 4,
    borderRadius: "16px",
    fontWeight: 700,
  },
};

export default function HtmlRenderText({ source }: { source: string }) {
  const { width } = useWindowDimensions();
  return (
    <RenderHtml
      contentWidth={width}
      source={{ html: source }}
      tagsStyles={customStyles}
    />
  );
}
