import { useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

const customStyles = {
  body: {
    whiteSpace: "normal" as "normal",
    color: "#000",
  },
  a: {
    color: "#0066cc",
    textDecorationLine: "underline" as "underline",
  },
  p: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    color: "#000",
  },
  mark: {
    backgroundColor: "#ffec99",
    color: "#000",
  },
  span: {
    color: "#000",
  },
  pre: {
    backgroundColor: "#282c34",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  code: {
    fontFamily: "Courier" as "Courier",
    fontSize: 13,
    lineHeight: 20,
  },
  h1: {
    fontSize: 28,
    fontWeight: "bold" as "bold",
    marginBottom: 16,
    marginTop: 24,
    color: "#000",
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold" as "bold",
    marginBottom: 12,
    marginTop: 20,
    color: "#000",
  },
  h3: {
    fontSize: 20,
    fontWeight: "bold" as "bold",
    marginBottom: 10,
    marginTop: 16,
    color: "#000",
  },
  h4: {
    fontSize: 18,
    fontWeight: "bold" as "bold",
    marginBottom: 8,
    marginTop: 12,
    color: "#000",
  },
  ul: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  ol: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  li: {
    marginBottom: 6,
    fontSize: 16,
    lineHeight: 24,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "#ccc",
    paddingLeft: 12,
    marginLeft: 8,
    marginBottom: 12,
    marginTop: 8,
    fontStyle: "italic" as "italic",
    color: "#555",
  },
  strong: {
    fontWeight: "bold" as "bold",
  },
  em: {
    fontStyle: "italic" as "italic",
  },
  table: {
    marginBottom: 16,
    marginTop: 8,
  },
  th: {
    fontWeight: "bold" as "bold",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  td: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  img: {
    marginBottom: 8,
    marginTop: 8,
    borderRadius: 16,
    padding: 4,
    width: "100%",
  }
};

const customRenderers = {
  pre: ({ TDefaultRenderer, ...props }: any) => {
    return (
      <TDefaultRenderer
        {...props}
        style={{
          backgroundColor: "#282c34",
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          marginTop: 8,
        }}
        textProps={{
          style: {
            fontFamily: "Courier",
            fontSize: 13,
            lineHeight: 20,
            color: "#abb2bf",
          },
        }}
      />
    );
  },
  code: ({ TDefaultRenderer, tnode, ...props }: any) => {
    // Check if this is inside a pre tag (code block) or inline code
    const isInPre = tnode?.parent?.tagName === "pre";

    if (isInPre) {
      // For code blocks, preserve whitespace and line breaks
      return (
        <TDefaultRenderer
          {...props}
          tnode={tnode}
          style={{
            fontFamily: "Courier",
            fontSize: 13,
            lineHeight: 20,
            backgroundColor: "transparent",
            color: "#abb2bf",
          }}
        />
      );
    }

    // For inline code
    return (
      <TDefaultRenderer
        {...props}
        tnode={tnode}
        style={{
          fontFamily: "Courier",
          fontSize: 13,
          lineHeight: 20,
          backgroundColor: "#f4f4f4",
          color: "#e83e8c",
          paddingHorizontal: 4,
          paddingVertical: 2,
          borderRadius: 4,
        }}
      />
    );
  },
};

export default function HtmlRenderText({ source, inset = 32 }: { source: string; inset?: number }) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(100, width - inset);
  return (
    <RenderHtml
      contentWidth={contentWidth}
      source={{ html: source }}
      tagsStyles={customStyles}
      renderers={customRenderers}
      defaultTextProps={{
        selectable: true,
      }}
      enableExperimentalBRCollapsing={false}
      enableExperimentalMarginCollapsing={false}
      systemFonts={["Courier", "Courier New", "monospace"]}
    />
  );
}
