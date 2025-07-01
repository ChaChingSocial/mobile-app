// "use dom"

// import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import { useEffect, forwardRef, useImperativeHandle } from "react";
// import { TextAlign } from "@tiptap/extension-text-align";
// import { Underline } from "@tiptap/extension-underline";
// import { Dropcursor } from "@tiptap/extension-dropcursor";
// import { Placeholder } from "@tiptap/extension-placeholder";
// import { Image } from "@tiptap/extension-image";
// import Mention from "@tiptap/extension-mention";
// import { Highlight } from "@tiptap/extension-highlight";
// import CharacterCount from "@tiptap/extension-character-count";
// import Youtube from "@tiptap/extension-youtube";
// import classes from "./PostEditor.module.css";
// import { SmilieReplacer } from "./SmilieReplacer";
// import suggestion from "./Suggestions";
// import { ImageResize } from "tiptap-extension-resize-image";

// const PostEditor = forwardRef(
//   (
//     {
//       message,
//       setContent,
//       id,
//       editorType,
//     }: {
//       message: string;
//       setContent: (content: string) => void;
//       id?: string;
//       editorType?: "blog" | "post" | "comment" | "community" | "rules";
//     },
//     ref
//   ) => {
//     const limit = editorType === "blog" || "rules" ? 50000 : 600;
//     const imageMaxWidth = editorType === "blog" ? "75%" : "50%";

//     const editor = useEditor({
//       extensions: [
//         StarterKit.configure({
//           bulletList: {
//             HTMLAttributes: {
//               class: "list-disc pl-4",
//             },
//           },
//           orderedList: {
//             HTMLAttributes: {
//               class: "list-decimal pl-4",
//             },
//           },
//         }),
//         ImageResize,
//         Underline,
//         // Link.configure({
//         //   HTMLAttributes: {
//         //     class: "text-purple-600 underline",
//         //   },
//         // }),
//         Dropcursor,
//         TextAlign.configure({ types: ["heading", "paragraph"] }),
//         Placeholder.configure({
//           placeholder:
//             editorType === "blog"
//               ? "Write your blog here!"
//               : "Your thoughts here! Tag with @",
//         }),
//         SmilieReplacer,
//         Highlight.configure({
//           HTMLAttributes: {
//             class: "bg-yellow-200 px-1 rounded",
//           },
//         }),
//         Image.configure({
//           HTMLAttributes: {
//             class:
//               "max-w-1/2 rounded-md border border-purple-500 m-2 display-block-inline",
//           },
//         }),
//         CharacterCount.configure({
//           limit,
//         }),
//         Mention.configure({
//           HTMLAttributes: {
//             style:
//               "background-color: purple; color: white; border-radius: 0.3rem; padding: 0.1rem 0.3rem;",
//           },
//           suggestion: suggestion(id),
//         }),
//         Youtube.configure({
//           HTMLAttributes: {
//             class: "youtube-video",
//           },
//         }),
//       ],
//       content: message || "",
//       onUpdate: ({ editor: updatedEditor }) => {
//         setContent(updatedEditor.getHTML());
//       },
//     });

//     useImperativeHandle(ref, () => ({
//       clearContent() {
//         editor?.commands.clearContent();
//       },
//       getContent() {
//         return editor?.getHTML();
//       },
//     }));

//     useEffect(() => {
//       if (editor && message !== editor.getHTML()) {
//         editor.commands.setContent(message || "");
//       }
//     }, [message, editor]);

//     useEffect(() => {
//       if (editor) {
//         const handleClick = () => {
//           if (!editor.isFocused) {
//             editor.commands.focus("end");
//           }
//         };

//         const editorContentElement = document.querySelector(
//           `.${classes.editorContent}`
//         );
//         if (editorContentElement) {
//           editorContentElement.addEventListener("click", handleClick);
//         }

//         return () => {
//           if (editorContentElement) {
//             editorContentElement.removeEventListener("click", handleClick);
//           }
//         };
//       }
//       return undefined;
//     }, [editor]);

//     const percentage = editor
//       ? Math.round((100 / limit) * editor.storage.characterCount.characters())
//       : 0;

//     return (
//       <div
//         className={
//           editorType === "blog"
//             ? classes.blogEditorContainer
//             : classes.editorContainer
//         }
//       >
//         {editor && (
//           <div
//             className={
//               editorType === "blog"
//                 ? classes.blogOptions
//                 : classes.editorOptions
//             }
//           >
//             <div className="flex gap-1 p-2 flex-wrap">
//               <button
//                 onClick={() => editor.chain().focus().toggleBold().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("bold") ? "bg-gray-200" : ""
//                 }`}
//                 title="Bold"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 24 24"
//                   width="24"
//                   height="24"
//                 >
//                   <path fill="none" d="M0 0h24v24H0z" />
//                   <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z" />
//                 </svg>
//               </button>
//               <button
//                 onClick={() => editor.chain().focus().toggleItalic().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("italic") ? "bg-gray-200" : ""
//                 }`}
//                 title="Italic"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 24 24"
//                   width="24"
//                   height="24"
//                 >
//                   <path fill="none" d="M0 0h24v24H0z" />
//                   <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15v2z" />
//                 </svg>
//               </button>
//               <button
//                 onClick={() => editor.chain().focus().toggleUnderline().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("underline") ? "bg-gray-200" : ""
//                 }`}
//                 title="Underline"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 24 24"
//                   width="24"
//                   height="24"
//                 >
//                   <path fill="none" d="M0 0h24v24H0z" />
//                   <path d="M8 3v9a4 4 0 1 0 8 0V3h2v9a6 6 0 1 1-12 0V3h2zM4 20h16v2H4v-2z" />
//                 </svg>
//               </button>
//               <button
//                 onClick={() => editor.chain().focus().unsetAllMarks().run()}
//                 className="p-1 rounded"
//                 title="Clear formatting"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 24 24"
//                   width="24"
//                   height="24"
//                 >
//                   <path fill="none" d="M0 0h24v24H0z" />
//                   <path d="M12.651 14.065L11.605 20H9.574l1.35-7.661-7.41-7.41L4.93 3.515 20.485 19.07l-1.414 1.414-6.42-6.42zm-.878-6.535l.27-1.53h-1.8l-2-2H20v2h-5.927L13.5 9.257 11.773 7.53z" />
//                 </svg>
//               </button>
//               <button
//                 onClick={() => editor.chain().focus().toggleHighlight().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("highlight") ? "bg-gray-200" : ""
//                 }`}
//                 title="Highlight"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 24 24"
//                   width="24"
//                   height="24"
//                 >
//                   <path fill="none" d="M0 0h24v24H0z" />
//                   <path d="M15.243 4.515l-6.738 6.737-.707 2.121-1.04 1.041 2.828 2.829 1.04-1.041 2.122-.707 6.737-6.738-4.242-4.242zm6.364 3.535a1 1 0 0 1 0 1.414l-7.779 7.779-2.12.707-1.415 1.414a1 1 0 0 1-1.414 0l-4.243-4.243a1 1 0 0 1 0-1.414l1.414-1.414.707-2.121 7.779-7.779a1 1 0 0 1 1.414 0l5.657 5.657zm-6.364-.707l1.414 1.414-4.95 4.95-1.414-1.414 4.95-4.95zM4.283 16.89l2.828 2.829-1.414 1.414-4.243-1.414 2.828-2.829z" />
//                 </svg>
//               </button>
//             </div>

//             <div className="flex gap-1 p-2 flex-wrap">
//               <button
//                 onClick={() =>
//                   editor.chain().focus().toggleHeading({ level: 2 }).run()
//                 }
//                 className={`p-1 rounded ${
//                   editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""
//                 }`}
//                 title="Heading 2"
//               >
//                 H2
//               </button>
//               <button
//                 onClick={() =>
//                   editor.chain().focus().toggleHeading({ level: 3 }).run()
//                 }
//                 className={`p-1 rounded ${
//                   editor.isActive("heading", { level: 3 }) ? "bg-gray-200" : ""
//                 }`}
//                 title="Heading 3"
//               >
//                 H3
//               </button>
//               <button
//                 onClick={() => editor.chain().focus().toggleBlockquote().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("blockquote") ? "bg-gray-200" : ""
//                 }`}
//                 title="Blockquote"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 24 24"
//                   width="24"
//                   height="24"
//                 >
//                   <path fill="none" d="M0 0h24v24H0z" />
//                   <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
//                 </svg>
//               </button>
//               <button
//                 onClick={() => editor.chain().focus().toggleBulletList().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("bulletList") ? "bg-gray-200" : ""
//                 }`}
//                 title="Bullet List"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 24 24"
//                   width="24"
//                   height="24"
//                 >
//                   <path fill="none" d="M0 0h24v24H0z" />
//                   <path d="M8 4h13v2H8V4zM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM8 11h13v2H8v-2zm0 7h13v2H8v-2z" />
//                 </svg>
//               </button>
//               <button
//                 onClick={() => editor.chain().focus().toggleOrderedList().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("orderedList") ? "bg-gray-200" : ""
//                 }`}
//                 title="Ordered List"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 24 24"
//                   width="24"
//                   height="24"
//                 >
//                   <path fill="none" d="M0 0h24v24H0z" />
//                   <path d="M8 4h13v2H8V4zM5 3v3h1v1H3V6h1V4H3V3h2zM3 14v-2.5h2V11H3v-1h3v2.5H4v.5h2v1H3zm2 5.5H3v-1h2V18H3v-1h3v4H3v-1h2v-.5zM8 11h13v2H8v-2zm0 7h13v2H8v-2z" />
//                 </svg>
//               </button>
//               {/* <button
//                 onClick={() => editor.chain().focus().toggleLink().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("link") ? "bg-gray-200" : ""
//                 }`}
//                 title="Link"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   viewBox="0 0 24 24"
//                   width="24"
//                   height="24"
//                 >
//                   <path fill="none" d="M0 0h24v24H0z" />
//                   <path d="M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.828l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07z" />
//                 </svg>
//               </button> */}
//             </div>
//           </div>
//         )}

//         {editor && (
//           <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
//             <div className="flex gap-1 bg-white p-1 rounded shadow-lg border border-gray-200">
//               <button
//                 onClick={() => editor.chain().focus().toggleBold().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("bold") ? "bg-gray-200" : ""
//                 }`}
//               >
//                 Bold
//               </button>
//               <button
//                 onClick={() => editor.chain().focus().toggleItalic().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("italic") ? "bg-gray-200" : ""
//                 }`}
//               >
//                 Italic
//               </button>
//               {/* <button
//                 onClick={() => editor.chain().focus().toggleLink().run()}
//                 className={`p-1 rounded ${
//                   editor.isActive("link") ? "bg-gray-200" : ""
//                 }`}
//               >
//                 Link
//               </button> */}
//             </div>
//           </BubbleMenu>
//         )}

//         <EditorContent
//           editor={editor}
//           className={`${classes.editorContent} ${
//             editorType === "blog" ? classes.blogEditorContent : ""
//           }`}
//         />

//         {editor && editorType !== "blog" && (
//           <div
//             className={`flex items-center text-gray-800 text-xs gap-2 my-6 ml-3 ${
//               editor.storage.characterCount.characters() === limit
//                 ? "text-red-500"
//                 : ""
//             }`}
//           >
//             <svg
//               height="20"
//               width="20"
//               viewBox="0 0 20 20"
//               className={`${
//                 editor.storage.characterCount.characters() > limit
//                   ? "text-red-500"
//                   : "text-purple-500"
//               }`}
//             >
//               <circle r="10" cx="10" cy="10" fill="#e9ecef" />
//               <circle
//                 r="5"
//                 cx="10"
//                 cy="10"
//                 fill="transparent"
//                 stroke="currentColor"
//                 strokeWidth="10"
//                 strokeDasharray={`calc(${percentage} * 31.4 / 100) 31.4`}
//                 transform="rotate(-90) translate(-20)"
//               />
//               <circle r="6" cx="10" cy="10" fill="white" />
//             </svg>
//             {editor.storage.characterCount.characters()} / {limit} characters
//             <br />
//             {editor.storage.characterCount.words()} words
//           </div>
//         )}
//       </div>
//     );
//   }
// );

// export default PostEditor;
